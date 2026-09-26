"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isOrganizationId } from "@/features/foundation/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

export type WorkflowDefinition = {
  id: string;
  organization_id: string;
  workflow_key: string;
  domain: string;
  workflow_type: string | null;
  name: string;
  description: string | null;
  created_at: string;
  source_template_key: string | null;
  source_template_version: number | null;
};

export type WorkflowVersion = {
  id: string;
  organization_id: string;
  workflow_definition_id: string;
  version: number;
  status: string;
  steps: Array<Record<string, unknown>>;
  published_at: string | null;
  created_at: string;
};

export type WorkflowTrigger = {
  id: string;
  organization_id: string;
  workflow_definition_id: string;
  trigger_key: string;
  event_type: string;
  event_schema_version: number;
  status: "ACTIVE" | "DISABLED";
  scope: "ORGANIZATION" | "BRANCH";
  branch_id: string | null;
  active_since: string;
  conditions: Array<Record<string, unknown>>;
  input_mapping: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type WorkflowDefinitionDetail = {
  definition: WorkflowDefinition;
  versions: WorkflowVersion[];
  triggers: WorkflowTrigger[];
};

export type WorkflowTriggerDelivery = {
  id: string;
  organization_id: string;
  workflow_trigger_id: string;
  workflow_definition_id: string;
  workflow_version_id: string;
  domain_event_id: string;
  event_type: string;
  branch_id: string | null;
  event_snapshot: Record<string, unknown>;
  trigger_snapshot: Record<string, unknown>;
  status: "PENDING" | "SKIPPED" | "STARTED" | "RETRYING" | "QUARANTINED";
  condition_result: Record<string, unknown> | null;
  workflow_run_id: string | null;
  attempt_count: number;
  next_attempt_at: string | null;
  last_error_code: string | null;
  last_error_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

function baseUrl(orgId: string): string {
  return (
    env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") +
    "/api/v1/organizations/" +
    orgId
  );
}

function requireOrganizationId(orgId: string): void {
  if (!isOrganizationId(orgId)) {
    throw new Error(
      "Organization context is not available. Select a workspace and try again.",
    );
  }
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const root =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const nested =
      root.error && typeof root.error === "object"
        ? (root.error as Record<string, unknown>)
        : root;
    throw Object.assign(
      new Error(
        typeof nested.message === "string"
          ? nested.message
          : "Request failed with HTTP " + res.status,
      ),
      {
        status: res.status,
        code: typeof nested.code === "string" ? nested.code : undefined,
        requestId:
          typeof nested.request_id === "string" ? nested.request_id : undefined,
      },
    );
  }
  return res.json() as Promise<T>;
}

export function useWorkflowDefinitions(
  orgId: string,
  filters: { domain?: string; workflowType?: string } = {},
) {
  const query = new URLSearchParams();
  if (filters.domain) query.set("domain", filters.domain);
  if (filters.workflowType) query.set("workflow_type", filters.workflowType);
  const suffix = query.size ? "?" + query.toString() : "";

  return useQuery<WorkflowDefinition[]>({
    queryKey: [
      "workflows",
      orgId,
      "definitions",
      filters.domain ?? null,
      filters.workflowType ?? null,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(baseUrl(orgId) + "/workflows" + suffix, {
        method: "GET",
      });
      return handleRes<WorkflowDefinition[]>(response);
    },
    enabled: isOrganizationId(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useWorkflowDefinition(
  orgId: string,
  definitionId: string | null,
) {
  return useQuery<WorkflowDefinitionDetail>({
    queryKey: ["workflows", orgId, "definitions", definitionId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      if (!definitionId) throw new Error("Workflow definition is required.");
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/workflows/" + definitionId,
        { method: "GET" },
      );
      return handleRes<WorkflowDefinitionDetail>(response);
    },
    enabled: isOrganizationId(orgId) && Boolean(definitionId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useWorkflowTriggerDeliveries(
  orgId: string,
  triggerId?: string | null,
) {
  const query = new URLSearchParams({ limit: "100" });
  if (triggerId) query.set("trigger_id", triggerId);

  return useQuery<WorkflowTriggerDelivery[]>({
    queryKey: ["workflows", orgId, "deliveries", triggerId ?? null],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) +
          "/workflow-trigger-deliveries?" +
          query.toString(),
        { method: "GET" },
      );
      return handleRes<WorkflowTriggerDelivery[]>(response);
    },
    enabled: isOrganizationId(orgId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useSetWorkflowTriggerStatus(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowTrigger,
    Error,
    { triggerId: string; status: "ACTIVE" | "DISABLED"; definitionId: string }
  >({
    mutationFn: async ({ triggerId, status }) => {
      requireOrganizationId(orgId);
      const action = status === "ACTIVE" ? "enable" : "disable";
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/workflow-triggers/" + triggerId + "/" + action,
        { method: "POST" },
      );
      return handleRes<WorkflowTrigger>(response);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "workflows",
            orgId,
            "definitions",
            variables.definitionId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workflows", orgId, "deliveries"],
        }),
      ]);
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import { buildProjectListParams } from "./branching";

export type ProjectKind = "INTERNAL" | "COMMERCIAL";
export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type Project = {
  id: string;
  organization_id: string;
  branch_id: string;
  kind: ProjectKind;
  customer_id: string | null;
  project_number: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  currency: string;
  contract_value: string | null;
  budget_amount: string | null;
  start_date: string | null;
  target_end_date: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectList = {
  data: Project[];
  next_cursor: string | null;
};

export type ProjectCreateInput = {
  kind: ProjectKind;
  branch_id: string;
  customer_id: string | null;
  name: string;
  description?: string | null;
  currency: string;
  contract_value?: string | null;
  budget_amount?: string | null;
  start_date?: string | null;
  target_end_date?: string | null;
};

function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(
      new Error(err?.message ?? `Request failed ${res.status}`),
      {
        status: res.status,
        code: err?.code,
        details: err?.details,
        requestId: err?.request_id,
      },
    );
  }
  return res.json() as Promise<T>;
}

export function useProjects(
  orgId: string,
  opts: {
    branchId?: string | null;
    customerId?: string | null;
    status?: string | null;
    cursor?: string | null;
    limit?: number;
    sort?: string;
    enabled?: boolean;
  } = {},
) {
  const params = buildProjectListParams(opts);
  return useQuery<ProjectList>({
    queryKey: [
      "projects",
      orgId,
      opts.branchId ?? null,
      opts.customerId ?? null,
      opts.status ?? null,
      opts.cursor ?? null,
      opts.limit ?? 20,
      opts.sort ?? "created_at:desc",
    ],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/projects?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<ProjectList>(res);
    },
    enabled: isUuid(orgId) && (opts.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}

export function useCreateProject(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectCreateInput>({
    mutationFn: async (input) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<Project>(res);
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      queryClient.setQueryData(["project", orgId, project.id], project);
    },
  });
}

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

export type ProjectDashboardCustomer = {
  id: string;
  name: string;
};

export type ProjectDashboardMilestone = {
  id: string;
  organization_id: string;
  project_id: string;
  sequence: number;
  name: string;
  description: string | null;
  completion_status: string;
  billing_status: string;
  billing_type: string | null;
  billing_percentage: string | null;
  billing_amount: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDashboard = {
  overview: {
    project: Project;
    customer: ProjectDashboardCustomer | null;
    counts: {
      quotes: number;
      invoices: number;
      milestones_total: number;
      milestones_completed: number;
      milestones_pending: number;
      milestones_ready_to_bill: number;
      milestones_invoiced: number;
      milestones_overdue: number;
      expenses: number;
    };
    financials: {
      currency: string;
      contract_value: string | null;
      budget_amount: string | null;
      quoted_total: string;
      invoiced_total: string;
      collected_total: string;
      outstanding_total: string;
      overdue_total: string;
      expenses_total: string;
    };
  };
  quotes: {
    counts_by_status: Record<string, number>;
    quoted_total: string;
    recent: Array<{
      id: string;
      quote_number: string;
      status: string;
      currency: string;
      grand_total: string;
      valid_until: string | null;
      created_at: string;
    }>;
  };
  milestones: {
    counts_by_completion: Record<string, number>;
    counts_by_billing: Record<string, number>;
    next_due: string | null;
    items: ProjectDashboardMilestone[];
    truncated: boolean;
  };
  invoices: {
    counts_by_document_state: Record<string, number>;
    counts_by_payment_state: Record<string, number>;
    invoiced_total: string;
    collected_total: string;
    outstanding_total: string;
    recent: Array<{
      id: string;
      invoice_number: string | null;
      document_state: string;
      payment_state: string;
      currency: string;
      grand_total: string;
      outstanding: string | null;
      due_date: string;
      issued_at: string | null;
    }>;
  };
  activity: {
    items: Array<{
      id: string;
      timestamp: string;
      entity_type: string;
      entity_id: string | null;
      action: string;
      actor_type: string;
      actor_id: string | null;
    }>;
  };
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

export function useProjectDashboard(orgId: string, projectId: string) {
  return useQuery<ProjectDashboard>({
    queryKey: ["project-dashboard", orgId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams({
        recent: "5",
        activity_limit: "10",
      });
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/projects/${projectId}/dashboard?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<ProjectDashboard>(res);
    },
    enabled: isUuid(orgId) && isUuid(projectId),
    staleTime: 30_000,
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

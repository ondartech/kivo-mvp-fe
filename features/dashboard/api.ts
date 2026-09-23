"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import { buildDashboardParams } from "./branching";

export type DashboardReceivablesSummary = {
  branch_id: string | null;
  currency: string;
  invoiced: string;
  collected: string;
  outstanding: string;
  overdue: string;
  due_soon: string;
  paid_count: number;
  outstanding_count: number;
  overdue_count: number;
  as_of: string;
};

export type DashboardAgingBucket = {
  label: string;
  days: string;
  outstanding: string;
  count: number;
};

export type DashboardAging = {
  branch_id: string | null;
  currency: string;
  as_of: string;
  buckets: DashboardAgingBucket[];
  total_outstanding: string;
};

export type OrganizationDashboard = {
  branch_id: string | null;
  cash: {
    currency: string;
    collected_total: string;
  };
  receivables: {
    summary: DashboardReceivablesSummary;
    aging: DashboardAging;
  };
  commercial: {
    quotes: {
      counts_by_status: Record<string, number>;
      accepted_unconverted: {
        count: number;
        total: string;
      };
    };
    projects: {
      counts_by_status: Record<string, number>;
      contract_value_total: string;
    };
    unbilled: {
      ready_milestones: {
        count: number;
        total: string;
      };
      total: string;
    };
  };
  nrs: {
    branch_id?: string | null;
    nrs?: {
      enablement_status?: string;
      business_id_present?: boolean;
      service_id_present?: boolean;
      [key: string]: unknown;
    };
    counts?: Record<string, number>;
    recent_failures?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
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

export function useOrganizationDashboard(
  orgId: string,
  opts: {
    branchId?: string | null;
    currency?: string;
    enabled?: boolean;
  } = {},
) {
  const params = buildDashboardParams(opts);
  return useQuery<OrganizationDashboard>({
    queryKey: [
      "organization-dashboard",
      orgId,
      opts.branchId ?? null,
      opts.currency ?? "NGN",
    ],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/dashboard?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<OrganizationDashboard>(res);
    },
    enabled: isUuid(orgId) && (opts.enabled ?? true),
    staleTime: 30_000,
  });
}

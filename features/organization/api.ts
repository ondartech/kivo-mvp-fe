"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

export type OperatingBranch = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  is_primary: boolean;
  timezone: string;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country_code: string | null;
  };
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OperatingBranchAccess = {
  organization_wide: boolean;
  branches: OperatingBranch[];
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

export function useOperatingBranches(orgId: string) {
  return useQuery<OperatingBranchAccess>({
    queryKey: ["operating-branches", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/operating-branches`, {
        method: "GET",
      });
      return handleRes<OperatingBranchAccess>(res);
    },
    enabled: isUuid(orgId),
    staleTime: 60_000,
    retry: 1,
  });
}

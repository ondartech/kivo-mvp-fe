"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export type NumberingDocumentType =
  | "INVOICE"
  | "QUOTE"
  | "ORDER"
  | "SUPPLIER_BILL";

export type NumberingScope = "ORGANIZATION" | "BRANCH";

export type NumberingPolicy = {
  organization_id: string;
  document_type: NumberingDocumentType;
  scope: NumberingScope;
  prefix: string;
  width: number;
  explicit: boolean;
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

export function useOperatingBranches(
  orgId: string,
  opts: { permissionCode?: string } = {},
) {
  return useQuery<OperatingBranchAccess>({
    queryKey: ["operating-branches", orgId, opts.permissionCode ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (opts.permissionCode) {
        params.set("permission", opts.permissionCode);
      }
      const suffix = params.size ? `?${params.toString()}` : "";
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/operating-branches${suffix}`,
        { method: "GET" },
      );
      return handleRes<OperatingBranchAccess>(res);
    },
    enabled: isUuid(orgId),
    staleTime: 60_000,
    retry: 1,
  });
}


export function useNumberingPolicies(orgId: string) {
  return useQuery<NumberingPolicy[]>({
    queryKey: ["numbering-policies", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/numbering-policies`, {
        method: "GET",
      });
      return handleRes<NumberingPolicy[]>(res);
    },
    enabled: isUuid(orgId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSetNumberingPolicy(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      documentType: NumberingDocumentType;
      scope: NumberingScope;
    }) => {
      if (!isUuid(orgId)) {
        throw new Error(
          "Organization context is not available. Select a workspace and try again.",
        );
      }
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/numbering-policies/${input.documentType}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: input.scope }),
        },
      );
      return handleRes<NumberingPolicy>(res);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["numbering-policies", orgId],
      });
    },
  });
}

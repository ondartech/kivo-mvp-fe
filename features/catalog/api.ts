"use client";

import { useQuery } from "@tanstack/react-query";

import { isOrganizationId } from "@/features/foundation/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

export type CommercialItem = {
  id: string;
  organization_id: string;
  type: "PRODUCT" | "SERVICE" | "CHARGE";
  name: string;
  description: string | null;
  code: string | null;
  sku: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  default_uom: string;
  default_currency: string | null;
  sales_enabled: boolean;
  purchase_enabled: boolean;
  tax_classification: string | null;
  sales_tax_code_id: string | null;
  purchase_tax_code_id: string | null;
  nrs_classification: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CommercialItemList = {
  data: CommercialItem[];
  next_cursor: string | null;
};

function baseUrl(orgId: string): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") + "/api/v1/organizations/" + orgId;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? "Request failed " + res.status), {
      status: res.status,
      code: err?.code,
      details: err?.details,
      requestId: err?.request_id,
    });
  }
  return res.json() as Promise<T>;
}

export function useCatalogItems(
  orgId: string,
  opts: { direction?: "SELL" | "BUY"; limit?: number } = {},
) {
  const params = new URLSearchParams({
    status: "ACTIVE",
    limit: String(opts.limit ?? 250),
  });

  return useQuery<CommercialItemList>({
    queryKey: ["catalog", orgId, "items", "ACTIVE", opts.direction ?? null],
    queryFn: async () => {
      const res = await fetchWithAuth(
        baseUrl(orgId) + "/catalog/items?" + params.toString(),
        { method: "GET" },
      );
      const payload = await handleRes<CommercialItemList>(res);
      const data = payload.data.filter((item) =>
        opts.direction === "BUY" ? item.purchase_enabled : item.sales_enabled,
      );
      return { ...payload, data };
    },
    enabled: isOrganizationId(orgId),
    staleTime: 60_000,
    retry: 1,
  });
}

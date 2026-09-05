"use client";

import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";

export interface ReceivableItem {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: string;
  amount_outstanding: string;
  due_date: string;
  days_overdue: number;
  collection_state: "OVERDUE" | "DUE_SOON" | "DUE_TODAY" | "CURRENT";
  payment_state: "UNPAID" | "PARTIALLY_PAID";
}

export interface ReceivablesSummary {
  total_outstanding: string;
  total_overdue: string;
  total_due_today: string;
  total_due_soon: string;
  total_current: string;
  count_outstanding: number;
  count_overdue: number;
  currency: string;
}

function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? `Request failed ${res.status}`), {
      status: res.status,
      code: err?.code,
      details: err?.details,
      requestId: err?.request_id,
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useReceivables(
  orgId: string,
  opts: {
    collection_state?: string;
    customer_id?: string;
    overdue?: boolean;
    cursor?: string | null;
    limit?: number;
    sort?: string;
  } = {}
) {
  const { collection_state, customer_id, overdue, cursor, limit = 20, sort = "due_date:asc" } = opts;
  return useQuery<{ data: ReceivableItem[]; next_cursor?: string | null }>({
    queryKey: ["receivables", orgId, collection_state, customer_id, overdue, cursor, limit, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (collection_state) params.set("collection_state", collection_state);
      if (customer_id) params.set("customer_id", customer_id);
      if (typeof overdue === "boolean") params.set("overdue", String(overdue));
      if (cursor) params.set("cursor", cursor);
      params.set("limit", String(limit));
      params.set("sort", sort);
      const res = await fetchWithAuth(`${baseUrl(orgId)}/receivables?${params.toString()}`, { method: "GET" });
      return handleRes<{ data: ReceivableItem[]; next_cursor?: string | null }>(res);
    },
    enabled: !!orgId,
  });
}

export function useReceivablesSummary(orgId: string) {
  return useQuery<ReceivablesSummary>({
    queryKey: ["receivables-summary", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/receivables/summary`, { method: "GET" });
      return handleRes<ReceivablesSummary>(res);
    },
    enabled: !!orgId,
  });
}

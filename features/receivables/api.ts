"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import {
  buildReceivableCurrencyParams,
  buildReceivableListParams,
} from "./branching";

export type ReceivableItem = {
  invoice_id: string;
  invoice_number: string;
  branch_id: string;
  customer_id: string;
  customer_name: string;
  currency: string;
  grand_total: string;
  amount_paid: string;
  outstanding: string;
  due_date: string;
  days_overdue: number;
  payment_state: string;
  collection_state: string;
  issued_at: string | null;
};

export type ReceivableList = {
  data: ReceivableItem[];
  next_cursor: string | null;
};

export type ReceivablesSummary = {
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

export type AgingBucket = {
  label: string;
  days: string;
  outstanding: string;
  count: number;
};

export type AgingReport = {
  branch_id: string | null;
  currency: string;
  as_of: string;
  buckets: AgingBucket[];
  total_outstanding: string;
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

export function useReceivables(
  orgId: string,
  opts: {
    branchId?: string | null;
    collectionState?: string | null;
    paymentState?: string | null;
    overdue?: boolean | null;
    currency?: string;
    cursor?: string | null;
    limit?: number;
    sort?: string;
    enabled?: boolean;
  } = {},
) {
  const params = buildReceivableListParams(opts);
  return useQuery<ReceivableList>({
    queryKey: [
      "receivables",
      orgId,
      opts.branchId ?? null,
      opts.collectionState ?? null,
      opts.paymentState ?? null,
      opts.overdue ?? null,
      opts.currency ?? null,
      opts.cursor ?? null,
      opts.limit ?? 20,
      opts.sort ?? "due_date:asc",
    ],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/receivables?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<ReceivableList>(res);
    },
    enabled: isUuid(orgId) && (opts.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}

export function useReceivablesSummary(
  orgId: string,
  opts: {
    branchId?: string | null;
    currency: string;
    enabled?: boolean;
  },
) {
  return useQuery<ReceivablesSummary>({
    queryKey: [
      "receivables-summary",
      orgId,
      opts.branchId ?? null,
      opts.currency,
    ],
    queryFn: async () => {
      const params = buildReceivableCurrencyParams({
        currency: opts.currency,
        branchId: opts.branchId,
      });
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/receivables/summary?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<ReceivablesSummary>(res);
    },
    enabled: isUuid(orgId) && Boolean(opts.currency) && (opts.enabled ?? true),
  });
}

export function useReceivablesAging(
  orgId: string,
  opts: {
    branchId?: string | null;
    currency: string;
    enabled?: boolean;
  },
) {
  return useQuery<AgingReport>({
    queryKey: [
      "receivables-aging",
      orgId,
      opts.branchId ?? null,
      opts.currency,
    ],
    queryFn: async () => {
      const params = buildReceivableCurrencyParams({
        currency: opts.currency,
        branchId: opts.branchId,
      });
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/receivables/aging?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<AgingReport>(res);
    },
    enabled: isUuid(orgId) && Boolean(opts.currency) && (opts.enabled ?? true),
  });
}

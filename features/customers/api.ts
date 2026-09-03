"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
import type { CustomerCreateInput, CustomerPatchInput } from "./schema";

type Customer = {
  id: string;
  organization_id: string;
  name: string;
  normalized_name: string;
  email: string | null;
  phone: string | null;
  billing_address: Record<string, unknown> | null;
  tax_identifier: string | null;
  tax_identifier_type: string | null;
  business_description: string | null;
  notes: string | null;
  status: "ACTIVE" | "ARCHIVED";
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  balance_summary?: { outstanding: string; overdue: string; currency: string };
};

type CustomersRes = {
  data: Customer[];
  next_cursor: string | null;
};

type CustomerBalance = {
  customer_id: string;
  organization_id: string;
  currency: string;
  outstanding: string;
  overdue: string;
  invoiced: string;
  paid: string;
  invoice_count: number;
  overdue_count: number;
  as_of: string;
};

type HistoryItem = {
  type: string;
  id: string;
  date: string;
  summary: Record<string, unknown>;
  amount: string;
};

type HistoryRes = {
  customer_id: string;
  balance: { outstanding: string; overdue: string };
  history: { data: HistoryItem[]; next_cursor: string | null };
};

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

export function useCustomers(
  orgId: string,
  opts: { q?: string; status?: string; cursor?: string | null; limit?: number; sort?: string }
) {
  const { q, status, cursor, limit = 20, sort = "normalized_name:asc" } = opts;
  return useQuery<CustomersRes>({
    queryKey: ["customers", orgId, q, status, cursor, limit, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", String(limit));
      params.set("sort", sort);
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers?${params.toString()}`, { method: "GET" });
      return handleRes<CustomersRes>(res);
    },
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(orgId: string, customerId: string) {
  return useQuery<Customer & { contacts: Contact[] }>({
    queryKey: ["customer", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}`, { method: "GET" });
      return handleRes(res);
    },
    enabled: !!customerId,
  });
}

export function useCustomerBalance(orgId: string, customerId: string) {
  return useQuery<CustomerBalance>({
    queryKey: ["customer-balance", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/balance`, { method: "GET" });
      return handleRes(res);
    },
    enabled: !!customerId,
  });
}

export function useCustomerHistory(orgId: string, customerId: string) {
  return useInfiniteQuery<HistoryRes>({
    queryKey: ["customer-history", orgId, customerId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", String(pageParam));
      params.set("limit", "20");
      const qs = params.toString();
      const url = `${baseUrl(orgId)}/customers/${customerId}/history${qs ? `?${qs}` : ""}`;
      const res = await fetchWithAuth(url, { method: "GET" });
      return handleRes<HistoryRes>(res);
    },
    getNextPageParam: (last) => last.history.next_cursor ?? null,
    enabled: !!customerId,
  });
}

type Contact = {
  id: string;
  customer_id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  is_primary: boolean;
  email_opt_in: boolean;
  whatsapp_opt_in: boolean;
  created_at: string;
};

export function useCreateCustomer(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerCreateInput) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers", orgId] });
    },
  });
}

export function usePatchCustomer(orgId: string, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerPatchInput) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers", orgId] });
      qc.invalidateQueries({ queryKey: ["customer", orgId, customerId] });
    },
  });
}

export function useArchiveCustomer(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/archive`, { method: "POST" });
      return handleRes(res);
    },
    onSuccess: (_data, cid) => {
      qc.invalidateQueries({ queryKey: ["customers", orgId] });
      qc.invalidateQueries({ queryKey: ["customer", orgId, cid] });
    },
  });
}

export function useRestoreCustomer(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/restore`, { method: "POST" });
      return handleRes(res);
    },
    onSuccess: (_data, cid) => {
      qc.invalidateQueries({ queryKey: ["customers", orgId] });
      qc.invalidateQueries({ queryKey: ["customer", orgId, cid] });
    },
  });
}

export function useContacts(orgId: string, customerId: string) {
  return useQuery<{ data: Contact[] }>({
    queryKey: ["contacts", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/contacts`, { method: "GET" });
      return handleRes(res);
    },
    enabled: !!customerId,
  });
}

export function useAddContact(orgId: string, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email?: string | null;
      phone?: string | null;
      type?: string;
      is_primary?: boolean;
    }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", orgId, customerId] });
      qc.invalidateQueries({ queryKey: ["customer", orgId, customerId] });
    },
  });
}

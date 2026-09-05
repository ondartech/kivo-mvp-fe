"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
import type { components } from "@/generated/openapi";
import type { CustomerCreateInput, CustomerPatchInput } from "./schema";

export type CustomerOut = components["schemas"]["CustomerOut"];
// BE generates CustomerDetailOut without classification/tax fields (openapi allOf flatten issue) — intersect with CustomerOut to restore full shape
export type CustomerDetailOut = components["schemas"]["CustomerOut"] & { contacts: components["schemas"]["ContactOut"][] };
export type CustomerListRes = components["schemas"]["CustomerListRes"];
export type ContactOut = components["schemas"]["ContactOut"];
export type BillingAddress = components["schemas"]["BillingAddress"];
export type CustomerBalanceOut = components["schemas"]["app__modules__customer__schemas__CustomerBalanceOut"];
export type CustomerHistoryOut = components["schemas"]["CustomerHistoryOut"];
export type ContactListRes = components["schemas"]["ContactListRes"];

export type Customer = CustomerOut;
export type CustomersRes = CustomerListRes;
export type CustomerBalance = CustomerBalanceOut;
export type HistoryItem = CustomerHistoryOut extends { data: (infer U)[] } ? U : never;
export type HistoryRes = CustomerHistoryOut;
export type Contact = ContactOut;

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
    placeholderData: (prev: CustomersRes | undefined) => prev,
  });
}

export function useCustomer(orgId: string, customerId: string) {
  return useQuery<CustomerDetailOut>({
    queryKey: ["customer", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}`, { method: "GET" });
      return handleRes<CustomerDetailOut>(res);
    },
    enabled: !!customerId,
  });
}

export function useCustomerBalance(orgId: string, customerId: string) {
  return useQuery<CustomerBalanceOut>({
    queryKey: ["customer-balance", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/balance`, { method: "GET" });
      return handleRes<CustomerBalanceOut>(res);
    },
    enabled: !!customerId,
  });
}

export function useCustomerHistory(orgId: string, customerId: string) {
  return useInfiniteQuery<CustomerHistoryOut>({
    queryKey: ["customer-history", orgId, customerId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", String(pageParam));
      params.set("limit", "20");
      const qs = params.toString();
      const url = `${baseUrl(orgId)}/customers/${customerId}/history${qs ? `?${qs}` : ""}`;
      const res = await fetchWithAuth(url, { method: "GET" });
      return handleRes<CustomerHistoryOut>(res);
    },
    getNextPageParam: (last) => (last as unknown as { next_cursor?: string | null }).next_cursor ?? null,
    enabled: !!customerId,
  });
}

export function useCreateCustomer(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerCreateInput) => {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(input),
      });
      return handleRes<CustomerDetailOut>(res);
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
  return useQuery<ContactListRes>({
    queryKey: ["contacts", orgId, customerId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/customers/${customerId}/contacts`, { method: "GET" });
      return handleRes<ContactListRes>(res);
    },
    enabled: !!customerId,
  });
}

export function useAddContact(orgId: string, customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email?: string | null; phone?: string | null; type?: string; is_primary?: boolean }) => {
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

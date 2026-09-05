"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";

export interface InvoiceLineItem {
  id?: string;
  line_number?: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount?: string;
  tax_rate?: string | null;
  tax_amount?: string;
  line_total?: string;
}

export interface InvoiceRecord {
  id: string;
  organization_id: string;
  customer_id: string;
  customer_name?: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  currency: string;
  document_state: "DRAFT" | "ISSUED" | "VOID";
  payment_state: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  subtotal: string;
  tax_total: string;
  discount_total: string;
  charge_total: string;
  grand_total: string;
  amount_paid: string;
  amount_outstanding: string;
  line_items: InvoiceLineItem[];
  created_at: string;
}

export interface CalculatePreviewRes {
  preview: boolean;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  charge_total: string;
  grand_total: string;
  line_totals: Array<{
    line_number: number;
    quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_rate: string | null;
    tax_amount: string;
    line_total: string;
  }>;
}

export interface CreateInvoiceReq {
  customer_id: string;
  issue_date: string;
  due_date: string;
  currency?: string;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  discount_total?: string;
  charge_total?: string;
  line_items: Array<{
    description: string;
    quantity: string;
    unit_price: string;
    discount_amount?: string;
    tax_rate?: string;
  }>;
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

export function useInvoices(
  orgId: string,
  opts: { document_state?: string; customer_id?: string; cursor?: string | null; limit?: number; sort?: string } = {}
) {
  const { document_state, customer_id, cursor, limit = 20, sort = "created_at:desc" } = opts;
  return useQuery<{ data: InvoiceRecord[]; next_cursor?: string | null }>({
    queryKey: ["invoices", orgId, document_state, customer_id, cursor, limit, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (document_state) params.set("document_state", document_state);
      if (customer_id) params.set("customer_id", customer_id);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", String(limit));
      params.set("sort", sort);
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices?${params.toString()}`, { method: "GET" });
      return handleRes<{ data: InvoiceRecord[]; next_cursor?: string | null }>(res);
    },
    enabled: !!orgId,
  });
}

export function useInvoice(orgId: string, invoiceId: string) {
  return useQuery<InvoiceRecord>({
    queryKey: ["invoice", orgId, invoiceId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices/${invoiceId}`, { method: "GET" });
      return handleRes<InvoiceRecord>(res);
    },
    enabled: !!orgId && !!invoiceId,
  });
}

export function useCalculatePreview(orgId: string) {
  return useMutation<
    CalculatePreviewRes,
    Error,
    {
      line_items: Array<{ description: string; quantity: string; unit_price: string; tax_rate?: string }>;
      discount_total?: string;
      charge_total?: string;
    }
  >({
    mutationFn: async (body) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleRes<CalculatePreviewRes>(res);
    },
  });
}

export function useCreateInvoice(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<InvoiceRecord, Error, CreateInvoiceReq>({
    mutationFn: async (data) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleRes<InvoiceRecord>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["receivables", orgId] });
    },
  });
}

export function useIssueInvoice(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; invoice_number: string; document_state: string },
    Error,
    { invoiceId: string; send_email?: boolean }
  >({
    mutationFn: async ({ invoiceId, send_email = false }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices/${invoiceId}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_email }),
      });
      return handleRes<{ id: string; invoice_number: string; document_state: string }>(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["invoice", orgId, variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["receivables", orgId] });
    },
  });
}

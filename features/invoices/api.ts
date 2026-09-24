"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import { buildInvoiceListParams } from "./branching";

export type InvoiceLine = {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_code_id: string | null;
  tax_rate: string | null;
  tax_amount: string;
  line_total: string;
  commercial_item_id: string | null;
  variant_id: string | null;
  product_service_id: string | null;
  service_id: string | null;
  source_order_id?: string | null;
  source_order_line_id?: string | null;
};

export type Invoice = {
  id: string;
  organization_id: string;
  branch_id: string;
  customer_id: string;
  project_id: string | null;
  quote_id: string | null;
  milestone_id: string | null;
  contract_id: string | null;
  billing_event_id: string | null;
  source_order_id: string | null;
  source_trigger_id: string | null;
  invoice_number: string | null;
  document_state: "DRAFT" | "ISSUED" | "VOID";
  payment_state: string;
  collection_state: string;
  view_state: string;
  delivery_state: string;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_terms: string | null;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  charge_total: string;
  grand_total: string;
  notes: string | null;
  terms: string | null;
  issued_at: string | null;
  voided_at: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  viewed_at?: string | null;
  viewed_count?: number;
  created_at: string;
  updated_at: string;
  line_items: InvoiceLine[];
};

export type InvoiceList = {
  data: Invoice[];
  next_cursor: string | null;
};

export type InvoiceCreateInput = {
  branch_id?: string | null;
  customer_id: string;
  project_id?: string | null;
  quote_id?: string | null;
  milestone_id?: string | null;
  issue_date: string;
  due_date: string;
  currency: string;
  payment_terms?: string | null;
  notes?: string | null;
  terms?: string | null;
  discount_total?: string;
  charge_total?: string;
  line_items: Array<{
    description: string;
    quantity: string;
    unit_price: string;
    discount_amount?: string;
    commercial_item_id?: string | null;
    variant_id?: string | null;
    tax_code_id?: string | null;
    tax_rate?: string | null;
    product_service_id?: string | null;
    service_id?: string | null;
  }>;
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

export function useInvoices(
  orgId: string,
  opts: {
    branchId?: string | null;
    documentState?: string | null;
    cursor?: string | null;
    limit?: number;
    sort?: string;
    enabled?: boolean;
  } = {},
) {
  const params = buildInvoiceListParams(opts);
  return useQuery<InvoiceList>({
    queryKey: [
      "invoices",
      orgId,
      opts.branchId ?? null,
      opts.documentState ?? null,
      opts.cursor ?? null,
      opts.limit ?? 20,
      opts.sort ?? "created_at:desc",
    ],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/invoices?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<InvoiceList>(res);
    },
    enabled: isUuid(orgId) && (opts.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}

export function useInvoice(orgId: string, invoiceId: string) {
  return useQuery<Invoice>({
    queryKey: ["invoice", orgId, invoiceId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/invoices/${invoiceId}`,
        { method: "GET" },
      );
      return handleRes<Invoice>(res);
    },
    enabled: isUuid(orgId) && isUuid(invoiceId),
  });
}

export type InvoiceCalculatePreview = {
  preview: true;
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
    tax_code_id: string | null;
    tax_rate: string | null;
    tax_amount: string;
    line_total: string;
  }>;
};

export function useCalculateInvoicePreview(orgId: string) {
  return useMutation<
    InvoiceCalculatePreview,
    Error,
    {
      line_items: InvoiceCreateInput["line_items"];
      issue_date?: string | null;
      discount_total?: string;
      charge_total?: string;
      currency?: string | null;
    }
  >({
    mutationFn: async (input) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<InvoiceCalculatePreview>(res);
    },
  });
}

export function useCreateInvoice(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<Invoice, Error, InvoiceCreateInput>({
    mutationFn: async (input) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<Invoice>(res);
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.setQueryData(["invoice", orgId, invoice.id], invoice);
    },
  });
}

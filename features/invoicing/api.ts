"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

export type InvoiceDocumentState = "DRAFT" | "ISSUED" | "VOID";

export type InvoiceLine = {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string | null;
  tax_amount: string;
  line_total: string;
  product_service_id: string | null;
  service_id: string | null;
  source_order_id: string | null;
  source_order_line_id: string | null;
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
  document_state: InvoiceDocumentState;
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
  sent_at: string | null;
  delivered_at: string | null;
  viewed_at: string | null;
  viewed_count: number;
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
    tax_rate?: string | null;
    product_service_id?: string | null;
    service_id?: string | null;
  }>;
};

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

function requireOrganizationId(orgId: string): void {
  if (!isUuid(orgId)) {
    throw new Error(
      "Organization context is not available. Select a workspace and try again.",
    );
  }
}

async function handleRes<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const root =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const nested =
      root.error && typeof root.error === "object"
        ? (root.error as Record<string, unknown>)
        : root;
    throw Object.assign(
      new Error(
        typeof nested.message === "string"
          ? nested.message
          : `Request failed with HTTP ${res.status}`,
      ),
      {
        status: res.status,
        code: typeof nested.code === "string" ? nested.code : undefined,
        requestId:
          typeof nested.request_id === "string" ? nested.request_id : undefined,
      },
    );
  }
  return body as T;
}

export function buildInvoiceListSearchParams(input: {
  branchId?: string | null;
  documentState?: InvoiceDocumentState;
  cursor?: string | null;
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.documentState) params.set("document_state", input.documentState);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 20));
  params.set("sort", "created_at:desc");
  return params;
}

export function useInvoices(
  orgId: string,
  input: {
    branchId?: string | null;
    documentState?: InvoiceDocumentState;
    cursor?: string | null;
    limit?: number;
  },
) {
  return useQuery<InvoiceList>({
    queryKey: [
      "invoices",
      orgId,
      input.branchId ?? "all-branches",
      input.documentState ?? "all-states",
      input.cursor ?? "first-page",
      input.limit ?? 20,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = buildInvoiceListSearchParams(input);
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/invoices?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<InvoiceList>(res);
    },
    enabled: isUuid(orgId),
    placeholderData: (previous) => previous,
  });
}

export function useInvoice(orgId: string, invoiceId: string) {
  return useQuery<Invoice>({
    queryKey: ["invoice", orgId, invoiceId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/invoices/${invoiceId}`,
        { method: "GET" },
      );
      return handleRes<Invoice>(res);
    },
    enabled: isUuid(orgId) && isUuid(invoiceId),
  });
}

export function useCreateInvoice(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InvoiceCreateInput) => {
      requireOrganizationId(orgId);
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<Invoice>(res);
    },
    onSuccess: async (invoice) => {
      queryClient.setQueryData(["invoice", orgId, invoice.id], invoice);
      await queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
    },
  });
}

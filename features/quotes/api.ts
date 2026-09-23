"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import { buildQuoteListParams } from "./branching";

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type QuoteArchetype =
  | "SERVICE"
  | "PROJECT"
  | "PRODUCT"
  | "TRADE"
  | "PROFESSIONAL";

export type QuoteLine = {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  tax_rate: string | null;
  tax_amount: string;
  line_total: string;
  item_name: string | null;
  commercial_item_id: string | null;
  variant_id: string | null;
};

export type Quote = {
  id: string;
  organization_id: string;
  branch_id: string;
  customer_id: string;
  project_id: string | null;
  quote_number: string;
  quote_version: number;
  supersedes_id: string | null;
  archetype: QuoteArchetype | null;
  status: QuoteStatus;
  currency: string;
  valid_until: string | null;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  charge_total: string;
  grand_total: string;
  notes: string | null;
  terms: string | null;
  converted_invoice_id: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  expired_at: string | null;
  cancelled_at: string | null;
  delivery_state: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  line_items: QuoteLine[];
};

export type QuoteList = {
  data: Quote[];
  next_cursor: string | null;
};

export type QuoteLineInput = {
  description: string;
  quantity: string;
  unit_price: string;
  discount_amount?: string;
  tax_rate?: string | null;
};

export type QuoteCreateInput = {
  branch_id: string;
  customer_id: string;
  project_id?: string | null;
  archetype?: QuoteArchetype | null;
  currency: string;
  valid_until?: string | null;
  notes?: string | null;
  terms?: string | null;
  discount_total?: string;
  charge_total?: string;
  line_items: QuoteLineInput[];
};

export type QuoteCalculatePreview = {
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
    tax_rate: string | null;
    tax_amount: string;
    line_total: string;
  }>;
};

export type QuoteHistory = {
  quote_id: string;
  quote_number: string;
  status: QuoteStatus;
  timeline: Array<{
    kind: string;
    at: string | null;
    actor: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
  }>;
};

export type QuoteConversion = {
  quote_id: string;
  invoice_id: string;
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

export function useQuotes(
  orgId: string,
  opts: {
    branchId?: string | null;
    customerId?: string | null;
    projectId?: string | null;
    status?: QuoteStatus | null;
    cursor?: string | null;
    limit?: number;
    enabled?: boolean;
  } = {},
) {
  const params = buildQuoteListParams(opts);
  return useQuery<QuoteList>({
    queryKey: [
      "quotes",
      orgId,
      opts.branchId ?? null,
      opts.customerId ?? null,
      opts.projectId ?? null,
      opts.status ?? null,
      opts.cursor ?? null,
      opts.limit ?? 20,
    ],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/quotes?${params.toString()}`,
        { method: "GET" },
      );
      return handleRes<QuoteList>(res);
    },
    enabled: isUuid(orgId) && (opts.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}

export function useQuote(orgId: string, quoteId: string) {
  return useQuery<Quote>({
    queryKey: ["quote", orgId, quoteId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/quotes/${quoteId}`,
        { method: "GET" },
      );
      return handleRes<Quote>(res);
    },
    enabled: isUuid(orgId) && isUuid(quoteId),
  });
}

export function useQuoteHistory(orgId: string, quoteId: string) {
  return useQuery<QuoteHistory>({
    queryKey: ["quote-history", orgId, quoteId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/quotes/${quoteId}/history`,
        { method: "GET" },
      );
      return handleRes<QuoteHistory>(res);
    },
    enabled: isUuid(orgId) && isUuid(quoteId),
  });
}

export function useCalculateQuotePreview(orgId: string) {
  return useMutation<
    QuoteCalculatePreview,
    Error,
    {
      line_items: QuoteLineInput[];
      discount_total?: string;
      charge_total?: string;
      currency?: string | null;
    }
  >({
    mutationFn: async (input) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/quotes/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<QuoteCalculatePreview>(res);
    },
  });
}

export function useCreateQuote(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Quote,
    Error,
    { input: QuoteCreateInput; idempotencyKey: string }
  >({
    mutationFn: async ({ input, idempotencyKey }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      });
      return handleRes<Quote>(res);
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", orgId] });
      queryClient.setQueryData(["quote", orgId, quote.id], quote);
    },
  });
}

export function useSendQuote(orgId: string, quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, string>({
    mutationFn: async (idempotencyKey) => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/quotes/${quoteId}/send`,
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
        },
      );
      return handleRes<Quote>(res);
    },
    onSuccess: (quote) => {
      queryClient.setQueryData(["quote", orgId, quoteId], quote);
      queryClient.invalidateQueries({ queryKey: ["quotes", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["quote-history", orgId, quoteId],
      });
    },
  });
}

export function useConvertQuoteToInvoice(orgId: string, quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation<QuoteConversion, Error, string>({
    mutationFn: async (idempotencyKey) => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/quotes/${quoteId}/convert`,
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
        },
      );
      return handleRes<QuoteConversion>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", orgId, quoteId] });
      queryClient.invalidateQueries({ queryKey: ["quotes", orgId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["quote-history", orgId, quoteId],
      });
    },
  });
}

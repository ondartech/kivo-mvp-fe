import type {
  PublicInvoicePaymentOptions,
  PublicInvoicePaymentSession,
  PublicInvoiceFeePreview,
  PublicInvoiceCheckoutStatus,
} from "@/features/public/schema";

export type {
  PublicInvoicePaymentOptions,
  PublicInvoicePaymentSession,
  PublicInvoiceFeePreview,
  PublicInvoiceCheckoutStatus,
} from "@/features/public/schema";

import { fetchWithAuth } from "@/lib/api-client";
import {
  publicAcceptanceSchema,
  publicInvoiceSchema,
  publicQuoteSchema,
  publicInvoicePaymentOptionsSchema,
  publicInvoicePaymentSessionSchema,
  publicInvoiceFeePreviewSchema,
  publicInvoiceCheckoutStatusSchema,
  type PublicAcceptance,
  type PublicInvoice,
  type PublicQuote,
} from "@/features/public/schema";

export type { PublicAcceptance, PublicInvoice, PublicQuote } from "@/features/public/schema";

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
  };
};

async function parseError(response: Response): Promise<Error> {
  let body: ErrorEnvelope | null = null;
  try {
    body = (await response.json()) as ErrorEnvelope;
  } catch {
    body = null;
  }
  const message = body?.error?.message ?? "Unable to load this public link.";
  const requestId = body?.error?.request_id;
  return new Error(requestId ? `${message} (Request ${requestId})` : message);
}


export async function getPublicInvoice(token: string): Promise<PublicInvoice> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoiceSchema.parse(await response.json());
}

export async function getPublicQuote(token: string): Promise<PublicQuote> {
  const response = await fetchWithAuth(
    `/api/public/quotes/${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicQuoteSchema.parse(await response.json());
}

export async function getPublicAcceptance(token: string): Promise<PublicAcceptance> {
  const response = await fetchWithAuth(
    `/api/public/acceptances/${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicAcceptanceSchema.parse(await response.json());
}

export async function acceptPublicAcceptance(
  token: string,
  customerName?: string,
  review?: { revision_hash: string; manifest_hash: string },
): Promise<PublicAcceptance> {
  const response = await fetchWithAuth(
    `/api/public/acceptances/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName?.trim() || null,
        ...(review
          ? {
              review_revision_hash: review.revision_hash,
              review_manifest_hash: review.manifest_hash,
            }
          : {}),
      }),
    },
  );
  if (!response.ok) throw await parseError(response);
  return publicAcceptanceSchema.parse(await response.json());
}

export async function rejectPublicAcceptance(
  token: string,
  reason: string,
  customerName?: string,
): Promise<PublicAcceptance> {
  const response = await fetchWithAuth(
    `/api/public/acceptances/${encodeURIComponent(token)}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: reason.trim(),
        customer_name: customerName?.trim() || null,
      }),
    },
  );
  if (!response.ok) throw await parseError(response);
  return publicAcceptanceSchema.parse(await response.json());
}

export async function getPublicInvoicePaymentOptions(
  token: string,
): Promise<PublicInvoicePaymentOptions> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-options`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoicePaymentOptionsSchema.parse(await response.json());
}

export async function getPublicInvoicePaymentSession(
  token: string,
): Promise<PublicInvoicePaymentSession> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoicePaymentSessionSchema.parse(await response.json());
}

export async function choosePublicInvoicePsp(
  token: string,
  connectionId: string,
  expectedVersion: number,
  idempotencyKey: string,
): Promise<PublicInvoicePaymentSession> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session/selections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        connection_id: connectionId,
        expected_version: expectedVersion,
      }),
    },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoicePaymentSessionSchema.parse(await response.json());
}

export async function getPublicInvoicePspFeePreview(
  token: string,
): Promise<PublicInvoiceFeePreview> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session/fee-preview`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoiceFeePreviewSchema.parse(await response.json());
}

export async function acknowledgePublicInvoicePspFees(
  token: string,
  quote: PublicInvoiceFeePreview,
  idempotencyKey: string,
): Promise<{ state: string; checkout_enabled: boolean }> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session/fee-consents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        choice_version: quote.choice_version,
        terms_sha256: quote.terms_sha256,
        buyer_total: quote.buyer_total,
      }),
    },
  );
  if (!response.ok) throw await parseError(response);
  const data = (await response.json()) as {
    state: string;
    checkout_enabled: boolean;
  };
  return data;
}


// IPACK-UI-002B: no API returns a provider redirect URL; the hosted-checkout
// route must be navigated directly only after server certification.
export async function getPublicInvoiceCheckoutStatus(
  token: string,
): Promise<PublicInvoiceCheckoutStatus> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session/attempt-status`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoiceCheckoutStatusSchema.parse(await response.json());
}

export async function initiatePublicInvoiceCheckout(
  token: string,
  quote: PublicInvoiceFeePreview,
  idempotencyKey: string,
): Promise<PublicInvoiceCheckoutStatus> {
  const response = await fetchWithAuth(
    `/api/public/invoices/${encodeURIComponent(token)}/payment-session/checkout-attempts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        choice_version: quote.choice_version,
        terms_sha256: quote.terms_sha256,
        buyer_total: quote.buyer_total,
      }),
    },
  );
  if (!response.ok) throw await parseError(response);
  return publicInvoiceCheckoutStatusSchema.parse(await response.json());
}

export function certifiedPspCheckoutPath(token: string): string {
  return `/api/public/invoices/${encodeURIComponent(token)}/payment-session/hosted-checkout`;
}

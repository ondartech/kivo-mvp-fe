"use client";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

export type SettlementValuationSnapshot = {
  id: string;
  organization_id: string;
  legal_entity_id: string;
  subject_type: string;
  subject_id: string;
  subject_version: number | null;
  purpose: "SETTLEMENT";
  source_currency: string;
  target_currency: string;
  rate_type: "BANK_EXECUTION";
  as_of: string;
  effective_rate: string;
  inverse_derived: boolean;
  source_rate_id: string;
  source_type: string;
  source_reference: string;
  source_identity_hash: string;
  source_quote_hash: string;
  source_provenance_hash: string;
  valuation_identity_hash: string;
  snapshot_hash: string;
  created_at: string;
};

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
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
          : `Request failed with HTTP ${response.status}`,
      ),
      {
        status: response.status,
        code: typeof nested.code === "string" ? nested.code : undefined,
        details: nested.details,
        requestId:
          typeof nested.request_id === "string" ? nested.request_id : undefined,
      },
    );
  }
  return body as T;
}

export async function resolvePaymentRunSettlementValuation(
  orgId: string,
  input: {
    legalEntityId: string;
    paymentObligationId: string;
    paymentObligationVersion: number;
    sourceCurrency: string;
    settlementCurrency: string;
    asOf: string;
  },
): Promise<SettlementValuationSnapshot> {
  if (!isUuid(orgId) || !isUuid(input.legalEntityId) || !isUuid(input.paymentObligationId)) {
    throw new Error("A valid Organization, payer LegalEntity, and Payment Obligation are required.");
  }
  if (
    !/^[A-Z]{3}$/.test(input.sourceCurrency) ||
    !/^[A-Z]{3}$/.test(input.settlementCurrency)
  ) {
    throw new Error("Settlement valuation requires explicit ISO currencies.");
  }
  if (input.sourceCurrency === input.settlementCurrency) {
    throw new Error("Same-currency Payment Run items must not resolve FX valuation evidence.");
  }

  const response = await fetchWithAuth(`${baseUrl(orgId)}/fx/valuations/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      legal_entity_id: input.legalEntityId,
      subject_type: "PAYMENT_OBLIGATION",
      subject_id: input.paymentObligationId,
      subject_version: input.paymentObligationVersion,
      purpose: "SETTLEMENT",
      source_currency: input.sourceCurrency,
      target_currency: input.settlementCurrency,
      rate_type: "BANK_EXECUTION",
      as_of: input.asOf,
    }),
  });
  const snapshot = await parseResponse<SettlementValuationSnapshot>(response);
  if (
    snapshot.purpose !== "SETTLEMENT" ||
    snapshot.rate_type !== "BANK_EXECUTION" ||
    snapshot.legal_entity_id !== input.legalEntityId ||
    snapshot.source_currency !== input.sourceCurrency ||
    snapshot.target_currency !== input.settlementCurrency
  ) {
    throw new Error("Settlement valuation evidence does not match the Payment Run economics.");
  }
  return snapshot;
}

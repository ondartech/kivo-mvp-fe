import { fetchWithAuth } from "@/lib/api-client";
import {
  publicAcceptanceSchema,
  publicQuoteSchema,
  type PublicAcceptance,
  type PublicQuote,
} from "@/features/public/schema";

export type { PublicAcceptance, PublicQuote } from "@/features/public/schema";

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
): Promise<PublicAcceptance> {
  const response = await fetchWithAuth(
    `/api/public/acceptances/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName?.trim() || null,
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

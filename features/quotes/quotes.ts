import type { Quote } from "./api";

export function canSendQuote(quote: Quote): boolean {
  return quote.status === "DRAFT";
}

export function canConvertQuote(quote: Quote): boolean {
  return quote.status === "ACCEPTED" && quote.converted_invoice_id === null;
}

export function quoteStatusVariant(status: Quote["status"]) {
  if (status === "ACCEPTED") return "success" as const;
  if (status === "SENT") return "info" as const;
  if (status === "REJECTED" || status === "CANCELLED") {
    return "critical" as const;
  }
  if (status === "EXPIRED") return "warning" as const;
  return "neutral" as const;
}

export function quoteActionErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (code === "ORDER_BILLING_REQUIRED") {
    return "This accepted Quote has an Order commitment. Create billing through the Order instead.";
  }
  if (code === "QUOTE_SUPERSEDED") {
    return "This Quote has a newer version. Use the latest proposal round.";
  }
  if (code === "QUOTE_NOT_ACCEPTED") {
    return "Only an accepted Quote can create an Invoice draft.";
  }
  if (code === "QUOTE_EXPIRED") {
    return "This Quote has expired and cannot be converted.";
  }
  if (code === "APPROVAL_REQUIRED") {
    return "This Quote requires approval before it can be sent.";
  }
  return error instanceof Error ? error.message : "The Quote action failed.";
}

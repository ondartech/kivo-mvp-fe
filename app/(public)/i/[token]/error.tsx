"use client";

import * as React from "react";
import { ErrorView } from "@/components/kivo/error-view";
import { extractErrorDetails } from "@/lib/error-codes";

export default function PublicInvoiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const details = extractErrorDetails(error);

  // Map public invoice specific error representations (FRONTEND_SPEC.md §8)
  if (details.code === "TOKEN_REVOKED" || details.code === "TOKEN_EXPIRED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <ErrorView
          category="not_found"
          code="TOKEN_REVOKED"
          title="Link expired"
          description="This invoice link has expired or was revoked by the sender. Please contact the business for an updated link."
        />
      </div>
    );
  }

  if (details.code === "INVOICE_NOT_FOUND" || details.status === 404) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <ErrorView
          category="not_found"
          title="Invoice not found"
          description="This invoice does not exist or the link is invalid. No information can be displayed."
        />
      </div>
    );
  }

  if (details.code === "RATE_LIMITED" || details.status === 429) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <ErrorView
          category="rate_limited"
          code="RATE_LIMITED"
          title="Too many attempts"
          description="You have made too many requests. Please wait a moment before trying again."
          onRetry={reset}
        />
      </div>
    );
  }

  if (details.code === "PROVIDER_ERROR" || details.code === "PROVIDER_UNAVAILABLE") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <ErrorView
          category="provider"
          code="PROVIDER_UNAVAILABLE"
          title="Payment service unavailable"
          description="The online payment provider is temporarily unavailable. Direct bank transfer instructions on the invoice remain valid."
          onRetry={reset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <ErrorView
        code={details.code}
        title="Could not load invoice"
        description="We were unable to load the requested invoice. Please try again."
        requestId={details.requestId}
        onRetry={reset}
      />
    </div>
  );
}

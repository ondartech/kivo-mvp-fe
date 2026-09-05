"use client";

import * as React from "react";
import { ErrorView } from "@/components/kivo/error-view";
import { extractErrorDetails } from "@/lib/error-codes";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const details = extractErrorDetails(error);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <ErrorView
        code={details.code}
        title="Application Error"
        description={details.message || "An unexpected error occurred. Please try again."}
        requestId={details.requestId}
        onRetry={reset}
        secondaryAction={{
          label: "Back to home",
          href: "/",
          variant: "secondary",
        }}
      />
    </div>
  );
}

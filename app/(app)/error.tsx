"use client";

import * as React from "react";
import { ErrorView } from "@/components/kivo/error-view";
import { extractErrorDetails } from "@/lib/error-codes";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const details = extractErrorDetails(error);

  return (
    <div className="py-12 px-4 flex justify-center">
      <ErrorView
        code={details.code}
        title={details.code ? undefined : "Workspace Error"}
        description={details.message || "Failed to load workspace data. Please retry."}
        requestId={details.requestId}
        onRetry={reset}
        secondaryAction={{
          label: "Back to dashboard",
          href: "/app/dashboard",
          variant: "secondary",
        }}
      />
    </div>
  );
}

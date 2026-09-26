"use client";

import { useParams } from "next/navigation";

import { EmptyState } from "@/components/kivo/empty-state";
import { PaymentRunWorkspace } from "@/features/payments/run-workspace";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function PaymentRunDetailPage() {
  const { paymentRunId } = useParams<{ paymentRunId: string }>();
  const orgId = useActiveOrganizationId() ?? "";

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening a Payment Run."
      />
    );
  }

  return (
    <PaymentRunWorkspace orgId={orgId} paymentRunId={paymentRunId} />
  );
}

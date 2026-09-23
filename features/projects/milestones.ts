import type { ProjectMilestone } from "./api";

export function canCompleteMilestone(milestone: ProjectMilestone): boolean {
  return milestone.completion_status === "PENDING";
}

export function canPrepareMilestoneInvoice(
  milestone: ProjectMilestone,
): boolean {
  return (
    milestone.completion_status === "COMPLETED" &&
    milestone.billing_status === "READY"
  );
}

export function milestoneBillingLabel(status: string): string {
  if (status === "READY") return "Ready to bill";
  if (status === "NOT_BILLABLE") return "Not billable";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function milestoneBillingVariant(status: string) {
  if (status === "READY") return "warning" as const;
  if (status === "INVOICED") return "info" as const;
  return "neutral" as const;
}

export function milestoneCompletionVariant(status: string) {
  return status === "COMPLETED" ? ("success" as const) : ("neutral" as const);
}

export function milestonePrepareErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (code === "ACCEPTANCE_PENDING") {
    return "Customer acceptance is still pending. The milestone cannot be billed yet.";
  }
  if (code === "ACCEPTANCE_REJECTED") {
    return "Customer acceptance was rejected. Resolve the acceptance before billing.";
  }
  if (code === "ORDER_BILLING_REQUIRED") {
    return "This Project has Order commitments. Prepare billing through the Order instead.";
  }
  if (code === "MILESTONE_ALREADY_INVOICED") {
    return "This milestone has already been invoiced.";
  }
  if (code === "MILESTONE_NOT_READY") {
    return "This milestone is not ready to bill.";
  }
  return error instanceof Error
    ? error.message
    : "Could not prepare the invoice draft.";
}

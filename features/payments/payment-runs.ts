import type { PaymentRun, PaymentRunItem } from "./schema";

export type PaymentRunStatusVariant =
  | "neutral"
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "processing";

export function humanizePaymentValue(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function shortPaymentId(value: string): string {
  return value.length > 14
    ? `${value.slice(0, 8)}…${value.slice(-4)}`
    : value;
}

export function paymentRunStatusVariant(
  status: string,
): PaymentRunStatusVariant {
  if (["SETTLED"].includes(status)) return "success";
  if (["REJECTED", "FAILED"].includes(status)) return "critical";
  if (["CANCELLED", "COMPLETED_WITH_EXCEPTIONS"].includes(status)) {
    return "warning";
  }
  if (["EXECUTING", "PARTIALLY_SETTLED"].includes(status)) return "processing";
  if (["PENDING_APPROVAL", "APPROVED", "READY"].includes(status)) return "info";
  return "neutral";
}

export function paymentInstructionStatusVariant(
  status: string,
): PaymentRunStatusVariant {
  if (status === "SETTLED") return "success";
  if (["FAILED", "REJECTED", "OUTCOME_UNKNOWN"].includes(status)) {
    return status === "OUTCOME_UNKNOWN" ? "warning" : "critical";
  }
  if (["DISPATCHED", "ACCEPTED", "IN_TRANSIT", "SUBMITTED"].includes(status)) {
    return "processing";
  }
  return "neutral";
}

export function paymentOutcomeStatusVariant(
  status: string,
): PaymentRunStatusVariant {
  if (status === "PROPAGATED") return "success";
  if (status === "QUARANTINED") return "critical";
  if (status === "RETRYING") return "warning";
  return "processing";
}

export function canEditPaymentRun(run: PaymentRun): boolean {
  return run.status === "DRAFT" && !run.archived_at;
}

export function canSubmitPaymentRun(run: PaymentRun): boolean {
  return (
    canEditPaymentRun(run) &&
    run.item_count > 0 &&
    run.items.every(
      (item) =>
        item.status === "REMOVED" ||
        (item.destination_configured && item.destination_trust_id !== null),
    )
  );
}

export function canCancelPaymentRun(run: PaymentRun): boolean {
  return (
    !run.archived_at &&
    ["DRAFT", "APPROVED", "READY"].includes(run.status)
  );
}

export function canPreparePaymentExecution(run: PaymentRun): boolean {
  return !run.archived_at && run.status === "APPROVED";
}

export function canCompleteWithExceptions(run: PaymentRun): boolean {
  return (
    !run.archived_at &&
    ["FAILED", "PARTIALLY_SETTLED"].includes(run.status)
  );
}

export function canArchivePaymentRun(run: PaymentRun): boolean {
  return (
    !run.archived_at &&
    ["SETTLED", "REJECTED", "CANCELLED", "COMPLETED_WITH_EXCEPTIONS"].includes(
      run.status,
    )
  );
}

export function canUnarchivePaymentRun(run: PaymentRun): boolean {
  return Boolean(run.archived_at);
}

export function itemDestinationLabel(item: PaymentRunItem): string {
  if (!item.destination_configured) return "Destination required";
  const bank = item.destination_bank_name ?? item.destination_bank_code ?? "Bank";
  const last4 = item.destination_account_number_last4
    ? `•••• ${item.destination_account_number_last4}`
    : "account configured";
  return `${bank} · ${last4}`;
}

export function paymentOperationsErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "The payment operation could not be completed.";
  }
  const code = (error as Error & { code?: string }).code;
  const messages: Record<string, string> = {
    PAYMENT_RUN_DESTINATION_REQUIRED:
      "Every active line requires an executable beneficiary destination before submission.",
    PAYMENT_RUN_OBLIGATION_NOT_AVAILABLE:
      "At least one obligation is no longer available. Refresh the run before continuing.",
    PAYMENT_RUN_OBLIGATION_VERSION_STALE:
      "An obligation changed after it was added. Remove it and add the current obligation state.",
    PAYMENT_RUN_RESERVATION_STALE:
      "The reserved amount no longer fits the current outstanding balance.",
    PAYMENT_RUN_BRANCH_SCOPE_MISMATCH:
      "This run spans more than one branch. Split the obligations into branch-specific runs.",
    PAYMENT_RUN_APPROVAL_REQUIRED:
      "This run must pass the configured approval authority before execution.",
    PAYMENT_RUN_ALREADY_ARCHIVED: "This Payment Run is already archived.",
    PAYMENT_RUN_NOT_ARCHIVABLE:
      "Only irreversible terminal Payment Runs can be archived.",
    PAYMENT_RUN_NOT_ARCHIVED: "This Payment Run is not archived.",
    PAYMENT_RUN_PREVIEW_DUPLICATE_OBLIGATION:
      "Each Payment Obligation may appear only once in a Payment Run.",
    STEP_UP_REQUIRED:
      "Re-authentication is required before this financial action can continue.",
    PAYMENT_EXECUTION_STEP_UP_REQUIRED:
      "Re-authenticate before releasing this Payment Execution.",
    APPROVAL_STEP_UP_REQUIRED:
      "Re-authenticate before recording this approval decision.",
    SEGREGATION_OF_DUTIES_VIOLATION:
      "This approval requires a different authorized operator.",
    WORKFLOW_TRIGGER_REQUIRES_PUBLISHED_VERSION:
      "Publish a Workflow version before enabling its trigger.",
  };
  return code && messages[code] ? messages[code] : error.message;
}

export function reconciliationEvidenceTypes(
  outcome: "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED",
): string[] {
  if (outcome === "IN_TRANSIT") {
    return [
      "IRREVOCABLE_BANK_ACCEPTANCE",
      "IRREVOCABLE_PROVIDER_ACCEPTANCE",
    ];
  }
  if (outcome === "SETTLED") {
    return [
      "BANK_STATEMENT_DEBIT",
      "BANK_PORTAL_SETTLED",
      "PROVIDER_VERIFIED_SETTLED",
    ];
  }
  return [
    "BANK_FILE_REJECTED",
    "BANK_PORTAL_REJECTED",
    "PROVIDER_VERIFIED_FAILED",
  ];
}

export function instructionResultEvidenceTypes(status: string): string[] {
  if (status === "DISPATCHED") {
    return ["MANUAL_DISPATCH", "BANK_FILE_UPLOADED"];
  }
  if (status === "ACCEPTED") {
    return [
      "BANK_ACKNOWLEDGEMENT",
      "PROVIDER_ACCEPTANCE",
      "STATUS_ENQUIRY",
    ];
  }
  if (status === "IN_TRANSIT") {
    return [
      "IRREVOCABLE_BANK_ACCEPTANCE",
      "IRREVOCABLE_PROVIDER_ACCEPTANCE",
    ];
  }
  return [];
}

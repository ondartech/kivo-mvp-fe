import { describe, expect, it } from "vitest";

import {
  canArchivePaymentRun,
  canCancelPaymentRun,
  canCompleteWithExceptions,
  canPreparePaymentExecution,
  canSubmitPaymentRun,
  paymentInstructionStatusVariant,
  paymentOutcomeStatusVariant,
  paymentRunStatusVariant,
} from "@/features/payments/payment-runs";
import { paymentRunSchema } from "@/features/payments/schema";

const ids = {
  org: "11111111-1111-4111-8111-111111111111",
  run: "22222222-2222-4222-8222-222222222222",
  bank: "33333333-3333-4333-8333-333333333333",
  user: "44444444-4444-4444-8444-444444444444",
  item: "55555555-5555-4555-8555-555555555555",
  obligation: "66666666-6666-4666-8666-666666666666",
  trust: "77777777-7777-4777-8777-777777777777",
};

function paymentRun(overrides: Record<string, unknown> = {}) {
  return paymentRunSchema.parse({
    id: ids.run,
    organization_id: ids.org,
    run_number: "PAYRUN-000008",
    name: "Production hardening run",
    currency: "NGN",
    funding_bank_account_id: ids.bank,
    funding_account_snapshot: {},
    scheduled_execution_date: "2026-09-30",
    status: "DRAFT",
    version: 1,
    version_hash: "b".repeat(64),
    submitted_material_hash: null,
    submitted_at: null,
    approval_request_id: null,
    approval_decided_at: null,
    approval_decided_by_user_id: null,
    cancelled_at: null,
    cancelled_by_user_id: null,
    cancellation_reason: null,
    exception_closed_at: null,
    exception_closed_by_user_id: null,
    exception_closure_reason: null,
    archived_at: null,
    archived_by_user_id: null,
    archive_reason: null,
    created_by_user_id: ids.user,
    created_at: "2026-09-26T12:00:00Z",
    updated_at: "2026-09-26T12:00:00Z",
    total_amount: "250000.000000",
    item_count: 1,
    branch_ids: [],
    items: [
      {
        id: ids.item,
        payment_obligation_id: ids.obligation,
        branch_id: null,
        allocated_amount: "250000.000000",
        currency: "NGN",
        obligation_outstanding_at_reservation: "250000.000000",
        obligation_version_at_reservation: 1,
        source_snapshot: {},
        beneficiary_snapshot: {},
        destination_configured: true,
        destination_trust_id: ids.trust,
        destination_fingerprint: "fingerprint",
        destination_bank_code: "058",
        destination_bank_name: "Example Bank",
        destination_account_number_last4: "1234",
        destination_account_name: "Supplier Ltd",
        destination_currency: "NGN",
        destination_source: "MANUAL",
        destination_verification_status: "VERIFIED",
        status: "ACTIVE",
        created_at: "2026-09-26T12:00:00Z",
        removed_at: null,
        removed_by_user_id: null,
      },
    ],
    ...overrides,
  });
}

describe("PAYRUN-FE-002 production hardening", () => {
  it("never presents dispatch, acceptance, transit, or unknown outcome as settled", () => {
    expect(paymentInstructionStatusVariant("DISPATCHED")).toBe("processing");
    expect(paymentInstructionStatusVariant("ACCEPTED")).toBe("processing");
    expect(paymentInstructionStatusVariant("IN_TRANSIT")).toBe("processing");
    expect(paymentInstructionStatusVariant("OUTCOME_UNKNOWN")).toBe("warning");
    expect(paymentInstructionStatusVariant("SETTLED")).toBe("success");
  });

  it("keeps Payment Run execution and settlement lifecycle visibly distinct", () => {
    expect(paymentRunStatusVariant("EXECUTING")).toBe("processing");
    expect(paymentRunStatusVariant("PARTIALLY_SETTLED")).toBe("processing");
    expect(paymentRunStatusVariant("SETTLED")).toBe("success");
    expect(paymentRunStatusVariant("COMPLETED_WITH_EXCEPTIONS")).toBe("warning");
  });

  it("keeps PAYRUN-009 propagation state separate from payment settlement state", () => {
    expect(paymentOutcomeStatusVariant("PENDING")).toBe("processing");
    expect(paymentOutcomeStatusVariant("RETRYING")).toBe("warning");
    expect(paymentOutcomeStatusVariant("PROPAGATED")).toBe("success");
    expect(paymentOutcomeStatusVariant("QUARANTINED")).toBe("critical");
  });

  it("does not allow pending approval to bypass the Approval API through run cancellation", () => {
    expect(canCancelPaymentRun(paymentRun({ status: "PENDING_APPROVAL" }))).toBe(false);
    expect(canCancelPaymentRun(paymentRun({ status: "DRAFT" }))).toBe(true);
    expect(canCancelPaymentRun(paymentRun({ status: "APPROVED" }))).toBe(true);
    expect(canCancelPaymentRun(paymentRun({ status: "READY" }))).toBe(true);
  });

  it("only exposes execution preparation after approval", () => {
    expect(canPreparePaymentExecution(paymentRun({ status: "DRAFT" }))).toBe(false);
    expect(canPreparePaymentExecution(paymentRun({ status: "PENDING_APPROVAL" }))).toBe(false);
    expect(canPreparePaymentExecution(paymentRun({ status: "APPROVED" }))).toBe(true);
  });

  it("requires a destination for every active run item before submission", () => {
    expect(canSubmitPaymentRun(paymentRun())).toBe(true);
    expect(
      canSubmitPaymentRun(
        paymentRun({
          items: [
            {
              ...paymentRun().items[0],
              destination_configured: false,
              destination_trust_id: null,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("keeps failed and partially settled runs recoverable rather than archivable", () => {
    expect(canCompleteWithExceptions(paymentRun({ status: "FAILED" }))).toBe(true);
    expect(
      canCompleteWithExceptions(paymentRun({ status: "PARTIALLY_SETTLED" })),
    ).toBe(true);
    expect(canArchivePaymentRun(paymentRun({ status: "FAILED" }))).toBe(false);
    expect(canArchivePaymentRun(paymentRun({ status: "PARTIALLY_SETTLED" }))).toBe(false);
  });

  it("archives only irreversible terminal run states", () => {
    for (const status of [
      "SETTLED",
      "REJECTED",
      "CANCELLED",
      "COMPLETED_WITH_EXCEPTIONS",
    ]) {
      expect(canArchivePaymentRun(paymentRun({ status }))).toBe(true);
    }

    for (const status of [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "READY",
      "EXECUTING",
      "FAILED",
      "PARTIALLY_SETTLED",
    ]) {
      expect(canArchivePaymentRun(paymentRun({ status }))).toBe(false);
    }
  });
});

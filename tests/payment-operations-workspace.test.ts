import { describe, expect, it } from "vitest";

import {
  canArchivePaymentRun,
  canCancelPaymentRun,
  canCompleteWithExceptions,
  canPreparePaymentExecution,
  canSubmitPaymentRun,
  instructionResultEvidenceTypes,
  paymentOperationsErrorMessage,
  reconciliationEvidenceTypes,
} from "@/features/payments/payment-runs";
import {
  decimalStringSchema,
  paymentRunSchema,
  paymentRunTemplateSchema,
  workflowTriggerSchema,
} from "@/features/payments/schema";

const ids = {
  org: "11111111-1111-4111-8111-111111111111",
  run: "22222222-2222-4222-8222-222222222222",
  bank: "33333333-3333-4333-8333-333333333333",
  user: "44444444-4444-4444-8444-444444444444",
  item: "55555555-5555-4555-8555-555555555555",
  obligation: "66666666-6666-4666-8666-666666666666",
  trust: "77777777-7777-4777-8777-777777777777",
};

function run(overrides: Record<string, unknown> = {}) {
  return paymentRunSchema.parse({
    id: ids.run,
    organization_id: ids.org,
    run_number: "PAYRUN-000009",
    name: "Supplier run",
    currency: "NGN",
    funding_bank_account_id: ids.bank,
    funding_account_snapshot: {},
    scheduled_execution_date: "2026-09-30",
    status: "DRAFT",
    version: 1,
    version_hash: "a".repeat(64),
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
    total_amount: "125000.000000",
    item_count: 1,
    branch_ids: [],
    items: [
      {
        id: ids.item,
        payment_obligation_id: ids.obligation,
        branch_id: null,
        allocated_amount: "125000.000000",
        currency: "NGN",
        obligation_outstanding_at_reservation: "125000.000000",
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

describe("PAYRUN-FE-001 Payment Operations workspace", () => {
  it("keeps authoritative money as decimal strings", () => {
    expect(decimalStringSchema.parse("125000.000000")).toBe("125000.000000");
    expect(() => decimalStringSchema.parse(125000)).toThrow();
  });

  it("only submits a populated draft with executable destinations", () => {
    expect(canSubmitPaymentRun(run())).toBe(true);

    const notReady = run({
      items: [
        {
          ...run().items[0],
          destination_configured: false,
          destination_trust_id: null,
        },
      ],
    });
    expect(canSubmitPaymentRun(notReady)).toBe(false);

    expect(canSubmitPaymentRun(run({ status: "PENDING_APPROVAL" }))).toBe(
      false,
    );
  });

  it("mirrors backend lifecycle boundaries instead of inventing actions", () => {
    expect(canCancelPaymentRun(run({ status: "DRAFT" }))).toBe(true);
    expect(canCancelPaymentRun(run({ status: "PENDING_APPROVAL" }))).toBe(
      false,
    );
    expect(canPreparePaymentExecution(run({ status: "APPROVED" }))).toBe(true);
    expect(
      canCompleteWithExceptions(run({ status: "PARTIALLY_SETTLED" })),
    ).toBe(true);
    expect(canArchivePaymentRun(run({ status: "SETTLED" }))).toBe(true);
    expect(canArchivePaymentRun(run({ status: "FAILED" }))).toBe(false);
  });

  it("maps instruction and reconciliation evidence to authoritative state", () => {
    expect(instructionResultEvidenceTypes("DISPATCHED")).toContain(
      "BANK_FILE_UPLOADED",
    );
    expect(instructionResultEvidenceTypes("IN_TRANSIT")).toContain(
      "IRREVOCABLE_BANK_ACCEPTANCE",
    );
    expect(reconciliationEvidenceTypes("SETTLED")).toContain(
      "BANK_STATEMENT_DEBIT",
    );
    expect(reconciliationEvidenceTypes("NOT_SETTLED")).toContain(
      "PROVIDER_VERIFIED_FAILED",
    );
  });

  it("surfaces lifecycle safety blockers in operator language", () => {
    expect(
      paymentOperationsErrorMessage(
        Object.assign(new Error("blocked"), {
          code: "PAYMENT_RUN_RESERVATION_STALE",
        }),
      ),
    ).toContain("reserved amount");

    expect(
      paymentOperationsErrorMessage(
        Object.assign(new Error("blocked"), {
          code: "SEGREGATION_OF_DUTIES_VIOLATION",
        }),
      ),
    ).toContain("different authorized operator");
  });

  it("parses recurring templates without implying pre-approval", () => {
    const template = paymentRunTemplateSchema.parse({
      id: ids.item,
      organization_id: ids.org,
      name: "Monthly supplier payments",
      cadence: "MONTHLY",
      generation_rule: {
        timezone: "Africa/Lagos",
        hour: 8,
        minute: 0,
        weekday: null,
        day_of_month: 25,
      },
      planned_execution_rule: { offset_days: 1 },
      funding_bank_account_id: ids.bank,
      currency: "NGN",
      source_filters: {
        obligation_types: ["VENDOR_PAYABLE"],
        source_types: ["PAYABLE"],
        branch_id: null,
        due_on_or_before_execution: true,
        include_undated: false,
        max_items: 50,
      },
      approval_policy_id: null,
      active: true,
      version: 1,
      next_generation_at: "2026-10-25T07:00:00Z",
      suspended_at: null,
      suspended_by_user_id: null,
      created_by_user_id: ids.user,
      created_at: "2026-09-26T12:00:00Z",
      updated_at: "2026-09-26T12:00:00Z",
    });

    expect(template.active).toBe(true);
    expect(template.cadence).toBe("MONTHLY");
  });

  it("parses WF-001 activation state as server authority", () => {
    const trigger = workflowTriggerSchema.parse({
      id: ids.item,
      organization_id: ids.org,
      workflow_definition_id: ids.run,
      trigger_key: "SUPPLIER_SETTLED",
      event_type: "payments.payment_outcome_propagated",
      event_schema_version: 1,
      status: "ACTIVE",
      scope: "ORGANIZATION",
      branch_id: null,
      active_since: "2026-09-26T12:00:00Z",
      conditions: [
        {
          path: "payload.outcome_type",
          operator: "EQ",
          value: "SETTLED",
        },
      ],
      input_mapping: {
        payment_run_id: "payload.payment_run_id",
      },
      created_at: "2026-09-26T12:00:00Z",
      updated_at: "2026-09-26T12:00:00Z",
    });

    expect(trigger.status).toBe("ACTIVE");
    expect(trigger.event_type).toBe("payments.payment_outcome_propagated");
  });
});

import { describe, expect, it } from "vitest";

import {
  billLineDescription,
  formatDecimalText,
  matchEvaluationSchema,
  matchExceptionSchema,
  matchReviewQueueSchema,
  needsReview,
  reviewPriority,
  supplierDisplayName,
} from "@/features/finance-matching/schema";

const ids = {
  org: "11111111-1111-4111-8111-111111111111",
  bill: "22222222-2222-4222-8222-222222222222",
  party: "33333333-3333-4333-8333-333333333333",
  evaluation: "44444444-4444-4444-8444-444444444444",
  line: "55555555-5555-4555-8555-555555555555",
  billLine: "66666666-6666-4666-8666-666666666666",
  orderLine: "77777777-7777-4777-8777-777777777777",
  exception: "88888888-8888-4888-8888-888888888888",
};

function queueItem(overrides: Record<string, unknown> = {}) {
  return {
    supplier_bill_id: ids.bill,
    bill_number: "BILL-000123",
    supplier_party_id: ids.party,
    supplier_snapshot: { legal_name: "Lagos Production Services Ltd" },
    supplier_invoice_number: "SUP-8821",
    bill_date: "2026-09-21",
    due_date: "2026-10-21",
    currency: "NGN",
    grand_total: "1250000.000000",
    bill_status: "UNDER_REVIEW",
    bill_version: 3,
    source_type: "PURCHASE_ORDER",
    purchase_order_id: null,
    latest_evaluation_id: ids.evaluation,
    match_mode: "THREE_WAY",
    match_result: "MISMATCH",
    evaluation_hash: "hash",
    evaluated_at: "2026-09-21T12:00:00+00:00",
    open_exception_count: 2,
    open_material_exception_count: 1,
    ...overrides,
  };
}

describe("finance match-review contracts", () => {
  it("accepts the Finance review queue contract", () => {
    const parsed = matchReviewQueueSchema.parse({
      data: [queueItem()],
    });
    expect(parsed.data[0].match_result).toBe("MISMATCH");
    expect(parsed.data[0].open_material_exception_count).toBe(1);
  });

  it("rejects unexpected queue fields", () => {
    expect(() =>
      matchReviewQueueSchema.parse({
        data: [queueItem({ unexpected: true })],
      }),
    ).toThrow();
  });

  it("accepts deterministic evaluation line evidence", () => {
    const parsed = matchEvaluationSchema.parse({
      id: ids.evaluation,
      organization_id: ids.org,
      supplier_bill_id: ids.bill,
      bill_version: 3,
      match_mode: "THREE_WAY",
      result: "MISMATCH",
      evaluation_hash: "hash",
      application_ids: [],
      summary: { mismatch_line_count: 1 },
      evidence_snapshot: {},
      evaluated_by_user_id: null,
      created_at: "2026-09-21T12:00:00+00:00",
      line_results: [
        {
          id: ids.line,
          evaluation_id: ids.evaluation,
          bill_line_id: ids.billLine,
          order_line_id: ids.orderLine,
          result: "MISMATCH",
          application_ids: [],
          billed_quantity: "2.000000",
          applied_quantity: "1.000000",
          ordered_quantity: "2.000000",
          evidence_quantity: "1.000000",
          bill_unit_price: "100.000000",
          order_unit_price: "100.000000",
          bill_tax_amount: "0.000000",
          order_tax_amount: "0.000000",
          description_match: true,
          comparison: { evidence_shortfall: true },
          source_snapshot: {
            bill_line: { description: "Stage lighting package" },
          },
          created_at: "2026-09-21T12:00:00+00:00",
        },
      ],
    });
    expect(billLineDescription(parsed.line_results[0])).toBe(
      "Stage lighting package",
    );
  });

  it("accepts governed exception evidence", () => {
    const parsed = matchExceptionSchema.parse({
      id: ids.exception,
      supplier_bill_id: ids.bill,
      evaluation_id: ids.evaluation,
      match_line_id: ids.line,
      bill_line_id: ids.billLine,
      bill_version: 3,
      exception_type: "QUANTITY_VARIANCE",
      status: "OPEN",
      material: true,
      fingerprint: "fingerprint",
      variance: { billed_quantity: "2.000000", received_quantity: "1.000000" },
      evidence: {},
      resolution_code: null,
      resolution_reason: null,
      resolved_by_user_id: null,
      resolved_at: null,
      created_at: "2026-09-21T12:00:00+00:00",
      current_bill_version: true,
      current_evaluation: true,
    });
    expect(parsed.material).toBe(true);
  });
});

describe("finance match-review presentation", () => {
  it("prefers authoritative supplier display fields", () => {
    expect(
      supplierDisplayName({
        name: "Fallback",
        legal_name: "Canonical Supplier Ltd",
      }),
    ).toBe("Canonical Supplier Ltd");
  });

  it("uses status/evidence rather than client arithmetic for review priority", () => {
    const material = matchReviewQueueSchema.parse({
      data: [queueItem()],
    }).data[0];
    const clean = matchReviewQueueSchema.parse({
      data: [
        queueItem({
          match_result: "MATCHED",
          open_exception_count: 0,
          open_material_exception_count: 0,
        }),
      ],
    }).data[0];

    expect(needsReview(material)).toBe(true);
    expect(needsReview(clean)).toBe(false);
    expect(reviewPriority(material)).toBeLessThan(reviewPriority(clean));
  });

  it("trims decimal text without converting it to floating point", () => {
    expect(formatDecimalText("2.000000")).toBe("2");
    expect(formatDecimalText("1.250000")).toBe("1.25");
    expect(formatDecimalText(null)).toBe("—");
  });
});

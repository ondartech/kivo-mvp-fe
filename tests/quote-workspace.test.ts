import { describe, expect, it } from "vitest";

import type { Quote } from "@/features/quotes/api";
import {
  buildQuoteListParams,
  resolveQuoteCreateBranchId,
  resolveQuoteReadScope,
} from "@/features/quotes/branching";
import {
  canConvertQuote,
  canSendQuote,
  quoteActionErrorMessage,
  quoteStatusVariant,
} from "@/features/quotes/quotes";

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    organization_id: "00000000-0000-0000-0000-000000000002",
    branch_id: "00000000-0000-0000-0000-000000000003",
    customer_id: "00000000-0000-0000-0000-000000000004",
    project_id: null,
    quote_number: "QTE-000001",
    quote_version: 1,
    supersedes_id: null,
    archetype: null,
    status: "DRAFT",
    currency: "NGN",
    valid_until: null,
    subtotal: "1000.00",
    discount_total: "0.00",
    tax_total: "0.00",
    charge_total: "0.00",
    grand_total: "1000.00",
    notes: null,
    terms: null,
    converted_invoice_id: null,
    sent_at: null,
    accepted_at: null,
    rejected_at: null,
    expired_at: null,
    cancelled_at: null,
    delivery_state: "NOT_SENT",
    delivered_at: null,
    created_at: "2026-09-23T12:00:00Z",
    updated_at: "2026-09-23T12:00:00Z",
    line_items: [],
    ...overrides,
  };
}

describe("KIV-FE-191 Quote workspace", () => {
  it("resolves Branch-scoped Quote reads without widening", () => {
    expect(
      resolveQuoteReadScope(
        {
          organization_wide: false,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ),
    ).toEqual({
      ready: false,
      branchId: null,
      selectionRequired: true,
    });

    expect(
      resolveQuoteReadScope(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ).branchId,
    ).toBeNull();
  });

  it("requires one concrete Branch for Quote creation", () => {
    const access = {
      organization_wide: true,
      branches: [{ id: "hq" }, { id: "lag" }],
    };

    expect(resolveQuoteCreateBranchId(access, null)).toBeNull();
    expect(resolveQuoteCreateBranchId(access, "lag")).toBe("lag");
    expect(
      resolveQuoteCreateBranchId(
        { organization_wide: false, branches: [{ id: "hq" }] },
        null,
      ),
    ).toBe("hq");
  });

  it("builds list filters without inventing Branch scope", () => {
    const params = buildQuoteListParams({
      branchId: "lag",
      status: "ACCEPTED",
      limit: 50,
    });

    expect(params.get("branch_id")).toBe("lag");
    expect(params.get("status")).toBe("ACCEPTED");
    expect(params.get("limit")).toBe("50");
  });

  it("exposes lifecycle-valid primary actions only", () => {
    expect(canSendQuote(quote())).toBe(true);
    expect(canConvertQuote(quote())).toBe(false);

    const accepted = quote({ status: "ACCEPTED" });
    expect(canSendQuote(accepted)).toBe(false);
    expect(canConvertQuote(accepted)).toBe(true);

    expect(
      canConvertQuote(
        quote({
          status: "ACCEPTED",
          converted_invoice_id: "00000000-0000-0000-0000-000000000099",
        }),
      ),
    ).toBe(false);
  });

  it("maps commercial governance blockers into operator language", () => {
    expect(
      quoteActionErrorMessage(
        Object.assign(new Error("blocked"), { code: "APPROVAL_REQUIRED" }),
      ),
    ).toContain("requires approval");

    expect(
      quoteActionErrorMessage(
        Object.assign(new Error("blocked"), {
          code: "CATALOG_CONFIGURATION_NOT_LOCKED",
        }),
      ),
    ).toContain("commercial configuration");

    expect(
      quoteActionErrorMessage(
        Object.assign(new Error("blocked"), { code: "ORDER_BILLING_REQUIRED" }),
      ),
    ).toContain("through the Order");
  });

  it("uses semantic status treatment for accepted and expired Quotes", () => {
    expect(quoteStatusVariant("ACCEPTED")).toBe("success");
    expect(quoteStatusVariant("EXPIRED")).toBe("warning");
  });
});

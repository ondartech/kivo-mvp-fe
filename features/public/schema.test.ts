import { describe, expect, it } from "vitest";
import {
  publicAcceptanceSchema,
  publicQuoteSchema,
} from "@/features/public/schema";

describe("public token schemas", () => {
  it("accepts the PII-minimal public quote contract", () => {
    const parsed = publicQuoteSchema.parse({
      quote_number: "QUO-0001",
      quote_version: 1,
      status: "SENT",
      status_label: "Sent",
      seller_name: "Acme Services",
      customer_name: "Buyer Ltd",
      currency: "NGN",
      valid_until: null,
      sent_at: "2026-09-19T00:00:00Z",
      line_items: [
        {
          description: "Consulting",
          quantity: "1.000000",
          unit_price: "100000.00",
          line_total: "100000.00",
        },
      ],
      subtotal: "100000.00",
      discount_total: "0.00",
      tax_total: "0.00",
      charge_total: "0.00",
      grand_total: "100000.00",
      notes: null,
      terms: null,
      project_name: null,
    });

    expect(parsed.grand_total).toBe("100000.00");
  });

  it("accepts the PII-minimal milestone acceptance contract", () => {
    const parsed = publicAcceptanceSchema.parse({
      merchant_name: "Acme Services",
      project_name: "Eko Festival",
      milestone_name: "Sound system setup",
      milestone_description: null,
      completed_at: "2026-12-12T10:00:00Z",
      deliverables: "FOH and stage audio ready",
      submitted_at: "2026-12-12T11:00:00Z",
      status: "PENDING",
      decided_at: null,
      expires_at: "2026-12-19T11:00:00Z",
    });

    expect(parsed.status).toBe("PENDING");
  });

  it("rejects internal identifiers that are not part of the public contract", () => {
    expect(() =>
      publicAcceptanceSchema.parse({
        merchant_name: "Acme Services",
        project_name: "Eko Festival",
        milestone_name: "Setup",
        submitted_at: "2026-12-12T11:00:00Z",
        status: "PENDING",
        organization_id: "should-not-cross-boundary",
      }),
    ).toThrow();
  });
});

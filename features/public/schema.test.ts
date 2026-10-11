import { describe, expect, it } from "vitest";
import {
  publicAcceptanceSchema,
  publicEvidenceReviewSchema,
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

  it("accepts only a revision-bound, non-storage-locator evidence manifest", () => {
    const proof = publicEvidenceReviewSchema.parse({
      revision_number: 2,
      revision_hash: "a".repeat(64),
      manifest_hash: "b".repeat(64),
      artifacts: [{
        ordinal: 1,
        artifact_id: "2aa6e6e8-7ed5-42bc-a4f1-283de0bb0668",
        content_hash: "c".repeat(64),
        media_type: "application/pdf",
        download_available: true,
      }],
      all_downloadable: true,
      acknowledgement_is_not_proof_of_reading: true,
    });
    expect(proof.revision_number).toBe(2);
    expect(proof.artifacts).toHaveLength(1);
    expect(() => publicEvidenceReviewSchema.parse({
      ...proof, artifacts: [{
        ...proof.artifacts[0],
        blob_ref: "evidence/tenant/private-document.pdf",
      }],
    })).toThrow();
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

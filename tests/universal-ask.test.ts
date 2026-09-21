import { describe, expect, it } from "vitest";

import {
  artifactFromEventPayload,
  entityWorkspaceHref,
  interactionStreamUrl,
  isUuid,
  workspaceFromEventPayload,
  type ExperienceEntityRef,
} from "@/lib/experience/ask-runtime";

const organizationId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const turnId = "33333333-3333-4333-8333-333333333333";

describe("Universal Ask runtime", () => {
  it("validates persisted Experience identifiers", () => {
    expect(isUuid(organizationId)).toBe(true);
    expect(isUuid("org_demo")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });

  it("builds a bounded replay URL for completed intent lifecycle events", () => {
    const url = interactionStreamUrl(
      organizationId,
      conversationId,
      turnId,
      false,
    );

    expect(url).toContain(
      `/api/v1/organizations/${organizationId}/conversations/${conversationId}/turns/${turnId}/events`,
    );
    expect(url).toContain("follow=false");
  });

  it("maps only implemented entity workspaces", () => {
    const invoice: ExperienceEntityRef = {
      entity_type: "INVOICE",
      entity_id: "44444444-4444-4444-8444-444444444444",
      title: "INV-001",
    };
    const project: ExperienceEntityRef = {
      entity_type: "PROJECT",
      entity_id: "55555555-5555-4555-8555-555555555555",
      title: "Eko Festival",
    };

    expect(entityWorkspaceHref(invoice)).toBe(
      "/app/invoices/44444444-4444-4444-8444-444444444444",
    );
    expect(entityWorkspaceHref(project)).toBeNull();
  });

  it("accepts only safe local workspace suggestions", () => {
    expect(
      workspaceFromEventPayload({
        href: "/app/receivables",
        title: "Receivables",
      }),
    ).toEqual({
      href: "/app/receivables",
      title: "Receivables",
    });

    expect(
      workspaceFromEventPayload({
        href: "https://attacker.example",
        title: "External",
      }),
    ).toBeNull();
  });

  it("accepts only a complete trusted artifact envelope", () => {
    const artifact = {
      artifact_id: "66666666-6666-4666-8666-666666666666",
      artifact_type: "ANSWER",
      schema_version: 1,
      title: "Receivables answer",
      conversation_id: conversationId,
      turn_id: turnId,
      organization_id: organizationId,
      authority_class: "DERIVED",
      freshness: { status: "CURRENT" },
      source_refs: [],
      related_entities: [],
      allowed_interactions: ["COPY"],
      render_mode: "INLINE",
      persistence_mode: "PERSISTED",
      data: {
        status: "GROUNDED",
        text: "One invoice is overdue.",
        evidence_ids: [],
        unknowns: [],
        conflicts: [],
      },
      created_at: "2026-09-21T06:00:00+00:00",
      expires_at: null,
    };

    expect(
      artifactFromEventPayload({ artifact }),
    ).toMatchObject({
      artifact_id: artifact.artifact_id,
      artifact_type: "ANSWER",
      schema_version: 1,
      render_mode: "INLINE",
      data: artifact.data,
    });

    expect(
      artifactFromEventPayload({
        artifact: {
          artifact_type: "ANSWER",
          title: "Missing identity",
        },
      }),
    ).toBeNull();
  });
});

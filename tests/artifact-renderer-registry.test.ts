import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ArtifactRenderer,
  registeredReadArtifactRenderers,
  type ArtifactRendererFlags,
  type ArtifactRendererTelemetryEvent,
} from "@/components/kivo/generated-ui/artifact-renderer";

const base = {
  artifact_id: "11111111-1111-4111-8111-111111111111",
  conversation_id: "22222222-2222-4222-8222-222222222222",
  turn_id: "33333333-3333-4333-8333-333333333333",
  organization_id: "44444444-4444-4444-8444-444444444444",
  schema_version: 1,
  authority_class: "DERIVED",
  freshness: { status: "CURRENT" },
  source_refs: [],
  related_entities: [],
  allowed_interactions: [],
  persistence_mode: "PERSISTED",
  created_at: "2026-09-21T06:00:00+00:00",
  expires_at: null,
};

function answerArtifact() {
  return {
    ...base,
    artifact_type: "ANSWER",
    title: "Receivables answer",
    render_mode: "INLINE",
    allowed_interactions: ["COPY"],
    data: {
      status: "GROUNDED",
      text: "One invoice is overdue.",
      evidence_ids: [],
      unknowns: [],
      conflicts: [],
    },
  };
}

function entityArtifact(allowedInteractions: string[]) {
  return {
    ...base,
    artifact_type: "ENTITY_CARD",
    title: "Invoice",
    authority_class: "AUTHORITATIVE",
    render_mode: "CARD",
    allowed_interactions: allowedInteractions,
    data: {
      entity: {
        entity_type: "INVOICE",
        entity_id: "55555555-5555-4555-8555-555555555555",
        title: "INV-001",
      },
      fields: {
        status: "OVERDUE",
      },
    },
  };
}

function renderArtifact(
  artifact: unknown,
  options?: {
    flags?: ArtifactRendererFlags;
    telemetry?: (event: ArtifactRendererTelemetryEvent) => void;
    resolveEntityHref?: () => string | null;
  },
) {
  return renderToStaticMarkup(
    React.createElement(ArtifactRenderer, {
      artifact,
      flags: options?.flags,
      onTelemetry: options?.telemetry,
      resolvers: options?.resolveEntityHref
        ? { resolveEntityHref: options.resolveEntityHref }
        : undefined,
    }),
  );
}

describe("EXP-FE-001 artifact renderer registry", () => {
  it("registers every L1 read artifact at schema v1", () => {
    const registered = registeredReadArtifactRenderers();

    expect(registered).toHaveLength(11);
    expect(
      registered.every((item) => item.schemaVersion === 1),
    ).toBe(true);
    expect(
      registered.map((item) => item.artifactType).sort(),
    ).toEqual(
      [
        "ANSWER",
        "CONFLICT",
        "DATA_TABLE",
        "ENTITY_CARD",
        "ENTITY_LIST",
        "ERROR",
        "EVIDENCE",
        "METRIC",
        "METRIC_GROUP",
        "TIMELINE",
        "WARNING",
      ].sort(),
    );
  });

  it("renders a valid registered artifact", () => {
    const markup = renderArtifact(answerArtifact());

    expect(markup).toContain("Receivables answer");
    expect(markup).toContain("One invoice is overdue.");
    expect(markup).not.toContain("ARTIFACT_RENDER_FAILED");
  });

  it("fails safely and emits telemetry for an unknown artifact type", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const markup = renderArtifact(
      {
        ...answerArtifact(),
        artifact_type: "ARBITRARY_COMPONENT",
      },
      { telemetry: (event) => events.push(event) },
    );

    expect(markup).toContain("Unsupported artifact");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: "artifact_render_failure",
      reason: "UNKNOWN_ARTIFACT_TYPE",
      artifact_type: "ARBITRARY_COMPONENT",
    });
  });

  it("rejects unsupported schema versions", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const markup = renderArtifact(
      {
        ...answerArtifact(),
        schema_version: 2,
      },
      { telemetry: (event) => events.push(event) },
    );

    expect(markup).toContain("Unsupported artifact version");
    expect(events[0]?.reason).toBe("UNSUPPORTED_SCHEMA_VERSION");
  });

  it("supports feature-flagging an artifact family off", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const markup = renderArtifact(answerArtifact(), {
      flags: { ANSWER: false },
      telemetry: (event) => events.push(event),
    });

    expect(markup).toContain("Artifact unavailable");
    expect(events[0]?.reason).toBe("FAMILY_DISABLED");
  });

  it("rejects a render mode that disagrees with the static registry", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const markup = renderArtifact(
      {
        ...answerArtifact(),
        render_mode: "CARD",
      },
      { telemetry: (event) => events.push(event) },
    );

    expect(markup).toContain("Invalid artifact presentation");
    expect(events[0]?.reason).toBe("RENDER_MODE_MISMATCH");
  });

  it("rejects invalid artifact data before a primitive is selected", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const markup = renderArtifact(
      {
        ...answerArtifact(),
        data: {
          status: "GROUNDED",
          text: { unsafe: true },
        },
      },
      { telemetry: (event) => events.push(event) },
    );

    expect(markup).toContain("Invalid artifact data");
    expect(events[0]?.reason).toBe("DATA_INVALID");
  });

  it("does not grant entity links unless the envelope allows them", () => {
    const resolver = vi.fn(
      () => "/app/invoices/55555555-5555-4555-8555-555555555555",
    );

    const blocked = renderArtifact(entityArtifact([]), {
      resolveEntityHref: resolver,
    });
    const allowed = renderArtifact(entityArtifact(["OPEN_ENTITY"]), {
      resolveEntityHref: resolver,
    });

    expect(blocked).not.toContain('href="');
    expect(allowed).toContain(
      'href="/app/invoices/55555555-5555-4555-8555-555555555555"',
    );
  });

  it("rejects incomplete envelopes before rendering", () => {
    const events: ArtifactRendererTelemetryEvent[] = [];
    const invalid = {
      artifact_id: base.artifact_id,
      artifact_type: "ANSWER",
      schema_version: 1,
      title: "Missing tenant scope",
      render_mode: "INLINE",
      data: answerArtifact().data,
    };

    const markup = renderArtifact(invalid, {
      telemetry: (event) => events.push(event),
    });

    expect(markup).toContain("Invalid artifact");
    expect(events[0]?.reason).toBe("ENVELOPE_INVALID");
  });
});

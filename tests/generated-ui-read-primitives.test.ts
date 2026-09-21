import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AnswerBlock,
  DataTable,
  EvidenceBlock,
  ReadPrimitiveState,
} from "@/components/kivo/generated-ui/read-primitives";
import {
  answerArtifactDataSchema,
  dataTableArtifactDataSchema,
  evidenceArtifactDataSchema,
  isSupportedReadArtifactSchema,
  readArtifactDataSchemas,
} from "@/lib/experience/read-artifact-contracts";

describe("FE-014 Generated UI read primitives", () => {
  it("covers the complete EXP-BE-005 L1 read artifact family", () => {
    expect(Object.keys(readArtifactDataSchemas).sort()).toEqual(
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

  it("accepts only registered L1 schema version 1 types", () => {
    expect(isSupportedReadArtifactSchema("ANSWER", 1)).toBe(true);
    expect(isSupportedReadArtifactSchema("DATA_TABLE", 1)).toBe(true);
    expect(isSupportedReadArtifactSchema("ANSWER", 2)).toBe(false);
    expect(isSupportedReadArtifactSchema("ARBITRARY_HTML", 1)).toBe(false);
  });

  it("rejects unknown fields rather than accepting arbitrary model payloads", () => {
    const parsed = answerArtifactDataSchema.safeParse({
      status: "GROUNDED",
      text: "One invoice is overdue.",
      evidence_ids: ["invoice:1"],
      unknowns: [],
      conflicts: [],
      html: "<script>alert(1)</script>",
    });

    expect(parsed.success).toBe(false);
  });

  it("renders user/business text as escaped text, never executable HTML", () => {
    const data = dataTableArtifactDataSchema.parse({
      columns: [
        {
          key: "customer",
          label: "Customer",
          value_type: "TEXT",
        },
      ],
      rows: [
        {
          customer: "<script>window.compromised=true</script>",
        },
      ],
    });

    const markup = renderToStaticMarkup(
      React.createElement(DataTable, { data }),
    );

    expect(markup).toContain(
      "&lt;script&gt;window.compromised=true&lt;/script&gt;",
    );
    expect(markup).not.toContain("<script>");
  });

  it("shows authority and freshness labels when supplied", () => {
    const data = answerArtifactDataSchema.parse({
      status: "GROUNDED",
      text: "The receivable is overdue.",
      evidence_ids: ["receivable:1"],
      unknowns: [],
      conflicts: [],
    });

    const markup = renderToStaticMarkup(
      React.createElement(AnswerBlock, {
        data,
        meta: {
          authorityClass: "DERIVED",
          freshness: {
            status: "STALE",
            as_of: "2026-09-21T05:00:00+00:00",
            reason: "STALE_AFTER_REACHED",
          },
        },
      }),
    );

    expect(markup).toContain("Derived");
    expect(markup).toContain("Stale");
  });

  it("opens evidence only through an explicit permitted resolver", () => {
    const data = evidenceArtifactDataSchema.parse({
      items: [
        {
          evidence_id: "invoice:1",
          title: "INV-001",
          snippet: "Outstanding invoice",
          entity_type: "INVOICE",
          entity_id: "11111111-1111-4111-8111-111111111111",
          authority: "AUTHORITATIVE",
          source_type: "DOMAIN",
        },
      ],
    });

    const withoutResolver = renderToStaticMarkup(
      React.createElement(EvidenceBlock, { data }),
    );
    const withEntityResolver = renderToStaticMarkup(
      React.createElement(EvidenceBlock, {
        data,
        resolveEntityHref: () =>
          "/app/invoices/11111111-1111-4111-8111-111111111111",
      }),
    );
    const withSourceResolver = renderToStaticMarkup(
      React.createElement(EvidenceBlock, {
        data,
        resolveSourceHref: () => "/app/documents/evidence/invoice-1",
      }),
    );

    expect(withoutResolver).not.toContain('href="');
    expect(withEntityResolver).toContain(
      'href="/app/invoices/11111111-1111-4111-8111-111111111111"',
    );
    expect(withSourceResolver).toContain(
      'href="/app/documents/evidence/invoice-1"',
    );
  });

  it("uses one shared grammar for loading, partial, empty and error states", () => {
    for (const state of ["LOADING", "PARTIAL", "EMPTY", "ERROR"] as const) {
      const markup = renderToStaticMarkup(
        React.createElement(ReadPrimitiveState, { state }),
      );
      expect(markup.length).toBeGreaterThan(0);
    }
  });
});

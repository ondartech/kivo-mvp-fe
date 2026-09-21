"use client";

import type { AskResponse } from "@/features/foundation/api";
import {
  AnswerBlock,
  EvidenceBlock,
} from "@/components/kivo/generated-ui/read-primitives";
import type {
  AnswerArtifactData,
  EvidenceArtifactData,
  EvidenceArtifactItem,
} from "@/lib/experience/read-artifact-contracts";

function answerData(result: AskResponse): AnswerArtifactData {
  return {
    status:
      result.status === "GROUNDED"
        ? "GROUNDED"
        : "INSUFFICIENT_EVIDENCE",
    text: result.answer,
    evidence_ids: result.evidence_ids,
    unknowns: result.unknowns,
    conflicts: result.conflicts,
  };
}

function evidenceData(result: AskResponse): EvidenceArtifactData | null {
  const items: EvidenceArtifactItem[] = result.evidence.flatMap((source) => {
    if (
      source.authority !== "AUTHORITATIVE" &&
      source.authority !== "DERIVED" &&
      source.authority !== "EXTERNAL_EVIDENCE"
    ) {
      return [];
    }

    return [
      {
        evidence_id: source.evidence_id,
        title: source.title,
        snippet: source.snippet,
        entity_type: source.entity_type,
        entity_id: source.entity_id,
        authority: source.authority,
        source_type: source.source_type,
      },
    ];
  });

  return items.length ? { items } : null;
}

export function AiAnswerBlock({ result }: { result: AskResponse }) {
  const evidence = evidenceData(result);

  return (
    <div className="space-y-4" data-testid="ai-answer-block">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Grounded read response</span>
        <span>
          {result.provider} · {result.model}
        </span>
      </div>

      <AnswerBlock
        data={answerData(result)}
        title="AI answer"
        meta={{ authorityClass: "DERIVED" }}
      />

      {evidence ? (
        <EvidenceBlock data={evidence} title="Evidence" />
      ) : (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No validated source objects were cited for this answer.
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Generated explanation. Verify decisions against the cited Ondar records.
      </p>
    </div>
  );
}

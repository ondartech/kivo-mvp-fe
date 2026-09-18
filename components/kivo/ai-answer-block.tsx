"use client";

import type { AskResponse } from "@/features/foundation/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SourceCard({ source }: { source: AskResponse["evidence"][number] }) {
  return (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {source.entity_type}
        </span>
        <span className="text-xs text-muted-foreground">{source.authority}</span>
      </div>
      <div className="mt-1 text-sm font-medium">{source.title}</div>
      {source.snippet ? <p className="mt-1 text-sm text-muted-foreground">{source.snippet}</p> : null}
      {source.source_reference ? (
        <div className="mt-2 text-xs text-muted-foreground">
          Source: <code>{source.source_reference}</code>
        </div>
      ) : null}
    </div>
  );
}

export function AiAnswerBlock({ result }: { result: AskResponse }) {
  return (
    <div className="space-y-4" data-testid="ai-answer-block">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>AI answer</CardTitle>
            <div className="text-xs text-muted-foreground">
              {result.provider} · {result.model} · {result.status}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-6">{result.answer}</div>
          <p className="mt-3 text-xs text-muted-foreground">
            Generated explanation. Verify decisions against the cited Ondar records below.
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="answer-evidence-heading">
        <h2 id="answer-evidence-heading" className="mb-2 text-sm font-semibold">
          Evidence
        </h2>
        {result.evidence.length ? (
          <div className="grid gap-2">
            {result.evidence.map((source) => (
              <SourceCard key={source.evidence_id} source={source} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No source objects were cited for this answer.
          </div>
        )}
      </section>

      {result.unknowns.length ? (
        <section className="rounded-md border p-3" aria-labelledby="answer-unknowns-heading">
          <h2 id="answer-unknowns-heading" className="text-sm font-semibold">
            Unknowns
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.unknowns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.conflicts.length ? (
        <section className="rounded-md border p-3" aria-labelledby="answer-conflicts-heading">
          <h2 id="answer-conflicts-heading" className="text-sm font-semibold">
            Conflicting evidence
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.conflicts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

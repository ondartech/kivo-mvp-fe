"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/kivo/page-header";
import { AiAnswerBlock } from "@/components/kivo/ai-answer-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAskOndar } from "@/features/foundation/api";

function useOrgId(): string {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("orgId") ??
      localStorage.getItem("organization_id") ??
      "00000000-0000-0000-0000-000000000000"
    );
  }
  return "00000000-0000-0000-0000-000000000000";
}

export default function AskOndarPage() {
  const orgId = useOrgId();
  const [question, setQuestion] = useState("");
  const ask = useAskOndar(orgId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;
    await ask.mutateAsync({ question: value, limit: 20 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Ask Ondar"
        description="Ask a business question. Ondar answers from records you are authorized to see and shows the evidence it used."
      />

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="ask-ondar-question" className="text-sm font-medium">
          Question
        </label>
        <textarea
          id="ask-ondar-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Which receivables are overdue, and what should I look at first?"
          className="flex w-full max-w-3xl rounded-md border border-input bg-surface px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={ask.isPending} disabled={!question.trim()}>
            Ask Ondar
          </Button>
          <span className="text-xs text-muted-foreground">
            Read-only foundation surface. No action is executed from an answer.
          </span>
        </div>
      </form>

      {ask.isError ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Ondar could not answer</div>
            <div className="mt-1 text-muted-foreground">
              {ask.error instanceof Error ? ask.error.message : "The intelligence request failed."}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {ask.data ? <AiAnswerBlock result={ask.data} /> : null}
    </div>
  );
}

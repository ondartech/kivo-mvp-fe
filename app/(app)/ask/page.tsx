"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AiAnswerBlock } from "@/components/kivo/ai-answer-block";
import { ArtifactRenderer } from "@/components/kivo/generated-ui";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  appendUserTurn,
  artifactFromEventPayload,
  askGrounded,
  entityWorkspaceHref,
  interactionStreamUrl,
  readExperienceScope,
  resolveIntent,
  resumeOrCreateConversation,
  workspaceFromEventPayload,
  type Conversation,
  type ExperienceEntityRef,
  type ExperienceScope,
  type IntentResolution,
  type StreamArtifact,
  type WorkspaceSuggestion,
} from "@/lib/experience/ask-runtime";
import {
  streamInteractionEvents,
  type InteractionEvent,
} from "@/lib/experience/interaction-stream";
import { emitExperienceTelemetry } from "@/lib/experience/telemetry";
import type { AskResponse } from "@/features/foundation/api";

type RunState =
  | "IDLE"
  | "CREATING_TURN"
  | "RESOLVING"
  | "READING_STREAM"
  | "ANSWERING";

function shortId(value: string | null): string {
  return value ? `${value.slice(0, 8)}…${value.slice(-4)}` : "None";
}

function eventLabel(event: InteractionEvent): string {
  switch (event.event_type) {
    case "turn.accepted":
      return "Turn accepted";
    case "intent.resolving":
      return "Understanding request";
    case "intent.resolved":
      return "Intent resolved";
    case "clarification.required":
      return "Clarification required";
    case "retrieval.started":
      return "Retrieval started";
    case "retrieval.completed":
      return "Retrieval completed";
    case "answer.delta":
      return "Answer streaming";
    case "artifact.created":
      return "Artifact created";
    case "workspace.suggested":
      return "Workspace suggested";
    case "tool.started":
      return "Tool started";
    case "tool.completed":
      return "Tool completed";
    case "turn.completed":
      return "Turn completed";
    case "turn.failed":
      return "Turn failed";
  }
}

function ContextPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <code className="font-medium">{value}</code>
    </span>
  );
}

function EntityHandoff({ entity }: { entity: ExperienceEntityRef }) {
  const href = entityWorkspaceHref(entity);
  const label = entity.title ?? `${entity.entity_type} ${shortId(entity.entity_id)}`;
  if (!href) {
    return (
      <div className="rounded-md border px-3 py-2 text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{entity.entity_type}</div>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-neutral-50"
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">
        {entity.entity_type} · Open workspace
      </div>
    </Link>
  );
}

export default function AskOndarPage() {
  const [scope, setScope] = useState<ExperienceScope>({
    organizationId: null,
    branchId: null,
  });
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [intent, setIntent] = useState<IntentResolution | null>(null);
  const [events, setEvents] = useState<InteractionEvent[]>([]);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [artifacts, setArtifacts] = useState<
    Array<{ key: string; artifact: StreamArtifact }>
  >([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceSuggestion[]>([]);
  const [runState, setRunState] = useState<RunState>("IDLE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScope(readExperienceScope());
  }, []);

  const busy = runState !== "IDLE";
  const contextReady = Boolean(scope.organizationId);

  const statusText = useMemo(() => {
    switch (runState) {
      case "CREATING_TURN":
        return "Saving this turn to the conversation…";
      case "RESOLVING":
        return "Resolving intent and references…";
      case "READING_STREAM":
        return "Reading typed interaction events…";
      case "ANSWERING":
        return "Grounding the answer in authorized Ondar records…";
      default:
        return null;
    }
  }, [runState]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || !scope.organizationId || busy) return;

    setError(null);
    setAnswer(null);
    setIntent(null);
    setEvents([]);
    setArtifacts([]);
    setWorkspaces([]);
    setLastQuestion(text);

    try {
      setRunState("CREATING_TURN");
      const activeConversation = await resumeOrCreateConversation(
        scope.organizationId,
        scope.branchId,
      );
      setConversation(activeConversation);

      const turn = await appendUserTurn(
        scope.organizationId,
        activeConversation.id,
        text,
      );

      setRunState("RESOLVING");
      const resolvedIntent = await resolveIntent(
        scope.organizationId,
        activeConversation.id,
        turn.id,
      );
      setIntent(resolvedIntent);

      setRunState("READING_STREAM");
      await streamInteractionEvents({
        url: interactionStreamUrl(
          scope.organizationId,
          activeConversation.id,
          turn.id,
          false,
        ),
        turnId: turn.id,
        onEvent: (streamEvent) => {
          setEvents((current) => [...current, streamEvent]);

          if (streamEvent.event_type === "artifact.created") {
            const artifact = artifactFromEventPayload(streamEvent.payload);
            if (artifact) {
              setArtifacts((current) =>
                current.some(
                  (item) => item.key === streamEvent.interaction_event_id,
                )
                  ? current
                  : [
                      ...current,
                      {
                        key: streamEvent.interaction_event_id,
                        artifact,
                      },
                    ],
              );
            }
          }

          if (streamEvent.event_type === "workspace.suggested") {
            const workspace = workspaceFromEventPayload(streamEvent.payload);
            if (workspace) {
              setWorkspaces((current) =>
                current.some((item) => item.href === workspace.href)
                  ? current
                  : [...current, workspace],
              );
            }
          }
        },
      });

      if (resolvedIntent.status === "CLARIFICATION_REQUIRED") {
        return;
      }
      if (resolvedIntent.status === "BLOCKED_L1") {
        return;
      }

      setRunState("ANSWERING");
      const grounded = await askGrounded(
        scope.organizationId,
        text,
        resolvedIntent.intent?.referenced_entities[0],
      );
      setAnswer(grounded);
      setQuestion("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ondar could not process this request.",
      );
    } finally {
      setRunState("IDLE");
    }
  };

  const clarificationCandidates =
    intent?.status === "CLARIFICATION_REQUIRED"
      ? intent.clarification?.candidates ?? []
      : [];

  const resolvedEntities = intent?.intent?.referenced_entities ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Experience"
        title="Ask Ondar"
        description="Your primary way to ask about the business. Ondar keeps the conversation durable, resolves business context, and grounds read answers in records you are authorized to see."
      />

      <div className="flex flex-wrap items-center gap-2">
        <ContextPill
          label="Organization"
          value={shortId(scope.organizationId)}
        />
        <ContextPill label="Branch" value={shortId(scope.branchId)} />
        {conversation ? (
          <ContextPill
            label="Conversation"
            value={shortId(conversation.id)}
          />
        ) : null}
      </div>

      {!contextReady ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Organization context is required</div>
            <p className="mt-1 text-muted-foreground">
              Select an organization workspace before using Ask Ondar.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={submit}>
            <label htmlFor="universal-ask" className="sr-only">
              Ask Ondar
            </label>
            <textarea
              id="universal-ask"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              maxLength={2000}
              autoFocus
              disabled={!contextReady || busy}
              placeholder="Ask about invoices, receivables, customers, projects, payments, or anything Ondar can verify…"
              className="min-h-36 w-full resize-none border-0 bg-surface px-4 py-4 text-base leading-7 outline-none placeholder:text-neutral-500 disabled:opacity-60 sm:px-5"
            />
            <div className="flex flex-col gap-3 border-t bg-neutral-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Read-only L1</span>
                <span aria-hidden="true">·</span>
                <span>Evidence-grounded</span>
                <span aria-hidden="true">·</span>
                <Link href="/app/search" className="font-medium hover:text-foreground">
                  Search records
                </Link>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="Voice will be enabled with the Experience voice runtime."
                >
                  Voice
                </Button>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={!contextReady || !question.trim()}
                  className="min-w-28"
                >
                  Ask Ondar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {statusText ? (
        <div
          className="rounded-md border bg-neutral-50 px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          {statusText}
        </div>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Ondar could not complete this turn</div>
            <div className="mt-1 text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      ) : null}

      {events.length ? (
        <section aria-labelledby="experience-progress-heading">
          <h2
            id="experience-progress-heading"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Interaction
          </h2>
          <div className="flex flex-wrap gap-2">
            {events.map((item) => (
              <span
                key={item.interaction_event_id}
                className="rounded-full border bg-surface px-2.5 py-1 text-xs"
                title={`${item.event_type} · sequence ${item.sequence}`}
              >
                {eventLabel(item)}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {intent?.status === "BLOCKED_L1" ? (
        <Card>
          <CardHeader>
            <CardTitle>Action not executed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              This request was understood as{" "}
              <strong>{intent.intent?.intent_type ?? "an action"}</strong>, but
              the L1 Experience Runtime is read-only.
            </p>
            <p className="text-muted-foreground">
              Ondar did not create, modify, approve, reject, send, pay, or
              otherwise mutate business data.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {intent?.status === "CLARIFICATION_REQUIRED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Clarify this request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {intent.clarification?.message ??
                "Ondar needs a more specific reference before continuing."}
            </p>
            {clarificationCandidates.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {clarificationCandidates.map((candidate) => (
                  <button
                    key={candidate.entity_id}
                    type="button"
                    className="rounded-md border p-3 text-left transition-colors hover:bg-neutral-50"
                    onClick={() =>
                      setQuestion(
                        `${lastQuestion} — ${candidate.title ?? candidate.entity_type}`,
                      )
                    }
                  >
                    <div className="font-medium">
                      {candidate.title ?? candidate.entity_type}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {candidate.entity_type} · Use this reference
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add the specific customer, invoice, project, or other record you
                mean and ask again.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {resolvedEntities.length || workspaces.length ? (
        <section aria-labelledby="workspace-handoffs-heading">
          <h2 id="workspace-handoffs-heading" className="mb-2 text-sm font-semibold">
            Open in Ondar
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {resolvedEntities.map((entity) => (
              <EntityHandoff
                key={`${entity.entity_type}:${entity.entity_id}`}
                entity={entity}
              />
            ))}
            {workspaces.map((workspace) => (
              <Link
                key={workspace.href}
                href={workspace.href}
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-neutral-50"
              >
                <div className="font-medium">{workspace.title}</div>
                <div className="text-xs text-muted-foreground">
                  Suggested workspace
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {artifacts.length ? (
        <section aria-labelledby="ask-artifacts-heading" className="space-y-3">
          <h2 id="ask-artifacts-heading" className="text-sm font-semibold">
            Generated views
          </h2>
          {artifacts.map((item) => (
            <ArtifactRenderer
              key={item.key}
              artifact={item.artifact}
              resolvers={{ resolveEntityHref: entityWorkspaceHref }}
              onTelemetry={emitExperienceTelemetry}
            />
          ))}
        </section>
      ) : null}
      {answer ? <AiAnswerBlock result={answer} /> : null}

      {!answer &&
      !intent &&
      !busy &&
      !error ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Which receivables are overdue?",
            "Explain what changed with my invoices this week.",
            "Summarize what needs my attention.",
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuestion(example)}
              className="rounded-lg border bg-surface p-4 text-left text-sm transition-colors hover:bg-neutral-50"
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

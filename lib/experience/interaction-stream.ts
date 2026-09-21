import { z } from "zod";

import { fetchWithAuth } from "@/lib/api-client";

export const interactionEventTypeSchema = z.enum([
  "turn.accepted",
  "intent.resolving",
  "intent.resolved",
  "clarification.required",
  "retrieval.started",
  "retrieval.completed",
  "answer.delta",
  "artifact.created",
  "workspace.suggested",
  "tool.started",
  "tool.completed",
  "turn.completed",
  "turn.failed",
]);

export const interactionEventSemanticsSchema = z.enum([
  "PROGRESS",
  "STATE",
  "COMMIT",
  "TERMINAL",
]);

export const interactionEventSchema = z
  .object({
    interaction_event_id: z.string().uuid(),
    conversation_id: z.string().uuid(),
    turn_id: z.string().uuid(),
    correlation_id: z.string().min(1),
    sequence: z.number().int().positive(),
    occurred_at: z.string().datetime({ offset: true }),
    event_type: interactionEventTypeSchema,
    payload_schema_version: z.number().int().positive(),
    semantics: interactionEventSemanticsSchema,
    payload: z.record(z.unknown()),
  })
  .strict();

export type InteractionEvent = z.infer<typeof interactionEventSchema>;
export type InteractionEventType = z.infer<typeof interactionEventTypeSchema>;
export type InteractionEventSemantics = z.infer<
  typeof interactionEventSemanticsSchema
>;

export class InteractionStreamProtocolError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_FRAME"
      | "EVENT_TYPE_MISMATCH"
      | "TURN_MISMATCH"
      | "RESUME_ID_MISMATCH"
      | "SEQUENCE_GAP"
      | "SEQUENCE_COLLISION",
  ) {
    super(message);
    this.name = "InteractionStreamProtocolError";
  }
}

export class InteractionEventCursor {
  private readonly seenEventIds = new Set<string>();

  lastSequence: number;
  lastEventId: string | null;

  constructor(
    readonly turnId: string,
    afterSequence = 0,
  ) {
    if (!Number.isInteger(afterSequence) || afterSequence < 0) {
      throw new RangeError("afterSequence must be a non-negative integer");
    }
    this.lastSequence = afterSequence;
    this.lastEventId =
      afterSequence > 0 ? interactionResumeToken(turnId, afterSequence) : null;
  }

  apply(frameId: string, event: InteractionEvent): boolean {
    if (event.turn_id !== this.turnId) {
      throw new InteractionStreamProtocolError(
        "Interaction event belongs to a different turn",
        "TURN_MISMATCH",
      );
    }

    const expectedFrameId = interactionResumeToken(
      event.turn_id,
      event.sequence,
    );
    if (frameId !== expectedFrameId) {
      throw new InteractionStreamProtocolError(
        "SSE id does not match the interaction event sequence",
        "RESUME_ID_MISMATCH",
      );
    }

    if (this.seenEventIds.has(event.interaction_event_id)) {
      return false;
    }

    if (event.sequence <= this.lastSequence) {
      throw new InteractionStreamProtocolError(
        "A different interaction event reused an applied sequence",
        "SEQUENCE_COLLISION",
      );
    }

    if (event.sequence !== this.lastSequence + 1) {
      throw new InteractionStreamProtocolError(
        `Expected interaction sequence ${this.lastSequence + 1}, received ${event.sequence}`,
        "SEQUENCE_GAP",
      );
    }

    this.seenEventIds.add(event.interaction_event_id);
    this.lastSequence = event.sequence;
    this.lastEventId = frameId;
    return true;
  }
}

export function interactionResumeToken(
  turnId: string,
  sequence: number,
): string {
  return `${turnId}:${sequence}`;
}

export function isAuthoritativeCommit(event: InteractionEvent): boolean {
  return event.semantics === "COMMIT";
}

export function isOptimisticProgress(event: InteractionEvent): boolean {
  return event.semantics === "PROGRESS";
}

export type ParsedInteractionSseFrame = {
  id: string;
  eventName: string | null;
  event: InteractionEvent;
};

export function parseInteractionSseFrame(
  rawFrame: string,
): ParsedInteractionSseFrame | null {
  const normalized = rawFrame.replace(/\r\n/g, "\n").trimEnd();
  if (!normalized || normalized.startsWith(":")) {
    return null;
  }

  let id: string | null = null;
  let eventName: string | null = null;
  const data: string[] = [];

  for (const line of normalized.split("\n")) {
    if (!line || line.startsWith(":") || line.startsWith("retry:")) {
      continue;
    }
    if (line.startsWith("id:")) {
      id = line.slice(3).trim();
      continue;
    }
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      data.push(line.slice(5).trimStart());
    }
  }

  if (!id || data.length === 0) {
    throw new InteractionStreamProtocolError(
      "SSE frame is missing id or data",
      "INVALID_FRAME",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(data.join("\n"));
  } catch {
    throw new InteractionStreamProtocolError(
      "SSE data is not valid JSON",
      "INVALID_FRAME",
    );
  }

  const parsed = interactionEventSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new InteractionStreamProtocolError(
      "SSE data does not match the interaction event schema",
      "INVALID_FRAME",
    );
  }

  if (eventName && eventName !== parsed.data.event_type) {
    throw new InteractionStreamProtocolError(
      "SSE event name does not match the envelope event_type",
      "EVENT_TYPE_MISMATCH",
    );
  }

  return {
    id,
    eventName,
    event: parsed.data,
  };
}

export type StreamInteractionEventsOptions = {
  url: string;
  turnId: string;
  afterSequence?: number;
  signal?: AbortSignal;
  onEvent: (
    event: InteractionEvent,
    meta: { resumeToken: string },
  ) => void | Promise<void>;
};

export async function streamInteractionEvents(
  options: StreamInteractionEventsOptions,
): Promise<InteractionEventCursor> {
  const cursor = new InteractionEventCursor(
    options.turnId,
    options.afterSequence ?? 0,
  );
  const headers = new Headers({
    Accept: "text/event-stream",
  });
  if (cursor.lastEventId) {
    headers.set("Last-Event-ID", cursor.lastEventId);
  }

  const response = await fetchWithAuth(options.url, {
    method: "GET",
    headers,
    signal: options.signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Interaction stream failed with HTTP ${response.status}`);
  }
  if (!response.body) {
    throw new Error("Interaction stream response has no body");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    throw new Error("Interaction stream did not return text/event-stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const rawFrame = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const parsed = parseInteractionSseFrame(rawFrame);
      if (parsed && cursor.apply(parsed.id, parsed.event)) {
        await options.onEvent(parsed.event, {
          resumeToken: cursor.lastEventId!,
        });
      }
      separator = buffer.indexOf("\n\n");
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    const parsed = parseInteractionSseFrame(buffer);
    if (parsed && cursor.apply(parsed.id, parsed.event)) {
      await options.onEvent(parsed.event, {
        resumeToken: cursor.lastEventId!,
      });
    }
  }

  return cursor;
}

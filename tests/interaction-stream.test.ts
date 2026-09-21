import { describe, expect, it } from "vitest";

import {
  InteractionEventCursor,
  InteractionStreamProtocolError,
  interactionEventSchema,
  isAuthoritativeCommit,
  isOptimisticProgress,
  parseInteractionSseFrame,
} from "@/lib/experience/interaction-stream";

const turnId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";

function event(sequence: number, id: string, semantics = "STATE") {
  return interactionEventSchema.parse({
    interaction_event_id: id,
    conversation_id: conversationId,
    turn_id: turnId,
    correlation_id: "corr-123",
    sequence,
    occurred_at: "2026-09-21T00:00:00+00:00",
    event_type: sequence === 1 ? "turn.accepted" : "intent.resolved",
    payload_schema_version: 1,
    semantics,
    payload: { sequence },
  });
}

describe("Experience interaction stream protocol", () => {
  it("parses the canonical SSE envelope", () => {
    const payload = event(
      1,
      "33333333-3333-4333-8333-333333333333",
    );
    const frame = [
      `id: ${turnId}:1`,
      "event: turn.accepted",
      "retry: 3000",
      `data: ${JSON.stringify(payload)}`,
      "",
    ].join("\n");

    const parsed = parseInteractionSseFrame(frame);

    expect(parsed?.id).toBe(`${turnId}:1`);
    expect(parsed?.event).toEqual(payload);
  });

  it("ignores keepalive comments", () => {
    expect(parseInteractionSseFrame(": keepalive")).toBeNull();
  });

  it("applies ordered events and ignores exact duplicates", () => {
    const cursor = new InteractionEventCursor(turnId);
    const first = event(
      1,
      "33333333-3333-4333-8333-333333333333",
    );

    expect(cursor.apply(`${turnId}:1`, first)).toBe(true);
    expect(cursor.apply(`${turnId}:1`, first)).toBe(false);
    expect(cursor.lastSequence).toBe(1);
    expect(cursor.lastEventId).toBe(`${turnId}:1`);
  });

  it("ignores a duplicate at the resume boundary", () => {
    const cursor = new InteractionEventCursor(turnId, 1);
    const first = event(
      1,
      "99999999-9999-4999-8999-999999999999",
    );

    expect(cursor.apply(`${turnId}:1`, first)).toBe(false);
    expect(cursor.lastSequence).toBe(1);
  });

  it("rejects sequence gaps instead of applying out of order", () => {
    const cursor = new InteractionEventCursor(turnId);
    const second = event(
      2,
      "44444444-4444-4444-8444-444444444444",
    );

    expect(() => cursor.apply(`${turnId}:2`, second)).toThrowError(
      InteractionStreamProtocolError,
    );
    expect(cursor.lastSequence).toBe(0);
  });

  it("rejects a mismatched resume id", () => {
    const cursor = new InteractionEventCursor(turnId);
    const first = event(
      1,
      "55555555-5555-4555-8555-555555555555",
    );

    expect(() => cursor.apply(`${turnId}:9`, first)).toThrowError(
      "SSE id does not match",
    );
  });

  it("keeps progress distinct from authoritative commits", () => {
    const progress = event(
      1,
      "66666666-6666-4666-8666-666666666666",
      "PROGRESS",
    );
    const commit = event(
      1,
      "77777777-7777-4777-8777-777777777777",
      "COMMIT",
    );

    expect(isOptimisticProgress(progress)).toBe(true);
    expect(isAuthoritativeCommit(progress)).toBe(false);
    expect(isAuthoritativeCommit(commit)).toBe(true);
  });

  it("rejects event-name/envelope mismatches", () => {
    const payload = event(
      1,
      "88888888-8888-4888-8888-888888888888",
    );
    const frame = [
      `id: ${turnId}:1`,
      "event: intent.resolved",
      `data: ${JSON.stringify(payload)}`,
      "",
    ].join("\n");

    expect(() => parseInteractionSseFrame(frame)).toThrowError(
      "event name does not match",
    );
  });
});

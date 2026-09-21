# Experience Runtime client

## Interaction streaming — EXP-BE-004

`interaction-stream.ts` is the frontend boundary for the versioned Experience
Runtime SSE protocol.

It consumes the backend stream through authenticated `fetch` rather than browser
`EventSource`, because Ondar API authentication uses bearer headers.

The client validates every event with Zod, applies events in strict turn-local
sequence order, suppresses exact UUID duplicates, and retains the last SSE event
ID as the reconnect token.

A sequence gap or mismatched resume ID is a protocol error. The client must not
silently reorder events.

Event semantics remain explicit:

- `PROGRESS`: optimistic/in-flight state.
- `STATE`: authoritative Experience Runtime state.
- `COMMIT`: authoritative business mutation commit, reserved for L2.
- `TERMINAL`: completed/failed turn.

UI code must never interpret `PROGRESS` as proof that a business-domain mutation
committed.

## FE-012 — Universal Ask / Primary Input Surface

Universal Ask composes the shipped L1 backend primitives rather than treating Ask
as a stateless chat request:

1. resolve the current organization and branch context;
2. resume the saved active Conversation only when its branch context matches;
3. append a durable USER turn;
4. resolve the typed Intent and conversational entity references;
5. replay the turn's EXP-BE-004 SSE lifecycle events;
6. stop on clarification or BLOCKED_L1 mutation intent;
7. for resolved read intents, call AIR-006 for the grounded answer, carrying the
   first resolved entity as the authorized graph anchor when one exists.

AIR-006 does not yet emit answer.delta or trusted Experience artifacts itself.
The frontend therefore does not fabricate those events or wrap the AIR-006 result
as an ArtifactEnvelope. It renders the grounded AIR-006 answer with the existing
evidence component while independently consuming any real artifact.created or
workspace.suggested events emitted by the Experience Runtime.

The production shell exposes Ask persistently. Search remains an explicit fallback.
Voice is present only as a disabled affordance until EXP-BE-009 / EXP-FE-004 lands.

L1 remains read-only: mutation-shaped intents stop at BLOCKED_L1 and never call a
business mutation endpoint.

## FE-014 — Generated UI Read Primitive Family

The frontend now has presentation-only primitives for every EXP-BE-005 L1
read artifact data shape:

- `AnswerBlock`
- `EvidenceBlock`
- `MetricBlock`
- `MetricGroup`
- `EntityCard`
- `EntityList`
- `DataTable`
- `Timeline`
- `WarningBlock`
- `ConflictBlock`
- `ErrorBlock`

The corresponding strict Zod contracts live in
`lib/experience/read-artifact-contracts.ts` and mirror backend schema version 1.

These primitives:

- render text/data only; they never execute arbitrary HTML or script;
- expose optional authority and freshness metadata;
- open evidence/entity records only through an explicit href resolver supplied
  by trusted application code;
- share one loading/partial/empty/error grammar;
- do not decide which ArtifactEnvelope type/version maps to which renderer.

That last responsibility intentionally remains with EXP-FE-001, the Artifact
renderer registry.

The existing AIR-006 `AiAnswerBlock` now composes `AnswerBlock` and
`EvidenceBlock`, so the primitive family is exercised by the production Ask
surface before ArtifactEnvelope registry integration lands.

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

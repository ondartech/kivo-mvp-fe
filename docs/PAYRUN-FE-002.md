# PAYRUN-FE-002 — Payment Operations Production Hardening

## Objective

Make the PAYRUN-FE-001 Payment Operations workspace continuously verifiable without moving financial authority into the browser.

## Quality gate

Every pull request targeting `dev`, `staging`, or `main` must execute:

1. TypeScript typecheck.
2. ESLint.
3. Vitest in non-watch mode.
4. Next.js production build.

The repository currently has no committed package-manager lockfile, so the workflow uses `npm install`. A future repository-wide dependency-governance card may introduce a lockfile and switch this gate to `npm ci`; PAYRUN-FE-002 does not fabricate one.

## Payment Run invariants under test

- `DISPATCHED`, `ACCEPTED`, `IN_TRANSIT`, and `OUTCOME_UNKNOWN` are not settlement.
- Only `SETTLED` is rendered as successful instruction settlement.
- PAYRUN-009 propagation status remains separate from payment settlement.
- `PENDING_APPROVAL` cannot be cancelled through the Payment Run cancellation command; approval decisions remain owned by the Approval API.
- Execution preparation is available only after approval.
- Active run items require executable beneficiary destinations before submission.
- `FAILED` and `PARTIALLY_SETTLED` remain recoverable and cannot be archived directly.
- Only irreversible terminal Payment Run states are archivable.

## Operator validation matrix

Before release, staging validation should exercise:

- draft creation and server preview;
- reservation drift and stale-obligation errors;
- missing beneficiary destination;
- submit → approve/reject;
- single-operator step-up where enabled;
- MANUAL and CSV_EXPORT execution;
- dispatch without acceptance;
- accepted/in-transit state;
- settled outcome;
- failed/rejected outcome;
- `OUTCOME_UNKNOWN`;
- partial settlement;
- authoritative reconciliation;
- Finance-posting failure without duplicate settlement reconciliation;
- PAYRUN-009 pending/retrying/quarantined/propagated evidence;
- complete-with-exceptions;
- cancel;
- archive/unarchive;
- recurring template generation into DRAFT only;
- WF-001 delivery from `payments.payment_outcome_propagated`.

## Non-goals

- No new Payment Run lifecycle state.
- No client-side balance, settlement, clearing, or approval calculation.
- No automatic financial Workflow action.
- No BANK_FILE_EXPORT exposure until a verified backend adapter exists.

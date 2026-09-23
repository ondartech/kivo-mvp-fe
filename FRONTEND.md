# Kivo Frontend Engineering Specification

**Status:** Frontend implementation authority (supporting — canonical is `DESIGN.md` v2.1)  
**Version:** 1.1  
**Scope:** Kivo customer-facing frontend  
**Aligned to:** `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` verbatim + `KIVO × NRS INTEGRATION SPECIFICATION.md` + `KIVO_MVP2_ENGINEERING_BACKLOG.md §6/§7` + `DESIGN.md v2.1`  
**Updated:** 4 September 2026

---

## 1. Purpose

`FRONTEND.md` translates Kivo's product, domain and design specifications into engineering conventions.

It governs implementation decisions that should be consistent across the frontend.

The frontend is not the source of financial truth.

The backend/domain services are authoritative.

---

# 2. Source-of-Truth Hierarchy

When documents conflict:

1. Domain and financial invariants
2. `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` (Updated PRD v2.0, Sep 2026) — verbatim, authoritative where it conflicts with Original
3. `KIVO — PRODUCT & DOMAIN FOUNDATION.md` v2.0
4. `KIVO — MATURE SYSTEM PRODUCT REQUIREMENTS DOCUMENT.md` (31 Aug 2026) — target, stays in
5. `KIVO × NRS INTEGRATION SPECIFICATION.md` + `prd/nrs.md`
6. `KIVO_MVP2_ENGINEERING_BACKLOG.md` §6/§7 (`RECONCILIATION.md §1–9`)
7. `DESIGN.md` v2.1 — *canonical UI implementation authority*
8. `UX.md` v1.1 (supporting)
9. `SCREENS.md` v1.1 (supporting — skeleton `Project/Quote/Milestone/NRS` §25–28)
10. `COMPONENTS.md` (supporting)
11. `DESIGN-TOKENS.md` v1.1 (supporting — `slate` for NRS `UNKNOWN`)
12. `FRONTEND.md` v1.1 (this file, supporting)
13. Implementation preference

An implementation preference must never override a financial invariant. `DESIGN.md v2.1` wins on presentation vs engineering; Updated PRD wins on financial truth.

---

# 3. Technology Baseline

The intended frontend stack is:

- Next.js;
- TypeScript;
- Tailwind CSS;
- shadcn/ui or equivalent primitive foundation.

Additional libraries should be introduced only when they solve a demonstrated problem.

The frontend should remain simple enough to support a 30-day MVP.

---

# 4. Architectural Principles

## 4.1 Feature-oriented structure

Prefer feature/domain boundaries over a giant generic component directory.

Conceptual structure:

```text
src/
├── app/
├── components/
│   ├── ui/
│   └── kivo/
├── features/
│   ├── onboarding/
│   ├── dashboard/
│   ├── invoices/
│   ├── customers/
│   ├── receivables/
│   ├── payments/
│   ├── communications/
│   └── settings/
├── lib/
├── hooks/
├── api/
├── types/
└── styles/
```

Exact repository structure may differ, but domain ownership should remain explicit.

---

# 5. Server vs Client

Prefer server-rendered/read-oriented surfaces where practical.

Use client components for:

- interactive forms;
- dialogs;
- live filtering;
- local UI state;
- provider handoff;
- optimistic interaction where safe.

Do not make entire pages client-rendered merely because one child component is interactive.

---

# 6. API Boundary

All protected financial data must come through the authorized API/application boundary.

The frontend must not:

- access PostgreSQL directly;
- construct financial commands as generic PATCH requests;
- infer tenant authorization from client state;
- bypass domain commands.

The MVP API uses:

```text
/api/v1
```

with explicit request/response schemas.

---

# 7. Query and Mutation Model

Separate:

```text
Queries
```

from:

```text
Commands
```

Examples of queries:

```text
getDashboard
getInvoices
getInvoice
getCustomers
getCustomer
getReceivables
getPayments
```

Examples of commands:

```text
createCustomer
createInvoiceDraft
updateInvoiceDraft
issueInvoice
sendInvoice
recordManualPayment
sendReminder
voidInvoice
```

Financial mutations must map to explicit backend commands.

---

# 8. Server State

Use a consistent server-state strategy.

Requirements:

- cache reads where useful;
- invalidate related queries after mutations;
- never trust stale financial state after a mutation;
- refetch authoritative financial results after consequential actions.

Example:

After recording payment:

```text
recordPayment
→ receive authoritative payment result
→ refresh invoice
→ refresh receivables
→ refresh customer balance
→ refresh dashboard metrics where relevant
```

---

# 9. Financial Data Handling

The frontend should treat money as a domain value.

Do not use JavaScript floating-point arithmetic for authoritative calculations.

Bad:

```ts
const total = quantity * unitPrice;
```

when that result is being treated as authoritative financial truth.

Good:

```text
submit invoice inputs
→ backend calculates
→ frontend renders authoritative totals
```

Client-side previews may exist for UX, but the backend result wins.

---

# 10. State Handling

Do not create a single frontend `status` field for every invoice concern.

Represent separately:

```text
documentStatus
paymentStatus
collectionStatus
viewStatus
```

This mirrors the domain model and prevents contradictory UI.

---

# 11. Forms

Forms should:

- use schema validation;
- validate at the boundary;
- preserve safe draft state;
- distinguish field errors from server errors;
- disable duplicate submission while a command is in flight;
- recover safely from network failure.

Financial command forms should support idempotency where the API requires it.

---

# 12. Mutation Safety

For consequential commands:

```text
Idle
→ Submitting
→ Processing
→ Authoritative result
```

Do not assume that a request timeout means the command failed.

This is especially important for:

- invoice issuance;
- payment recording;
- payment initiation;
- reminders.

---

# 13. Payment UI

The frontend must distinguish:

```text
Provider attempt
```

from:

```text
Confirmed financial payment
```

A redirect from Paystack is not sufficient evidence to render:

> Paid

The UI should obtain trusted backend state.

---

# 14. Loading, Error and Empty States

Every major screen must define:

```text
loading
empty
error
success
```

Financial operations additionally require:

```text
pending
processing
confirmed
failed
```

Do not rely on generic global loading indicators.

---

# 15. Accessibility

Requirements:

- semantic HTML;
- keyboard navigation;
- visible focus;
- accessible names;
- form labels;
- error association;
- screen-reader state announcements where needed;
- non-colour state communication;
- adequate touch targets.

Accessibility is part of financial trust.

---

# 16. Responsive Implementation

Use content-driven breakpoints.

Desktop:

- higher information density;
- multi-column tables;
- persistent navigation.

Mobile:

- priority information first;
- stacked content;
- transformed tables;
- reachable actions;
- readable amounts.

Do not simply reduce font size to fit desktop structures onto mobile.

---

# 17. Routing

The route map should reflect the information architecture (`DESIGN.md v2.1 §17/18`, `KIVO_MVP2 §6`):

```text
/dashboard  // KIV-BE-201  owed→attention→insight  + KIV-FE-201
/invoices
/invoices/new              // KIV-FE-051  CustomerCombobox/LineItemsEditor/TotalsPreview
/invoices/[invoiceId]      // NRS Panel secondary  KIV-FE-192  Slate UNKNOWN
/customers
/customers/new
/customers/[customerId]
/projects                  // NEW MVP2 KIV-FE-121  lightweight  no contract_value/budget
/projects/new
/projects/[projectId]            // tabs Overview|Quotes|Milestones|Invoices|Activity  KIV-FE-190
/projects/[projectId]/milestones // KIV-FE-140  READY_TO_BILL amber
/quotes                    // NEW MVP2 KIV-FE-191
/quotes/new
/quotes/[quoteId]          // Accepted → Create Invoice
/receivables
/payments
/finance/matching                    // N2-FIN-005 Supplier Bill review queue
/finance/matching/[billId]           // Ordered→Received→Billed→Variance + exceptions
/compliance/nrs            // Mature list, MVP2 detail panel only  KIV × NRS SPEC
/settings/*                // team  cut — Membership+Role covers RECON §2 row4
```

Public invoice/payment routes are isolated from authenticated application routes (`/invoice/[token]` + `/invoice/[token]/payment/result` unchanged).

---

# 18. Authorization UX

The frontend may hide unavailable actions for clarity, but this is not authorization.

The backend must enforce:

- authentication;
- organization membership;
- resource access;
- command authorization.

The frontend should gracefully handle a server authorization denial.

---

# 19. Tenant Context

The frontend may display the current organization.

It must never treat a client-provided organization ID as proof of authorization.

Organization context should be established by authenticated session/API behavior.

---

# 20. Notifications

Use notifications for:

- successful non-financial actions;
- asynchronous job completion;
- delivery results;
- important errors.

Do not use transient toasts as the only record of a consequential financial outcome.

The actual state should also appear on the relevant resource.

---

# 21. Analytics

Product analytics may track:

- signup;
- organization creation;
- customer creation;
- invoice creation;
- invoice issuance;
- invoice send;
- invoice view;
- payment recorded;
- payment succeeded;
- payment failed;
- reminder sent.

Do not send unnecessary financial/PII data.

Analytics must never become the source of financial truth.

---

# 22. Error Boundaries

Use layered error handling:

```text
field error
→ form error
→ component error
→ page error
→ application fallback
```

A financial screen should fail gracefully without presenting fabricated data.

---

# 23. Performance

Priorities:

1. dashboard usefulness;
2. invoice creation responsiveness;
3. public invoice speed;
4. list scanning;
5. mobile performance.

Avoid:

- giant client bundles;
- unnecessary dependencies;
- fetching data the screen does not need;
- rendering hidden mature features.

---

# 24. Design System Integration

All product UI should consume:

```text
DESIGN-TOKENS.md
COMPONENTS.md
DESIGN.md
```

Do not introduce ad hoc:

- colours;
- typography;
- radii;
- shadows;
- financial states.

A new visual pattern requires a design-system decision before being repeated.

---

# 25. Definition of Done for a Frontend Feature

A feature is complete when:

- behavior matches the MVP PRD;
- UX matches `UX.md`;
- screen behavior matches `SCREENS.md`;
- components follow `COMPONENTS.md`;
- tokens are used;
- loading/empty/error states exist;
- mobile behavior exists;
- accessibility is addressed;
- financial authority is preserved;
- relevant tests exist;
- no conflicting visual pattern was introduced.

---

# 26. Frontend Anti-Patterns

Do not:

- compute authoritative balances in the browser;
- use generic PATCH for financial commands;
- trust client-side payment success;
- expose internal IDs as public invoice tokens;
- create a giant universal component;
- copy UI from Kuda/Stripe/N26;
- add charts because a dashboard feels empty;
- create decorative UI before core financial hierarchy is correct;
- hide important financial state behind hover;
- let a stale cache override an authoritative mutation result.

---

# 27. Implementation Sequence

The recommended frontend implementation order is:

```text
1. App shell + auth
2. Onboarding
3. Customers
4. Invoice creation
5. Invoice review/issue
6. Invoice detail
7. Public invoice
8. Send/share
9. Dashboard
10. Receivables
11. Manual payments
12. Receipt
13. Reminders
14. Paystack payment states
15. Settings
16. Hardening/accessibility/responsive polish
```

This follows the product dependency graph rather than building screens in visual order.

---

# 28. Frontend Quality Bar

The frontend should feel like one coherent financial product.

It should not feel like:

- a dashboard template;
- an accounting package;
- an invoice PDF generator;
- a generic SaaS admin panel.

The standard is:

> **Calm. Sharp. Financial. Modern. Nigerian.**

## Branch operating context — FE-BRN-001

The authenticated shell owns one browser-local operating scope:

```text
organizationId
└── branchId?   # null means Organization-wide only when server access allows it
```

Branch options come only from
`GET /api/v1/organizations/{organization_id}/operating-branches`. The browser does
not derive Branch access from role names or IAM assignments.

Rules:

- Organization-wide access exposes an `All branches` context plus every active Branch.
- Branch-scoped access exposes only server-authorized Branches.
- A single authorized Branch is selected automatically.
- Multiple Branch-scoped choices require explicit selection.
- A stale/revoked Branch id is cleared when it disappears from the server response.
- Same-tab context changes dispatch `ondar:experience-scope-changed`; storage events
  continue to synchronize other tabs.
- Branch context is presentation/defaulting state, never an authorization credential.
- Domain create/list cards consume `useActiveBranchId()` in their own implementation
  waves; the server remains authoritative for Branch validation and permissions.

Ask already consumes the persisted Branch context when creating/resuming conversations.
Search, Attention and each commercial/finance workspace must add Branch filtering only
when their backend contract explicitly supports it; FE-BRN-001 does not invent client-side
filter semantics.



## Document numbering settings — FE-NUM-001

`/app/settings/numbering` is the Organization governance surface for numbering scope.

Rules:

- Policies are read from
  `GET /api/v1/organizations/{organization_id}/numbering-policies`; the frontend
  does not infer prefixes, widths or effective defaults.
- Supported families are Invoice, Quote, Order and Supplier Bill.
- Each family may be Organization-wide or per-Branch.
- The UI distinguishes inherited/default policy from an explicit saved policy.
- Reference examples use the server-returned prefix and width; Branch examples add
  a sample immutable Branch code only for presentation.
- `PUT /numbering-policies/{document_type}` is the only mutation used by the
  surface. The backend remains authoritative for Organization-scoped `org:write`.
- Policy changes apply only to future allocations. Existing references are never
  presented as mutable or renumberable.
- Business settings links to this dedicated workspace; numbering controls are not
  mixed into static business-identity form state.

## Invoice Branch operating behavior — FE-BRN-002

Invoice surfaces consume the server-authoritative Branch access introduced by
FE-BRN-001.

- Invoice lists send `branch_id` only when an authorized active Branch is selected.
- Organization-wide members may intentionally use `All branches`; Branch-scoped
  members with multiple Branches must select one before the list request executes.
- Invoice draft creation always resolves a concrete authorized Branch. A single
  available Branch may default automatically; multi-Branch creation never silently
  chooses HQ or another Branch.
- Stale browser Branch ids fail closed against the current
  `/operating-branches` response.
- `branch_id` is sent as commercial lineage, not as an authorization credential.
- Invoice list/detail/create surfaces render persisted Branch attribution from API
  data rather than inferred location labels.
- Money remains decimal-string input/output and the frontend does not calculate
  invoice totals.

## Receivables Branch read context — FE-BRN-003

Receivables is a Branch-attributed subsidiary-ledger read surface.

- List, summary and aging requests resolve one shared operating scope.
- When an authorized Branch is selected, all three requests send the same
  `branch_id`.
- Organization-wide members may intentionally read `All branches`.
- Branch-scoped members with multiple Branches must select one before any
  Receivables read executes.
- A membership with no effective active Branch fails closed with an explicit access
  state; the client does not fall back to organization-wide data.
- Stale browser Branch ids are reconciled against the server-authoritative
  `/operating-branches` response.
- Receivable rows render the persisted source-Invoice Branch. Payment aggregate
  surfaces remain organization-level because one Payment can classify value across
  Receivables from multiple Branches.
- Dashboard/Command Center remains organization-level until its backend composed
  projection accepts a Branch scope; the frontend does not locally filter aggregate
  totals.

## Dashboard Branch command center — FE-BRN-004

The Dashboard consumes the single KIV-BE-201 composed endpoint; it does not assemble
financial/commercial totals from separate client-side queries.

- `GET /api/v1/organizations/{organization_id}/dashboard` is requested only after
  operating Branch access resolves.
- An authorized selected Branch is sent as `branch_id`; Organization-wide access may
  intentionally omit it for `All branches`.
- Branch-scoped memberships with multiple active Branches fail closed until the user
  chooses one. No active Branch produces an explicit access state.
- The backend response's effective `branch_id` is rendered as the authoritative scope
  of the command center.
- Collected cash, Receivables summary/aging, Quote pipeline, Project/ready-milestone
  commercial metrics and NRS posture come from the same response and therefore cannot
  mix Branch scopes.
- The frontend never recalculates cash, outstanding, overdue, unbilled, contract value
  or NRS totals. Money remains authoritative decimal strings.
- The Dashboard deliberately does not synthesize recent invoices/payments or local
  charts. Detail navigation goes to authoritative domain workspaces.

## Finance Branch reporting context — FE-BRN-005

Finance reporting uses capability-specific Branch context rather than the broader global
membership Branch set.

- Finance pages request
  `GET /api/v1/organizations/{organization_id}/operating-branches?permission=finance:read`.
- The browser never infers Finance scope from role names or from unrelated Branch grants.
- Account Activity sends the selected/effective Finance `branch_id` to the canonical
  ledger report endpoint.
- Organization-wide Finance access may intentionally use `All branches`; a sole
  Finance Branch auto-resolves; multiple Branch-scoped choices require explicit
  selection.
- A stale global Branch that is not Finance-authorized is rejected against the
  permission-filtered context before ledger data loads.
- Opening, period and closing balances remain server-authoritative; the frontend does
  not filter JournalLines or recompute balances.
- Each returned JournalLine renders its persisted Branch dimension.
- Chart-of-Accounts metadata remains Organization-wide shared Finance metadata.
- Journal detail links are suppressed when Finance access is Branch-scoped. A balanced
  Journal may span multiple Branches, so the frontend does not request or fabricate a
  partial journal view.


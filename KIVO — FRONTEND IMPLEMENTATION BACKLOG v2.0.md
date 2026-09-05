Absolutely. I’m treating this as the **execution companion to `KIVO — SCREEN SPECIFICATION v1.0`**, not as another UX document.

I checked the existing Kivo backlog material first. The current baseline is **58 core items**, with **54 FE items**, and MVP2 adds **KIV-FE-021–023** for Teams/Invites. The existing architecture explicitly requires BE/FE work to remain separate and linked through the OpenAPI contract.  The engineering backlog template also defines `KIV-FE-*` as the execution identifier for the Next.js frontend repository. 

One important correction is incorporated below: **`KIV-FE-021–023` are retained exactly as the existing MVP2 Team UI cards**, rather than inventing replacement IDs. 

# KIVO — FRONTEND IMPLEMENTATION BACKLOG v2.0

**Repository:** `kivo-mvp-fe`
**Framework:** Next.js App Router + TypeScript + Tailwind + shadcn/ui
**Status:** Proposed canonical frontend execution backlog
**Version:** 2.0
**Date:** 3 September 2026
**Product:** Kivo — Nigeria-first invoicing & receivables platform

---

## 1. Purpose

This document converts the Kivo product, architecture, frontend engineering specification, design system, and **Screen Specification v1.0** into an executable frontend backlog.

The objective is simple:

> **A frontend engineer or coding agent should be able to open this document, select the next card, inspect the referenced backend contract, and build the feature without having to invent what the UI should do.**

The frontend backlog therefore answers:

* What screen is being built?
* What route does it own?
* Which user journey does it support?
* Which backend capability does it consume?
* Which API queries and mutations are required?
* Which components are used?
* What permissions apply?
* What entitlements apply?
* What loading/error/empty/processing states exist?
* What happens after a mutation?
* What mobile behavior is required?
* What tests prove it works?
* What blocks it?
* What can a coding agent decide?
* What must the coding agent **not** decide?

---

# 2. Authority Hierarchy

When implementing frontend work, use this precedence:

```text
1. Backend/API contract
        ↓
2. Architecture + domain model
        ↓
3. State machines / financial invariants
        ↓
4. Product requirements
        ↓
5. SCREEN SPECIFICATION v1.0
        ↓
6. DESIGN.md / DESIGN-TOKENS.md / COMPONENTS.md
        ↓
7. FRONTEND IMPLEMENTATION BACKLOG v2.0
        ↓
8. Individual implementation decisions
```

The frontend **never overrides backend financial truth**.

The existing backlog explicitly establishes the frontend repository as the Next.js App Router application and requires cross-repository work to be synchronized through the generated OpenAPI contract. 

---

# 3. Product Objective

Kivo's frontend exists to make this progression visible and actionable:

```text
Customer
   ↓
Commercial work
   ↓
Invoice
   ↓
Receivable
   ↓
Collection
   ↓
Payment
   ↓
Cash
   ↓
Financial clarity
```

The UI should therefore not behave like:

> “a collection of CRUD screens.”

It should behave like:

> **a commercial-to-cash operating system for a Nigerian business.**

The shortest valid journey remains:

```text
Customer → Invoice → Payment
```

The expanded journey is:

```text
Customer
 → Project
 → Quote
 → Invoice
 → Send
 → View
 → Due
 → Reminder
 → Payment
 → Allocation
 → Receipt
 → Cash visibility
```

---

# 4. Frontend Backlog Model

Every frontend card has:

| Field         | Meaning                           |
| ------------- | --------------------------------- |
| ID            | `KIV-FE-*` execution identifier   |
| Screen        | Canonical Screen Specification ID |
| Capability    | Owning product domain             |
| Route         | Route owned by card               |
| Type          | Foundation / Feature / Hardening  |
| Priority      | P0 / P1 / P2                      |
| Phase         | Product delivery phase            |
| SP            | Story points                      |
| BE Dependency | Backend cards/contracts           |
| API           | Queries/mutations consumed        |
| UI            | Components required               |
| States        | Required state handling           |
| Security      | Permission/tenant considerations  |
| Entitlement   | Plan gating                       |
| Tests         | Unit/integration/E2E              |
| Blocks        | Downstream frontend work          |

---

# 5. Phase Model

## Phase 0 — Frontend Foundation

The application becomes structurally capable of hosting the product.

```text
Shell
Auth
API client
Org context
Design primitives
Financial formatting
Global state handling
Permission/entitlement infrastructure
```

---

## Phase 1 — Golden Path

The customer can actually use Kivo:

```text
Signup
→ Organization
→ Customer
→ Invoice
→ Issue
→ Public invoice
→ Send
```

This is the minimum commercially meaningful product.

---

## Phase 2 — Cash

Complete the money loop:

```text
Receivable
→ Reminder
→ Payment
→ Allocation
→ Receipt
→ Dashboard
```

---

## Phase 3 — Commercial Depth

Add:

```text
Project
→ Quote
→ Acceptance
→ Invoice
```

---

## Phase 4 — Organization & Monetization

Add:

```text
Teams
RBAC
Business settings
Invoice settings
Payment settings
Communications
Subscription
Entitlements
```

---

## Phase 5 — Hardening

Production-grade:

```text
Mobile
Accessibility
Error recovery
Permissions
Entitlements
Performance
E2E
Observability
Visual consistency
```

---

# 6. Master Implementation Sequence

This is the sequence a coding agent should follow unless an explicit dependency requires otherwise.

```text
FE-001 Foundation
   ↓
FE-002 App Shell
   ↓
FE-003 Auth
   ↓
FE-004 Organization Context
   ↓
FE-005 Dashboard
   ↓
FE-006 Customer List
   ↓
FE-007 Customer Create/Edit
   ↓
FE-008 Customer Detail
   ↓
FE-009 Invoice List
   ↓
FE-010 Invoice Create
   ↓
FE-011 Invoice Review
   ↓
FE-012 Invoice Detail
   ↓
FE-013 Invoice Issue
   ↓
FE-014 Public Invoice
   ↓
FE-015 Invoice Delivery
   ↓
FE-016 Receivables
   ↓
FE-017 Record Payment
   ↓
FE-018 Payment Detail/Allocation
   ↓
FE-019 Receipt
   ↓
FE-020 Collections/Reminder
   ↓
FE-021 Team
   ↓
FE-022 Invite
   ↓
FE-023 Accept Invite
   ↓
FE-024 Projects
   ↓
FE-025 Quotes
   ↓
FE-026 Quote→Invoice
   ↓
FE-027 Settings
   ↓
FE-028 Billing/Entitlements
   ↓
FE-029 Hardening
```

**Important:** the numbering above is a **logical implementation sequence**, not a replacement for existing IDs. Existing `KIV-FE-*` identifiers must be preserved. Where the existing repository already has a card, that card remains authoritative and the logical sequence maps onto it.

---

# 7. Foundation Epic

## KIV-FE-001 — Frontend Application Foundation

**Screen:** Foundation
**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 0
**Effort:** 3 SP

### Objective

Establish the frontend architecture required for all subsequent feature work.

### Scope

Implement:

```text
app/
components/
features/
lib/
hooks/
checks/
types/
```

Establish:

* API client boundary
* query layer
* mutation layer
* error normalization
* authentication context
* organization context
* money display utilities
* permission utilities
* entitlement utilities
* loading/error conventions
* toast infrastructure
* modal/dialog conventions

### Must not implement

* financial calculations
* duplicate domain logic
* invoice state transitions
* payment allocation
* entitlement decisions

### Acceptance Criteria

* `pnpm lint` passes
* `pnpm typecheck` passes
* `pnpm test` passes
* `pnpm build` passes
* no `parseFloat`/floating-point financial calculation
* generated OpenAPI client can be consumed
* all subsequent feature modules have defined placement

---

# 8. Application Shell

## KIV-FE-002 — Application Shell & Navigation

**Screen:** APP-SHELL
**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 0
**Effort:** 5 SP

### Route

```text
/{orgId}/*
```

### Navigation

```text
HOME
  Dashboard

WORK
  Projects
  Quotes

SELL
  Customers

BILL
  Invoices

CASH
  Receivables
  Payments

SETTINGS
  Organization
  Team
  Billing
```

### Global action

```text
+ New
 ├ Invoice
 ├ Customer
 ├ Payment
 ├ Project
 └ Quote
```

Quote/Project actions are entitlement/availability controlled.

### Required behavior

* active navigation
* organization context
* responsive sidebar
* mobile navigation
* user menu
* logout
* settings access
* permission-aware actions

### Mobile

```text
Home | Invoices | Receivables | Payments | More
```

### Acceptance Criteria

* all authenticated routes render inside shell
* current organization is explicit
* unauthorized routes do not become visible merely because URL is manually entered
* mobile navigation works
* keyboard navigation works

---

# 9. Authentication Epic

## KIV-FE-003 — Authentication Screens

**Screens:**

```text
AUTH-001 Login
AUTH-002 Signup
AUTH-003 Verify
AUTH-004 Forgot Password
AUTH-005 Reset Password
```

**Priority:** P0
**Phase:** 0
**Effort:** 5 SP

### Components

* AuthLayout
* Input
* PasswordInput
* Button
* Form
* Alert
* ErrorState

### Requirements

Do not reveal whether an arbitrary account exists where that would create account enumeration risk.

### E2E

```text
signup
→ verification
→ login
→ authenticated shell
```

---

# 10. Organization Context

## KIV-FE-004 — Organization Context & Onboarding

**Screen:** APP-002
**Capability:** Organization & Business
**Priority:** P0
**Phase:** 1
**Effort:** 5 SP

### Journey

```text
Signup
 ↓
Verify
 ↓
Create Organization
 ↓
Business Profile
 ↓
Add Customer
 ↓
Create Invoice
```

### Requirements

Organization ID comes from authenticated context, not blindly from the URL.

### States

* no organization
* organization loading
* organization created
* incomplete onboarding
* completed onboarding
* API failure

### Acceptance

A new user can reach the Dashboard without manually configuring application state.

---

# 11. Dashboard Epic

## KIV-FE-005 — Dashboard

**Screen:** APP-001
**Capability:** Reporting & Analytics
**Priority:** P0
**Phase:** 1
**Effort:** 5 SP

### Primary purpose

Answer:

> **“What is happening with my money?”**

### Primary metrics

```text
Invoiced
Collected
Outstanding
Overdue
```

### Money needing attention

Worklist:

```text
Overdue invoices
Invoices due soon
Unpaid high-value invoices
Failed delivery
Payment requiring reconciliation
```

### Secondary sections

* recent invoices
* recent payments
* receivables summary
* quick actions

### Primary CTA

```text
Create invoice
```

### API

Conceptually:

```text
GET /dashboard
GET /receivables/summary
GET /invoices?...
GET /payments?...
```

Use actual generated OpenAPI contract names.

### Acceptance

Dashboard financial numbers are rendered from backend aggregates.

Frontend performs **zero authoritative financial calculations**.

---

# 12. Customer Epic

## KIV-FE-006 — Customer List

**Screen:** CUST-001
**Capability:** Customer
**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Route

```text
/{orgId}/customers
```

### UI

Desktop:

```text
Search | Filters | + Customer

Customer
Contact
Outstanding
Last invoice
Status
Actions
```

Mobile:

```text
Customer card
Outstanding
Last activity
```

### Actions

* Create
* Open
* Edit
* Archive where permitted

### States

* loading
* empty
* search-empty
* error
* populated

---

## KIV-FE-007 — Customer Create/Edit

**Screens:**

```text
CUST-002
CUST-004
```

**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Fields

* business/customer name
* email
* phone
* address
* contact information
* notes

### Rules

Customer profile changes must not rewrite historical invoice snapshots.

### Validation

Use schema validation consistent with backend contract.

### Mutation

```text
POST /customers
PATCH /customers/{id}
```

### Acceptance

Successful mutation invalidates:

```text
customer list
customer detail
dashboard if relevant
```

---

## KIV-FE-008 — Customer Detail

**Screen:** CUST-003
**Priority:** P0
**Phase:** 1
**Effort:** 5 SP

### Header

```text
Customer
Contact
Outstanding balance
```

### Sections

```text
Financial summary
Invoices
Payments
Receivables
Activity
```

### Financial summary

Must distinguish:

```text
Total invoiced
Total paid
Outstanding
Overdue
```

All are backend values.

### Acceptance

A user can move from:

```text
Customer → Invoice
```

without returning to the customer list.

---

# 13. Invoice Epic

## KIV-FE-009 — Invoice List

**Screen:** INV-001
**Priority:** P0
**Phase:** 1
**Effort:** 5 SP

### Route

```text
/{orgId}/invoices
```

### Filters

* search
* status
* customer
* date range

### Statuses

```text
Draft
Issued
Paid
Partially Paid
Overdue
Void
```

### Important

Document state and payment state must not be collapsed into one arbitrary frontend status if the API exposes separate dimensions.

---

# 14. Invoice Creation

## KIV-FE-010 — Invoice Creation

**Screen:** INV-002
**Priority:** P0
**Phase:** 1
**Effort:** 8 SP

### Route

```text
/{orgId}/invoices/new
```

### Form

```text
Customer
Invoice date
Due date
Currency

Line items
  Description
  Quantity
  Unit price

Discount
Tax
Charges

Notes
Payment instructions
Terms
```

### Line-item editor

Reusable:

```text
KivoLineItemsEditor
```

### Totals

```text
KivoTotalsPreview
```

But:

> The displayed total is a preview of server-authoritative financial logic.

Do not implement an alternative financial calculation engine in the browser.

### Submission

```text
POST /invoices
```

### Processing state

```text
IDLE
→ SUBMITTING
→ PROCESSING
→ AUTHORITATIVE RESULT
```

Never interpret timeout as definitive failure.

---

# 15. Invoice Review

## KIV-FE-011 — Invoice Review

**Screen:** INV-003
**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Purpose

Give the user a final confirmation before issuance.

### Layout

```text
Customer
Invoice metadata
Line items
Subtotal
Tax
Discount
Charges
Total
Payment instructions
Terms
```

### Critical warning

> Issuing an invoice creates an authoritative financial record. Review before continuing.

### Actions

```text
Back / Edit
Issue invoice
```

---

# 16. Invoice Detail

## KIV-FE-012 — Invoice Detail

**Screen:** INV-004
**Priority:** P0
**Phase:** 1
**Effort:** 8 SP

### Header

```text
Invoice number
Customer
Amount
Due date
Status
```

### Financial hierarchy

Primary:

```text
Amount due
```

Secondary:

```text
Invoice date
Due date
Paid
Outstanding
```

### State dimensions

Render separately where provided:

```text
document_status
payment_status
collection_status
view_status
compliance_status
```

### Sections

```text
Invoice
Customer
Payments
Collection
Delivery
Activity
Compliance
```

### Actions

State-dependent:

```text
Edit
Issue
Send
Download
Duplicate
Void
Record payment
Remind
```

Do not display impossible actions.

---

# 17. Invoice Issuance

## KIV-FE-013 — Invoice Issue Command

**Screen:** INV-003 / INV-004
**Capability:** Invoicing
**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Mutation

```text
POST /invoices/{id}/issue
```

### Requirements

* confirmation
* idempotent command behavior
* processing state
* duplicate-click prevention
* authoritative response handling
* cache invalidation

### On success

Refresh:

```text
invoice detail
invoice list
dashboard
receivables
```

### Critical rule

Frontend must never fabricate an invoice number.

The backend owns atomic invoice number allocation and immutable snapshot creation.

---

# 18. Public Invoice

## KIV-FE-014 — Public Invoice Experience

**Screen:** PUB-001
**Priority:** P0
**Phase:** 1
**Effort:** 5 SP

### Route

```text
/invoice/[token]
```

### Purpose

The recipient should be able to:

```text
Understand what they owe
→ Verify who invoiced them
→ Understand when it is due
→ Pay
```

### Layout

```text
Business identity

Invoice #
Issue date
Due date

Line items

Total

Payment instructions

Pay now
```

### Security

Token is the public capability.

Do not expose internal organization identifiers or authenticated application navigation.

### States

* loading
* valid
* expired/invalid token
* invoice unavailable
* payment unavailable
* payment initiated

---

# 19. Public Payment

## KIV-FE-015 — Public Payment Processing

**Screens:**

```text
PUB-002
PUB-003
```

**Priority:** P0
**Phase:** 2
**Effort:** 5 SP

### Flow

```text
Public invoice
 ↓
Pay now
 ↓
Payment processing
 ↓
Provider
 ↓
Return
 ↓
Verification
 ↓
Result
```

### Critical rule

A browser redirect is **not proof of payment**.

The UI must display the authoritative payment state returned by Kivo.

### States

```text
Initiated
Processing
Successful
Failed
Unknown / verification pending
```

---

# 20. Invoice Delivery

## KIV-FE-016 — Invoice Send & Delivery Status

**Screen:** INV-004
**Capability:** Communications
**Priority:** P0
**Phase:** 2
**Effort:** 3 SP

### Actions

```text
Send invoice
Copy public link
Download
```

### Delivery state

Show separately:

```text
Not sent
Queued
Sent
Delivered
Failed
```

### Failure

Provide:

```text
Retry
Copy link
```

Do not imply that `Sent` means `Viewed` or `Paid`.

---

# 21. Receivables Epic

## KIV-FE-017 — Receivables Command Center

**Screen:** REC-001
**Capability:** Receivables
**Priority:** P0
**Phase:** 2
**Effort:** 8 SP

### Purpose

This is one of Kivo's most important screens.

It should answer:

> **“Who owes me money, how much, and what should I do next?”**

### Summary

```text
Total outstanding
Overdue
Due soon
Collected
```

### Aging

```text
Current
Due soon
1–7 days overdue
8–30 days overdue
30+ days overdue
```

### Worklist

Each receivable should expose:

```text
Customer
Invoice
Amount
Due date
Age
Last action
Recommended action
```

### Actions

```text
View invoice
Send reminder
Record payment
```

### Mobile

Receivable cards rather than dense tables.

---

# 22. Collections & Reminders

## KIV-FE-018 — Reminder Workflow

**Screen:** REC-001 / INV-004
**Capability:** Collections
**Priority:** P0
**Phase:** 2
**Effort:** 5 SP

### Reminder confirmation

Before sending:

```text
Customer
Invoice
Amount outstanding
Reminder type
Message preview
```

### Action

```text
Send reminder
```

### Result

```text
Queued
Sent
Failed
```

### History

Invoice detail should show reminder activity.

---

# 23. Payments Epic

## KIV-FE-019 — Payment List

**Screen:** PAY-001
**Capability:** Payments
**Priority:** P0
**Phase:** 2
**Effort:** 3 SP

### Columns

```text
Date
Reference
Customer
Amount
Method
Status
Allocated
```

### Filters

* date
* status
* customer
* method
* invoice

### States

* loading
* empty
* error
* populated

---

# 24. Record Payment

## KIV-FE-020 — Record Manual Payment

**Screen:** PAY-003
**Capability:** Payments
**Priority:** P0
**Phase:** 2
**Effort:** 5 SP

### Fields

```text
Customer / payer
Amount
Currency
Payment date
Reference
Method
Notes
```

### Allocation

If supported by API:

```text
Invoice
Amount allocated
Remaining
```

### Critical rule

Frontend does not determine the final outstanding balance.

Backend allocation is authoritative.

---

# 25. Payment Detail

## KIV-FE-021A — Payment Detail & Allocation

**Screen:** PAY-002
**Capability:** Payments
**Priority:** P0
**Phase:** 2
**Effort:** 5 SP

> `021A` is deliberately a **logical screen-work item**, not a replacement for existing `KIV-FE-021`, which is already assigned to Team Settings in MVP2.

### Sections

```text
Payment summary
Provider/reference
Allocation
Invoice(s)
Receipt
Timeline
```

### Allocation

Display:

```text
Payment amount
Allocated amount
Unallocated amount
```

Use backend values.

---

# 26. Receipt

## KIV-FE-022A — Receipt Experience

**Screen:** PAY-002 / Receipt surface
**Capability:** Payments
**Priority:** P0
**Phase:** 2
**Effort:** 3 SP

Again, this is a logical work identifier because existing `KIV-FE-022` is already the Team Invite card.

### Receipt actions

```text
View
Download
Share
```

### Receipt must show

```text
Receipt number
Payment date
Customer
Invoice
Amount
Allocation
Payment reference
Business identity
```

---

# 27. MVP2 Team UI

Existing cards are retained.

## KIV-FE-021 — Team Settings

**Route**

```text
/{orgId}/settings/team
```

**Priority:** P0
**Phase:** MVP2

The existing specification defines:

* TeamTable
* MemberTable
* role badges
* membership status
* Invite CTA
* Create team
* permission-aware Invite visibility

and depends on `KIV-BE-054`, `KIV-BE-056`, and the application shell. 

### Roles

```text
OWNER
ADMIN
MEMBER
```

Frontend hides actions for presentation purposes, but backend remains authoritative. The RBAC backend explicitly requires frontend gating of the New/Invite behavior while retaining server-side enforcement. 

---

# 28. KIV-FE-022 — Invite Modal

Existing card.

### Route

```text
/{orgId}/settings/team/invite
```

### Fields

```text
Email
Role
Team
```

### Roles

```text
ADMIN
MEMBER
```

### Requirements

* RHF
* Zod
* idempotency key
* copy invite link
* pending invite handling
* resend
* rate-limit handling

The existing card specifies `POST /organizations/{orgId}/invites`, `GET /invites?status=PENDING`, and `POST /invites/{id}/resend`, with idempotency and duplicate-invite handling. 

---

# 29. KIV-FE-023 — Accept Invite

Existing card.

### Route

```text
/invite/[token]
```

### Flow

```text
Open invite
 ↓
Validate
 ↓
Show organization + role
 ↓
Accept
 ↓
Membership created
 ↓
Dashboard
```

### Failure

```text
Invalid token
Expired token
Already accepted
Already declined
```

The existing card specifies the invite card, role badge, accept/decline commands and E2E coverage. 

---

# 30. Projects Epic

## KIV-FE-024 — Project List

**Screen:** PROJ-001
**Capability:** Projects
**Priority:** P1
**Phase:** 3
**Effort:** 5 SP

### Purpose

Projects are **commercial work containers**, not generic project-management software.

### Display

```text
Project
Customer
Value
Invoices
Outstanding
Status
```

### Primary action

```text
New project
```

---

# 31. Project Creation

## KIV-FE-025 — Create Project

**Screen:** PROJ-002
**Priority:** P1
**Phase:** 3
**Effort:** 3 SP

### Fields

```text
Customer
Project name
Description
Start date
Expected value
Status
```

Avoid introducing tasks, Kanban, sprints, timesheets or generic PM functionality.

---

# 32. Project Detail

## KIV-FE-026 — Project Detail

**Screen:** PROJ-003
**Priority:** P1
**Phase:** 3
**Effort:** 5 SP

### Sections

```text
Commercial summary
Milestones
Quotes
Invoices
Payments
Receivables
```

### Core purpose

Show:

> **How this piece of work is turning into money.**

---

# 33. Quotes Epic

## KIV-FE-027 — Quote List

**Screen:** QUOTE-001
**Capability:** Quotes
**Priority:** P1
**Phase:** 3
**Effort:** 3 SP

### Statuses

```text
Draft
Sent
Viewed
Accepted
Rejected
Expired
Converted
```

---

# 34. Quote Creation

## KIV-FE-028 — Create Quote

**Screen:** QUOTE-002
**Priority:** P1
**Phase:** 3
**Effort:** 5 SP

Reuse invoice construction patterns where semantically appropriate.

### Do not

Duplicate invoice financial logic.

---

# 35. Quote Review

## KIV-FE-029 — Quote Review

**Screen:** QUOTE-003
**Priority:** P1
**Phase:** 3
**Effort:** 3 SP

### Actions

```text
Edit
Send
Preview
```

---

# 36. Quote Detail

## KIV-FE-030 — Quote Detail

**Screen:** QUOTE-004
**Priority:** P1
**Phase:** 3
**Effort:** 5 SP

### Core CTA

```text
Convert to invoice
```

### Journey

```text
Quote accepted
 ↓
Convert
 ↓
Invoice draft
 ↓
Review
 ↓
Issue
```

Never silently issue an invoice during conversion unless the backend contract explicitly defines such behavior.

---

# 37. Settings Epic

## KIV-FE-031 — Settings Shell

**Screen:** SET-001
**Priority:** P1
**Phase:** 4
**Effort:** 3 SP

### Navigation

```text
Organization
Business profile
Invoice settings
Payment settings
Communications
Team
Subscription
```

Settings must be permission-aware.

---

# 38. Business Profile

## KIV-FE-032 — Business Profile

**Screen:** SET-002
**Capability:** Organization & Business
**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Fields

```text
Business name
Legal name
Email
Phone
Address
Tax identifiers
Logo
```

### Preview

Show how business identity appears on:

```text
Invoice
Public invoice
Receipt
```

---

# 39. Invoice Settings

## KIV-FE-033 — Invoice Settings

**Screen:** SET-003
**Priority:** P1
**Phase:** 4
**Effort:** 5 SP

### Configuration

Potentially:

```text
Invoice prefix
Payment terms
Default notes
Default payment instructions
Tax defaults
Numbering configuration
```

Backend contract governs which values are actually configurable.

---

# 40. Payment Settings

## KIV-FE-034 — Payment Settings

**Screen:** SET-004
**Capability:** Payment Provider Integration
**Priority:** P1
**Phase:** 4
**Effort:** 5 SP

### UI

```text
Available payment methods
Provider status
Connection state
Payment instructions
```

Never display provider credentials.

---

# 41. Communications Settings

## KIV-FE-035 — Communications Settings

**Screen:** SET-005
**Capability:** Communications
**Priority:** P1
**Phase:** 4
**Effort:** 3 SP

### Configuration

```text
Invoice email
Reminder preferences
Sender identity
Message defaults
```

---

# 42. Subscription

## KIV-FE-036 — Subscription & Usage

**Screen:** SET-006
**Capability:** Subscription & Entitlements
**Priority:** P1
**Phase:** 4
**Effort:** 5 SP

### Display

```text
Current plan
Billing status
Trial status
Usage
Limits
Entitlements
Upgrade
```

### Critical distinction

The frontend must distinguish:

```text
Unauthorized
```

from:

```text
Authorized but not entitled
```

and:

```text
Feature unavailable because backend has not enabled it
```

### Example

Do not show:

> “You don't have permission.”

when the real condition is:

> “Your plan does not include Projects.”

---

# 43. Entitlement Infrastructure

## KIV-FE-037 — Entitlement-Aware UI

**Capability:** Subscription & Entitlements
**Priority:** P0
**Phase:** 4
**Effort:** 5 SP

Create reusable:

```text
<Entitled feature="projects">
<Can permission="invoices.write">
<FeatureGate>
<UpgradePrompt>
```

### Rules

Frontend entitlement checks:

* control visibility
* improve UX
* explain unavailable capabilities

Backend entitlement checks:

* determine authority
* enforce limits
* reject unauthorized mutations

Frontend must never be the security boundary.

---

# 44. Permission Infrastructure

## KIV-FE-038 — Permission-Aware UI

**Capability:** Identity & Access
**Priority:** P0
**Phase:** 4
**Effort:** 3 SP

Centralize:

```text
usePermissions()
can(permission)
canAny(...)
canAll(...)
```

Example:

```text
canInvite
canIssueInvoice
canRecordPayment
canManageBilling
canManageMembers
```

### Never scatter

```text
if (role === "OWNER")
```

throughout the application.

Use a centralized permission abstraction.

---

# 45. Financial Display Infrastructure

## KIV-FE-039 — Money Display System

**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 0
**Effort:** 3 SP

Implement:

```text
KivoMoney
KivoMoneyCard
formatMoney()
formatAmount()
```

### Rules

Financial API values remain strings/decimal-safe representations.

Frontend may:

* format
* localize
* display

Frontend may not:

* calculate authoritative totals
* allocate payments
* determine balances
* determine tax
* determine invoice state

The engineering baseline explicitly requires money handling to avoid floating-point arithmetic and treats `lib/money.ts` as display-only. 

---

# 46. Status System

## KIV-FE-040 — Financial State Components

**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 0
**Effort:** 3 SP

Create:

```text
KivoStatusBadge
KivoInvoiceStatus
KivoPaymentStatus
KivoCollectionStatus
KivoComplianceStatus
```

### Do not overload

A single generic:

```text
status
```

field should not drive all financial UI if the domain exposes multiple state machines.

---

# 47. Global Error & Processing System

## KIV-FE-041 — Error Recovery & Mutation States

**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 0
**Effort:** 5 SP

Standardize:

```text
Loading
Empty
Error
Submitting
Processing
Success
Unknown
```

### Financial mutation model

```text
IDLE
 ↓
SUBMITTING
 ↓
PROCESSING
 ↓
AUTHORITATIVE RESULT
```

### Timeout

Never automatically say:

> “Payment failed.”

if the client simply lost communication with the backend.

Show:

> “We haven't confirmed the result yet.”

and provide a safe refresh/retry path.

---

# 48. Query Invalidation

## KIV-FE-042 — Financial Cache Invalidation

**Capability:** Cross-cutting
**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

### Payment recorded

Invalidate:

```text
payment detail
payment list
invoice
receivables
customer
dashboard
```

### Invoice issued

Invalidate:

```text
invoice
invoice list
dashboard
receivables
customer
```

### Reminder sent

Invalidate:

```text
invoice activity
receivable
reminder state
```

The frontend must never leave stale financial state visible after a successful mutation.

---

# 49. Responsive System

## KIV-FE-043 — Responsive Application

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

### Desktop

Optimized for:

```text
tables
multi-column financial information
side navigation
dense workflows
```

### Mobile

Optimized for:

```text
cards
bottom navigation
sticky actions
single-column forms
compressed summaries
```

### Special treatment

Invoice creation:

```text
sticky bottom action
sticky total
```

Receivables:

```text
card-first
action-first
```

Public invoice:

```text
mobile-first
```

---

# 50. Accessibility

## KIV-FE-044 — Accessibility Hardening

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

### Requirements

* keyboard navigation
* focus management
* semantic headings
* form labels
* field errors
* screen-reader announcements
* accessible dialogs
* adequate touch targets
* no color-only status communication
* logical tab order

### Financial accessibility

Amounts must be understandable without relying solely on typography/color.

---

# 51. Loading / Empty / Error State Library

## KIV-FE-045 — State Components

**Priority:** P0
**Phase:** 0
**Effort:** 3 SP

Reusable:

```text
KivoLoadingState
KivoEmptyState
KivoErrorState
KivoProcessingState
KivoSuccessState
```

Each domain should use the same behavioral language.

---

# 52. Data Table System

## KIV-FE-046 — Financial Data Table

**Priority:** P1
**Phase:** 1
**Effort:** 5 SP

Reusable:

```text
KivoDataTable
KivoFilterBar
KivoSearch
```

Requirements:

* sorting where API supports it
* pagination
* responsive transformation
* empty state
* loading state
* row actions
* accessible headers

No client-side reimplementation of server filtering where server filtering is authoritative.

---

# 53. Entity Selection

## KIV-FE-047 — Entity Combobox

**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

Reusable for:

```text
Customer
Project
Invoice
Team
```

Requirements:

* async search
* keyboard navigation
* empty result
* loading
* selected state
* tenant-safe API usage

---

# 54. Financial Action Confirmation

## KIV-FE-048 — Command Confirmation Framework

**Priority:** P0
**Phase:** 1
**Effort:** 3 SP

For consequential actions:

```text
Issue
Void
Record payment
Send reminder
Remove member
Change role
```

Confirmation should explain the consequence.

Example:

```text
Issue invoice?

Once issued, the financial record cannot be edited
as a draft.

[Cancel] [Issue invoice]
```

---

# 55. Public Experience Hardening

## KIV-FE-049 — Public Invoice Reliability

**Priority:** P0
**Phase:** 5
**Effort:** 3 SP

Test:

```text
valid token
expired token
invalid token
invoice void
invoice paid
invoice partially paid
payment unavailable
provider processing
```

---

# 56. Financial E2E Suite

## KIV-FE-050 — Golden Path E2E

**Priority:** P0
**Phase:** 5
**Effort:** 8 SP

### Mandatory E2E

```text
Signup
→ Verify
→ Organization
→ Customer
→ Invoice
→ Review
→ Issue
→ Public invoice
→ Send
→ View
→ Reminder
→ Payment
→ Allocation
→ Paid
→ Receipt
→ Dashboard
```

This is the most important frontend E2E.

---

# 57. Multi-user E2E

## KIV-FE-051 — RBAC E2E

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

Test:

```text
OWNER
ADMIN
MEMBER
```

### Verify

* navigation
* visible actions
* hidden actions
* forbidden API response handling
* member invitation
* role changes
* member removal
* last-owner protection

The MVP2 backlog already defines OWNER/ADMIN/MEMBER as the current role model and explicitly defers additional roles such as FINANCE/STAFF/ACCOUNTANT to Mature. 

---

# 58. Entitlement E2E

## KIV-FE-052 — Plan Gating E2E

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

Verify:

```text
included feature
excluded feature
usage limit
upgrade prompt
backend rejection
```

### Critical invariant

The UI must never imply that upgrading has happened until the backend confirms the subscription state.

---

# 59. Payment Failure E2E

## KIV-FE-053 — Payment Recovery E2E

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

Test:

```text
payment succeeds
payment fails
provider timeout
webhook delayed
browser closes
redirect returns but verification pending
duplicate callback
```

### Expected behavior

No duplicate payment UI.

No false “Paid”.

No fabricated receipt.

---

# 60. Visual Consistency

## KIV-FE-054 — Design System Conformance

**Priority:** P1
**Phase:** 5
**Effort:** 5 SP

Audit:

* typography
* spacing
* radii
* buttons
* inputs
* cards
* tables
* status badges
* empty states
* dialogs
* page headers
* mobile layouts

Kivo's design direction explicitly prioritizes financial clarity, user comprehension, trust, actionability, consistency, accessibility and then visual refinement. 

---

# 61. Performance

## KIV-FE-055 — Frontend Performance Hardening

**Priority:** P1
**Phase:** 5
**Effort:** 5 SP

Focus:

* server components where appropriate
* minimal client components
* query deduplication
* lazy loading
* optimized images
* route-level loading
* skeletons
* avoiding unnecessary global state
* avoiding waterfall requests

Do not sacrifice financial correctness for perceived speed.

---

# 62. Production Resilience

## KIV-FE-056 — Production Error Recovery

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

Handle:

```text
401
403
404
409
422
429
500
502
503
timeout
network offline
```

### Special financial errors

```text
PAYMENT_PROCESSING
PAYMENT_UNKNOWN
INVOICE_ALREADY_ISSUED
INVOICE_VOID
INSUFFICIENT_ALLOCATION
ENTITLEMENT_EXCEEDED
```

Use the actual backend error catalog rather than inventing error codes.

---

# 63. Frontend Security Hardening

## KIV-FE-057 — Security Review

**Priority:** P0
**Phase:** 5
**Effort:** 5 SP

Check:

* XSS
* unsafe HTML
* token exposure
* local storage misuse
* organization context manipulation
* public invoice token handling
* sensitive error leakage
* authorization assumptions
* client-side permission bypass
* secret exposure

### Absolute rule

A user changing:

```text
/{orgId}
```

in the browser must never grant access to another organization.

---

# 64. Frontend Contract Verification

## KIV-FE-058 — OpenAPI Contract Gate

**Priority:** P0
**Phase:** 0
**Effort:** 3 SP

Pipeline:

```text
Backend OpenAPI
      ↓
generated/openapi.ts
      ↓
Frontend API layer
      ↓
Typecheck
```

The existing Kivo engineering model explicitly requires the backend to publish `openapi.json` and the frontend to synchronize its generated contract. 

### CI

```text
sync-contract.sh --check
```

must pass.

---

# 65. Final Frontend Backlog Matrix

| Work                     | Phase | Priority |            SP |
| ------------------------ | ----: | -------: | ------------: |
| Foundation               |     0 |       P0 |             3 |
| Shell                    |     0 |       P0 |             5 |
| Authentication           |     0 |       P0 |             5 |
| Organization/Onboarding  |     1 |       P0 |             5 |
| Dashboard                |     1 |       P0 |             5 |
| Customer List            |     1 |       P0 |             3 |
| Customer Create/Edit     |     1 |       P0 |             3 |
| Customer Detail          |     1 |       P0 |             5 |
| Invoice List             |     1 |       P0 |             5 |
| Invoice Create           |     1 |       P0 |             8 |
| Invoice Review           |     1 |       P0 |             3 |
| Invoice Detail           |     1 |       P0 |             8 |
| Invoice Issue            |     1 |       P0 |             3 |
| Public Invoice           |     1 |       P0 |             5 |
| Delivery                 |     2 |       P0 |             3 |
| Public Payment           |     2 |       P0 |             5 |
| Receivables              |     2 |       P0 |             8 |
| Reminders                |     2 |       P0 |             5 |
| Payment List             |     2 |       P0 |             3 |
| Record Payment           |     2 |       P0 |             5 |
| Payment Detail           |     2 |       P0 |             5 |
| Receipt                  |     2 |       P0 |             3 |
| Projects                 |     3 |       P1 |            13 |
| Quotes                   |     3 |       P1 |            16 |
| Quote → Invoice          |     3 |       P1 |             3 |
| Settings                 |     4 |       P1 |            24 |
| Team/RBAC                |     4 |       P0 | existing 8 SP |
| Entitlement UI           |     4 |       P0 |             5 |
| Financial display system |     0 |       P0 |             3 |
| State system             |     0 |       P0 |             3 |
| Permission system        |     4 |       P0 |             3 |
| Error/recovery           |   0/5 |       P0 |             5 |
| Cache invalidation       |     1 |       P0 |             3 |
| Responsive               |     5 |       P0 |             5 |
| Accessibility            |     5 |       P0 |             5 |
| E2E                      |     5 |       P0 |            18 |
| Security                 |     5 |       P0 |             5 |
| Performance              |     5 |       P1 |             5 |
| Contract gate            |     0 |       P0 |             3 |

---

# 66. Dependency Graph

The important dependency graph is:

```text
                    ┌──────────────┐
                    │ API Contract │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ FE Foundation   │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Auth             Shell          Money/State
          │                │                │
          └────────────┬───┴────────────────┘
                       ▼
                Organization
                       │
                       ▼
                  Customers
                       │
                       ▼
                   Invoices
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Public       Delivery       Review
       Invoice         │
          │            │
          └──────┬─────┘
                 ▼
             Receivables
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
     Reminder Payment     Dashboard
                 │
                 ▼
             Allocation
                 │
                 ▼
               Receipt
```

Then:

```text
Customers
   │
   ▼
Projects
   │
   ▼
Quotes
   │
   ▼
Invoice
```

And orthogonally:

```text
Organization
     │
     ▼
   Team
     │
 ┌───┼────┐
 ▼   ▼    ▼
RBAC Invite Membership
```

The existing MVP2 dependency graph similarly places Team/Identity upstream of the rest of the product and ties `KIV-FE-021..023` to the shell and backend identity work. 

---

# 67. What Is Actually P0?

If development capacity is constrained, **do not build everything simultaneously**.

The true P0 sequence is:

### P0-A — Platform

```text
Foundation
Shell
Auth
Organization
API contract
Money display
State system
Permission infrastructure
```

### P0-B — Revenue path

```text
Customer
Invoice
Issue
Public Invoice
Send
```

### P0-C — Cash path

```text
Receivables
Reminder
Payment
Allocation
Receipt
Dashboard
```

### P0-D — Trust

```text
Loading
Error recovery
Processing states
Permissions
Entitlements
E2E
Security
```

Everything else can follow.

---

# 68. What We Should NOT Build Yet

This is important because the backlog will otherwise expand indefinitely.

Do **not** introduce:

### Generic accounting

```text
Full general ledger
Chart of accounts
Journal management
Double-entry accounting UI
```

### Generic ERP

```text
Inventory
Procurement
HR
Payroll
Manufacturing
Warehouse
```

### Generic project management

```text
Tasks
Sprints
Kanban
Time tracking
Resource planning
```

### Premature analytics

```text
Dozens of dashboards
BI builder
Custom reporting engine
```

### Premature AI

```text
AI assistant
AI invoice generation
AI forecasting
AI collections agent
```

Those may eventually be powerful extensions, but they should not obstruct the core:

> **Get businesses closer to their money.**

---

# 69. Coding-Agent Operating Contract

A coding agent implementing any `KIV-FE-*` card **MUST**:

1. Read the referenced screen specification.
2. Read the relevant API contract.
3. Use generated OpenAPI types where available.
4. Use existing design-system components.
5. Use existing money utilities.
6. Use existing permission utilities.
7. Use existing entitlement utilities.
8. Implement loading state.
9. Implement empty state.
10. Implement error state.
11. Implement processing state for consequential mutations.
12. Implement responsive behavior.
13. Implement accessibility.
14. Invalidate affected queries after mutations.
15. Add appropriate tests.
16. Avoid financial calculations.
17. Avoid duplicating API/domain logic.
18. Never trust `orgId` from the URL alone.
19. Never treat frontend authorization as security.
20. Never invent backend state transitions.

---

# 70. Coding-Agent Freedom

The coding agent **may** decide:

* component decomposition
* hooks
* server/client component boundaries
* local state structure
* query library implementation details
* test file organization
* CSS composition using approved tokens
* implementation-level abstractions
* accessibility implementation details
* loading skeleton implementation

provided those decisions do not contradict the canonical product/design/architecture documents.

---

# 71. Coding-Agent Prohibitions

The coding agent **must not decide**:

```text
What screens exist
What the main navigation is
What a financial state means
What counts as paid
What counts as overdue
How invoice totals are calculated
How tax is calculated
How payments are allocated
Whether an invoice can be issued
Whether an invoice can be voided
Whether a user is authorized
Whether a feature is entitled
What constitutes successful payment
Whether a payment timeout means failure
Whether historical financial records can be edited
```

Those belong to the product/domain/backend authorities.

---

# 72. Definition of Done — Every Frontend Card

A card is not complete until:

### Functional

* [ ] Screen implemented
* [ ] Route implemented
* [ ] API integration complete
* [ ] Primary action works
* [ ] Secondary actions work
* [ ] Correct navigation
* [ ] Correct state transitions

### State

* [ ] Loading
* [ ] Empty
* [ ] Error
* [ ] Success
* [ ] Processing
* [ ] Permission denied
* [ ] Entitlement denied where applicable

### Financial

* [ ] No authoritative client-side calculation
* [ ] Money represented safely
* [ ] Backend values rendered as authoritative
* [ ] Financial mutations handle uncertain outcomes safely
* [ ] Query invalidation complete

### UX

* [ ] Desktop
* [ ] Mobile
* [ ] Keyboard
* [ ] Screen reader
* [ ] Focus management
* [ ] Design-system compliance

### Engineering

* [ ] Typecheck
* [ ] Lint
* [ ] Unit tests
* [ ] Integration tests where applicable
* [ ] E2E where workflow-critical
* [ ] OpenAPI contract synchronized
* [ ] No unnecessary duplication

---

# 73. The Frontend Golden Path

This becomes the **single most important implementation target**:

```text
NEW USER
   │
   ▼
Signup
   │
   ▼
Verify
   │
   ▼
Create Business
   │
   ▼
Dashboard
   │
   ▼
Create Customer
   │
   ▼
Create Invoice
   │
   ▼
Review
   │
   ▼
Issue
   │
   ▼
Public Invoice
   │
   ▼
Send
   │
   ▼
Customer Views
   │
   ▼
Due
   │
   ▼
Reminder
   │
   ▼
Payment
   │
   ▼
Verification
   │
   ▼
Allocation
   │
   ▼
Paid
   │
   ▼
Receipt
   │
   ▼
Dashboard
```

The UI should make that journey feel almost inevitable.

---

# 74. Final Architecture Principle

The frontend should progressively move the user through:

```text
WORK
 ↓
COMMERCIAL VALUE
 ↓
INVOICE
 ↓
MONEY OWED
 ↓
ACTION
 ↓
PAYMENT
 ↓
CASH
```

That means the most important Kivo frontend screens are **not** necessarily the screens with the most CRUD functionality.

The hierarchy is:

```text
                 CASH
                  ▲
                  │
              PAYMENT
                  ▲
                  │
             RECEIVABLE
                  ▲
                  │
               INVOICE
                  ▲
                  │
             CUSTOMER
                  ▲
                  │
                 WORK
```

This is the frontend manifestation of Kivo's product thesis.

The engineering backlog already frames Kivo's capabilities around Customer → Invoicing → Receivables → Payments → Collections → Communications → Subscription, rather than treating invoicing as the entire product. 

**The practical consequence is significant:** you no longer need to sit down and ask, *“What frontend should I build?”*

You should be able to ask:

> **“Which KIV-FE card is next in the dependency graph?”**

Then the Screen Specification tells you **what it looks like**, the API contract tells you **what data it consumes**, the architecture tells you **what it is allowed to do**, and this backlog tells you **what to implement next**.

That is the structure I would use to take Kivo from “I can code the frontend but don't know what to code” to an **agent-executable frontend production pipeline**.

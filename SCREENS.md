# Kivo MVP Screen Specification

**Status:** Screen contracts (supporting — canonical is `DESIGN.md` v2.1)  
**Version:** 1.1  
**Scope:** Customer application + public invoice/payment surfaces  
**Aligned to:** `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` verbatim + `KIVO_MVP2_ENGINEERING_BACKLOG.md §6/§7` + `DESIGN.md v2.1`  
**Updated:** 4 September 2026

---

## 1. Purpose

`SCREENS.md` defines the MVP screen inventory, hierarchy, routes, states, actions and responsive behavior.

It does not prescribe exact CSS values. Those belong in `DESIGN-TOKENS.md`.

---

# 2. Application Surface Map

```text
PUBLIC
├── /invoice/[token]
├── /invoice/[token]/payment
└── /invoice/[token]/payment/result

AUTHENTICATED
├── /onboarding
│   ├── /business
│   └── /complete
│
└── /app
    ├── /dashboard
    ├── /invoices
    │   ├── /new
    │   └── /[invoiceId]
    ├── /customers
    │   ├── /new
    │   └── /[customerId]
    ├── /payments
    ├── /receivables
    └── /settings
        ├── /business
        ├── /invoice
        ├── /payments
        ├── /communications
        └── /subscription
```

Exact route naming may adapt to the repository's routing conventions, but the information architecture should remain stable.

---

# 3. Application Shell

## Desktop

Conceptual structure:

```text
┌─────────────────────────────────────────────────────┐
│ Kivo                         Search   Help   User    │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│ Dashboard    │                                      │
│ Invoices     │             Page content             │
│ Customers    │                                      │
│ Receivables  │                                      │
│ Payments     │                                      │
│              │                                      │
│ Settings     │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

The shell should remain visually quiet. Product content owns the hierarchy.

## Mobile

Use a compact header and mobile navigation pattern.

Primary destinations must remain reachable without exposing desktop navigation density.

---

# 4. Authentication & Onboarding

## 4.1 Sign up

Purpose:

> Get a business into Kivo with minimal friction.

Required:

- name;
- email;
- password/authentication mechanism;
- verification where required.

Avoid collecting configuration that can be deferred.

## 4.2 Business setup

Capture the minimum business identity required to issue an invoice:

- business name;
- contact details;
- business address where required;
- invoice defaults where necessary.

## 4.3 Onboarding completion

The primary CTA should be:

> Create your first invoice

Secondary:

> Add a customer

Do not make onboarding feel like enterprise setup.

---

# 5. Dashboard

**Route:** `/app/dashboard`

## Purpose

Answer:

1. What am I owed?
2. What have I collected?
3. What is overdue?
4. What needs my attention?

## Primary hierarchy

```text
Financial position
↓
Attention required
↓
Recent activity
↓
Upcoming
```

## Core content

### Financial summary

- Total invoiced
- Total collected
- Total outstanding
- Total overdue

These should be clearly distinguished and not visually equalized into generic KPI cards.

### Attention

Show overdue invoices/customers with:

- customer;
- invoice;
- amount;
- days overdue;
- action.

Primary action:

> Remind

Secondary:

> Open invoice

### Recent invoices

Show recent invoice activity.

### Recent payments

Show recent confirmed payments.

### Upcoming

Show due-soon items.

## Empty state

The empty dashboard should lead directly to invoice creation.

## Loading

Preserve layout with skeletons.

## Mobile

Financial summary remains prominent. Attention list follows. Secondary activity can be progressively condensed.

---

# 6. Invoice List

**Route:** `/app/invoices`

## Purpose

Provide a searchable operational view of invoices.

## Columns / information

Desktop:

```text
Customer
Invoice #
Amount
Outstanding
Due
Status
Updated
Action
```

Status should distinguish:

- Draft;
- Issued;
- Void;
- Unpaid;
- Partially paid;
- Paid;
- Due soon;
- Due today;
- Overdue;
- Viewed/unviewed where useful.

Do not display all state dimensions as badges simultaneously. Use hierarchy.

## Actions

Contextual actions may include:

- Open;
- Send;
- Share;
- Download;
- Record payment;
- Remind;
- Void where permitted.

## Filters

MVP should support practical filters for:

- status;
- customer;
- date range;
- overdue.

Avoid building an advanced reporting filter system.

---

# 7. Create Invoice

**Route:** `/app/invoices/new`

## Primary objective

Create an invoice with the least friction possible.

## Quick mode

Fields:

```text
Customer
Description
Amount
Due date
```

Then:

> Review invoice

## Standard mode

Add:

- line items;
- quantity;
- unit price;
- discount where supported;
- tax where configured;
- payment instructions;
- terms;
- notes.

Advanced fields should be progressively disclosed.

## Draft behavior

- autosave or safe local draft persistence where appropriate;
- preserve fields after recoverable errors;
- warn before discarding unsaved changes.

## Calculation display

Show:

```text
Subtotal
Discount
Tax
Total
```

Server remains authoritative.

## CTA

> Review invoice

Not:

> Save invoice

The user is progressing toward an outcome, not managing records.

---

# 8. Invoice Review

**Route:** `/app/invoices/new/review`

## Purpose

Create confidence before issuance.

Show:

- seller;
- customer;
- invoice number preview if applicable;
- issue date;
- due date;
- line items;
- subtotal;
- tax;
- discount;
- total;
- payment instructions.

Primary action:

> Issue invoice

Secondary:

> Edit

Issuance should explicitly communicate that the invoice becomes an immutable issued financial document.

---

# 9. Invoice Detail

**Route:** `/app/invoices/[invoiceId]`

## Purpose

Make one invoice completely understandable.

## Header

Show:

- invoice number;
- customer;
- amount;
- outstanding amount;
- primary financial state;
- primary action.

## Financial summary

Example:

```text
₦2,400,000
₦1,000,000 paid
₦1,400,000 outstanding
```

## Lifecycle

Represent important events:

```text
Issued
Sent
Viewed
Due
Reminder
Payment
```

## Activity

Show material activity without exposing raw technical logs.

## Actions

Depending on state:

- Send;
- Share;
- Download PDF;
- Remind;
- Record payment;
- View public invoice;
- Void where allowed.

Actions that are no longer valid should disappear or become explicitly disabled with explanation.

---

# 10. Invoice Send / Share

This may be a modal, drawer or dedicated step.

## Send by email

Show:

- recipient;
- subject;
- message preview;
- invoice attachment/link.

Primary:

> Send invoice

## Share link

Show the secure public invoice URL with:

- copy;
- open;
- revoke/rotate if supported.

The user should understand whether the invoice was sent, merely shared, or both.

---

# 11. Customer List

**Route:** `/app/customers`

## Purpose

Manage the customer master record used by invoices.

Show:

- customer;
- contact;
- outstanding;
- invoices;
- last activity.

Primary CTA:

> Add customer

Search should be prominent.

Archive should be secondary.

---

# 12. Create Customer

**Route:** `/app/customers/new`

Minimum fields:

- name;
- email;
- phone;
- address where needed.

The form should be fast.

After creation, provide:

> Create invoice

as a contextual next action.

---

# 13. Customer Detail

**Route:** `/app/customers/[customerId]`

## Header

Show:

- customer identity;
- contact information;
- outstanding balance;
- invoice count.

## Primary financial view

```text
Outstanding
Overdue
Paid historically
```

## History

Show:

- invoices;
- payments;
- reminders;
- recent activity.

The screen should answer:

> What does this customer owe me?

before:

> What other information do I have about this customer?

---

# 14. Receivables

**Route:** `/app/receivables`

This is the strategic screen that differentiates Kivo from invoice generators.

## Purpose

Answer:

> Who owes me money, and what should I do?

## Primary sections

### Overdue

Highest priority.

### Due today

Immediate attention.

### Due soon

Upcoming attention.

### Outstanding

Broader view.

Each row should provide:

- customer;
- invoice;
- amount;
- due state;
- outstanding;
- next action.

Primary action:

> Remind

---

# 15. Payments

**Route:** `/app/payments`

## Purpose

Give the owner confidence about money received.

Show:

- date;
- customer;
- invoice;
- amount;
- payment method;
- status;
- reference.

## Payment states

Distinguish:

- pending;
- confirmed;
- failed where relevant to payment attempts.

Do not present an unverified provider attempt as confirmed cash.

---

# 16. Record Manual Payment

Entry point from invoice/customer/receivables.

Fields:

- amount;
- date;
- payment method;
- reference;
- note.

Show outstanding amount before entry.

After confirmation:

```text
Payment recorded
₦300,000 received
₦150,000 remaining
```

If the payment fully settles the invoice:

> Invoice paid

Do not allow allocation above the authoritative outstanding/payment constraints.

---

# 17. Receipt

Receipt is an evidence document.

After payment confirmation, show:

- amount;
- customer;
- invoice;
- date;
- reference;
- receipt number;
- download receipt.

Receipt generation may be asynchronous.

---

# 18. Reminder

Entry points:

- receivables;
- invoice detail;
- customer detail.

Show:

- customer;
- invoice;
- amount;
- due state;
- delivery channel;
- last reminder;
- proposed action.

MVP primary channel:

> Email

Primary CTA:

> Send reminder

---

# 19. Public Invoice

**Route:** `/invoice/[token]`

Public, no authentication.

Show:

- Kivo/seller branding;
- seller;
- buyer;
- invoice number;
- issue date;
- due date;
- line items;
- taxes/charges;
- total;
- current payment state;
- payment instructions;
- payment CTA when enabled.

The page should feel more like a premium payment document than an application screen.

Mobile-first.

---

# 20. Public Payment

**Route:** `/invoice/[token]/payment`

Purpose:

Allow the customer to initiate online payment when enabled.

Show:

- invoice identity;
- amount being paid;
- payment provider handoff;
- secure processing feedback.

Do not expose unnecessary Kivo account concepts.

---

# 21. Payment Result

**Route:** `/invoice/[token]/payment/result`

States:

### Confirmed

> Payment confirmed  
> ₦450,000 received

### Pending

> Payment is being confirmed.

### Failed

> Payment could not be confirmed.

The result must reflect trusted backend/payment-provider state rather than browser redirect alone.

---

# 22. Settings

MVP settings should remain focused.

## Business

- business identity;
- contact;
- address;
- invoice branding.

## Invoice

- numbering;
- default payment terms;
- default notes/payment instructions.

## Payments

- Paystack configuration/status where enabled.

## Communications

- sender details;
- basic reminder preferences.

## Subscription

- plan;
- usage;
- entitlement state.

Do not build a large settings centre for deferred features.

---

# 23. Cross-Screen State Rules

The same invoice should look and behave consistently wherever it appears.

Example:

If an invoice is:

```text
ISSUED
PARTIALLY_PAID
OVERDUE
VIEWED
```

those facts should remain consistent across:

- dashboard;
- invoices;
- receivables;
- customer;
- invoice detail.

The frontend should consume one authoritative representation rather than recomputing conflicting state independently.

---

# 24. Responsive Rules

Desktop prioritizes:

- scanning;
- side-by-side context;
- table density.

Mobile prioritizes:

- financial amount;
- status;
- next action;
- essential metadata.

A table may become:

```text
Customer
Amount
State
Due
[Action]
```

rather than shrinking every desktop column.

---

# 25. Project Screens — Skeleton (MVP2 KIVO_MVP2 §6.1/6.2 KIV-BE-121/140)

**Route:** /app/projects, /app/projects/new, /app/projects/[projectId]

**Source:** KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md §13–16 + KIVO_MVP2 §6.1 KIV-BE-121 Project no contract_value/budget/Expenses (cut RECON §2) — lightweight 
ame* (max 100), description?, customer_id* (Combobox trigram <200ms), currency NGN readonly + GET /projects/{id}/financial-summary Quoted/Invoiced/Collected/Outstanding.

**Skeleton (1 page):**
- /app/projects list Table Project | Customer | Status Badge PLANNING|ACTIVE|ON_HOLD|COMPLETED|CANCELLED | Financial Summary (Quoted/Invoiced) | Action + EmptyState No projects yet → Create project + Skeleton while isLoading.
- /app/projects/new RHF+Zod 
ame*, description, customer_id* → POST /projects IdempotentButton crypto.randomUUID() → 202.
- /app/projects/[projectId] Tabs Overview (financial_summary) | Quotes | Milestones | Invoices | Activity — one GET KIV-BE-190 (no waterfall), no Expenses tab.

No ssignee/Gantt/contract_value/budget fields. Team cut.

---

# 26. Quote Screens — Skeleton (MVP2 KIV-BE-141 KIV-FE-191)

**Route:** /app/quotes, /app/quotes/new, /app/quotes/[quoteId]

**Source:** KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md §17–20 + KIVO_MVP2 §6.3 KIV-BE-141 Quote DRAFT→SENT→ACCEPTED ConvertQuoteToInvoice quote_id.

**Skeleton (1 page):**
- /app/quotes list Quote | Customer | Project? | Status Badge DRAFT|SENT|ACCEPTED|REJECTED | Total | Action + EmptyState.
- /app/quotes/new mirrors invoices/new but project_id? optional → POST /quotes QTE-###### DRAFT.
- /app/quotes/[quoteId] Accepted shows primary Create Invoice → POST /quotes/{id}/convert-to-invoice Idempotency-Key 201 
ew Invoice DRAFT quote_id set; DRAFT hides it. Quote immutable after SENT.

---

# 27. Milestone Screens — Skeleton (MVP2 KIV-BE-140 KIV-FE-140)

**Route:** /app/projects/[projectId]/milestones, /app/projects/[projectId]/milestones/[milestoneId]

**Source:** KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md §21–24 + KIVO_MVP2 §6.2 KIV-BE-140 PENDING→IN_PROGRESS→COMPLETED → READY_TO_BILL + PrepareMilestoneInvoice multi-select.

**Skeleton (1 page):**
- Milestones list under Project Table Name | Sequence | Target Date | Status PENDING|IN_PROGRESS|COMPLETED | Derived READY_TO_BILL amber Badge | invoice_id + Badge + EmptyState.
- Complete POST /milestones/{id}/complete → COMPLETED READY_TO_BILL (never auto-creates Invoice) + Prepare Invoice multi-select checkbox → POST /milestones/:id/prepare-invoice Idempotency-Key milestone_ids[] 201 one Invoice Draft with 2 line items, project_id set.

Never auto-issue. CANCELLED excluded from future prepare.

---

# 28. NRS Compliance Screens — Skeleton (MVP2 KIV-BE-221 KIV-FE-192)

**Route:** /app/invoices/[invoiceId] NRS Panel + /app/compliance/nrs (Mature list)

**Source:** KIVO × NRS INTEGRATION SPECIFICATION.md + KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md §38–44, §66 + KIVO_MVP2 §6.4 KIV-BE-221 7-state NOT_REQUIRED/PENDING/SUBMITTED/VALIDATED/APPROVED/REJECTED/UNKNOWN.

**Skeleton (1 page):**
- Invoice Detail NRS Panel secondary to financial Badge ISSUED/PAID primary: APPROVED green IRN + QR + QR artifact CSID, PENDING amber spinner, REJECTED red 
eason + Verify CTA → POST /compliance/verify, UNKNOWN slate Verify first blocking resubmit. REJECTED never mutates Invoice totals (assert via row diff).
- Submit POST /invoices/{id}/compliance/submit Idempotency-Key (org,invoice_id) 202 PENDING→SUBMITTED; retry UNKNOWN → 409 NRS_STATUS_UNKNOWN_VERIFY_FIRST until Verify.

No Team field.

---

# 29. Screen-Level Quality Gate

Every screen must answer:

1. What is this page for?
2. What is the primary object?
3. What is the primary financial fact?
4. What is the primary action?
5. What happens if the data is empty?
6. What happens while loading?
7. What happens if the operation fails?
8. What happens on mobile?
9. What information is authoritative?
10. What action is impossible because of the object's current state?

If those questions cannot be answered, the screen is not ready for implementation.

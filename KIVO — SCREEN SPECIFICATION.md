# KIVO — SCREEN SPECIFICATION

**Document:** `SCREEN-SPECIFICATION.md`  
**Version:** 1.0  
**Status:** Canonical Screen-Level UX & Implementation Specification  
**Product:** Kivo  
**Market:** Nigeria-first  
**Primary Repository:** `kivo-mvp-fe`  
**Frontend:** Next.js App Router / TypeScript / Tailwind / shadcn/ui  
**Date:** 3 September 2026

---

# 0. PURPOSE

This document defines the screen-level user experience and interaction contract for Kivo.

It exists to eliminate ambiguity between:

```text
Product Requirements
        ↓
UX / Design System
        ↓
SCREEN-SPECIFICATION.md
        ↓
Frontend Backlog
        ↓
Implementation
```

A frontend engineer or coding agent MUST be able to implement a screen using this document without inventing:

- page structure;
- information hierarchy;
- primary actions;
- secondary actions;
- fields;
- navigation;
- state presentation;
- loading behavior;
- empty states;
- error states;
- permission behavior;
- entitlement behavior;
- responsive behavior;
- accessibility behavior.

This document does not replace:

- `Kivo_MVP_PRD_v1.0.md`
- `architecture.md`
- `domain-model.md`
- `DESIGN.md`
- `DESIGN-TOKENS.md`
- `COMPONENTS.md`
- `FRONTEND.md`
- `API_CONTRACTS.md`
- `Security.md`
- `STATE_MACHINES.md`

Those remain authoritative for their respective domains.

Where this document conflicts with a financial, security, tenancy, authorization, or domain invariant, the higher-level source wins.

---

# 1. PRODUCT UX MODEL

Kivo's UI is organized around the movement of commercial work into money.

```text
CUSTOMER
   ↓
PROJECT
   ↓
QUOTE
   ↓
MILESTONE
   ↓
INVOICE
   ↓
DELIVERY
   ↓
PAYMENT
   ↓
RECEIVABLE
   ↓
COLLECTION
   ↓
CASH
```

Not every organization will use every stage.

The shortest valid path remains:

```text
CUSTOMER
   ↓
INVOICE
   ↓
PAYMENT
```

The MVP PRD explicitly requires a user to be able to create a usable first invoice without completing advanced settings.

The UI therefore follows this principle:

> **Progressive commercial depth, not forced workflow.**

---

# 2. SCREEN INVENTORY

## 2.1 Public / unauthenticated

| ID | Screen | Route | Priority |
|---|---|---|---|
| PUB-001 | Public Invoice | `/invoice/[token]` | P0 |
| PUB-002 | Public Payment Processing | `/invoice/[token]/payment` | P0 |
| PUB-003 | Public Payment Result | `/invoice/[token]/payment/result` | P0 |
| AUTH-001 | Login | `/login` | P0 |
| AUTH-002 | Signup | `/signup` | P0 |
| AUTH-003 | Verify Account | `/verify` | P0 |
| AUTH-004 | Forgot Password | `/forgot-password` | P0 |
| AUTH-005 | Reset Password | `/reset-password` | P0 |
| INV-001 | Accept Invitation | `/invite/[token]` | P0 |

---

## 2.2 Authenticated application

| ID | Screen | Route | Priority |
|---|---|---|---|
| APP-001 | Dashboard | `/{orgId}/dashboard` | P0 |
| APP-002 | Onboarding | `/{orgId}/onboarding` | P0 |
| CUST-001 | Customer List | `/{orgId}/customers` | P0 |
| CUST-002 | Create Customer | `/{orgId}/customers/new` | P0 |
| CUST-003 | Customer Detail | `/{orgId}/customers/[customerId]` | P0 |
| CUST-004 | Edit Customer | `/{orgId}/customers/[customerId]/edit` | P0 |
| INV-001 | Invoice List | `/{orgId}/invoices` | P0 |
| INV-002 | Create Invoice | `/{orgId}/invoices/new` | P0 |
| INV-003 | Invoice Review | `/{orgId}/invoices/new/review` | P0 |
| INV-004 | Invoice Detail | `/{orgId}/invoices/[invoiceId]` | P0 |
| REC-001 | Receivables | `/{orgId}/receivables` | P0 |
| PAY-001 | Payment List | `/{orgId}/payments` | P0 |
| PAY-002 | Payment Detail | `/{orgId}/payments/[paymentId]` | P0 |
| PAY-003 | Record Payment | `/{orgId}/payments/new` | P0 |
| SET-001 | Settings | `/{orgId}/settings` | P0 |
| SET-002 | Business Profile | `/{orgId}/settings/business` | P0 |
| SET-003 | Invoice Settings | `/{orgId}/settings/invoice` | P0 |
| SET-004 | Payment Settings | `/{orgId}/settings/payments` | P0 |
| SET-005 | Communications Settings | `/{orgId}/settings/communications` | P0 |
| SET-006 | Subscription | `/{orgId}/settings/subscription` | P0 |

---

# 3. MVP2 EXTENSION SCREENS

The expanded MVP2 adds commercial-work and multi-user capabilities.

The existing MVP2 source explicitly adds Teams/Roles and identifies `KIV-FE-021..023` as the corresponding frontend work.

| ID | Screen | Route | Priority |
|---|---|---|---|
| TEAM-001 | Team Settings | `/{orgId}/settings/team` | P0 |
| TEAM-002 | Invite Member | `/{orgId}/settings/team/invite` | P0 |
| TEAM-003 | Accept Invitation | `/invite/[token]` | P0 |
| TEAM-004 | Member Management | `/{orgId}/settings/team/[memberId]` | P0 |
| PROJ-001 | Project List | `/{orgId}/projects` | P0 |
| PROJ-002 | Create Project | `/{orgId}/projects/new` | P0 |
| PROJ-003 | Project Detail | `/{orgId}/projects/[projectId]` | P0 |
| QUOTE-001 | Quote List | `/{orgId}/quotes` | P0 |
| QUOTE-002 | Create Quote | `/{orgId}/quotes/new` | P0 |
| QUOTE-003 | Quote Review | `/{orgId}/quotes/new/review` | P0 |
| QUOTE-004 | Quote Detail | `/{orgId}/quotes/[quoteId]` | P0 |
| NRS-001 | Compliance Status | Invoice Detail integration | P0 |

---

# 4. APPLICATION SHELL

Every authenticated application screen uses:

```text
┌──────────────────────────────────────────────────────────────┐
│ KIVO       Organization ▾       Search       + New       User │
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│ Dashboard      │                                             │
│                │              PAGE CONTENT                   │
│ Projects       │                                             │
│                │                                             │
│ Quotes         │                                             │
│ Customers      │                                             │
│                │                                             │
│ Invoices       │                                             │
│                │                                             │
│ Receivables    │                                             │
│ Payments       │                                             │
│                │                                             │
│ Settings       │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

## 4.1 Navigation groups

```text
HOME
  Dashboard

WORK
  Projects

SELL
  Quotes
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

Capabilities that are not enabled or entitled MUST NOT appear as active destinations.

The current design authority explicitly allows MVP navigation to expose only the capabilities available at launch and progressively expose mature capabilities later.

---

# 5. GLOBAL + NEW ACTION

The global creation menu is:

```text
+ New

Invoice
Customer
Payment

Project
Quote
```

Project and Quote appear only when enabled for the organization.

The creation menu is intentionally action-oriented.

Do not expose:

```text
Create Invoice Object
Create Customer Record
```

Use:

```text
Create invoice
Add customer
Record payment
```

---

# 6. APP-001 — DASHBOARD

## Route

```text
/{orgId}/dashboard
```

## Purpose

Answer immediately:

1. What have I invoiced?
2. What have I collected?
3. What am I owed?
4. What is overdue?
5. What requires action?

This directly follows the MVP dashboard requirements.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Good morning                                                 │
│ Here's what's happening with your business.                 │
│                                      [+ New Invoice]         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ INVOICED        COLLECTED       OUTSTANDING       OVERDUE    │
│ ₦8.4m           ₦5.8m           ₦2.6m             ₦850k      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ MONEY NEEDING ATTENTION                                       │
│                                                              │
│ Customer      Invoice       Due        Outstanding  Action  │
│ Acme Ltd      INV-0024      15 Sep     ₦450,000     Remind  │
│ XYZ Ltd       INV-0021      08 Sep     ₦400,000     Remind  │
│                                                              │
│                         View receivables →                   │
├──────────────────────────────────────────────────────────────┤
│ RECENT PAYMENTS                                              │
│                                                              │
│ Acme Ltd                         ₦500,000                    │
│ ABC Ltd                          ₦250,000                    │
├──────────────────────────────────────────────────────────────┤
│ RECENT INVOICES                                              │
│                                                              │
│ INV-0024  Acme Ltd             ₦850,000      Sent            │
│ INV-0023  XYZ Ltd              ₦400,000      Paid            │
└──────────────────────────────────────────────────────────────┘
```

## Primary CTA

```text
Create invoice
```

## Secondary CTAs

```text
View receivables
View invoices
View payments
```

## Empty state

```text
Your business starts here.

Create your first invoice and start tracking what you're owed.

[Create invoice]
```

## Loading

Use skeletons for metric cards and tables.

## Error

```text
We couldn't load your financial summary.

Your financial records have not been changed.

[Try again]
```

Do not display fabricated zero values when the financial query failed.

---

# 7. APP-002 — ONBOARDING

## Purpose

Get the organization from account creation to first usable invoice with minimal configuration.

The canonical onboarding flow is:

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



## Steps

```text
1. Business
2. Profile
3. Customer
4. Invoice
```

Do not require:

- advanced tax settings;
- payment configuration;
- communication configuration;
- subscription configuration

before the first invoice unless technically required.

---

# 8. AUTH-001 — LOGIN

## Layout

```text
KIVO

Welcome back.

Email
[                              ]

Password
[                              ]

[Log in]

Forgot password?

────────────────

Don't have an account?
Create account
```

## States

### Invalid credentials

```text
Email or password is incorrect.
```

Do not reveal which credential was incorrect.

### Suspended account

```text
Your account is currently unavailable.

Contact support if you believe this is an error.
```

---

# 9. AUTH-002 — SIGNUP

Fields:

```text
Full name
Email
Password
```

Primary:

```text
Create account
```

Secondary:

```text
Already have an account? Log in
```

Validation occurs client-side for usability and server-side authoritatively.

---

# 10. AUTH-003 — VERIFY

```text
Check your email.

We sent a verification link to:

user@example.com

[Open email]

Didn't receive it?
[Resend email]
```

Resend must expose cooldown/rate-limit behavior.

---

# 11. AUTH-004 — FORGOT PASSWORD

```text
Reset your password

Email
[                         ]

[Send reset link]
```

Success:

```text
If an account exists for that email, we've sent reset instructions.
```

Do not reveal account existence.

---

# 12. CUST-001 — CUSTOMER LIST

## Purpose

Provide a searchable customer master list with immediate financial context.

## Layout

```text
Customers

Customers you invoice and collect from.

[Search customers...]                 [+ Add customer]

────────────────────────────────────────────────────────

Customer              Contact            Outstanding

Acme Limited           john@acme.com     ₦1,500,000
ABC Consulting         jane@abc.com       ₦450,000
XYZ Limited            info@xyz.com       ₦0
```

## Row action

```text
View customer
```

Secondary:

```text
Create invoice
```

## Search

Search:

- company/name;
- primary email;
- phone.

This follows `CUST-004`.

## Empty

```text
No customers yet.

Add your first customer to start invoicing.

[Add customer]
```

## Filtered empty

```text
No customers match your search.

[Clear search]
```

---

# 13. CUST-002 — CREATE CUSTOMER

## Fields

### Required

```text
Customer / company name
Email or phone
```

### Optional

```text
Address
Tax identifier
Notes
```

The MVP customer requirements explicitly support these fields.

## Layout

```text
Add customer

Customer information

Name / Company
[                         ]

Email
[                         ]

Phone
[                         ]

Address
[                         ]

Tax identifier
[                         ]

Notes
[                         ]

                         [Cancel] [Save customer]
```

## Success

After creation:

```text
Customer created.
```

Then navigate to customer detail unless the customer was created inline from invoice creation.

---

# 14. CUST-003 — CUSTOMER DETAIL

## Header

```text
Acme Limited
john@acme.com

[Create invoice] [...]
```

## Financial summary

```text
Outstanding
₦1,500,000

Total collected
₦8,200,000

Invoices
12
```

## Sections

```text
Overview
Invoices
Payments
Activity
```

## Invoice table

```text
Invoice       Amount       Due          Status
INV-0024      ₦850,000     15 Sep       Outstanding
INV-0021      ₦650,000     01 Sep       Paid
```

## Payment history

Show:

- payment date;
- amount;
- invoice;
- method;
- reference.

Customer history MUST include invoices, payments, reminders and relevant communications.

---

# 15. CUST-004 — EDIT CUSTOMER

Same structure as create.

Important:

> Editing a customer MUST NOT rewrite historical invoice snapshots.

The UI should not imply that changing customer information changes already-issued invoices.

---

# 16. INV-001 — INVOICE LIST

## Layout

```text
Invoices

Invoices you've created and sent.

[Search invoices...] [Status ▾] [Customer ▾] [Date ▾]

                                               [+ New invoice]

──────────────────────────────────────────────────────────────

Invoice       Customer       Amount       Due       Status

INV-0024      Acme Ltd       ₦850,000     15 Sep    Outstanding
INV-0023      XYZ Ltd        ₦400,000     08 Sep    Paid
INV-0022      ABC Ltd        ₦250,000     01 Sep    Overdue
```

## Search

Support:

- invoice number;
- customer name.

## Status filters

```text
All
Draft
Issued
Paid
Partially paid
Overdue
Void
```

Document, payment, collection and view state remain conceptually separate even if the list presents a combined human-readable status.

The frontend MUST represent the underlying states separately.

---

# 17. INV-002 — CREATE INVOICE

## Route

```text
/{orgId}/invoices/new
```

## Purpose

Create an editable draft invoice.

## Layout

```text
Create invoice

Customer
[ Select customer                         ]

Invoice date
[ 03 Sep 2026 ]

Due date
[ 03 Oct 2026 ]

Currency
[ NGN ]

──────────────────────────────────────────────

Items

Description       Qty       Rate       Amount

Consulting        1         ₦500,000   ₦500,000
Development       2         ₦250,000   ₦500,000

[+ Add item]

──────────────────────────────────────────────

Discount
[ Configure ]

Tax
[ Configure ]

Additional charges
[ Configure ]

──────────────────────────────────────────────

Subtotal                         ₦1,000,000
Discount                              ₦0
Tax                                 ₦150,000
Charges                               ₦0

TOTAL                            ₦1,150,000

Notes
[                                        ]

Payment instructions
[                                        ]

Terms
[                                        ]

                 [Save draft] [Review invoice]
```

## Customer selection

Use `CustomerCombobox`.

Support:

```text
Search customer
Create new customer
```

If creating a customer inline, return to invoice form with the newly created customer selected.

## Line items

Use `LineItemsEditor`.

Each item:

```text
Description
Quantity
Unit price
Tax
```

## Totals

Use `TotalsPreview`.

The frontend may show previews but backend totals are authoritative.

The frontend MUST NOT treat JavaScript floating-point calculations as financial truth.

---

# 18. INV-003 — INVOICE REVIEW

## Purpose

Provide a final review before issuance.

```text
Review invoice

INV-DRAFT

Acme Limited

────────────────────────────────────────

Invoice date       03 Sep 2026
Due date           03 Oct 2026
Currency           NGN

────────────────────────────────────────

Consulting                         ₦500,000
Development                        ₦500,000

Subtotal                         ₦1,000,000
Tax                                ₦150,000

TOTAL                            ₦1,150,000

────────────────────────────────────────

This invoice will become an issued
financial document and cannot be edited
after issuance.

                    [Back] [Issue invoice]
```

## Issue confirmation

Before commitment:

```text
Issue invoice?

After issuance, the invoice details become
an immutable financial snapshot.

Invoice total
₦1,150,000

Customer
Acme Limited

[Cancel] [Issue invoice]
```

The invoice issuance operation creates the immutable snapshot and unique invoice number.

---

# 19. INV-004 — INVOICE DETAIL

This is one of Kivo's most important screens.

## Header

```text
← Invoices

INV-0024

Acme Limited

₦850,000

ISSUED · OUTSTANDING · DUE 15 SEP

[Send] [Record payment] [...]
```

## Primary financial block

```text
Invoice total
₦850,000

Paid
₦500,000

Outstanding
₦350,000
```

## State block

```text
Document
Issued

Payment
Partially paid

Collection
Due soon

View
Viewed
```

Never collapse these into one database-style status.

## Timeline

```text
Invoice created
       ↓
Invoice issued
       ↓
Invoice sent
       ↓
Invoice viewed
       ↓
Payment received
       ↓
Balance updated
```

## Sections

```text
Invoice
Customer
Payments
Activity
Delivery
Compliance
```

---

# 20. INVOICE ACTION MATRIX

Actions depend on authoritative state.

| State | Actions |
|---|---|
| Draft | Edit, Review, Delete |
| Issued unpaid | Send, Share, Record Payment, Void |
| Issued viewed | Send, Share, Record Payment, Void |
| Partially paid | Send, Share, Record Payment, Void |
| Paid | Download, Share |
| Overdue | Send Reminder, Share, Record Payment |
| Void | View, Duplicate |

Issued invoices MUST NOT expose normal editing.

---

# 21. INVOICE DELIVERY

The invoice detail page contains:

```text
Delivery

Email
Delivered

Public link
Available

Last sent
03 Sep 2026, 10:42
```

Failed:

```text
Email
Failed

We couldn't deliver this invoice.

[Try again]
```

The backend records communication/delivery state. A failed or bounced email MUST NOT be shown as delivered.

---

# 22. PUBLIC INVOICE — PUB-001

## Route

```text
/invoice/[token]
```

This page does not require login.

The public invoice should be deliberately simpler than the internal invoice page.

## Layout

```text
┌───────────────────────────────────────┐
│ KIVO                                  │
│                                       │
│ INVOICE                               │
│ INV-0024                              │
│                                       │
│ From                                  │
│ Acme Consulting Ltd                   │
│                                       │
│ Bill to                               │
│ XYZ Limited                           │
│                                       │
│ Issue date      03 Sep 2026            │
│ Due date        03 Oct 2026            │
│                                       │
│ ───────────────────────────────────   │
│                                       │
│ Consulting                ₦500,000    │
│ Development               ₦350,000    │
│                                       │
│ TOTAL                     ₦850,000    │
│                                       │
│ Outstanding               ₦850,000    │
│                                       │
│ [Pay invoice]                          │
│                                       │
│ Payment instructions                  │
│ ...                                   │
└───────────────────────────────────────┘
```

The public invoice requirements specify seller, buyer, invoice number, dates, line items, taxes/charges, total, payment state and payment action where enabled.

---

# 23. PUBLIC PAYMENT

The customer should not need to understand Kivo's payment infrastructure.

Show:

```text
Pay invoice

INV-0024
Acme Consulting Ltd

Amount due

₦850,000

[Pay ₦850,000]
```

Do not display:

```text
Create PaymentIntent
PSP transaction
Webhook
Provider reference
```

Those are infrastructure concepts.

---

# 24. PAYMENT RESULT

## Success

```text
Payment received

₦850,000

Invoice
INV-0024

Thank you.

A payment confirmation has been recorded.
```

However, the browser redirect alone MUST NOT be treated as proof of payment.

The frontend obtains authoritative state from the backend.

## Processing

```text
We're confirming your payment.

Please keep this page open.

[Check payment status]
```

## Failed

```text
Payment unsuccessful.

No payment has been recorded against this invoice.

[Try again]
```

---

# 25. REC-001 — RECEIVABLES

## Purpose

This is the financial command center.

```text
Receivables

Money currently owed to you.

──────────────────────────────────────────────

Outstanding
₦4,850,000

Overdue
₦1,200,000

Due soon
₦850,000

──────────────────────────────────────────────

[All] [Overdue] [Due soon] [Paid]

──────────────────────────────────────────────

Customer       Invoice       Due       Outstanding

Acme Ltd       INV-0024      15 Sep    ₦850,000
XYZ Ltd        INV-0021      08 Sep    ₦350,000
ABC Ltd        INV-0018      30 Sep    ₦500,000
```

## Primary actions

```text
Send reminder
View invoice
View customer
```

## Principle

Receivables is not merely a report.

It is:

> **A work queue for getting money collected.**

---

# 26. AGING PRESENTATION

MVP aging should remain simple.

```text
CURRENT
₦2,400,000

DUE SOON
₦850,000

OVERDUE 1–7 DAYS
₦700,000

OVERDUE 8–30 DAYS
₦500,000

OVERDUE 30+ DAYS
₦400,000
```

Do not introduce advanced forecasting or predictive collection scores in MVP.

---

# 27. REMINDER ACTION

When an invoice is eligible:

```text
Send reminder?

Acme Limited
INV-0024

Outstanding
₦850,000

Due
15 Sep 2026

[Cancel] [Send reminder]
```

Success:

```text
Reminder sent.

Acme Limited was sent a payment reminder.
```

The reminder state must also appear on the invoice activity timeline.

Automated reminder schedules are based on due-date-relative policies.

---

# 28. PAY-001 — PAYMENT LIST

```text
Payments

Payments received from customers.

[Search payments...] [Date ▾] [Method ▾]

                                  [Record payment]

──────────────────────────────────────────────

Date        Customer       Invoice       Amount

03 Sep      Acme Ltd       INV-0024      ₦500,000
01 Sep      XYZ Ltd        INV-0021      ₦350,000
```

---

# 29. PAY-002 — PAYMENT DETAIL

```text
Payment

₦500,000

Acme Limited

03 September 2026

────────────────────────────────────────

Method
Bank transfer

Reference
TRX-123456

Source
Manual

────────────────────────────────────────

Allocation

INV-0024
₦500,000

────────────────────────────────────────

Receipt

[View receipt]
[Download receipt]
```

Payment is an independent financial object and allocation is shown separately.

The MVP model explicitly separates Payment from PaymentAllocation.

---

# 30. PAY-003 — RECORD PAYMENT

```text
Record payment

Customer
[ Select customer ]

Invoice
[ Select invoice ]

Outstanding
₦850,000

Amount received
[ ₦500,000 ]

Payment date
[ 03 Sep 2026 ]

Payment method
[ Bank transfer ▾ ]

Reference
[ TRX-123456 ]

Notes
[                               ]

────────────────────────────────────

Invoice total
₦850,000

Previously paid
₦0

This payment
₦500,000

Remaining
₦350,000

                       [Cancel]
                       [Record payment]
```

## Partial payment

The UI explicitly shows the resulting balance.

## Full payment

```text
Remaining
₦0

Invoice will become paid.
```

## Overpayment

If supported:

```text
Payment amount exceeds invoice balance.

₦100,000 will remain unapplied.

[Cancel] [Record payment]
```

The system MUST never reduce an invoice below zero.

---

# 31. RECEIPT

After confirmed payment:

```text
Payment received

₦500,000

Receipt
RCT-00042

Acme Limited
INV-0024

[View receipt]
[Download]
[Send receipt]
```

A receipt references the payment and allocations and does not overwrite the underlying payment.

---

# 32. SETTINGS SHELL

Settings uses:

```text
Settings

Business
Invoice
Payments
Communications
Team
Subscription
```

Settings should not become a dumping ground.

Each section answers one configuration concern.

---

# 33. SET-002 — BUSINESS PROFILE

Fields:

```text
Legal/business name
Display name
Logo
Email
Phone
Address
Website
Tax identifier
Registration identifier
Default currency
Timezone
```

Invoice numbering prefix and payment instructions are also configurable at organization level.

---

# 34. SET-003 — INVOICE SETTINGS

```text
Invoice settings

Number prefix
[ INV ]

Default payment terms
[ 30 days ]

Default notes
[                         ]

Default payment instructions
[                         ]

Tax defaults
[ Configure ]
```

The page configures defaults only.

It must not imply that changing defaults modifies already-issued invoices.

---

# 35. SET-004 — PAYMENT SETTINGS

```text
Payments

Online payments
Paystack

Status
Enabled

[Configure]
```

Payment provider configuration should clearly distinguish:

```text
Enabled
Disabled
Unavailable
```

Do not expose provider implementation details.

---

# 36. SET-005 — COMMUNICATION SETTINGS

```text
Communications

Invoice email
Enabled

Payment receipt email
Enabled

Automatic reminders
Enabled

Reminder policy
Default
```

MVP reminder configuration should remain intentionally simple.

---

# 37. SET-006 — SUBSCRIPTION

```text
Your plan

PROFESSIONAL

₦7,500 / month

Next billing date
03 October 2026

──────────────────────────────

Usage

Invoices
24 / 100

Reminders
18 / 100

──────────────────────────────

[Manage plan]
```

The UI should present capabilities and usage, not expose the internal entitlement implementation.

Entitlements remain server-authoritative.

---

# 38. TEAM-001 — TEAM SETTINGS

MVP2 introduces:

```text
OWNER
ADMIN
MEMBER
```

The MVP2 backlog explicitly requires Team Settings to display team members, roles and invitation controls.

## Layout

```text
Team

Manage the people who have access to your business.

[Invite member]

────────────────────────────────────────────

MEMBERS

Name              Role       Status

Lewis             OWNER      Active
Jane              ADMIN      Active
David             MEMBER     Active

────────────────────────────────────────────

TEAMS

Finance           3 members
Operations        4 members
```

## Role badges

```text
OWNER
ADMIN
MEMBER
```

Do not rely solely on color.

---

# 39. TEAM-002 — INVITE MEMBER

```text
Invite member

Email
[                         ]

Role
[ Member ▾ ]

Team
[ Optional ▾ ]

────────────────────────────

[Cancel] [Send invitation]
```

Role options:

```text
ADMIN
MEMBER
```

OWNER MUST NOT be offered as an invitation role in MVP2.

## Existing invite

```text
An invitation is already pending for this email.

[Resend invitation]
```

## Rate limit

```text
You've sent too many invitations.

Try again in 42 seconds.
```

The MVP2 contract specifically requires handling `409 INVITE_ALREADY_PENDING` and `429 RATE_LIMITED`.

---

# 40. TEAM-003 — ACCEPT INVITATION

```text
You're invited to join

Acme Limited

You've been invited as:

MEMBER

Invitation expires in 23 hours.

[Accept invitation]

[Decline]
```

Expired:

```text
This invitation has expired.

Request a new invitation from the organization.
```

Invalid:

```text
This invitation is no longer valid.
```

The existing MVP2 contract specifies `401 INVALID_TOKEN` and `410 TOKEN_EXPIRED` handling.

---

# 41. TEAM-004 — MEMBER MANAGEMENT

```text
Jane Doe

ADMIN
Active

[Change role] [Remove access]
```

Changing role:

```text
Change role

Jane Doe

Current role
ADMIN

New role
[ MEMBER ▾ ]

[Cancel] [Change role]
```

Last owner:

```text
This owner cannot be removed or demoted.

Every organization must have at least one active owner.
```

The backend enforces the last-owner guard; the frontend presents the resulting error clearly.

---

# 42. PROJ-001 — PROJECT LIST

Projects are a commercial-work layer, not a project-management application.

```text
Projects

Track commercial work and its financial progress.

[Search projects...] [Status ▾]

                                      [+ New project]

────────────────────────────────────────────────────

Project            Customer       Status      Value

Website redesign   Acme Ltd       Active      ₦5m
Consulting         XYZ Ltd        Planning    ₦2m
```

Do not introduce:

- task boards;
- sprint planning;
- kanban;
- time tracking;
- resource scheduling

unless separately specified.

---

# 43. PROJ-002 — CREATE PROJECT

```text
Create project

Project name
[                         ]

Customer
[ Select customer ]

Description
[                         ]

Start date
[                         ]

Target completion
[                         ]

                         [Cancel] [Create project]
```

Optional commercial context may be added where supported.

---

# 44. PROJ-003 — PROJECT DETAIL

```text
Website redesign

Acme Limited
ACTIVE

[Create quote] [Create invoice] [...]

────────────────────────────────────────────

PROJECT VALUE

Quoted
₦5,000,000

Invoiced
₦3,500,000

Collected
₦2,000,000

Outstanding
₦1,500,000

────────────────────────────────────────────

OVERVIEW | QUOTES | MILESTONES | INVOICES | ACTIVITY
```

The four financial values are central to the project financial summary.

The project should always expose the next commercially useful action.

---

# 45. QUOTE-001 — QUOTE LIST

```text
Quotes

Commercial proposals sent to customers.

[Search...] [Status ▾] [Customer ▾]

                                      [+ New quote]

────────────────────────────────────────────

Quote      Customer      Amount       Status

Q-0012     Acme Ltd      ₦5m          Accepted
Q-0011     XYZ Ltd       ₦2m          Sent
Q-0010     ABC Ltd       ₦1m          Rejected
```

---

# 46. QUOTE-002 — CREATE QUOTE

Use a structure analogous to invoice creation:

```text
Customer
Project
Quote date
Expiry date

Items

Subtotal
Discount
Tax
Charges

Notes
Terms
```

The UI should clearly distinguish:

```text
QUOTE
```

from:

```text
INVOICE
```

A quote does not represent an amount currently owed.

---

# 47. QUOTE-003 — QUOTE REVIEW

```text
Review quote

Q-0012

Acme Limited

₦5,000,000

This is a commercial proposal.
It does not create a receivable.

[Back] [Send quote]
```

---

# 48. QUOTE-004 — QUOTE DETAIL

State-dependent actions:

### Draft

```text
Edit
Send
```

### Sent

```text
Resend
Mark accepted
Mark rejected
```

### Accepted

```text
Create invoice
```

### Rejected / Expired

```text
Duplicate
```

---

# 49. NRS / COMPLIANCE UI

Compliance is displayed as a **separate state dimension**.

Example:

```text
Invoice
PAID

Compliance
SUBMITTED
```

or:

```text
Invoice
PAID

Compliance
REJECTED

Reason
...
```

Never combine:

```text
PAID + NRS REJECTED
```

into one status.

The domain model explicitly separates financial/payment state from compliance state.

---

# 50. GLOBAL SEARCH

Search should eventually support:

```text
Invoices
Customers
Payments
Projects
Quotes
```

Results should be grouped:

```text
Search results

INVOICES
INV-0024   Acme Ltd      ₦850,000

CUSTOMERS
Acme Limited

PAYMENTS
RCT-0042   ₦500,000
```

Search should not expose records outside the current authorized organization.

---

# 51. GLOBAL ERROR MODEL

All screens use four primary states:

```text
Loading
Empty
Success
Error
```

Financial actions additionally use:

```text
Submitting
Processing
Confirmed
Failed
```

The frontend engineering specification explicitly requires these distinct states.

---

# 52. FINANCIAL MUTATION MODEL

For consequential commands:

```text
IDLE
 ↓
SUBMITTING
 ↓
PROCESSING
 ↓
AUTHORITATIVE RESULT
```

Never:

```text
click
 ↓
assume success
 ↓
show success toast
```

This is especially important for:

- issue invoice;
- record payment;
- allocate payment;
- initiate payment;
- send reminder.

The frontend specification explicitly warns that a timeout does not necessarily mean a financial command failed.

---

# 53. PERMISSION UX

Frontend permission checks are for presentation only.

Example:

```text
OWNER
  sees all permitted actions

ADMIN
  sees administrative actions available to ADMIN

MEMBER
  sees only permitted operations
```

If an action is hidden:

```text
normal
```

If a user attempts an unauthorized action through stale UI:

```text
You don't have permission to perform this action.
```

Backend authorization remains authoritative.

The current MVP2 role model gives OWNER full access, ADMIN broad operational access, and MEMBER narrower access.

---

# 54. ENTITLEMENT UX

Entitlement and authorization are different.

## Not entitled

```text
This feature isn't included in your plan.

[View plans]
```

## Not authorized

```text
You don't have permission to perform this action.
```

## Temporarily unavailable

```text
This feature is temporarily unavailable.

Try again later.
```

Do not incorrectly tell users to upgrade when the actual problem is authorization.

---

# 55. MOBILE SPECIFICATION

Mobile is not a compressed desktop UI.

The primary mobile destinations are:

```text
Home
Invoices
Receivables
Payments
More
```

This is consistent with the current design authority.

## Mobile invoice list

Transform table rows into cards:

```text
INV-0024

Acme Limited

₦850,000
Outstanding

Due 15 Sep

›
```

## Mobile invoice detail

Order:

```text
Amount
Status
Primary action
Customer
Invoice details
Payments
Activity
```

## Mobile invoice creation

Fields stack vertically.

The totals section remains visually persistent near the bottom.

Primary action may use a sticky bottom action bar:

```text
┌──────────────────────────────┐
│ ₦1,150,000          [Review] │
└──────────────────────────────┘
```

---

# 56. ACCESSIBILITY

Every screen MUST support:

- keyboard navigation;
- visible focus;
- semantic HTML;
- accessible labels;
- associated validation messages;
- sufficient touch target size;
- screen-reader-friendly status;
- non-colour state communication.

This is explicitly part of the frontend authority.

Financial state must never depend solely on color.

For example:

```text
OVERDUE
```

must be visible as text even if the badge is red.

---

# 57. CONTENT DESIGN

Kivo copy is:

```text
Concise
Direct
Confident
Human
Financially precise
Calm
```

Prefer:

```text
Send reminder
```

over:

```text
Take action
```

Prefer:

```text
Payment received
```

over:

```text
Transaction successful
```

Prefer:

```text
₦450,000 outstanding
```

over:

```text
Balance: 450000
```

---

# 58. DESTRUCTIVE ACTIONS

Destructive actions require confirmation.

Examples:

```text
Void invoice
Remove member
Archive customer
Archive project
Delete draft
```

Confirmation MUST identify:

1. object;
2. amount where applicable;
3. consequence;
4. reversibility.

Example:

```text
Void invoice?

INV-0024
₦850,000

Voiding this invoice will stop it from being
treated as an active receivable.

This cannot be undone.

[Cancel] [Void invoice]
```

---

# 59. TOAST POLICY

Toasts may communicate:

- successful non-financial actions;
- asynchronous completion;
- delivery results;
- minor errors.

They MUST NOT be the only representation of consequential financial outcomes.

For example:

Bad:

```text
Toast: Payment successful
```

Good:

```text
Toast: Payment recorded

Invoice detail:
₦500,000 paid
₦350,000 outstanding
```

The actual resource state must reflect the outcome.

---

# 60. COMPONENT CONTRACTS

The screen system should use these Kivo-specific components.

```text
KivoPage
KivoPageHeader
KivoMetricCard
KivoMoney
KivoMoneyCard
KivoStatusBadge
KivoInvoiceStatus
KivoPaymentStatus
KivoCollectionStatus
KivoComplianceStatus
KivoCustomerSummary
KivoInvoiceSummary
KivoReceivableSummary
KivoActivityTimeline
KivoPaymentTimeline
KivoEmptyState
KivoErrorState
KivoConfirmDialog
KivoCommandButton
KivoDataTable
KivoFilterBar
KivoSearch
KivoEntityCombobox
KivoLineItemsEditor
KivoTotalsPreview
KivoStickyActions
```

Generic shadcn components remain primitives.

Kivo components encode domain meaning.

---

# 61. DATA → UI MAPPING

## Invoice

```text
document_status
payment_status
collection_status
view_status
```

map to separate UI elements.

## Payment

```text
payment
allocations
receipt
```

are presented as separate concepts.

## Customer

```text
customer
invoices
payments
receivable balance
activity
```

combine into a customer financial picture.

## Dashboard

```text
authoritative financial aggregates
+
operational worklists
+
recent activity
```

Never calculate dashboard financial truth locally.

---

# 62. API → SCREEN MAPPING

## Dashboard

```text
GET /api/v1/dashboard/receivables
```

## Customers

```text
GET /customers
POST /customers
GET /customers/{id}
PATCH /customers/{id}
GET /customers/{id}/balance
```

## Invoices

```text
GET /invoices
POST /invoices
GET /invoices/{id}
PATCH /invoices/{id}
POST /invoices/{id}/issue
POST /invoices/{id}/void
POST /invoices/{id}/duplicate
```

## Payments

```text
GET /invoices/{id}/payments
POST /payments
POST /payments/{id}/allocations
```

## Receivables

```text
GET /dashboard/receivables
```

The MVP API surface explicitly defines these core resources and commands.

---

# 63. QUERY / COMMAND RULE

Screens consume:

```text
Queries
```

Commands execute:

```text
Mutations
```

Examples:

```text
getInvoices()
getInvoice()
getCustomer()
getReceivables()
getPayments()
```

Commands:

```text
createCustomer()
createInvoiceDraft()
updateInvoiceDraft()
issueInvoice()
sendInvoice()
recordManualPayment()
sendReminder()
voidInvoice()
```

This mirrors the current frontend engineering specification.

---

# 64. CACHE INVALIDATION

After:

```text
recordPayment()
```

refresh:

```text
Invoice
Receivables
Customer balance
Dashboard
Payment list
```

After:

```text
issueInvoice()
```

refresh:

```text
Invoice
Invoice list
Dashboard
Receivables
```

After:

```text
sendReminder()
```

refresh:

```text
Invoice activity
Receivables
Reminder state
```

The frontend must refetch authoritative financial state after consequential mutations.

---

# 65. SCREEN DESIGN RULE

Every screen MUST have:

```text
Purpose
Primary user
Entry points
Primary action
Secondary actions
Data required
Layout
States
Permissions
Entitlements
Responsive behavior
Accessibility
Acceptance criteria
```

A screen without a clear purpose should not exist.

---

# 66. SCREEN COMPOSITION RULE

Prefer:

```text
Page
 ├── PageHeader
 ├── Summary
 ├── MainContent
 ├── SecondaryContent
 └── Activity
```

over:

```text
Card
  Card
    Card
      Card
```

Not every section requires a card.

The Kivo design authority explicitly discourages putting every section inside a card.

---

# 67. SCREEN DENSITY RULE

Use high information density when the user is:

```text
Scanning invoices
Reviewing receivables
Reviewing payments
Comparing customers
```

Use lower density when the user is:

```text
Creating an invoice
Confirming payment
Performing destructive action
Completing onboarding
```

The design system's principle is:

> Complexity should produce simpler presentation, not more visual noise.

---

# 68. PRIMARY ACTION RULE

Every page has exactly one dominant primary action.

Examples:

```text
Customer list
→ Add customer

Invoice list
→ New invoice

Invoice detail
→ state-dependent financial action

Receivables
→ Send reminder

Payment list
→ Record payment

Project detail
→ next commercial action
```

Secondary actions belong in menus where appropriate.

---

# 69. FINANCIAL HIERARCHY

When displaying a financial object:

```text
1. Amount
2. Financial state
3. Customer
4. Due date
5. Primary action
6. Supporting metadata
```

Example:

```text
₦850,000

₦350,000 outstanding

Acme Limited

Due 15 Sep

[Record payment]
```

The UI should never make the user search for the financial outcome.

---

# 70. SCREEN IMPLEMENTATION PRIORITY

Implement in this order:

```text
PHASE 1 — FOUNDATION

1. Application shell
2. Authentication
3. Organization context
4. Design system primitives
5. Global states


PHASE 2 — GOLDEN PATH

6. Dashboard
7. Customer list
8. Create customer
9. Customer detail
10. Invoice list
11. Create invoice
12. Invoice review
13. Invoice detail
14. Public invoice


PHASE 3 — CASH

15. Receivables
16. Payment list
17. Record payment
18. Payment detail
19. Receipt
20. Reminders
21. Payment provider states


PHASE 4 — COMMERCIAL DEPTH

22. Projects
23. Project detail
24. Quotes
25. Quote detail
26. Quote → invoice


PHASE 5 — ORGANIZATION

27. Team
28. Invite
29. Accept invitation
30. Member management
31. Business settings
32. Invoice settings
33. Payment settings
34. Communications
35. Subscription


PHASE 6 — HARDENING

36. Responsive
37. Accessibility
38. Error recovery
39. Permission states
40. Entitlement states
41. E2E golden paths
42. Visual consistency
```

This follows the frontend implementation sequence already established in the frontend authority while incorporating the newer MVP2 capabilities.

---

# 71. GOLDEN PATH E2E

The primary acceptance journey is:

```text
Signup
 ↓
Verify
 ↓
Create organization
 ↓
Dashboard
 ↓
Create customer
 ↓
Create invoice
 ↓
Review
 ↓
Issue
 ↓
Public link generated
 ↓
Send
 ↓
Customer views
 ↓
Invoice appears outstanding
 ↓
Reminder
 ↓
Payment
 ↓
Payment allocated
 ↓
Invoice becomes paid
 ↓
Receipt
 ↓
Dashboard updates
```

This journey must work before visual polish is considered complete.

---

# 72. SECONDARY GOLDEN PATH

```text
Customer
 ↓
Project
 ↓
Quote
 ↓
Accept
 ↓
Create invoice
 ↓
Issue
 ↓
Send
 ↓
Payment
```

---

# 73. MULTI-USER GOLDEN PATH

```text
Owner
 ↓
Settings
 ↓
Team
 ↓
Invite member
 ↓
Email
 ↓
Accept invitation
 ↓
Membership ACTIVE
 ↓
Member enters organization
 ↓
Role-based UI
```

The MVP2 implementation explicitly defines this flow.

---

# 74. FRONTEND DEFINITION OF DONE

A screen is complete only when:

- [ ] Correct route exists.
- [ ] Correct API/query dependencies are implemented.
- [ ] Primary action works.
- [ ] Secondary actions work.
- [ ] Permission behavior is implemented.
- [ ] Entitlement behavior is implemented where relevant.
- [ ] Loading state exists.
- [ ] Empty state exists.
- [ ] Error state exists.
- [ ] Success state exists.
- [ ] Financial processing state exists where relevant.
- [ ] Mobile layout exists.
- [ ] Keyboard navigation works.
- [ ] Accessible labels exist.
- [ ] No authoritative financial calculation occurs in the browser.
- [ ] No client state is treated as authorization.
- [ ] Relevant queries are invalidated/refetched after mutations.
- [ ] Component patterns come from the Kivo design system.
- [ ] No ad-hoc colors/radii/typography are introduced.
- [ ] Tests exist.
- [ ] E2E coverage exists for critical workflows.

---

# 75. WHAT CODING AGENTS MUST NOT INVENT

Coding agents MUST NOT independently decide:

- new navigation categories;
- new financial states;
- new invoice statuses;
- new payment semantics;
- financial calculations;
- entitlement rules;
- authorization rules;
- new primary workflows;
- new mandatory onboarding steps;
- new financial actions;
- new visual language;
- new component patterns.

If implementation requires a decision not covered by this document, the agent should identify the ambiguity rather than silently inventing product behavior.

---

# 76. WHAT CODING AGENTS MAY DECIDE

Agents may decide implementation details such as:

- component extraction;
- hook structure;
- local state management;
- server/client component boundaries;
- internal TypeScript types;
- test organization;
- query caching mechanics;
- accessibility implementation details;
- CSS composition using established tokens;
- loading implementation using established patterns.

These decisions MUST preserve the screen contract.

---

# 77. DESIGN AUTHORITY

The visual authority remains:

```text
DESIGN.md
```

The current design system defines Kivo's implementation baseline as:

```text
Calm
Sharp
Financial
Modern
Nigerian
```

with financial clarity taking precedence over visual novelty.

Current baseline tokens include:

```text
Brand primary
#1E2A78

Inter
Primary UI typeface

4px
Base spacing grid

8px
Default component radius

12px
Card radius
```

as specified by the current design authority. 
Frontend implementation should consume these through the token layer rather than hard-coding values.

---

# 78. FINAL PRODUCT TEST

Before shipping a screen, ask:

### Financial clarity

> Can I understand the financial reality in under five seconds?

### Actionability

> Do I know what I should do next?

### Trust

> Is it obvious what has actually happened versus what is still processing?

### Simplicity

> Have we exposed only the complexity necessary for this task?

### Consistency

> Does this behave like the rest of Kivo?

### Mobile

> Can the important job be completed on a phone?

### Domain integrity

> Does the interface accurately reflect the backend's authoritative state?

### Product identity

> Does this feel like Kivo rather than a generic SaaS dashboard?

If the answer to any of these is no, the screen is not finished.

---

# 79. THE KIVO UX NORTH STAR

Every screen ultimately contributes to one experience:

```text
             KIVO
               │
               ▼
        SEE THE BUSINESS
               │
               ▼
        SEE THE MONEY
               │
               ▼
       SEE WHAT IS OWED
               │
               ▼
       KNOW WHAT TO DO
               │
               ▼
         GET PAID
               │
               ▼
      UNDERSTAND THE RESULT
```

The product should therefore never make the user feel like they are navigating a collection of database tables.

They should feel like they are operating their business's **commercial-to-cash system**.

> **Kivo turns work into invoices, invoices into receivables, receivables into collections, and collections into financial clarity.**

That is the experience the frontend must make visible.
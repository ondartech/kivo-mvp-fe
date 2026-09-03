# KIVO — DESIGN SYSTEM & PRODUCT UI AUTHORITY

**Document:** `DESIGN.md`  
**Version:** 2.1  
**Status:** Canonical UI implementation authority — *UI counterpart to `KIVO_MVP2_ENGINEERING_BACKLOG.md` (`RECONCILIATION.md`)*  
**Product:** Kivo  
**Market:** Nigeria-first, expansion-ready  
**Primary surface:** Customer web application + public invoice/payment experiences  
**Secondary surface:** Internal Kivo Operations application  
**Audience:** Product designers, UX designers, frontend engineers, design-system engineers, product managers, coding agents  
**Updated:** 4 September 2026  
**Aligned to:** `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` verbatim (Sep 2026) + `KIVO — PRODUCT & DOMAIN FOUNDATION.md` `v2.0` + `KIVO — MATURE SYSTEM PRODUCT REQUIREMENTS DOCUMENT.md` (31 Aug 2026) + `KIVO × NRS INTEGRATION SPECIFICATION.md` + `KIVO_MVP2_ENGINEERING_BACKLOG.md §6/§7`

---

# 0. PURPOSE AND AUTHORITY

`DESIGN.md` is the canonical visual and interaction contract for Kivo.

It exists so that a designer or coding agent can implement Kivo UI without inventing its own visual language, information architecture, state treatment, interaction pattern, or financial presentation.

This document defines:

- product design philosophy;
- brand personality in executable design terms;
- visual language;
- design tokens;
- layout and responsive rules;
- application shell;
- information architecture;
- route and screen contracts;
- financial state presentation;
- reusable component contracts;
- forms;
- tables;
- charts;
- notifications;
- loading, empty and error states;
- confirmation and destructive-action behavior;
- public invoice/payment experiences;
- mature-system UI patterns;
- AI and automation presentation;
- accessibility;
- content/copy rules;
- frontend implementation rules;
- review and acceptance criteria.

This document intentionally does **not** define:

- backend business logic;
- database schema;
- API implementation details;
- authentication implementation;
- payment-provider implementation;
- legal compliance claims.

Those are governed by `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md`, `KIVO_MVP2_ENGINEERING_BACKLOG.md`, the domain model and architecture.

However, this document does define how those authoritative system outcomes MUST appear in the UI.

> **UI counterpart note:** `KIVO_MVP2_ENGINEERING_BACKLOG.md` is the *engineering* source-of-truth (`RECONCILIATION.md §1–9`); this `DESIGN.md v2.1` is the *UI* source-of-truth. On presentation vs financial truth conflicts, `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` wins; on presentation vs engineering, this `DESIGN.md` wins.

---

# 1. SOURCE AUTHORITY AND PRECEDENCE

The design has been derived from the Kivo source set currently established for the project:

1. `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` — Updated PRD v2.0, Sep 2026 — **authoritative where it conflicts with the Original** (per `KIVO_MVP2_ENGINEERING_BACKLOG.md:10`)
2. `KIVO — PRODUCT & DOMAIN FOUNDATION.md` v2.0 (31 Aug 2026)
3. `KIVO — MATURE SYSTEM PRODUCT REQUIREMENTS DOCUMENT.md` — latest mature target, 31 August 2026 — *stays in per your keep*
4. `KIVO × NRS INTEGRATION SPECIFICATION.md` + `prd/nrs.md` — NRS compliance, explicitly included
5. `KIVO_MVP2_ENGINEERING_BACKLOG.md` §6/§7 (`RECONCILIATION.md §1–9`; traceability migrates once `architecture.md` is written via `KIV-BE-001`)
6. `architecture.md` v2.1 (financial/tenant/idempotency invariants)
7. `domain-model.md` v2.1
8. existing `UX.md` v1.1 (now supporting)
9. existing `SCREENS.md` v1.1 (now supporting)
10. existing `DESIGN-TOKENS.md` v1.1 (now supporting)
11. existing `FRONTEND.md` v1.1 (now supporting)
12. existing `AGENTS.md`

Historical `Kivo_MVP_PRD_v1.0.md` is retained as *historical rationale per `RECONCILIATION.md §2`* — not in precedence. The Updated PRD + `KIVO_MVP2` jointly define MVP2 scope: `Project` no `contract_value/budget`, `ProjectExpenses` cut, `Team` cut (`Membership+Role` covers), `Reporting` folded into Dashboard.

The latest mature PRD establishes the target product model. The Updated PRD establishes the smallest launchable user journey (`RECONCILIATION §2`).

When sources conflict:

```text
Security / financial authority
        ↓
KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md (Updated PRD v2.0)
        ↓
KIVO — MATURE SYSTEM PRODUCT REQUIREMENTS DOCUMENT.md (target)
        ↓
KIVO_MVP2_ENGINEERING_BACKLOG.md §6/§7 (engineering source-of-truth)
        ↓
This DESIGN.md v2.1 (UI source-of-truth)
        ↓
Architecture / domain invariants (once seeded via KIV-BE-001)
        ↓
UX behavior (supporting)
        ↓
Design system (supporting)
        ↓
Screen-level design (supporting)
        ↓
Cosmetic preference
```

A design decision MUST NOT weaken a financial, authorization, tenant-isolation, immutability, idempotency or compliance invariant.

Where this document makes an implementation-oriented visual decision that the older design documents left open, that decision is explicitly marked:

> **Implementation baseline**

This resolves cosmetic ambiguity so coding agents do not need external clarification. Because the design system is tokenized, the visual baseline can later be changed centrally without redesigning the product architecture.

---

# 2. KIVO DESIGN THESIS

Kivo is not an invoice generator.

The invoice is the acquisition wedge. The receivable is the core business object. Payment is the outcome. Customer financial history becomes the long-term asset.

The core product journey evolves from:

```text
Customer
    ↓
Invoice
    ↓
Sent
    ↓
Viewed
    ↓
Due
    ↓
Reminder
    ↓
Payment
    ↓
Receipt
    ↓
Receivable clarity
```

to the mature commercial-to-cash model:

```text
Customer
    ↓
Project
    ↓
Quote
    ↓
Milestone
    ↓
Invoice
    ↓
NRS / Compliance
    ↓
Delivery
    ↓
Payment
    ↓
Receivable
    ↓
Reconciliation
    ↓
Cash Position
    ↓
Financial Intelligence
```

The design consequence is fundamental:

> **Kivo is organized around the movement and state of money, not around document generation.**

Every important authenticated surface should help the business answer:

> **What is happening with my money?**

and:

> **What should I do next?**

The product promise remains:

> **Invoice customers. Track what you're owed. Get paid.**

The mature product expands this to:

> **Understand the work, money owed, money collected and the financial outcome of the work.**

---

# 3. BRAND TERRITORY

Kivo's visual territory is informed by:

| Reference | Learn from it |
|---|---|
| Kuda Business | local-market familiarity, accessibility, approachable financial UX |
| Stripe | precision, trust, hierarchy, restraint, infrastructure-grade credibility |
| N26 | calm premium financial UX, whitespace, disciplined presentation of money |

These are references only.

Kivo MUST NOT look like a combination of these brands.

Kivo's own territory is:

> **Receivables clarity + financial control + Nigerian business reality + premium product quality.**

Kivo should feel:

> **Calm. Sharp. Financial. Modern. Nigerian.**

---

# 4. BRAND PERSONALITY → DESIGN RULES

## 4.1 Calm

Calm means:

- low visual noise;
- predictable layouts;
- quiet borders;
- limited visual competition;
- clear state hierarchy;
- confident copy;
- enough whitespace for comprehension;
- deliberate motion.

Calm does not mean sparse for its own sake.

Dense operational information is acceptable when the information is genuinely needed.

### Do

- one clear primary action;
- strong hierarchy;
- restrained surfaces;
- obvious state;
- predictable placement.

### Do not

- animate every transition;
- use decorative blobs;
- put every section in a card;
- add charts because a page feels empty.

---

## 4.2 Sharp

Sharp means:

- exact typography;
- strong alignment;
- intentional spacing;
- consistent states;
- concise labels;
- crisp focus states;
- no ambiguous actions.

### Do

> `Remind customer`

### Do not

> `Take action`

---

## 4.3 Financial

Financial means:

- money is prominent;
- values are formatted consistently;
- state is explicit;
- consequential actions are unambiguous;
- payment outcomes are trustworthy;
- historical financial facts are visually distinguishable from suggestions.

A user must never have to infer whether:

- money was received;
- a payment is pending;
- an invoice is overdue;
- a message was sent;
- a document is issued.

---

## 4.4 Modern

Modern means:

- responsive;
- accessible;
- technically refined;
- information-dense where useful;
- uncluttered;
- subtle motion;
- good typography.

Modern does not mean:

- glassmorphism;
- excessive gradients;
- oversized pills;
- ornamental 3D;
- novelty animation.

---

## 4.5 Nigerian

Nigeria-native design is expressed through product reality:

- NGN as a first-class currency;
- bank transfer behavior;
- local phone number formats;
- WhatsApp and email;
- mobile-first usage;
- practical payment instructions;
- invoice/PDF sharing;
- small-business workflows.

Do not express Nigeria through stereotypes.

Do not use:

- flags as decoration;
- excessive green merely because finance + Nigeria;
- generic African patterns;
- culturally decorative imagery with no product purpose.

The principle is:

> **Nigeria-native, globally credible.**

---

# 5. DESIGN PRINCIPLES

## P-01 — Financial clarity over visual novelty

When visual beauty and financial clarity conflict, financial clarity wins.

## P-02 — Money is information, not decoration

Amounts deserve first-class hierarchy.

## P-03 — Action over reporting

Kivo should tell users what happened and make the next useful action obvious.

## P-04 — Calm over complexity

Complex financial behavior should produce simpler presentation, not more visual noise.

## P-05 — Precision builds trust

Dates, amounts, statuses, spacing, alignment and wording must be consistent.

## P-06 — Progressive disclosure

Expose the minimum necessary for the current task. Reveal advanced controls when needed.

## P-07 — The system state is authoritative

The UI displays server-authoritative state. It does not create financial truth.

## P-08 — Consequences should be visible before commitment

For consequential actions, show:

- object;
- amount;
- effect;
- final state;
- reversibility.

## P-09 — Empty is a state

Empty screens should explain the current condition and give the next useful action.

## P-10 — Error recovery is part of the product

Every error should answer:

1. What happened?
2. What does it mean?
3. What can I do now?

## P-11 — Mobile is a primary context

Do not design desktop first and merely shrink it.

## P-12 — Reuse patterns, not screenshots

New screens should reuse design-system behavior rather than copying page-specific styling.

## P-13 — Complexity must be earned

Do not expose mature-system complexity in MVP merely because the backend can support it.

## P-14 — Local insight, global quality

Kivo should feel built for Nigeria without feeling geographically limited.

## P-15 — AI is assistance, not authority

AI-generated information must never be visually indistinguishable from authoritative financial facts.

---

# 6. DESIGN DECISION HIERARCHY

When two design solutions are both acceptable, rank them:

1. financial clarity;
2. user comprehension;
3. trust;
4. actionability;
5. consistency;
6. accessibility;
7. performance;
8. visual refinement.

The design question is:

> **Does this make the financial reality obvious, the next action clear, and the experience unmistakably Kivo?**

---

# 7. VISUAL SYSTEM

# 7.1 Overall visual character

The default visual character is:

- neutral-led;
- warm but professional;
- high legibility;
- restrained accent use;
- subtle borders;
- low shadow usage;
- moderate corner radius;
- strong typography;
- generous but not wasteful spacing.

The interface should feel premium because it is precise, not because it is flashy.

---

# 7.2 Color strategy

## Brand color — implementation baseline

The existing source design left brand colour as exploratory. For coding purposes, the implementation baseline is:

```text
Brand primary:        #1E2A78
Brand primary hover:  #17205E
Brand primary active: #111A4D
Brand light:          #EEF0FF
```

Rationale:

- distinct from generic fintech green;
- trustworthy;
- suitable for business software;
- strong on light surfaces;
- works with financial semantic colours;
- recognizably Kivo when used consistently.

These values MUST be implemented through tokens, never hard-coded in components.

If a future brand decision changes them, only the token layer should need modification.

---

# 7.3 Neutral palette

Implementation baseline:

```text
neutral.0    #FFFFFF
neutral.25   #FCFCFD
neutral.50   #F8F9FB
neutral.100  #F1F3F5
neutral.200  #E5E7EB
neutral.300  #D1D5DB
neutral.400  #9CA3AF
neutral.500  #6B7280
neutral.600  #4B5563
neutral.700  #374151
neutral.800  #1F2937
neutral.900  #111827
neutral.950  #0B1020
```

Use neutral surfaces as the primary visual environment.

---

# 7.4 Semantic colors

Implementation baseline:

```text
Success:
  text:       #166534
  background: #ECFDF3
  border:     #BBF7D0
  icon:       #15803D

Warning:
  text:       #92400E
  background: #FFFBEB
  border:     #FDE68A
  icon:       #D97706

Critical:
  text:       #991B1B
  background: #FEF2F2
  border:     #FECACA
  icon:       #DC2626

Info:
  text:       #1E40AF
  background: #EFF6FF
  border:     #BFDBFE
  icon:       #2563EB

Processing:
  text:       #4338CA
  background: #EEF2FF
  border:     #C7D2FE
  icon:       #4F46E5
```

Do not use semantic colors for decorative purposes.

---

# 7.5 Financial semantic colors

| Financial state | Semantic treatment |
|---|---|
| Paid / Collected | Success |
| Partially paid | Info |
| Due soon | Warning |
| Due today | Warning |
| Overdue | Critical |
| Pending | Processing |
| Failed | Critical |
| Refunded | Neutral + explanatory text |
| Reversed | Critical/neutral depending on context |
| Draft | Neutral |
| Issued | Brand/info |
| Viewed | Info |
| Unviewed | Neutral |

Colour is never the sole carrier of meaning.

---

# 8. TYPOGRAPHY

## 8.1 Font family

Implementation baseline:

```text
Primary UI: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Monospace:   "JetBrains Mono", "SFMono-Regular", Consolas, monospace
```

The final brand typeface can replace the primary family through the token layer.

Requirements:

- excellent rendering of NGN;
- high readability;
- tabular numeral support;
- clear distinction between headings and body;
- good web and PDF performance.

---

# 8.2 Type scale

Use the following baseline:

| Token | Size | Line height | Weight |
|---|---:|---:|---:|
| text-xs | 12px | 16px | 400–500 |
| text-sm | 14px | 20px | 400–500 |
| text-md | 16px | 24px | 400–500 |
| text-lg | 18px | 28px | 500–600 |
| text-xl | 20px | 28px | 600 |
| text-2xl | 24px | 32px | 600 |
| text-3xl | 30px | 36px | 600 |
| text-4xl | 36px | 44px | 600 |
| text-5xl | 48px | 56px | 600 |

Do not use large display typography for normal application pages unless the number itself is the primary information.

---

# 8.3 Numerical typography

Money is first-class UI information.

Requirements:

- use tabular numerals where alignment benefits comparison;
- use consistent decimal behavior;
- keep currency explicit in detailed views;
- use abbreviated amounts only when precision is not required.

Examples:

```text
₦450,000
₦2.4m
₦12.4m
```

Detailed records:

```text
₦2,450,000.00
```

Do not display:

```text
2450000
```

for human-facing financial records.

---

# 8.4 Number alignment

In tables:

- numeric columns are right-aligned;
- labels are left-aligned;
- dates may be left or right depending on density;
- amounts use tabular figures;
- currency symbol and amount should not visually drift between rows.

---

# 9. SPACING

Use a 4px base grid.

```text
space-0   0
space-1   4px
space-2   8px
space-3   12px
space-4   16px
space-5   20px
space-6   24px
space-8   32px
space-10  40px
space-12  48px
space-16  64px
space-20  80px
space-24  96px
space-32  128px
```

Rules:

- 8px–24px for component spacing;
- 24px–48px for section spacing;
- 32px–64px for page-level separation;
- avoid arbitrary one-off values.

Dense operational tables may use 12px–16px row rhythm.

---

# 10. RADIUS

Implementation baseline:

```text
radius-none  0
radius-sm    6px
radius-md    8px
radius-lg    12px
radius-xl    16px
radius-2xl   20px
radius-full  9999px
```

Default:

- inputs/buttons: `radius-md`;
- cards: `radius-lg`;
- modals/drawers: `radius-xl`;
- pills: `radius-full`.

Do not make the entire application pill-shaped.

---

# 11. BORDERS AND ELEVATION

## Borders

Default border:

```text
1px solid neutral.200
```

Strong border:

```text
1px solid neutral.300
```

Focus:

```text
2px solid brand.primary
```

## Shadows

Use only three levels:

```text
shadow-none
shadow-subtle
shadow-overlay
```

Default cards should NOT require a shadow.

Use elevation mainly for:

- dropdowns;
- dialogs;
- command surfaces;
- sticky action surfaces;
- mobile bottom sheets.

---

# 12. ICONOGRAPHY

Use one icon family consistently.

Implementation baseline:

> **Lucide icons**

Rules:

- 16px for dense metadata;
- 18px default;
- 20px for navigation/actions;
- 24px for prominent empty states;
- 32px+ only for major state illustrations.

Icons support meaning. They do not replace labels for consequential actions.

Do not decorate every table row with an icon.

---

# 13. IMAGERY AND ILLUSTRATION

Product UI should be primarily interface-led.

Use photography/illustration only for:

- marketing;
- onboarding moments where it adds warmth;
- important empty states where a simple illustration improves comprehension.

Avoid stock imagery inside operational financial screens.

Do not use generic “African business” stock imagery as a localization shortcut.

---

# 14. MOTION

Motion exists to communicate:

- state;
- hierarchy;
- feedback;
- processing;
- transition.

Implementation baseline:

```text
instant: 0ms
fast:    120ms
normal:  180ms
slow:    240ms
```

Use standard ease-out for entrances and state changes.

Avoid:

- page-wide slide animations;
- bouncy finance UI;
- decorative number counting;
- forced delays before actions complete.

Respect:

```text
prefers-reduced-motion: reduce
```

---

# 15. LAYOUT SYSTEM

## 15.1 Application content width

Desktop:

```text
max-width: 1440px
```

Standard content:

```text
max-width: 1200px
```

Narrow workflow:

```text
max-width: 880px
```

Document/public invoice:

```text
max-width: 760px
```

---

## 15.2 Desktop shell

```text
┌─────────────────────────────────────────────────────────────────┐
│ KIVO HEADER                                           User menu │
├───────────────┬─────────────────────────────────────────────────┤
│               │                                                 │
│ Main nav      │              Page content                       │
│               │                                                 │
│ Dashboard     │                                                 │
│ Customers     │                                                 │
│ Projects      │                                                 │
│ Quotes        │                                                 │
│ Invoices      │                                                 │
│ Receivables   │                                                 │
│ Collections   │                                                 │
│ Payments      │                                                 │
│ Reconciliation│                                                 │
│ Reports       │                                                 │
│               │                                                 │
│ Settings      │                                                 │
└───────────────┴─────────────────────────────────────────────────┘
```

MVP may expose only:

```text
Dashboard
Invoices
Customers
Receivables
Payments
Settings
```

Mature navigation progressively exposes:

```text
Projects
Quotes
Collections
Reconciliation
Reports
```

Only entitled capabilities appear as active navigation.

---

# 16. APPLICATION SHELL

## 16.1 Header

Desktop header contains:

- Kivo wordmark;
- optional organization/entity switcher;
- contextual search;
- help/support;
- notifications where implemented;
- user menu.

The header remains visually quiet.

---

## 16.2 Sidebar

Desktop:

- width: 240px;
- collapsed mode: 72px;
- sticky within viewport;
- subtle separator;
- no excessive active-state decoration.

Active navigation uses:

- text weight;
- brand-tinted surface;
- brand-colored indicator/icon.

Do not use large coloured blocks.

---

## 16.3 Mobile shell

Mobile header:

- Kivo mark;
- page title or context;
- primary contextual action where required;
- menu/search trigger.

Primary mobile navigation should use a bottom navigation or compact navigation surface for top-level destinations.

Recommended top-level mobile destinations:

```text
Home
Invoices
Receivables
Payments
More
```

The `More` surface contains lower-frequency sections.

---

# 17. INFORMATION ARCHITECTURE

## MVP

```text
/app
├── dashboard
├── invoices
│   ├── new
│   ├── new/review
│   └── [invoiceId]
├── customers
│   ├── new
│   └── [customerId]
├── receivables
├── payments
└── settings
    ├── business
    ├── invoice
    ├── payments
    ├── communications
    └── subscription
```

Public:

```text
/invoice/[token]
/invoice/[token]/payment
/invoice/[token]/payment/result
```

---

# 18. MATURE INFORMATION ARCHITECTURE

```text
/app
├── dashboard
├── projects
│   ├── new
│   └── [projectId]
│       ├── overview
│       ├── milestones
│       ├── expenses
│       └── invoices
├── quotes
│   ├── new
│   └── [quoteId]
├── invoices
│   ├── new
│   └── [invoiceId]
├── customers
│   ├── new
│   └── [customerId]
├── receivables
├── collections
├── payments
├── reconciliation
├── reports
│   ├── receivables
│   ├── collections
│   ├── customers
│   ├── cash-flow
│   └── projects
├── compliance
│   └── nrs
├── team
├── integrations
├── developer
└── settings
    ├── business
    ├── entities
    ├── invoice
    ├── payments
    ├── collections
    ├── communications
    ├── tax
    ├── compliance
    ├── subscription
    └── security
```

Do not expose every mature route in MVP.

---

# 19. GLOBAL PAGE TEMPLATE

Every authenticated page should follow:

```text
Breadcrumb/context (optional)
↓
Page title
Supporting description (only if useful)
Primary action
↓
Primary content
↓
Secondary content
```

A page should NOT begin with:

- five decorative KPI cards;
- a giant banner;
- unnecessary hero art.

---

# 20. PAGE HEADER

A standard page header contains:

```text
Title
Optional description
Optional contextual state
Primary action
Secondary actions
```

Example:

```text
Invoices
Create and manage invoices, track delivery and payment.

[Create invoice]
```

For an object detail page:

```text
Invoice INV-00482
Acme Limited

₦2,450,000
₦1,450,000 outstanding

[Remind customer] [More]
```

The primary financial fact should be visible without scrolling.

---

# 21. DASHBOARD

**Route:** `/app/dashboard`

## Purpose

Answer:

1. What am I owed?
2. What have I collected?
3. What is overdue?
4. What needs my attention?
5. What changed recently?

## Hierarchy

```text
Financial position
↓
Attention
↓
Recent activity
↓
Upcoming
```

## Financial summary

Use four values:

```text
Total invoiced
Total collected
Total outstanding
Total overdue
```

Do not render all four as identical generic cards.

Recommended layout:

```text
┌───────────────────────────────────────────────┐
│ Financial position                            │
│                                               │
│ Outstanding     Collected     Overdue         │
│ ₦12.4m          ₦28.7m        ₦4.2m           │
└───────────────────────────────────────────────┘
```

Total invoiced may appear as supporting context.

## Attention section

Highest priority first.

Row:

```text
Acme Ltd.
INV-00482
₦1,450,000 outstanding
12 days overdue
[Remind]
```

## Recent activity

Show:

- invoice issued;
- invoice sent;
- invoice viewed;
- payment received;
- reminder sent.

Do not expose raw technical events.

## Empty dashboard

```text
No invoices yet

Create your first invoice to start tracking what you're owed.

[Create invoice]
```

## Mobile

Priority order:

1. outstanding;
2. overdue;
3. next action;
4. recent activity;
5. upcoming.

---

# 22. CUSTOMER LIST

**Route:** `/app/customers`

## Purpose

Manage the customer master.

## Toolbar

```text
Customers
[Search customers] [Add customer]
```

Filters may include:

- active/archived;
- has outstanding;
- overdue.

## Table

Desktop:

```text
Customer | Contact | Outstanding | Invoices | Last activity | Action
```

Mobile:

```text
Customer
₦X outstanding
3 invoices · Last activity
[Open]
```

## Empty

```text
No customers yet

Add your first customer to create an invoice.

[Add customer]
```

---

# 23. CREATE CUSTOMER

**Route:** `/app/customers/new`

Minimum:

- name/company name;
- email;
- phone;
- address where needed.

Optional:

- tax ID;
- notes.

Primary action:

> Create customer

Success should immediately offer:

> Create invoice

Do not trap the user on a generic success page.

---

# 24. CUSTOMER DETAIL

**Route:** `/app/customers/[customerId]`

## Header

Show:

- customer name;
- primary contact;
- outstanding;
- overdue;
- invoice count.

Primary question:

> What does this customer owe me?

## Financial summary

```text
Outstanding
Overdue
Paid historically
```

## Tabs

```text
Overview
Invoices
Payments
Activity
```

Mature:

```text
Overview
Projects
Invoices
Payments
Collections
Activity
```

## Customer action menu

Possible:

- Create invoice;
- send reminder;
- edit;
- archive;
- export statement in mature system.

---

# 25. RECEIVABLES

**Route:** `/app/receivables`

This is a strategic Kivo screen.

## Purpose

> **Who owes me money, and what should I do?**

## Primary hierarchy

```text
Overdue
Due today
Due soon
Outstanding
```

## Row

```text
Customer
Invoice
Outstanding
Due state
Days
Next action
```

Example:

```text
Acme Ltd.    INV-00482
₦1,450,000 outstanding
12 days overdue
[Remind]
```

## Filters

MVP:

- overdue;
- due today;
- due soon;
- customer;
- date.

Mature:

- amount range;
- aging bucket;
- collector;
- project;
- entity;
- collection policy;
- risk/payment behavior.

## Bulk actions

Mature only unless MVP requirements expand:

- remind selected;
- assign collector;
- apply collection policy;
- export.

Bulk financial actions require explicit count, scope and confirmation.

---

# 26. INVOICE LIST

**Route:** `/app/invoices`

## Purpose

Operational invoice management.

Desktop columns:

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

Primary filter:

> Status

Other filters:

- customer;
- date;
- overdue;
- project in mature system;
- NRS state in mature system.

## State display

Do not show all state dimensions simultaneously.

Primary state depends on context:

- document list → document/payment state;
- collections → collection state;
- delivery history → communication state;
- compliance → NRS state.

---

# 27. CREATE INVOICE

**Route:** `/app/invoices/new`

## MVP quick mode

The fastest path is:

```text
Customer
Description
Amount
Due date
```

Primary CTA:

> Review invoice

Do not call the primary CTA `Save invoice`.

## Standard mode

Additional fields:

- line items;
- quantity;
- unit price;
- discount;
- tax;
- payment instructions;
- terms;
- notes;
- branding.

Advanced controls should be collapsible.

## Form layout

Two-column desktop:

```text
┌──────────────────────────┬───────────────────────┐
│ Invoice details          │ Live document preview │
│                          │                       │
│ Customer                 │ Seller                │
│ Dates                    │ Customer              │
│ Items                    │ Items                 │
│ Tax                      │ Total                 │
│ Payment instructions     │                       │
└──────────────────────────┴───────────────────────┘
```

Mobile:

```text
Form
↓
Preview
```

Never put a full invoice preview beside the form if it makes the editing controls unusably narrow.

---

# 28. INVOICE REVIEW

**Route:** `/app/invoices/new/review`

This is a confidence screen.

Show:

- seller;
- customer;
- invoice number;
- issue date;
- due date;
- line items;
- subtotal;
- discount;
- tax;
- total;
- payment instructions.

Primary:

> Issue invoice

Secondary:

> Edit invoice

Before issue, show a lightweight immutability notice:

> **Issuing this invoice makes the issued financial document immutable.**

Avoid alarmist language.

---

# 29. INVOICE DETAIL

**Route:** `/app/invoices/[invoiceId]`

## Header

```text
Invoice INV-00482
Acme Limited

₦2,450,000
₦1,450,000 outstanding

[Remind customer]
```

## State hierarchy

Example:

```text
Issued
Partially paid
Overdue
Viewed
```

Visually:

```text
PRIMARY: Partially paid
SECONDARY: 12 days overdue
TERTIARY: Viewed
```

Do not display four equally prominent badges.

## Financial summary

```text
Total
₦2,450,000

Paid
₦1,000,000

Outstanding
₦1,450,000
```

## Timeline

```text
Invoice issued
Invoice sent
Invoice viewed
Due date passed
Reminder sent
Payment received
```

Timelines are human-readable.

They are not audit-log dumps.

## Actions

Valid by state:

- send;
- share;
- download;
- remind;
- record payment;
- open public invoice;
- void where allowed.

Invalid actions should either:

- disappear; or
- be visibly disabled with a concise reason if discovery is important.

---

# 30. SEND / SHARE INVOICE

Can be:

- modal;
- drawer;
- dedicated step.

Use a modal for simple email sending.

Use a drawer for multi-channel sharing in mature flows.

## Email send

Show:

- recipient;
- subject;
- message;
- invoice link/attachment state.

Primary:

> Send invoice

Success:

> Invoice sent to Acme Ltd.

## Share link

Show:

- public URL;
- copy;
- open;
- revoke/rotate where supported.

The interface must distinguish:

```text
Sent by email
Shared by link
Both
```

---

# 31. PUBLIC INVOICE

**Route:** `/invoice/[token]`

This is a customer-facing financial document, not an authenticated Kivo screen.

## Goals

- immediate trust;
- obvious amount;
- obvious due date;
- minimal friction;
- easy payment;
- strong mobile experience.

## Layout

```text
Seller identity
        ↓
INVOICE
Invoice number
Issue date / Due date
        ↓
Bill to
        ↓
Line items
        ↓
Subtotal / Tax / Charges
        ↓
TOTAL
        ↓
Payment state
        ↓
Payment instructions
        ↓
Pay now
```

## Visual character

The public invoice should feel more like a premium financial document than an application dashboard.

Use:

- white/near-white surface;
- strong document typography;
- clear totals;
- quiet dividers;
- restrained brand accent.

Do not use app chrome.

Do not require recipient login.

---

# 32. PUBLIC PAYMENT

**Route:** `/invoice/[token]/payment`

Show:

- seller;
- invoice number;
- amount;
- payment provider;
- secure processing state.

Do not expose:

- application navigation;
- Kivo account setup;
- internal organization information.

Primary action:

> Pay ₦450,000

The amount must be explicit.

---

# 33. PAYMENT RESULT

**Route:** `/invoice/[token]/payment/result`

### Confirmed

```text
Payment confirmed

₦450,000 received

Payment reference
KIVO-XXXX

[View invoice]
```

### Pending

```text
Payment is being confirmed

Kivo is waiting for trusted confirmation from the payment provider.

You can safely leave this page.
```

### Failed

```text
Payment could not be confirmed

No confirmed payment has been recorded yet.

[Try payment again]
```

Never show “Payment successful” merely because a browser redirect occurred.

---

# 34. PAYMENTS

**Route:** `/app/payments`

## Purpose

Give the business confidence about money received.

Table:

```text
Date
Customer
Invoice
Amount
Method
Status
Reference
```

Payment list primary state is `CONFIRMED`, `PENDING`, or `FAILED` as appropriate.

Do not confuse a payment attempt with confirmed cash.

---

# 35. RECORD MANUAL PAYMENT

Entry points:

- invoice detail;
- customer detail;
- receivables;
- payments.

Show before entry:

```text
Invoice total
Paid
Outstanding
```

Form:

- amount;
- received date;
- payment method;
- reference;
- note.

Primary:

> Record payment

Confirmation:

```text
Record ₦300,000 payment?

Invoice INV-00482
Outstanding before payment: ₦450,000

After payment:
Outstanding: ₦150,000

[Record payment]
```

If fully settled:

> **Invoice paid**

If partially paid:

> **₦300,000 received. ₦150,000 remaining.**

---

# 36. RECEIPT

Receipt is evidence of a financial event.

Show:

- receipt number;
- customer;
- invoice;
- amount;
- date;
- payment method;
- reference.

Actions:

- download;
- share/send.

Receipt generation can be asynchronous.

The user should see:

```text
Receipt generating…
```

rather than a blank state.

---

# 37. REMINDERS

Entry points:

- dashboard;
- receivables;
- invoice detail;
- customer detail.

MVP channel:

> Email

Show:

- customer;
- invoice;
- amount;
- due/overdue state;
- last reminder;
- channel;
- next action.

Primary:

> Send reminder

Success:

> Reminder sent to Acme Ltd.

Do not call it marketing automation.

---

# 38. COLLECTIONS — MATURE

**Route:** `/app/collections`

Purpose:

Turn overdue receivables into coordinated, explainable actions.

## Overview

Primary sections:

```text
Needs attention
Scheduled
Recently sent
Resolved
```

## Collection item

```text
Customer
Invoice
Outstanding
Days overdue
Last contact
Recommended next action
```

Example:

```text
Acme Ltd.
₦1,450,000
12 days overdue
Last reminder: 3 days ago

Recommended:
Send another reminder

[Review] [Send]
```

Recommendations must be distinguishable from rules.

---

# 39. COLLECTION POLICY BUILDER

Mature route:

`/app/settings/collections/policies`

Policy builder:

```text
When
  invoice becomes overdue

Then
  wait 2 days
  send email

Then
  wait 5 days
  send WhatsApp

Then
  escalate
```

Controls:

- trigger;
- delay;
- channel;
- template;
- contact;
- timezone;
- quiet hours;
- max attempts;
- stop conditions;
- escalation.

Use a vertical step builder, not a dense rule table.

---

# 40. PROJECTS — MATURE

**Route:** `/app/projects`

Purpose:

Connect commercial work to financial outcomes.

List columns:

```text
Project
Customer
Status
Expected value
Invoiced
Collected
Outstanding
```

Project cards/rows should emphasize:

```text
Work → Bill → Collect
```

not project-management ceremony.

---

# 41. PROJECT DETAIL — MATURE

Tabs:

```text
Overview
Milestones
Invoices
Expenses
Activity
```

Financial overview:

```text
Expected value
Quoted
Invoiced
Collected
Outstanding
Expenses
Estimated contribution
```

Use derived values only.

Do not present project summaries as a separate ledger.

---

# 42. MILESTONES — MATURE

Milestone list:

```text
Sequence
Milestone
Target
Status
Billing
Amount
Action
```

Status:

```text
PLANNED
IN_PROGRESS
COMPLETED
READY_TO_BILL
```

Completing a milestone is not itself a financial posting.

If a billing policy exists, show:

> Milestone complete — invoice draft can be created.

---

# 43. PROJECT EXPENSES — MATURE

Expenses:

- amount;
- date;
- category;
- vendor;
- description;
- attachment;
- payment status.

Expense UI should remain operational and lightweight.

Do not make Kivo look like a full accounting expense suite unless the product scope explicitly expands.

---

# 44. QUOTES — MATURE

**Route:** `/app/quotes`

Quote states:

```text
Draft
Sent
Accepted
Rejected
Expired
Cancelled
```

List:

```text
Customer
Quote #
Amount
Valid until
Status
Project
Action
```

Primary CTA:

> Create quote

---

# 45. QUOTE DETAIL — MATURE

Show:

- quote number;
- customer;
- project;
- line items;
- taxes;
- discounts;
- total;
- validity;
- status;
- history.

For accepted quote:

```text
Accepted

[Create invoice]
```

The UI should make clear:

> A quote is not a receivable.

---

# 46. QUOTE-TO-INVOICE

Workflow:

```text
Accepted quote
↓
Review invoice draft
↓
Issue invoice
```

Do not visually merge quote and invoice into one mutable object.

The quote remains historical evidence.

---

# 47. RECONCILIATION — MATURE

**Route:** `/app/reconciliation`

Purpose:

Resolve incoming money against outstanding obligations.

Primary queue:

```text
Needs review
Auto-matched
Exceptions
Imported
```

## Review item

```text
Incoming transaction
₦450,000
Ref: INV-00482
Date: 02 Sep 2026

Suggested match
Acme Ltd. / INV-00482
Confidence: High

Why:
✓ Exact invoice reference
✓ Exact amount

[Match] [Review]
```

AI or scoring assistance must never look like authoritative financial state.

---

# 48. RECONCILIATION DETAIL

Show:

- source transaction;
- provider/bank;
- amount;
- date;
- reference;
- candidate matches;
- match evidence;
- decision;
- reviewer;
- resulting action.

Use side-by-side desktop:

```text
Incoming transaction | Candidate obligation
```

Mobile:

```text
Incoming
↓
Candidate
↓
Evidence
↓
Decision
```

---

# 49. NRS / COMPLIANCE — MATURE

Compliance is a separate UI dimension from invoice financial state.

An invoice can be:

```text
Kivo:
ISSUED

NRS:
SUBMISSION_PENDING
```

or:

```text
Kivo:
ISSUED

NRS:
APPROVED
```

Do not collapse NRS status into Invoice status.

---

# 50. NRS STATUS PRESENTATION

Use a dedicated compliance status component.

States:

```text
Not submitted
Submission pending
Validated
Approved
Rejected
Resubmission required
```

Rejected example:

> **NRS submission rejected**  
> The invoice remains recorded in Kivo. Review the compliance issue before resubmitting.

Never imply legal compliance merely because a submission succeeded technically.

---

# 51. REPORTING

**Route:** `/app/reports`

Mature reporting areas:

```text
Receivables
Collections
Customers
Cash flow
Projects
Payments
```

Reporting should answer business questions, not display chart collections.

Each report needs:

- title;
- question answered;
- period;
- filters;
- main metric/table;
- optional chart;
- export.

Example:

> **Where is our cash tied up?**

Then:

```text
Overdue
Due soon
Customer concentration
Aging
```

---

# 52. CASH-FLOW

Mature route:

`/app/reports/cash-flow`

Primary visualization:

```text
Opening cash
+ expected collections
- known outflows where supported
= projected cash
```

Forecasts must show:

- period;
- confidence;
- assumptions;
- actual vs forecast.

Never present forecast values using the same visual language as confirmed cash without a clear distinction.

---

# 53. ANALYTICS

Analytics may include:

- invoice-to-payment time;
- overdue rate;
- collection effectiveness;
- customer payment behavior;
- project margin-like derived indicators where supported;
- cash collection trends.

Charts must be subordinate to the answer.

Use:

- line charts for trends;
- bars for comparisons;
- stacked bars for composition;
- tables for exact values.

Avoid pie charts unless composition is genuinely the easiest thing to understand.

---

# 54. REPORT FILTERS

Filter patterns:

```text
Date range
Entity
Customer
Project
Currency
Status
```

Use a filter bar for common filters.

Use a filter drawer for advanced filtering.

Do not create 15 visible filter controls.

---

# 55. TEAM & ACCESS — MATURE

**Route:** `/app/team`

List:

```text
Name
Email
Role
Status
Last active
Actions
```

Mature roles may include:

```text
OWNER
ADMIN
FINANCE
STAFF
ACCOUNTANT
VIEWER
```

Permission descriptions should be human-readable.

Do not expose raw permission strings as primary UI.

Example:

> **Finance**  
> Can manage payments and receivables. Cannot manage organization security.

---

# 56. ACCOUNTANT WORKSPACE — MATURE

This is a cross-organization experience.

Primary navigation:

```text
Clients
Tasks
Receivables
Exceptions
Reports
```

The organization switcher must make current tenant/entity context unmistakable.

Never allow cross-client financial data to appear in an ambiguous shared list.

Every cross-client screen should include visible client context.

---

# 57. MULTI-ENTITY — MATURE

Where an organization contains multiple legal/operating entities:

```text
Organization
  ↓
Entity
```

The UI must show entity context whenever the current screen contains entity-specific financial data.

Use a top-level entity selector.

Current context example:

> **Kivo Consulting Ltd. — Nigeria**

Do not rely solely on a logo or colour to distinguish entities.

---

# 58. SETTINGS

MVP sections:

```text
Business
Invoice
Payments
Communications
Subscription
```

Mature:

```text
Business
Entities
Invoice
Payments
Collections
Communications
Tax
Compliance
Subscription
Security
Integrations
Developer
```

Settings should be configuration-led, not a dumping ground.

---

# 59. SUBSCRIPTION & ENTITLEMENTS

Plan names may include:

```text
Starter
Business
Professional
Enterprise / Accountant
```

UI must use effective entitlements from the backend.

Do not use plan ID directly to decide whether a frontend action is authorized.

## Usage limit pattern

Example:

```text
Invoices this month
82 / 100

18 remaining
```

When approaching a limit:

> You have 18 invoices left this month.

At limit:

> You've reached your monthly invoice limit.

Primary action:

> Upgrade plan

Historical records remain visible even after downgrade.

---

# 60. UPGRADE PROMPTS

Upgrade prompts should be contextual and useful.

Good:

```text
Projects are available on Business.

Your existing invoice history stays available.

[View plans]
```

Bad:

```text
Unlock this amazing feature today!!!
```

Avoid aggressive upselling in core financial workflows.

---

# 61. SEARCH

Search should be available once the product has enough entities to justify it.

Global search categories:

```text
Customers
Invoices
Quotes
Projects
Payments
```

Search result example:

```text
Acme Ltd.
Customer

INV-00482
Invoice
₦2,450,000 · Overdue
```

Never expose unrelated tenant records.

---

# 62. COMMAND SURFACE

Mature product may support a command/search surface:

```text
Search invoices
Open Acme Ltd.
Create invoice
```

Keep command actions limited to safe, high-confidence operations.

Do not make destructive financial operations one-keystroke commands.

---

# 63. TABLES

Tables are a major Kivo operational pattern.

## Desktop requirements

- sticky header for long lists;
- row hover only when useful;
- action menu at row end;
- numeric alignment;
- truncation with tooltip only for non-critical text;
- visible pagination/cursor progress when relevant.

## Mobile

Do not horizontally shrink a desktop table until text becomes unreadable.

Transform into a vertical record:

```text
Acme Ltd.
INV-00482

₦1,450,000 outstanding
12 days overdue

[Remind]
```

---

# 64. CARDS

Use cards to:

- group related information;
- isolate a useful summary;
- show a meaningful state;
- support comparison.

Do not use cards for:

- every table row;
- every statistic;
- every form section.

A card must answer why the grouping exists.

---

# 65. BADGES

Badges are for compact state.

Use:

```text
Paid
Pending
Overdue
Draft
Accepted
Rejected
```

Do not use badges for every piece of metadata.

Maximum recommended badge count for a single object header:

> 2 prominent states.

Secondary states can be rendered as metadata.

---

# 66. BUTTONS

## Primary

Use for the single main action.

Examples:

- Create invoice;
- Issue invoice;
- Record payment;
- Send reminder;
- Pay invoice.

## Secondary

For common complementary actions:

- Edit;
- Preview;
- Share;
- Download.

## Tertiary

For low-emphasis actions:

- Open;
- View details.

## Destructive

For:

- Void;
- Archive;
- Remove;
- Revoke.

Destructive buttons use critical semantic styling.

Do not colour ordinary secondary actions red.

---

# 67. BUTTON LABELS

Use verbs + objects where useful.

Good:

```text
Create invoice
Send reminder
Record payment
Issue invoice
Download receipt
```

Avoid:

```text
Submit
Continue
Done
Proceed
Manage
```

unless the object is genuinely obvious from context.

---

# 68. ICON BUTTONS

Icon-only controls MUST have:

- accessible name;
- tooltip on desktop;
- adequate touch target.

Use icon-only for:

- search;
- close;
- back;
- overflow;
- copy;
- download.

Do not use icon-only for:

- destructive financial actions;
- send;
- record payment;
- issue invoice;

unless paired with an accessible textual explanation.

---

# 69. FORMS

Form principles:

- group by user intent;
- minimum required fields first;
- advanced fields progressively disclosed;
- field labels always visible;
- helper text only when useful;
- inline validation;
- preserve entered values on recoverable failure.

## Required indicators

Use:

> `* Required`

Do not depend solely on red styling.

---

# 70. FORM VALIDATION

Validation timing:

1. do not overwhelm the user before interaction;
2. validate on blur or submit where appropriate;
3. preserve user input;
4. focus the first actionable error after submit;
5. display server validation errors.

Error format:

> **Due date is required**  
> Choose when payment is due.

For financial values:

> **Amount must be greater than ₦0**

Avoid raw exception messages.

---

# 71. INPUTS

## Text

Use explicit labels.

## Money

Use:

```text
Amount
₦ [          ]
```

Do not rely on placeholder text as the field label.

## Date

Display human-readable date.

Internally, backend timestamps remain authoritative.

## Select

Use searchable select when the option set is large.

## Currency

Currency must always be explicit where more than one currency is supported.

---

# 72. LINE ITEM EDITOR

Invoice line items use a repeatable structure.

Desktop:

```text
Description | Qty | Unit price | Tax | Amount | Remove
```

Mobile:

```text
Description
Qty
Unit price
Tax
Amount
Remove
```

The amount field is calculated.

The UI may display a provisional total, but server response is authoritative.

---

# 73. CALCULATION DISPLAY

Do not expose calculation complexity unless necessary.

Primary:

```text
Subtotal       ₦2,000,000
Discount          ₦50,000
Tax               ₦90,000
Total           ₦2,040,000
```

For detailed views, use exact authoritative values.

For creation workflows, clearly identify totals as calculated.

---

# 74. CONFIRMATION DIALOGS

Use confirmation only when:

- financially consequential;
- destructive;
- difficult to reverse;
- ambiguous intent.

Good:

> **Issue invoice for ₦2,450,000?**  
> This creates the issued financial document and locks its financial values.

Bad:

> Are you sure?

---

# 75. DRAWERS

Use drawers when the user needs contextual detail without losing their place.

Good drawer use:

- send/share invoice;
- filter builder;
- payment details;
- customer preview;
- reconciliation review;
- collection action.

Do not put long multi-step creation workflows in tiny drawers.

---

# 76. MODALS

Use modals for focused decisions.

Good:

- record payment confirmation;
- void invoice;
- archive customer;
- confirm resend;
- show concise details.

Avoid giant “modal pages”.

If content needs scrolling and multiple sections, use a route or drawer.

---

# 77. TOASTS

Use toasts for:

- non-consequential confirmation;
- copy succeeded;
- settings saved;
- background job completed.

Do not use a toast as the sole evidence for:

- invoice issuance;
- payment confirmation;
- refund;
- invoice void;
- NRS submission outcome.

The resource page must reflect the resulting state.

---

# 78. SUCCESS STATES

Success should communicate outcome.

Good:

> **Invoice issued**  
> INV-00482 is ready to send.

Good:

> **Payment recorded**  
> ₦300,000 received. ₦150,000 remains outstanding.

Avoid:

> Success!

---

# 79. LOADING STATES

Use:

- skeletons for content;
- inline spinners for local actions;
- progress text for asynchronous financial operations.

Do not use full-page loading unless the entire page truly cannot render without the request.

Financial commands should show a processing state:

```text
Issuing invoice…
Recording payment…
Confirming payment…
Sending reminder…
```

---

# 80. EMPTY STATES

Every meaningful page must have a designed empty state.

Structure:

```text
Current condition
Why it matters
Next action
```

Example:

> **No invoices yet**  
> Create your first invoice to start tracking what you're owed.  
> [Create invoice]

Avoid:

> No data.

---

# 81. ERROR STATES

Three levels:

## Field

Inline message.

## Page/action

Explain what failed and recovery.

## System

Provide safe fallback and support context.

Financial example:

> **Payment confirmation is still pending**  
> Kivo has not yet received trusted confirmation from the payment provider. No confirmed payment has been recorded yet.

This is better than:

> Error 504.

---

# 82. OFFLINE / NETWORK FAILURE

When a request fails due to connectivity:

- preserve form data;
- distinguish unknown state from failed state;
- do not automatically retry a financial command unless the command is explicitly idempotent and safe;
- tell the user whether the server may have received the command.

For financial commands:

> **We couldn't confirm the result**  
> The request may have reached Kivo. Check the invoice before trying again.

This is safer than:

> Try again.

---

# 83. OPTIMISTIC UI

Optimistic updates are allowed only for:

- non-financial presentation;
- reversible UI preferences;
- visual interactions.

Do NOT optimistically assert:

- payment received;
- invoice issued;
- invoice paid;
- refund completed;
- NRS approved;
- reconciliation completed.

Authoritative state must come from the server.

---

# 84. PAGINATION

Use cursor pagination for large lists.

UI should provide:

- result count where known;
- next/previous behavior;
- loading state;
- filters preserved during navigation.

Do not reset filters after pagination.

---

# 85. FILTERS

Common filter bar:

```text
[Status] [Customer] [Date] [More]
```

Advanced filters:

```text
Filters
---------------------------------
Status
Customer
Amount
Date range
Entity
Project
Collection stage
```

A filter summary should show selected filters as removable chips.

---

# 86. SORTING

Sort by meaningful operational value:

Invoices:

- issue date;
- due date;
- amount;
- outstanding;
- updated.

Receivables:

- overdue age;
- amount;
- due date.

Customers:

- outstanding;
- last activity;
- name.

---

# 87. TIMELINES

Timelines answer:

> What happened?

Examples:

```text
02 Sep — Invoice issued
02 Sep — Invoice sent
03 Sep — Invoice viewed
05 Sep — Reminder sent
09 Sep — ₦500,000 payment received
```

Use human-readable events.

Technical metadata belongs in audit/operations surfaces, not normal customer-facing timelines.

---

# 88. FINANCIAL STATE MODEL IN UI

The UI MUST keep these dimensions conceptually separate:

```text
documentStatus
paymentStatus
collectionStatus
viewStatus
communicationStatus
complianceStatus
```

A single generic `status` badge is not sufficient for mature Kivo.

Context determines the primary displayed state.

---

# 89. STATE MATRIX

| Domain object | Primary state(s) |
|---|---|
| Invoice list | Payment + document context |
| Invoice detail | Payment + collection |
| Receivables | Collection |
| Payments | Payment |
| Communications | Delivery |
| NRS | Compliance |
| Reconciliation | Match/review |
| Quote | Commercial |
| Project | Project lifecycle |
| Subscription | Subscription |
| Entitlement | Access |
| Customer | Financial summary, not a single status |

---

# 90. CUSTOMER BALANCE LANGUAGE

Prefer:

> **₦2.4m outstanding**

Avoid:

> Total outstanding receivables balance.

Prefer:

> **₦850k overdue**

Avoid:

> Overdue receivable amount.

Language should feel like a competent operator explaining the situation.

---

# 91. DATES AND TIME

Persisted data is UTC.

UI displays organization-local dates/times according to configuration.

Use relative time only where useful:

> 2 days ago

For financial evidence, show exact dates:

> 2 September 2026

Do not make exact financial dates discoverable only on hover.

---

# 92. CURRENCY

NGN is the launch currency.

Use:

> ₦450,000

Where multi-currency exists:

> USD 1,250.00

Currency must remain explicit in all financial detail.

Do not silently convert or imply cross-currency equivalence.

---

# 93. COPY & CONTENT DESIGN

Voice:

- concise;
- direct;
- calm;
- human;
- financially precise;
- confident.

## Preferred

> Invoice ready.

> ₦450,000 paid.

> 7 invoices are overdue.

> ₦2.4m outstanding.

> Remind customer.

> Payment pending.

## Avoid

> Your invoice has successfully been generated and is now available for you to share with your customer.

> Your payment has been successfully processed.

> You currently have 7 overdue invoices requiring your attention.

---

# 94. MICROCOPY RULES

Prefer one sentence over three.

Prefer concrete nouns.

Prefer active verbs.

Use “customer”, not “client” unless the product context specifically means accountant clients.

Use:

> payment pending

not:

> transaction processing status.

Use:

> outstanding

not:

> unpaid balance amount due.

---

# 95. DESTRUCTIVE LANGUAGE

Avoid emotionally loaded language.

Use:

> Void invoice

not:

> Delete invoice

when the domain operation is void.

Use:

> Archive customer

not:

> Remove customer

if historical data remains.

Use:

> Revoke link

not:

> Delete link.

---

# 96. ACCESSIBILITY

Minimum requirement:

> WCAG 2.2 AA-aligned implementation.

## Requirements

- semantic HTML;
- keyboard navigation;
- visible focus;
- accessible names;
- associated labels;
- associated errors;
- sufficient contrast;
- non-colour state communication;
- accessible dialogs;
- screen-reader status announcements;
- adequate touch targets.

Target touch size:

> 44×44 CSS pixels minimum.

---

# 97. ACCESSIBILITY — FINANCIAL STATES

Never encode:

```text
green = paid
red = overdue
```

without text.

Always:

```text
[Paid]
[Overdue]
[Pending]
```

Use icons only as supplementary cues.

---

# 98. FOCUS MANAGEMENT

Required:

- opening a modal moves focus into it;
- closing returns focus to the trigger;
- drawers follow the same pattern;
- validation should move focus to the first actionable error;
- route changes should announce page context where required.

---

# 99. RESPONSIVE BREAKPOINTS

Implementation baseline:

```text
mobile:  < 640px
tablet:  640px–1023px
desktop: 1024px–1439px
wide:    ≥ 1440px
```

Breakpoints represent layout changes, not device labels.

---

# 100. RESPONSIVE RULES

## Mobile

Prioritize:

1. amount;
2. state;
3. next action;
4. identity;
5. essential metadata.

## Tablet

Use:

- reduced navigation;
- flexible two-column layouts;
- transformed tables.

## Desktop

Use:

- side-by-side context;
- higher density;
- multi-column tables;
- persistent navigation.

---

# 101. MOBILE ACTION BAR

For key workflows, use a sticky bottom action bar:

```text
[Cancel]              [Issue invoice]
```

or:

```text
[Edit]              [Record payment]
```

Ensure it does not obscure important content.

Use safe-area padding on mobile.

---

# 102. MOBILE FORMS

Mobile forms should:

- use one primary column;
- group related fields;
- use full-width controls;
- keep primary action reachable;
- avoid excessively long dropdowns;
- preserve context at the top.

Avoid two-column forms on narrow screens.

---

# 103. PUBLIC MOBILE EXPERIENCE

Public invoice/payment pages are mobile-first.

Priority:

```text
Seller
↓
Amount
↓
Due date
↓
What is being billed
↓
Pay
```

Do not bury payment below long explanatory copy.

---

# 104. INVOICE DOCUMENT DESIGN

The invoice PDF and public invoice must share visual DNA with the app.

They should use:

- same brand accent;
- same typography;
- same spacing logic;
- same financial state language.

The document itself should remain optimized for:

- print;
- PDF;
- email;
- customer trust.

---

# 105. INVOICE PDF STRUCTURE

Recommended:

```text
[Business logo/name]         INVOICE

Invoice #
Issue date
Due date

Bill to
Customer

--------------------------------
Description        Qty    Total
--------------------------------
Service 1                  ₦...
Service 2                  ₦...
--------------------------------

Subtotal                   ₦...
Discount                   ₦...
Tax                        ₦...
TOTAL                      ₦...

Payment instructions
Bank details / payment link

Terms / notes
```

Use clear whitespace around the total.

The total must never visually compete with decorative brand elements.

---

# 106. AI UI

Mature Kivo may provide AI assistance.

AI may assist with:

- summaries;
- explanations;
- classification;
- suggestions;
- forecasting;
- draft communication;
- reconciliation explanations;
- natural-language queries over authorized read models.

AI MUST NOT visually masquerade as financial authority.

---

# 107. AI VISUAL DISTINCTION

AI content uses a subtle “insight” treatment rather than a semantic financial color.

Example:

```text
AI suggestion

Acme usually pays within 9 days of a reminder.
A reminder today may improve the chance of payment before Friday.

[Review reminder]
```

The phrase “AI suggestion” or an equivalent trust label must be present when users could otherwise mistake the content for a recorded fact.

---

# 108. AI CONFIDENCE

Where confidence matters, express it in words:

```text
High confidence
Moderate confidence
Low confidence
```

Do not expose meaningless decimal scores like:

> 0.8734

unless the user is an advanced operator and the numeric model provides genuine value.

---

# 109. AI + FINANCIAL AUTHORITY

The visual distinction should follow:

```text
Known
→ authoritative product state

Inferred
→ analytics or derived signal

Suggested
→ AI/recommendation

Action
→ explicit user/system command
```

The user must understand which category they are seeing.

---

# 110. NOTIFICATIONS

Notification center may contain:

- invoice processing;
- payment results;
- reminder results;
- NRS outcomes;
- reconciliation review items;
- subscription events.

Notification cards should include:

```text
What happened
When
Why it matters
Open action
```

---

# 111. NOTIFICATION PRIORITY

Use:

```text
Critical
Attention
Information
Success
```

Do not make every notification urgent.

Financially critical notifications should be persistent until acknowledged where appropriate.

---

# 112. CONFIRMATION AFTER BACKGROUND WORK

When an asynchronous job completes, update the underlying record.

Example:

PDF generation:

```text
Generating PDF…
```

then:

```text
PDF ready
[Download]
```

Do not rely only on a toast.

---

# 113. SUBSCRIPTION STATE UI

Subscription status:

```text
Trial
Active
Past due
Grace period
Suspended
Cancelled
```

Make access implications explicit.

Example:

> **Past due**  
> Your subscription payment needs attention. Core invoice history remains available.

Do not threaten immediate data loss unless that is genuinely the product policy.

---

# 114. ENTITLEMENT-GATED UI

When a capability is not available:

## If user has never used it

Show a capability teaser:

> Projects are available on Business.

## If user previously used it and was downgraded

Show preserved history:

> Your existing projects are still available to view. Upgrade to create new projects.

Never hide historical data merely because a plan changed.

---

# 115. SECURITY UX

User-facing security surfaces include:

- active sessions where supported;
- password change;
- authentication methods;
- team roles;
- API keys in mature platform;
- public link revocation.

Sensitive operations require:

- explicit confirmation;
- clear consequence;
- appropriate re-authentication where required.

---

# 116. PUBLIC LINK SECURITY UX

When sharing an invoice:

```text
Anyone with this link can view the invoice.
```

Where public link rotation exists:

> Revoke this link and create a new one?

Explain that previous link holders will lose access.

---

# 117. OPERATIONS UI

Kivo Operations is a separate internal surface.

It should visually reuse Kivo's foundational design language but can use a denser operator-oriented shell.

Primary sections:

```text
Command Center
Organizations
Payments
Jobs
Communications
Subscriptions
Audit
Security
```

Operators inspect and orchestrate. They do not directly edit financial tables.

The Operations UI must visually distinguish:

- observation;
- recommended action;
- executed command;
- audit evidence.

---

# 118. OPERATIONS COMMAND CONFIRMATION

For high-risk internal actions:

```text
Action
Object
Scope
Expected effect
Risk
Approval state
Audit reason
```

Example:

> **Retry payment verification?**  
> Payment: PAY-8831  
> Effect: re-run provider verification.  
> No financial record will be created unless verification succeeds.

This should be much more explicit than normal customer actions.

---

# 119. DESIGN TOKENS — PRIMITIVE LAYER

Implement tokens in three layers:

```text
Primitive
   ↓
Semantic
   ↓
Component
```

Never put raw brand/semantic hex values inside individual components.

---

# 120. DESIGN TOKENS — SEMANTIC LAYER

Required semantic token groups:

```text
color.text.primary
color.text.secondary
color.text.muted
color.text.inverse

color.surface.page
color.surface.default
color.surface.subtle
color.surface.raised
color.surface.overlay

color.border.default
color.border.strong
color.border.focus

color.action.primary
color.action.primary.hover
color.action.secondary
color.action.destructive

color.success.*
color.warning.*
color.critical.*
color.info.*
color.processing.*

color.financial.paid
color.financial.partial
color.financial.due
color.financial.overdue
color.financial.pending
color.financial.failed
```

---

# 121. DESIGN TOKENS — COMPONENT LAYER

Required examples:

```text
button.primary.background
button.primary.hover
button.primary.text

button.secondary.background
button.secondary.border
button.secondary.text

input.background
input.border
input.border.focus
input.text
input.placeholder

status.paid.background
status.paid.text

status.overdue.background
status.overdue.text

table.row.hover
table.row.selected

dialog.background
dialog.overlay

toast.success.background
toast.error.background
```

---

# 122. LAYOUT TOKENS

```text
layout.page.max = 1200px
layout.page.wide = 1440px
layout.page.padding.desktop = 32px
layout.page.padding.mobile = 16px

layout.sidebar.width = 240px
layout.sidebar.collapsed = 72px

layout.header.height = 64px

layout.form.narrow = 640px
layout.document.max = 760px
```

---

# 123. CONTROL TOKENS

```text
control.sm = 32px
control.md = 40px
control.lg = 48px
```

Default form control:

> 40px

Primary mobile controls may use:

> 48px

Touch target remains at least 44×44 even when the visual control is smaller.

---

# 124. COMPONENT INVENTORY

The frontend should implement, at minimum:

## Foundations

- Box/Layout;
- Stack;
- Grid;
- Text;
- Heading;
- Divider;
- Icon.

## Controls

- Button;
- IconButton;
- Input;
- MoneyInput;
- DateInput;
- Select;
- Combobox;
- Checkbox;
- Radio;
- Switch;
- Textarea;
- FileUpload.

## Navigation

- AppShell;
- Sidebar;
- MobileNav;
- Breadcrumbs;
- Tabs;
- Pagination;
- CommandSurface.

## Feedback

- Badge/Status;
- Alert;
- Toast;
- Progress;
- Skeleton;
- EmptyState;
- ErrorState.

## Overlays

- Dialog;
- Drawer;
- DropdownMenu;
- Tooltip;
- Popover.

## Data

- Table;
- DataList;
- Timeline;
- ActivityList;
- SummaryMetric;
- Chart;
- FilterBar.

## Kivo domain components

- MoneyAmount;
- InvoiceStatus;
- PaymentStatus;
- CollectionStatus;
- ComplianceStatus;
- InvoiceRow;
- CustomerRow;
- ReceivableRow;
- PaymentRow;
- FinancialSummary;
- InvoiceSummary;
- PaymentSummary;
- CollectionAction;
- AuditEventSummary;
- EntitySwitcher.

---

# 125. MONEY AMOUNT COMPONENT

A standard `MoneyAmount` component should support:

```text
currency
amount
precision
abbreviation
tone
size
weight
```

Examples:

```text
MoneyAmount(2450000, NGN)
→ ₦2,450,000

MoneyAmount(2400000, NGN, abbreviated=true)
→ ₦2.4m
```

The component MUST NOT perform authoritative financial calculations.

It formats values already provided by the backend.

---

# 126. STATUS COMPONENTS

Use semantic domain-specific components:

```text
<InvoiceStatus />
<PaymentStatus />
<CollectionStatus />
<ComplianceStatus />
```

Do not create one generic badge with arbitrary text everywhere.

Each component maps domain state to:

- label;
- semantic color;
- icon if useful;
- accessible description.

---

# 127. INVOICE ROW COMPONENT

Standard contract:

```text
customer
invoiceNumber
amount
outstanding
dueDate
paymentState
collectionState
viewState
actions
```

Display only the states relevant to the surface.

---

# 128. RECEIVABLE ROW COMPONENT

Contract:

```text
customer
invoice
outstanding
dueDate
daysOverdue
collectionState
nextAction
```

Primary action:

> Remind

In mature collection contexts, primary action can vary by policy.

---

# 129. FINANCIAL SUMMARY COMPONENT

Use for:

- dashboard;
- customer detail;
- project detail;
- subscription usage where appropriate.

Structure:

```text
Label
Primary amount
Supporting comparison
Optional trend/context
```

Avoid making every metric visually equal.

---

# 130. CHART COMPONENTS

Every chart must have:

- title;
- question/description;
- units;
- period;
- legend only when needed;
- accessible table alternative where appropriate.

Charts are supplementary.

Do not use chart-only communication for exact financial values.

---

# 131. DATA VISUALIZATION RULES

Use color sparingly.

Prefer semantic distinctions.

Never use 8 unrelated colors in one chart because a chart library defaults to it.

Recommended maximum:

> 4 semantic series in normal operational charts.

For categorical charts, add labels/tooltips and provide accessible tabular data.

---

# 132. RESPONSIVE DATA VISUALIZATION

On mobile:

- reduce dimensions;
- simplify legends;
- move filters above;
- allow horizontal scrolling only where necessary;
- provide tabular alternatives.

Do not squeeze an unreadable desktop chart into 320px.

---

# 133. DATE RANGE PICKER

Standard presets:

```text
Today
Last 7 days
Last 30 days
This month
Last month
This quarter
Custom
```

Use organization timezone.

---

# 134. EXPORT UI

Export actions should state scope.

Example:

> Export 248 invoices

not:

> Export

For long-running exports:

```text
Preparing export…
We'll notify you when it's ready.
```

Export completion should be reflected in notifications/history where appropriate.

---

# 135. FILE UPLOADS

Use for:

- logos;
- receipts/attachments;
- project expenses;
- bank statements in mature system.

Show:

- filename;
- upload progress;
- success/failure;
- retry.

Do not expose storage URLs directly unless intended.

---

# 136. COMMUNICATION UI

Communications are:

```text
Queued
Sent
Delivered
Failed
```

Never treat “sent” as “delivered”.

On message history:

```text
Invoice reminder
Email
Sent 03 Sep 2026, 09:42

Delivered
```

Where delivery data is unavailable:

> Sent — delivery status unavailable.

---

# 137. WHATSAPP UI — MATURE

When supported:

```text
Channel: WhatsApp
Template: Payment reminder
Recipient: +234...
Status: Delivered
```

Show consent/preferences where relevant.

WhatsApp is a channel, not the financial record.

---

# 138. PAYMENT METHOD DISPLAY

Examples:

```text
Bank transfer
Card
Paystack
Flutterwave
Cash
Other
```

Provider and method are separate concepts.

Do not show a provider as the payment method if it was only the transport layer and a more accurate payment method is available.

---

# 139. PAYMENT REFERENCE DISPLAY

References are secondary but important.

Use monospace for technical identifiers:

```text
PSK_8F42D1A9
```

Do not make technical IDs visually larger than the amount.

---

# 140. AUDIT-FACING UI

Customer-facing activity:

> Payment received.

Operator-facing audit:

> PaymentConfirmed command executed by system after verified provider event.

The level of technical detail depends on user role and surface.

---

# 141. ROLE-BASED UX

The UI may simplify itself based on permissions.

A user without permission should not see confusing destructive actions.

However:

> Hiding a button is not authorization.

The backend remains authoritative.

When the server returns authorization denial:

> **You don't have permission to do this.**

Do not expose raw permission errors.

---

# 142. TENANT CONTEXT

The UI must always make current organization context obvious.

For mature multi-entity organizations:

```text
Organization: Kivo Group
Entity: Kivo Consulting Ltd.
```

Avoid ambiguous cross-organization views.

---

# 143. SENSITIVE DATA

Do not expose unnecessary:

- provider secrets;
- API credentials;
- raw webhook payloads;
- internal IDs;
- PII;
- operational debugging data.

Use role-appropriate summaries.

---

# 144. PERFORMANCE UX

Priority:

1. useful dashboard;
2. invoice creation;
3. public invoice;
4. invoice detail;
5. receivables;
6. mobile performance.

Prefer:

- server-rendered initial content where appropriate;
- cache-safe reads;
- focused queries;
- skeletons;
- progressive loading.

Avoid:

- giant client bundles;
- rendering mature features hidden behind flags;
- redundant API requests;
- duplicated data fetching on every component.

---

# 145. FRONTEND STATE MANAGEMENT

Use server state for server-owned data.

Use local state for:

- form editing;
- UI toggles;
- drawers;
- filters where appropriate.

Avoid creating a global client-side financial state store unless a measured use case requires it.

The source of truth remains the server.

---

# 146. CACHING

Cached values MUST NOT override a freshly confirmed financial mutation.

After:

- payment creation;
- invoice issuance;
- void;
- reminder creation;
- NRS action;
- reconciliation decision;

invalidate/refetch affected authoritative resources.

---

# 147. ERROR BOUNDARIES

Layer:

```text
field error
→ form error
→ component error
→ page error
→ application fallback
```

A failed component should not necessarily blank the entire application.

A financial page MUST never render fabricated fallback financial data.

---

# 148. ROUTE TRANSITIONS

Route changes should feel immediate.

Use:

- loading skeletons;
- preserve page context where useful;
- avoid dramatic transitions.

The product should feel operational, not cinematic.

---

# 149. PAGE TITLE CONVENTION

Use:

```text
Dashboard | Kivo
Invoices | Kivo
INV-00482 | Kivo
Acme Ltd. | Kivo
```

Mature:

```text
Project: Website Redesign | Kivo
```

---

# 150. BROWSER BACK BEHAVIOR

Forms:

- preserve safe form state;
- warn about unsaved changes when loss is meaningful.

Filters:

- preserve filter/search state where practical.

Modals/drawers:

- should not break expected back navigation on mobile.

---

# 151. NOT FOUND

For an unavailable resource:

> **We couldn't find that invoice.**  
> It may have been removed, archived, or the link may no longer be valid.

For public invoices, avoid revealing whether a token corresponds to another invoice.

---

# 152. SESSION EXPIRY

If an authenticated session expires during a form:

- preserve non-sensitive form data locally where appropriate;
- redirect to authentication;
- restore the user to the intended page after re-authentication where secure.

Do not lose a long invoice draft because the session expired.

---

# 153. SECURITY-SENSITIVE PUBLIC PAGES

Public invoice pages must:

- reveal minimal required customer data;
- avoid internal organization IDs;
- use opaque public tokens;
- support rate-limiting behavior gracefully;
- not expose system diagnostics.

---

# 154. GLOBAL 404 / ERROR PAGE

Kivo error pages should remain product-like.

Example:

> **Something didn't go as planned.**  
> The page could not be loaded.

Primary:

> Try again

Secondary:

> Go to dashboard

Do not use cartoon error pages that undermine financial credibility.

---

# 155. REDIRECT / SUCCESS FLOW

After successful creation:

Customer:

```text
Customer created
[Create invoice] [View customer]
```

Invoice:

```text
Invoice issued
[Send invoice] [View invoice]
```

Payment:

```text
Payment recorded
[View receipt] [View invoice]
```

Always offer a next logical action.

---

# 156. FIRST-USE / ONBOARDING

Activation path:

```text
Signup
→ Verify
→ Create business
→ Add customer
→ Create invoice
→ Review
→ Send
```

Do not require:

- advanced settings;
- tax configuration unless needed;
- payment provider setup;
- branding perfection.

The user should reach first value quickly.

---

# 157. ONBOARDING SCREEN

Minimal business setup:

```text
Business name
Email
Phone
Address
```

Optional where necessary.

Primary:

> Create business

Completion:

> Your business is ready.

Next:

> Create your first invoice

---

# 158. ONBOARDING EMPTY STATES

The product should progressively teach the system:

```text
No customers
→ Add customer

No invoices
→ Create invoice

No payments
→ Share an invoice with a customer
```

Never overwhelm new users with the entire mature navigation model.

---

# 159. MATURE HOME EXPERIENCE

At maturity the dashboard may evolve from invoice-centric to commercial-to-cash.

Possible hierarchy:

```text
Cash position
↓
Receivables attention
↓
Work in progress / Projects
↓
Collections
↓
Recent money movement
↓
Financial insights
```

The home screen should still preserve the original Kivo question:

> What do I need to do about my money?

---

# 160. MATURE DASHBOARD MODULES

Available modules:

- financial position;
- overdue receivables;
- collections effectiveness;
- upcoming payments;
- project billing;
- reconciliation exceptions;
- NRS issues;
- cash forecast;
- customer payment behavior.

Modules must be priority-driven.

Do not show every module by default.

---

# 161. DASHBOARD PERSONALIZATION

Mature users may reorder optional widgets.

Rules:

- user customization cannot change financial semantics;
- critical alerts remain visible;
- layout preferences must not hide security/compliance warnings;
- default order remains optimized for the product's core job.

---

# 162. AI DASHBOARD ASSISTANCE

Optional insight block:

> **What changed**  
> Outstanding receivables increased 18% this week, mainly from 3 overdue invoices.

Then:

> **What to do next**  
> 2 customers are past their usual payment window.

The supporting records must be inspectable.

Never present AI-generated narrative without links to underlying facts when the claim materially affects decisions.

---

# 163. REPORT EXPLANATIONS

Every derived metric should have an explanation or definition available.

Example:

> **Collection rate**  
> Collected amount ÷ invoiced amount for the selected period.

Derived metrics must not be visually presented as raw financial facts.

---

# 164. FINANCIAL DATA DENSITY

Use density deliberately.

High density is appropriate for:

- invoice lists;
- payments;
- reconciliation;
- operations.

Lower density is appropriate for:

- dashboard summary;
- onboarding;
- public invoice;
- payment confirmation;
- critical decision dialogs.

---

# 165. NO DECORATIVE KPI CARDS

Do not turn:

```text
12 invoices
₦4.2m
87%
Tuesday
```

into four identical cards merely because dashboards often do this.

Visual weight should follow decision value.

---

# 166. VISUAL HIERARCHY RULE

On every financial screen, answer in this order:

```text
1. What is the object?
2. What amount matters?
3. What state is it in?
4. What should I do?
5. What evidence/history supports it?
```

---

# 167. OBJECT DETAIL STANDARD

Every major domain object detail screen should have:

```text
Identity
Financial/operational summary
Primary action
Secondary actions
State
History
Related objects
```

The exact order varies by domain.

---

# 168. RELATED OBJECTS

Use contextual links:

Invoice:

> Customer · Project · Payments · Communications · Compliance

Payment:

> Customer · Invoice · Provider transaction · Receipt

Project:

> Customer · Quotes · Milestones · Invoices · Expenses

Do not require users to search globally to find obvious relationships.

---

# 169. CONTEXT PRESERVATION

When navigating:

```text
Receivables → Invoice
```

the user should be able to return to the same filtered receivables context where practical.

Use breadcrumbs or preserved list state.

---

# 170. UNSAVED CHANGES

If the user leaves a form with meaningful unsaved input:

> **Leave without saving?**  
> Your changes will be lost.

Buttons:

> Stay  
> Leave

Never say:

> Yes / No

---

# 171. AUTOSAVE

Autosave can be used for:

- long drafts;
- settings;
- project details.

Autosave MUST NOT silently issue or post financial documents.

Show:

```text
Saved
Saving…
Changes saved
```

---

# 172. FINANCIAL ACTION IDEMPOTENCY UX

Where the backend supports idempotent commands, the UI should prevent accidental double submission by:

- disabling the button while processing;
- keeping the command in a pending state;
- reconciling the result after timeout.

Do not show two successful toasts for one command.

---

# 173. DOUBLE-CLICK PROTECTION

For:

- issue invoice;
- record payment;
- send reminder;
- void;
- refund;
- reconcile;

disable the triggering control while submission is active.

The backend remains responsible for idempotency.

---

# 174. UNKNOWN OUTCOME STATE

For a timed-out financial action:

```text
We couldn't confirm the result.

Check the invoice/payment history before trying again.
```

This state is critical.

Do not incorrectly label it `Failed` if the actual server state is unknown.

---

# 175. REVERSIBILITY INDICATORS

Where action is reversible:

> Can be reversed

Where not:

> This cannot be undone.

Only state this when it is true according to the domain.

Do not use “undo” as a generic UI metaphor for compensating financial events unless the domain actually supports it.

---

# 176. FILTER STATE URLS

Where practical, list filters may be reflected in query parameters:

```text
/invoices?status=overdue&customer=...
```

This improves:

- shareability;
- back navigation;
- reproducibility.

Do not place sensitive data in URLs.

---

# 177. DEEP LINKS

Deep links should preserve authorization and tenant context.

An internal invoice URL must never become a cross-tenant access mechanism.

---

# 178. PRINT STYLES

Customer-facing document pages should support print cleanly.

Print rules:

- hide application navigation;
- hide action controls;
- preserve invoice identity;
- preserve totals;
- preserve page breaks;
- avoid colour-only state.

---

# 179. PDF / PRINT TYPOGRAPHY

Do not reuse compact table typography for the document if it damages print readability.

Use:

- clear heading;
- comfortable line height;
- strong total hierarchy;
- print-safe spacing.

---

# 180. EMAIL DESIGN

Kivo-generated customer email should mirror product trust.

Structure:

```text
Business identity

Invoice INV-00482

₦2,450,000
Due 15 Sep 2026

[View invoice] [Pay invoice]

Payment instructions
```

Avoid long marketing copy in transactional emails.

---

# 181. REMINDER EMAIL DESIGN

Reminders should emphasize:

```text
Invoice
Amount
Due/overdue status
Payment action
```

Example:

> **Invoice INV-00482 is overdue**  
> ₦1,450,000 remains outstanding.

> [View invoice]

---

# 182. PAYMENT EMAIL DESIGN

Payment receipt email:

> **Payment received**  
> ₦450,000 from Acme Ltd.  
> Invoice INV-00482

> [View receipt]

Avoid congratulatory or marketing language.

---

# 183. NRS / COMPLIANCE EVIDENCE UI

Show compliance identifiers in a dedicated evidence block:

```text
NRS status      Approved
IRN             XXXX
Submitted       03 Sep 2026
```

Technical evidence should not overwhelm the invoice's financial hierarchy.

---

# 184. RECONCILIATION EXPLANATION UI

Use evidence chips:

```text
✓ Exact invoice reference
✓ Exact amount
✓ Customer match
```

Do not show an opaque “AI matched” label without explanation.

---

# 185. COLLECTION RECOMMENDATION UI

Recommendations need:

```text
Recommendation
Reason
Action
```

Example:

> **Follow up today**  
> This invoice is 11 days overdue and the customer usually pays within 7 days.

> [Send reminder]

---

# 186. CUSTOMER PAYMENT BEHAVIOR UI

Use neutral language.

Good:

> Usually pays within 7–10 days.

Not:

> High-risk customer.

Unless a formally defined risk model exists and the label is supported.

Kivo should avoid stigmatizing customers with unexplained risk labels.

---

# 187. AUDIT TIMELINE VS ACTIVITY TIMELINE

Customer/activity timeline:

> Reminder sent

Audit timeline:

> `ReminderSent` event created by scheduler.

Keep these separate.

---

# 188. OPERATOR DENSITY MODE

Kivo Operations may use:

- 12px table text;
- denser row heights;
- more filters;
- technical metadata.

This is acceptable because it serves trained internal users.

Customer Kivo should remain calmer.

---

# 189. MATURE DEVELOPER PLATFORM UI

Developer settings may include:

```text
API keys
Webhooks
Events
Usage
Documentation
```

Technical surfaces should follow the same Kivo typography and shell.

Use monospace for:

- API keys;
- webhook event IDs;
- endpoint paths;
- code.

Never expose secret values after initial creation.

---

# 190. WEBHOOK UI

Show:

```text
Event
Endpoint
Status
Attempts
Last delivery
```

Example:

```text
payment.confirmed
https://example.com/webhooks/kivo
Delivered
2 attempts
03 Sep 2026 · 10:12
```

Do not present raw payloads as the primary view.

---

# 191. API USAGE UI

Metrics:

```text
Requests today
Requests this month
Errors
Rate-limit usage
```

If usage limits are enforced:

> 81% of monthly API requests used.

---

# 192. ENTITLEMENT-DRIVEN NAVIGATION

Navigation visibility should follow:

```text
Authorized + entitled
```

Examples:

- no Projects entitlement → Projects omitted or contextual upgrade;
- no Reconciliation entitlement → not shown in default navigation;
- no API entitlement → developer section can show upgrade page where commercially appropriate.

Financial history should not disappear.

---

# 193. FEATURE FLAGS

UI should not hard-code hidden feature availability.

Use server-provided capability/entitlement state.

Feature flags are for rollout, not authorization.

---

# 194. DESIGN FOR ERROR RECOVERY

After recoverable errors, keep:

- context;
- entered data;
- filters;
- scroll position where appropriate;
- safe retry option.

Do not force users back to the beginning.

---

# 195. ACCESSIBLE DATA TABLE ALTERNATIVE

For charts containing financial values:

- expose a screen-reader accessible summary;
- provide table view for exact values;
- do not encode critical numbers only in chart geometry.

---

# 196. REDUCED MOTION

When reduced motion is enabled:

- remove non-essential transitions;
- preserve state changes;
- do not hide feedback.

---

# 197. DARK MODE

Dark mode is optional for MVP.

If implemented:

- use semantic tokens;
- never invert brand and financial semantics mechanically;
- preserve contrast;
- keep public invoice optimized independently.

Do not treat dark mode as a separate brand.

---

# 198. DESIGN REVIEW FOR DARK MODE

Financial states must remain clearly distinguishable in dark mode.

Test:

- paid;
- overdue;
- pending;
- failed;
- critical alerts;
- form errors.

---

# 199. BROWSER SUPPORT

Target current evergreen:

- Chrome;
- Edge;
- Safari;
- Firefox.

Do not design around obsolete browser behaviors.

---

# 200. FRONTEND IMPLEMENTATION CONTRACT

Expected stack:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui or equivalent
TanStack Query
React Hook Form
Zod
```

Do not introduce a competing UI system without a documented architecture decision.

---

# 201. TOKEN IMPLEMENTATION RULE

Preferred Tailwind/component architecture:

```text
raw values
→ CSS variables
→ semantic tokens
→ component classes
```

Example:

```css
--color-brand-primary
--color-surface-default
--color-text-primary
--color-financial-overdue
```

Avoid:

```tsx
className="bg-[#1E2A78]"
```

inside application components.

---

# 202. COMPONENT IMPLEMENTATION RULE

Prefer:

```text
MoneyAmount
InvoiceStatus
ReceivableRow
PaymentSummary
```

over:

```text
BlueMoneyText
SpecialInvoiceCard
BigAmountBox
```

Name components by product meaning, not visual appearance.

---

# 203. NO UNIVERSAL COMPONENT

Do not create one “SuperTable” or “UniversalCard” component that contains dozens of domain-specific conditionals.

Use:

```text
primitive
→ product component
→ domain composition
```

---

# 204. SERVER AUTHORITY IN UI

The frontend must never become authoritative for:

- totals;
- tax;
- payment state;
- allocation;
- balances;
- entitlement;
- NRS status;
- reconciliation outcome.

It can preview.

It cannot decide.

---

# 205. FORM/API BOUNDARY

All financial command forms should conceptually follow:

```text
User input
↓
Client validation
↓
Server command
↓
Authoritative response
↓
Resource refresh
↓
Success/failure UI
```

Do not infer final state from request success alone.

---

# 206. RESOURCE INVALIDATION

After mutation, refresh:

- target resource;
- directly affected parent views;
- dashboard/read-model surfaces where required.

Example:

Payment recorded:

```text
Payment list
Invoice detail
Customer balance
Receivables
Dashboard
```

should converge on server state.

---

# 207. STALE DATA HANDLING

If a page is stale:

- show loading/refresh where appropriate;
- do not silently overwrite a newer user change;
- prefer server result after mutation;
- show updated timestamp where operationally useful.

---

# 208. DATA FORMATTING CENTRALIZATION

Centralize:

- currency formatting;
- date formatting;
- relative time;
- state labels;
- number abbreviations.

Do not implement each in individual pages.

---

# 209. FINANCIAL FORMAT HELPERS

Required shared helpers:

```text
formatMoney()
formatCompactMoney()
formatDate()
formatDateTime()
formatRelativeTime()
formatInvoiceNumber()
getFinancialStatusPresentation()
```

These format/display data.

They must not mutate or recalculate financial values.

---

# 210. COMPONENT TESTING

For each meaningful component test:

- normal state;
- empty state;
- loading;
- error;
- long content;
- mobile behavior;
- accessibility;
- key permission variations.

---

# 211. SCREEN ACCEPTANCE TEST

Every screen must answer:

1. What is this page for?
2. What is the primary object?
3. What is the primary financial fact?
4. What is the primary action?
5. What happens if data is empty?
6. What happens while loading?
7. What happens on failure?
8. What happens on mobile?
9. Which information is authoritative?
10. Which actions are impossible in the current state?

---

# 212. MVP SCREEN QUALITY GATE

Before release:

- [ ] Signup works
- [ ] Onboarding works
- [ ] Customer create/list/detail works
- [ ] Invoice create works
- [ ] Invoice review works
- [ ] Invoice issuance state is clear
- [ ] Invoice detail works
- [ ] Public invoice works
- [ ] Send/share works
- [ ] Receivables works
- [ ] Manual payment works
- [ ] Receipt works
- [ ] Reminder works
- [ ] Paystack pending/success/failure states work where enabled
- [ ] Settings works
- [ ] Mobile flows work
- [ ] Empty/loading/error states exist
- [ ] Accessibility baseline passes

---

# 213. MATURE SCREEN QUALITY GATE

For new mature capabilities:

- [ ] Project UI
- [ ] Quote UI
- [ ] Milestone UI
- [ ] Project expense UI
- [ ] Collections UI
- [ ] Reconciliation UI
- [ ] NRS UI
- [ ] Multi-provider payment UI
- [ ] Team/RBAC UI
- [ ] Accountant workspace
- [ ] Multi-entity context
- [ ] Reporting
- [ ] Cash-flow
- [ ] API/developer UI
- [ ] AI assistance UI
- [ ] All capability gating states
- [ ] All mobile adaptations

are added only when the corresponding domain capability exists and is entitled.

---

# 214. DESIGN ANTI-PATTERNS

Never ship:

## Generic SaaS dashboard

- identical KPI cards;
- meaningless charts;
- template-like gradients.

## Generic fintech green

Green may mean paid. It does not need to be the brand.

## Excessive pills

Pills should be reserved for statuses, filters and similar compact semantics.

## Card explosion

Not every section needs a card.

## Decorative gradients

Only use gradients if a future brand system specifically establishes one.

## Financial icon overload

Do not use coins/wallets/arrows for every concept.

## Accounting-software intimidation

Do not expose ledger terminology or accounting complexity unless the product actually requires it.

## Status ambiguity

Do not use “Complete” when the real state is “Payment pending”.

## Payment ambiguity

Never imply payment succeeded before trusted confirmation.

## Colour-only semantics

Never.

## Hidden primary action

The next useful action should be nearby.

## Hover-only critical information

Important state must be visible without hover.

## Giant empty whitespace

Whitespace is useful. Empty screens should still communicate purpose.

## Premature enterprise complexity

Do not expose multi-entity, accountant, reconciliation or API concepts in MVP merely because the system is future-ready.

---

# 215. DESIGN HEURISTICS

## 3-second test

Can the user immediately tell:

- this is a financial product;
- what page they are on?

## 10-second test

Can they understand:

- what matters;
- what is owed;
- what needs attention?

## Money test

Does the amount feel trustworthy and readable?

## Action test

Can the user identify the next action without hunting?

## State test

Can the user distinguish:

- draft;
- issued;
- unpaid;
- partially paid;
- paid;
- overdue;
- pending;
- failed?

## Nigeria test

Does the design feel native to Nigerian business usage without cultural decoration?

## Scale test

Could the same language survive:

- 10 invoices;
- 10,000 invoices;
- accountant workflows;
- multiple entities;
- reconciliation?

---

# 216. PRODUCT DESIGN NORTH STAR

Kivo should feel:

> **Like a serious financial system that is remarkably simple to operate.**

Users should be able to move from:

```text
Uncertainty
↓
Understanding
↓
Action
↓
Outcome
```

without unnecessary interface friction.

---

# 217. FINAL DESIGN DIRECTIVE

Do not design:

> Stripe + Kuda + N26.

Do not design:

> an invoice generator with a dashboard.

Do not design:

> accounting software with fewer fields.

Design:

> **a world-class Nigerian commercial-to-cash operating product built around receivables clarity, payment control and financial confidence.**

The design should make the product's evolution feel natural:

```text
Invoice
   ↓
Receivable
   ↓
Collection
   ↓
Payment
   ↓
Reconciliation
   ↓
Cash
   ↓
Financial intelligence
```

The invoice may be the user's first touchpoint.

The user's true job is getting paid and understanding the money.

---

# 218. IMPLEMENTATION STANDARD

A coding agent receiving a Kivo UI task should not invent:

- colors;
- typography;
- state semantics;
- button conventions;
- financial amount formatting;
- table patterns;
- responsive behavior;
- loading states;
- error language;
- confirmation behavior;
- public invoice patterns;
- entitlement UI.

Use this document.

When the requested behavior is already defined by the PRD, domain model, UX specification or screen specification, follow it.

When the requested visual behavior is not defined elsewhere, follow this document.

When a new pattern is genuinely required, add it to the design system rather than creating a one-off.

---

# 219. FINAL STANDARD

The Kivo UI standard is:

> **Make the financial reality obvious.**

> **Make the next action clear.**

> **Make the outcome trustworthy.**

> **Make complexity feel controlled.**

> **Make the product unmistakably Kivo.**

That is the purpose of this document.

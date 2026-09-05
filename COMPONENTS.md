# Kivo Component Specification

**Status:** Component authority  
**Version:** 1.0  
**Scope:** Reusable Kivo UI and financial-domain components

---

## 1. Purpose

Kivo's component system has three layers:

```text
Primitive
   ↓
Product component
   ↓
Financial-domain component
```

Do not turn every component into a Kivo-specific abstraction.

Do not allow generic primitives to encode financial rules.

---

# 2. Component Architecture

## Layer 1 — UI primitives

Examples:

- Button
- Input
- Select
- Checkbox
- Radio
- Dialog
- Drawer
- Dropdown
- Tooltip
- Tabs
- Table
- Pagination
- Toast
- Skeleton
- EmptyState
- Alert
- FormField

These should remain reusable.

## Layer 2 — Kivo product components

Examples:

- PageHeader
- AppShell
- FinancialSummary
- InvoiceRow
- CustomerRow
- ActivityTimeline
- ReminderCard
- PaymentRow
- ReceivableRow
- InvoicePreview

## Layer 3 — Financial-domain components

Examples:

- MoneyAmount
- FinancialStatus
- InvoiceStatus
- PaymentState
- CollectionState
- OutstandingAmount
- PaymentSummary
- FinancialEvent
- ReceiptSummary

These encode Kivo's domain language.

---

# 3. MoneyAmount

## Purpose

Render authoritative monetary values consistently.

Example:

```tsx
<MoneyAmount
  amount={2400000}
  currency="NGN"
  emphasis="primary"
/>
```

## Requirements

- never accept floating-point financial values as authoritative input;
- currency must be explicit;
- support compact and full display modes;
- support positive, zero and negative values where the domain permits;
- align with Kivo numerical typography.

## Modes

```text
primary
secondary
table
compact
document
```

## Rules

Compact display:

```text
₦2.4m
```

Detailed display:

```text
₦2,400,000.00
```

The component must not silently change precision where exact financial representation is required.

---

# 4. FinancialStatus

## Purpose

Communicate semantic financial/operational state.

Props should conceptually include:

```text
kind
label
icon
size
```

Examples:

```text
Paid
Partially paid
Unpaid
Overdue
Due today
Due soon
Pending
Failed
```

Colour is supportive, never the only signal.

---

# 5. InvoiceStatus

Separate document state from payment and collection state.

```text
DRAFT
ISSUED
VOID
```

Do not make `InvoiceStatus` responsible for:

```text
PAID
OVERDUE
VIEWED
```

Those belong to separate semantic components.

---

# 6. PaymentState

Represents payment state:

```text
UNPAID
PARTIALLY_PAID
PAID
PENDING
FAILED
```

Where necessary, distinguish payment attempt/provider state from confirmed financial state.

---

# 7. CollectionState

Represents derived collection state:

```text
CURRENT
DUE_SOON
DUE_TODAY
OVERDUE
```

Collection state is not directly editable by the UI.

---

# 8. OutstandingAmount

Purpose:

Make remaining receivable prominent.

Example:

```text
₦1,400,000 outstanding
```

Should support:

- amount;
- label;
- optional due state;
- compact/full variants.

The component should not calculate authoritative balance itself.

---

# 9. FinancialSummary

Purpose:

Dashboard and detail-page summary.

Possible metrics:

```text
Invoiced
Collected
Outstanding
Overdue
```

It should support a hierarchy rather than making all four values visually identical.

---

# 10. InvoiceRow

Minimum conceptual data:

```text
Customer
Invoice number
Amount
Outstanding
Due
State
Primary action
```

Desktop is table-oriented.

Mobile becomes a compact financial card/list row.

The row should not expose every state simultaneously.

---

# 11. ReceivableRow

Primary purpose:

Move the user toward collection.

Information:

```text
Customer
Invoice
Outstanding
Due state
Days overdue
Primary action
```

Primary action should usually be:

> Remind

when overdue.

---

# 12. CustomerRow

Information:

```text
Customer
Contact
Outstanding
Invoice count
Last activity
```

Primary action:

> Open

Secondary actions remain contextual.

---

# 13. ActivityTimeline

Purpose:

Show material lifecycle events.

Examples:

- Invoice issued
- Invoice sent
- Invoice viewed
- Reminder sent
- Payment received

Do not expose raw backend events.

---

# 14. PaymentSummary

Used after confirmed payment.

```text
₦450,000 paid
Invoice INV-1042
Acme Ltd.
```

Should communicate outcome first.

---

# 15. InvoicePreview

Used in review and public/document contexts.

Must faithfully represent:

- seller;
- customer;
- invoice number;
- issue/due dates;
- line items;
- subtotal;
- tax;
- discount;
- total;
- payment instructions.

It should use the same domain data as the eventual PDF.

---

# 16. InvoiceForm

Should support two modes:

```text
Quick
Standard
```

Quick:

```text
Customer
Description
Amount
Due date
```

Standard:

```text
Customer
Line items
Quantity
Unit price
Discount
Tax
Payment instructions
Terms
Notes
```

Server remains authoritative for calculations.

---

# 17. MoneyInput

A financial input must:

- make currency explicit;
- avoid floating-point semantics;
- format user input safely;
- validate amount boundaries;
- preserve user intent.

Do not use generic numeric inputs blindly for financial amounts.

---

# 18. DateInput

Financial dates require explicit interpretation.

Support:

- issue date;
- due date;
- payment date.

User-facing dates should respect organization timezone.

Stored timestamps remain UTC.

---

# 19. ReminderComposer

Purpose:

Prepare a reminder action.

Show:

- customer;
- invoice;
- outstanding;
- due state;
- delivery channel;
- message preview.

MVP:

```text
Email
```

---

# 20. PaymentRecorder

Purpose:

Record a manual payment.

Fields:

```text
Amount
Date
Method
Reference
Note
```

Show:

```text
Outstanding before
Payment
Remaining after
```

The "remaining after" value is an authoritative response from the server, not a client-side financial assertion.

---

# 21. PaymentStatusBanner

Useful for payment pages and invoice detail.

States:

```text
Processing
Confirmed
Failed
Pending verification
```

Must clearly distinguish browser/network state from authoritative financial state.

---

# 22. EmptyState

Structure:

```text
Title
Explanation
Primary action
Optional secondary action
```

No decorative illustrations unless they materially help comprehension.

---

# 23. ErrorState

Structure:

```text
What happened
What it means
Recovery action
```

Financial errors should avoid ambiguous retry instructions.

---

# 24. LoadingState

Use:

- skeletons for predictable content;
- inline progress for local mutations;
- explicit processing states for financial operations.

---

# 25. ConfirmationDialog

Use only when:

- financial consequence;
- destructive action;
- difficult reversal;
- ambiguity.

Never use generic:

> Are you sure?

Use specific consequences.

---

# 26. DataTable

Generic table primitive with Kivo rules:

- readable density;
- right-aligned monetary values;
- predictable row actions;
- mobile transformation;
- accessible headers;
- sorting/filtering where relevant.

Do not use tiny typography to fit excessive columns.

---

# 27. PageHeader

Concept:

```text
Eyebrow/context
Title
Description
Primary action
Secondary actions
```

Financial pages should put the financial purpose near the title.

---

# 28. AppShell

Owns:

- navigation;
- top-level user context;
- responsive navigation;
- global feedback;
- page container.

It should not own domain data.

---

# 29. Component State Contract

Every stateful product component should explicitly consider:

```text
default
loading
success
empty
error
disabled
permission-limited
mobile
```

Financial components additionally consider:

```text
pending
confirmed
failed
immutable
terminal
```

---

# 30. Component Naming

Prefer domain nouns and explicit semantics.

Good:

```text
MoneyAmount
ReceivableRow
InvoiceStatus
PaymentSummary
ReminderComposer
```

Avoid:

```text
FancyCard
ModernTable
BlueBadge
UniversalStatus
```

Names should communicate purpose, not appearance.

---

# 31. Component Quality Bar

A component is ready when:

- its semantic purpose is clear;
- states are documented;
- accessibility behavior is defined;
- mobile behavior is defined;
- financial authority is explicit;
- it can be reused without copying implementation;
- it does not duplicate existing component behavior.

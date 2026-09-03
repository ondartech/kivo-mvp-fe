# Kivo UX Specification

**Status:** Product UX authority (supporting — canonical is `DESIGN.md` v2.1)  
**Version:** 1.1  
**Scope:** Customer-facing Kivo application and public invoice/payment experiences  
**Aligned to:** `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` verbatim + `KIVO_MVP2_ENGINEERING_BACKLOG.md §6/§7` + `DESIGN.md v2.1`  
**Updated:** 4 September 2026

---

## 1. Purpose

`UX.md` translates Kivo's product thesis and design authority into an interaction model.

It answers:

> How should Kivo behave and feel as a product?

It sits between `DESIGN.md` v2.1 (canonical) and `SCREENS.md` v1.1.

- `DESIGN.md` v2.1 defines the design language and principles (canonical).
- `UX.md` v1.1 defines interaction principles and user experience behavior (supporting).
- `SCREENS.md` v1.1 defines individual product surfaces (supporting).
- `COMPONENTS.md` defines reusable UI contracts (supporting).
- `DESIGN-TOKENS.md` v1.1 defines concrete visual primitives (supporting — now includes `slate` for NRS `UNKNOWN`).
- `FRONTEND.md` v1.1 defines implementation conventions (supporting).

> **Canonical note:** On presentation conflicts, `DESIGN.md v2.1` wins. This file details *interaction* only and points at `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` + `KIVO_MVP2 §6/§7` for scope (`Project` no `contract_value/budget`, `Expenses` cut).

The Kivo MVP must prove one continuous loop:

```text
Customer
→ Invoice
→ Send
→ View
→ Due
→ Reminder
→ Payment
→ Receipt
→ Receivable visibility
```

The MVP is not an accounting system. The product should feel like a focused financial operating tool for getting paid.

---

# 2. UX North Star

> **Make getting paid as simple as sending an invoice.**

The product should continuously help the owner answer:

1. Who owes me money?
2. How much?
3. When is it due?
4. What is overdue?
5. What should I do next?
6. What happened after I acted?

The experience should move users from **uncertainty → understanding → action → outcome**.

---

# 3. Primary User

The MVP is designed for a digitally active Nigerian B2B micro or small service business, typically:

- 1–10 employees;
- 5–100 invoices/month;
- frequent bank-transfer payments;
- frequent WhatsApp/email communication;
- limited appetite for accounting complexity.

The primary application role is **Owner**.

Do not design the MVP around accountant workflows, enterprise RBAC or ERP-style administration.

---

# 4. UX Principles

## 4.1 Receivables-first

Kivo is not primarily a document generator.

Every important surface should connect invoices to:

- amount owed;
- due date;
- payment state;
- collection state;
- next action.

## 4.2 Shortest path to first value

The canonical activation path is:

```text
Signup
→ Create business
→ Add customer
→ Create invoice
→ Review
→ Send
```

The user should not need to configure a financial system before sending the first invoice.

## 4.3 Quick mode

The fastest invoice path should allow:

```text
Customer
Description
Amount
Due date
```

Advanced fields can be progressively disclosed.

## 4.4 Progressive disclosure

Advanced configuration such as:

- tax;
- discounts;
- bank details;
- terms;
- templates;

should not obstruct the first invoice unless genuinely required.

## 4.5 Financial clarity

The UI must distinguish:

- document state;
- payment state;
- collection state;
- view state.

Never collapse these into one generic status.

## 4.6 Actionability

When the product says something is overdue, the next useful action should be nearby.

Example:

```text
Acme Ltd.
₦2,400,000
4 days overdue

[Remind customer]
```

## 4.7 Preserve user intent

Forms should:

- preserve safe local draft state;
- warn before destructive navigation when unsaved work exists;
- recover from network errors;
- allow retry;
- avoid duplicate financial commands.

## 4.8 Server authority

The frontend displays authoritative server state.

It must never invent:

- invoice totals;
- payment confirmation;
- balance;
- financial status.

The frontend may provide immediate UX feedback, but the server determines the financial truth.

---

# 5. Mental Model

Kivo should present a simple mental model — MVP2 extends `Invoice` with `Project → Quote → Milestone → NRS` per `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md §13–16` + `KIVO_MVP2 §6.1/6.2/6.4`:

```text
Customer
   |
   +--> Project (no contract_value/budget, no Expenses — cut RECON §2)
   |        |
   |        +--> Quote (DRAFT→SENT→ACCEPTED → ConvertQuoteToInvoice)
   |        |
   |        +--> Milestone (PENDING→IN_PROGRESS→COMPLETED → READY_TO_BILL → PrepareMilestoneInvoice)
   |                 |
   |                 +--> Invoice (project_id nullable 0..1 KIV-BE-160)
   |
   +--> Invoice (direct)
            |
            +--> NRS (NOT_REQUIRED/PENDING/SUBMITTED/VALIDATED/APPROVED/REJECTED/UNKNOWN — compliance secondary per KIVO × NRS SPEC)
            |
            +--> Delivery
            |
            +--> View
            |
            +--> Due
            |
            +--> Reminder
            |
            +--> Payment
                    |
                    +--> Receipt
            |
            +--> Outstanding balance
```

The user should not need to understand the underlying financial domain model to operate the product. `Team` is cut (`Membership+Role` covers — RECON §2 row4); `ProjectExpenses` cut.

---

# 6. Financial State Model

## Invoice document

```text
DRAFT → ISSUED → VOID
```

Issued invoices are immutable.

## Payment

```text
UNPAID → PARTIALLY_PAID → PAID
```

## Collection

```text
CURRENT
DUE_SOON
DUE_TODAY
OVERDUE
```

Collection state is derived.

## View

```text
UNVIEWED → VIEWED
```

View state is independent of payment state.

## Provider payment attempt

```text
CREATED → INITIATED → SUCCEEDED | FAILED
```

A browser redirect is not payment truth.

---

# 7. Interaction Rules for Financial Actions

Financially consequential actions require higher interaction discipline.

## Issue invoice

Before issuing:

- show final customer;
- show final amount;
- show due date;
- show important taxes/discounts;
- make clear that issuance creates the immutable financial snapshot.

After issuing:

- disable draft editing;
- show issued state;
- provide send/share/download actions;
- show processing state if PDF generation is still asynchronous.

## Record manual payment

Show:

- invoice;
- outstanding balance;
- payment amount;
- payment date;
- payment method;
- optional reference/notes.

If partial:

> ₦300,000 received  
> ₦150,000 remaining

Do not allow the UI to create an impossible balance.

## Paystack payment

The flow must clearly distinguish:

```text
Payment initiated
Payment pending
Payment confirmed
Payment failed
```

Never tell the user "Paid" solely because they returned from a PSP page.

---

# 8. Collection UX

Kivo's collection experience should answer:

> Who should I follow up with today?

A useful collection surface should rank attention by financial relevance.

Suggested conceptual ordering:

1. overdue;
2. due today;
3. due soon;
4. recently unpaid;
5. recently paid.

Do not make users inspect charts to discover overdue invoices.

---

# 9. Dashboard UX

The dashboard is an operational surface.

Primary hierarchy:

```text
What is owed
↓
What needs attention
↓
What changed
↓
Supporting insight
```

Core information:

- invoiced;
- collected;
- outstanding;
- overdue;
- overdue invoices/customers;
- recent invoices;
- recent payments;
- upcoming due items.

Charts are secondary.

---

# 10. Customer UX

A customer is a long-term data asset.

Customer detail should connect:

```text
Customer
→ invoices
→ payments
→ outstanding
→ recent activity
```

The user should be able to answer:

> What does this customer owe me, and what has happened historically?

Avoid turning Customer into a generic CRM profile.

---

# 11. Invoice UX

An invoice is a living financial object.

The detail experience should expose:

- customer;
- invoice number;
- amount;
- outstanding;
- due date;
- document state;
- payment state;
- collection state;
- view state;
- delivery history;
- activity;
- payment history;
- available actions.

The invoice PDF is an output of the invoice object, not the primary object itself.

---

# 12. Public Invoice UX

A recipient does not need a Kivo account.

The public invoice should be:

- fast;
- trustworthy;
- minimal;
- mobile-friendly;
- clearly branded;
- explicit about amount and due date;
- clear about payment state;
- capable of payment when enabled.

Public pages must expose only the minimum necessary customer information.

---

# 13. Reminder UX

Reminders are operational actions, not marketing automation.

The UI should make clear:

- what invoice is being reminded;
- customer;
- amount;
- due/overdue state;
- channel;
- when the reminder was/will be sent;
- result.

For MVP, email is the primary reminder channel.

---

# 14. Feedback States

Every meaningful action should have four classes of feedback:

### Immediate

The UI acknowledges the action.

### Processing

The UI communicates that work is still occurring.

### Success

The UI communicates the authoritative result.

### Failure

The UI explains what happened and gives the safest recovery path.

Financial operations must never leave the user guessing whether an action happened.

---

# 15. Error UX

Use:

```text
What happened
Why it matters
What can I do now?
```

Example:

> **Payment confirmation is still pending.**  
> Kivo has not yet received trusted confirmation from the payment provider.  
> You can safely leave this page; we'll update the invoice when confirmation arrives.

Do not ask the user to manually retry a payment merely because a browser request timed out.

---

# 16. Empty States

Empty states should teach the product.

Example dashboard:

> **No invoices yet**  
> Create your first invoice and start tracking what you're owed.  
> [Create invoice]

Example customers:

> **Add your first customer**  
> Customers are the starting point for invoices and receivables.  
> [Add customer]

---

# 17. Mobile UX

Primary flows must work comfortably on mobile:

- onboarding;
- customer creation;
- invoice creation;
- invoice review;
- invoice sharing;
- dashboard attention;
- manual payment;
- public invoice;
- payment.

Desktop can expose more density. Mobile should preserve the same financial hierarchy.

---

# 18. Accessibility UX

Do not rely on colour alone.

All financial state must have semantic text.

Keyboard and assistive-technology users must be able to:

- create invoices;
- navigate invoice detail;
- understand status;
- complete forms;
- recover from errors;
- execute available actions.

---

# 19. UX Anti-Patterns

Avoid:

- accounting jargon without user value;
- dashboard-as-data-dump;
- modal-heavy workflows;
- unnecessary confirmation dialogs;
- hidden financial states;
- generic "Success!" messages;
- payment ambiguity;
- excessive setup before first invoice;
- mobile layouts that merely shrink desktop tables;
- decorative animation that delays action.

---

# 20. UX Acceptance Test

A new user should be able to move through:

```text
Signup
→ Business
→ Customer
→ Invoice
→ Review
→ Send
```

without needing documentation.

An existing user should be able to answer:

> Who owes me money?

within seconds.

And:

> What should I do about it?

immediately afterward.

That is the core Kivo UX standard.

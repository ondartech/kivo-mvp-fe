# Kivo Design Tokens

**Status:** Token architecture (supporting — canonical is `DESIGN.md` v2.1)  
**Version:** 1.1  
**Scope:** Concrete visual primitives for Kivo's design system  
**Aligned to:** `KIVO — MVP PRODUCT REQUIREMENTS DOCUMENT UPDATED.md` verbatim + `KIVO_MVP2_ENGINEERING_BACKLOG.md §6` + `DESIGN.md v2.1` `slate` for NRS `UNKNOWN`  
**Updated:** 4 September 2026

---

## 1. Purpose

This document defines the token architecture that turns Kivo's design language into implementation-ready primitives.

Where the brand identity is not yet finalized, values are explicitly marked as **Design Exploration**.

The token system must separate:

```text
Primitive tokens
→ Semantic tokens
→ Component usage
```

Never hard-code raw colours throughout product components.

---

# 2. Token Layers

## Primitive

Raw design values.

```text
color.blue.500
space.4
radius.md
font.size.14
```

## Semantic

Meaning in Kivo.

```text
color.text.primary
color.surface.default
color.financial.overdue
color.action.primary
```

## Component

Specific component mapping.

```text
button.primary.background
invoice.status.overdue.text
```

Components should consume semantic tokens wherever possible.

---

# 3. Colour

## 3.1 Brand

**Design Exploration**

```text
brand.primary
brand.primary-hover
brand.primary-active
brand.secondary
brand.on-primary
```

Do not assume Kivo's primary brand colour is green.

## 3.2 Neutral

Conceptual scale:

```text
neutral.0
neutral.50
neutral.100
neutral.200
neutral.300
neutral.400
neutral.500
neutral.600
neutral.700
neutral.800
neutral.900
neutral.950
neutral.1000
```

Final values: **Design Exploration**.

## 3.3 Semantic

```text
success
success-subtle
success-text

warning
warning-subtle
warning-text

critical
critical-subtle
critical-text

info
info-subtle
info-text

processing
processing-subtle
processing-text
```

## 3.4 Financial

```text
financial.paid
financial.partial
financial.due
financial.overdue
financial.pending
financial.failed
financial.neutral
```

Financial semantics must remain consistent across the application.

---

# 4. Typography

## 4.1 Font families

**Design Exploration**

The final typeface must:

- render NGN and numerical values exceptionally well;
- support Latin UI text;
- have strong tabular figures;
- perform well on web and PDF surfaces.

Conceptual tokens:

```text
font.family.display
font.family.body
font.family.mono
```

A separate display face is optional. Do not introduce one merely for visual novelty.

## 4.2 Sizes

Conceptual scale:

```text
xs
sm
md
lg
xl
2xl
3xl
4xl
```

Final values: **Design Exploration**.

## 4.3 Weights

```text
regular
medium
semibold
bold
```

Avoid excessive weight variation.

## 4.4 Line heights

```text
tight
normal
relaxed
```

Financial tables should prioritize compact readability.

---

# 5. Numerical Typography

Money is a first-class visual element.

Required conceptual tokens:

```text
numeric.display
numeric.primary
numeric.secondary
numeric.table
numeric.document
```

Where supported, use tabular numerals for aligned financial data.

---

# 6. Spacing

Use a consistent base spacing system.

Conceptual scale:

```text
space.0
space.1
space.2
space.3
space.4
space.5
space.6
space.8
space.10
space.12
space.16
space.20
space.24
space.32
```

Final base unit and values: **Design Exploration**.

Spacing should support Kivo's calm/precise character without making operational screens excessively sparse.

---

# 7. Radius

Conceptual:

```text
radius.none
radius.sm
radius.md
radius.lg
radius.xl
radius.full
```

Use `full` sparingly.

Avoid making the entire application pill-shaped.

---

# 8. Borders

```text
border.width.default
border.width.strong
border.color.default
border.color.strong
border.color.focus
```

Borders should establish structure quietly.

---

# 9. Elevation

Conceptual:

```text
elevation.none
elevation.subtle
elevation.surface
elevation.overlay
```

Prefer separation through layout and surface before shadows.

---

# 10. Layout

```text
layout.content.max
layout.content.narrow
layout.page.padding
layout.section.gap
layout.sidebar.width
layout.header.height
```

Exact values: **Design Exploration**.

---

# 11. Breakpoints

Conceptual responsive tiers:

```text
mobile
tablet
desktop
wide
```

Recommended starting implementation values may be established in the frontend codebase after layout exploration.

Do not create breakpoints merely because a device exists. Breakpoints should correspond to layout changes.

---

# 12. Control Sizing

Conceptual:

```text
control.sm
control.md
control.lg
```

Interactive targets must remain accessible on touch devices.

---

# 13. Motion

Conceptual:

```text
motion.duration.instant
motion.duration.fast
motion.duration.normal
motion.duration.slow

motion.easing.standard
motion.easing.enter
motion.easing.exit
```

Motion should communicate:

- processing;
- success;
- state transition;
- hierarchy.

Never use motion to make financial workflows feel like games.

---

# 14. Focus

```text
focus.ring.color
focus.ring.width
focus.ring.offset
```

Focus must be visible and accessible.

---

# 15. Component Semantic Tokens

Components should map to semantic tokens.

Example:

```text
button.primary.background
button.primary.background-hover
button.primary.text

input.background
input.border
input.border-focus
input.text
input.placeholder

status.overdue.background
status.overdue.text
status.overdue.icon
```

---

# 16. Financial Semantic Mapping

Conceptual mapping:

```text
PAID
→ positive semantic

PARTIALLY_PAID
→ informational/neutral-positive semantic

DUE_SOON
→ warning semantic

DUE_TODAY
→ warning/attention semantic

OVERDUE
→ critical semantic

PENDING
→ processing semantic

FAILED
→ critical semantic

UNKNOWN (NRS)
→ slate semantic — new slate token (see §3.3b)
```

The exact colour assignments remain subject to accessibility testing and brand exploration.

### 3.3b Slate — NRS `UNKNOWN` (new)

Conceptual scale (added 4 Sep 2026 for `KIVO_MVP2 §6.4 KIV-BE-221` 7-state `UNKNOWN` blocking resubmit):

```text
slate.50   #F8FAFC  // background for UNKNOWN badge
slate.200  #E2E8F0  // border
slate.600  #475569  // text/icon
slate.700  #334155  // text/icon strong
```

Tokens:
```text
status.unknown.background: slate.50
status.unknown.text: slate.600
status.unknown.border: slate.200
status.unknown.icon: slate.600
```

Use `slate` only for `NRS UNKNOWN` (and future `NOT_REQUIRED` neutral). Do not use for generic financial states.

---

# 17. Invoice Document Tokens

The invoice PDF/public document requires its own controlled token layer:

```text
invoice.page
invoice.text
invoice.muted
invoice.border
invoice.accent
invoice.total
invoice.status
```

Document styling should align with the application but remain optimized for print, PDF and customer trust.

---

# 18. Token Governance

Rules:

1. Raw colour values belong in token definitions, not components.
2. Components consume semantic tokens.
3. New tokens require a demonstrated design need.
4. Do not create one-off tokens for individual screens.
5. Financial semantics must be centralized.
6. Token changes should be reviewed for cross-screen impact.
7. Accessibility must be rechecked after semantic colour changes.

---

# 19. Token Completion Criteria

The token system is ready for production implementation when:

- brand colours are finalized;
- typography is finalized;
- semantic colours pass contrast testing;
- spacing scale is tested across desktop/mobile;
- controls meet touch/accessibility requirements;
- invoice/PDF output has been validated;
- tokens are represented in the codebase as a single source of truth.

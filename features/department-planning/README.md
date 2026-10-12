# DPLAN-016 — Department Planning Workspace (frontend draft)

Backend dependency: [backend PR #2582](https://github.com/ondartech/kivo-mvp-be/pull/2582); DPLAN implementation issue [#2580](https://github.com/ondartech/kivo-mvp-be/issues/2580).

The protected route `/app/department-planning` contains role-scoped, read-only departmental planning evidence: assigned campaigns, deadlines, DPLAN-003 non-spendable targets, DPLAN-004 submissions, DPLAN-010 recommendations, DPLAN-011 Finance review, DPLAN-012 proposal rollup, DPLAN-013 exact source-currency planning target comparisons and DPLAN-015 immutable baseline replanning. DPLAN-014 corporate sign-off is documentary rather than budget adoption.

Tenant authentication is **server enforced**. The frontend converts the currently authenticated legacy membership organization ID to verified public identity using existing `/auth/organization-identities` before querying the DPLAN backend. It only allows campaigns from the server-returned actor inbox and does not manufacture action links. A missing assigned scope, 403, 404, stale error or incomplete source produces explicit states rather than broader fallback access.

The displayed BUD adopted budget, BUD+COMMIT available balance, COMMIT obligations, GL posted actuals, FCST, budget and forecast variance remain `NOT_AVAILABLE_UNMAPPED` until backend financial crosswalk certification is implemented. The FE tests ensure null/unverified monetary values are **never** rendered as zero and original decimal strings are never recomputed with JS floats.

**Not release-ready**: role, scope, source drift and end-to-end browser/API runtime certification; backend predecessors DPLAN-001–015; pagination; planning contributor queue; responsive accessibility review; real financial source adapters; generated OpenAPI sync. The navigation link is visible but does not grant access: server denial is displayed directly.

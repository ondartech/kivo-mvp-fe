# PRO-007C — Professional Services First-Class Workspace (frontend)

Issue: [PRO-007C #114](https://github.com/ondartech/kivo-mvp-fe/issues/114) · Parent backend [PRO-007 #2368](https://github.com/ondartech/kivo-mvp-be/issues/2368) · Dependencies PRO-007A PR #2369 and PRO-007B PR #2380 (both open when this frontend slice was authored).

## Implemented route
- `/app/professional-services` (Next.js App Router); only included in desktop/mobile domain navigation after the authenticated, principal-effective PRO-007B endpoint resolves and the organization has relevant industry/pack evidence. No unauthorized hardcoded Services navigation.
- Authenticated `GET /api/v1/organizations/{orgId}/industry-packs/professional-services/workspace/effective` with optional `engagement_pattern`. `GET /industry-ux/terminology` supplies canonical display vocabulary; when unavailable, the UI states that generic labels are shown.
- Source-backed engagement pattern switch (Project, Retainer, Time-based) is an **advisory view**, not activation, configuration mutation or an assertion of installation.
- Lifecycle cards for proposal/customer, contract/SOW, time/delivery, client acceptance and billing/collections; each describes the owning authority and provides an actionable link **only** if PRO-007B explicitly authorizes the action and the frontend implements its exact destination.
- Real commercial Project list from existing Project API, limited by the current operating Branch and server membership authorization; error/403/empty, multi-branch selection and loading states are visibly distinct. No synthetic revenue/deliverable/milestone counts.
- Guided setup using returned IUX steps; role-pack/WFP/dashboard installation status using PRO-007B states; no widget values or hidden data synthesized.
- Document family availability is explicitly **not** interpreted as document rendering, e-signature or external counterparty acceptance. Approved time, earned revenue, invoice issuance/payment and NRS fiscalization remain separate truth sources.
- Responsive page sections, semantic headings, native selectable controls, focus-visible styles, loading/empty/error states, and an explicit retry.

## Safety/access invariants
1. Client validates `catalogue.organization_id`, `pack_key`, required authority boundary and every returned action's organization before display.
2. All new-action destinations are exact allowlisted (action key **and** backend destination key), must exist in this FE, and are never constructed from arbitrary backend strings. If a link's Branch scope differs from the currently selected Branch, the link is suppressed; owning create pages retain final IAM/scope validation.
3. No frontend CMP installation POST/plan/apply or AI-triggered installation. The eligibility badge explains human consent and CMP-014 plan/apply obligations; preview token is not rendered.
4. User can view role-pack organizational health without being represented as assigned any IAM role. Installed dashboards are distinct from user-visible widgets; workflow ACTIVE means installation state, not execution.
5. The workspace never equates acceptance/approval with invoice, GL, cash or fiscal status.
6. The frontend is hidden from global navigation until a successful effective workspace response; directly accessing the URL still uses the same scope and API guards.

## Outstanding work / release gates
- Explicitly connect quote/contract/retainer/time/deliverable read views when the backend publishes member-authorized scoped projections; do not invent APIs, signatures or statuses.
- Explicit CMP-014 onboarding plan/apply screen with review and entitlement/scope checks is not in this FE slice. The backend returns acceptance paths/tokens but this page does not mutate CMP state.
- Implement full e2e browser tests (desktop/mobile, keyboard/screen reader, branch-scoped access, read-only memberships, cross-tenant, hidden modules, expired token, IUX drift) against a deployed backend with PRO-007A/B. Conformance unit tests were authored, not executed in this session.
- Backend PRO-007D #2378 and earlier PRO-002R/003A/004A/006D certification remain required.
- No production deployment or backend runtime certification is implied by source PR merging.

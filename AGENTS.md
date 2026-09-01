# AGENTS.md — `kivo-mvp-fe`

## 1. Purpose

Operating contract for AI agents in `kivo-mvp-fe` — Next.js App Router consumer of `kivo-mvp-be` contract (`openapi.json`). No business logic in FE; never calculate `grand_total`. Preserve design-system + accessibility + mobile-first.

## 2. Instruction Hierarchy

1. System instructions. 2. User request. 3. Nearest `AGENTS.md`. 4. Parent `AGENTS.md`. 5. Architecture (`kivo-docs/` subtree) 6. PRD 7. Existing implementation (Tailwind/shadcn/RHF+Zod/TanStack) 8. Judgment.

## 3. Repository Scope

**Name:** `kivo-mvp-fe`  
**Purpose:** Next.js 15 `App Router` + TS Strict + Tailwind 3 + `shadcn/ui` + `RHF+Zod` + `TanStack Query` — consumes `kivo-mvp-be` `openapi.json` (`generated/openapi.ts`) via `lib/api-client.ts`. Routes under `app/(auth)`, `app/(app)/[orgId]`, `app/(public)/i/[token]`. No PG access.

**Primary Technologies**

* Language: `TypeScript 5.5` strict
* Frontend: `Next.js 15 App Router (RSC)` + `React 19`
* UI System: `Tailwind CSS 3 + shadcn/ui (Radix) + Inter font`
* Database: `N/A — API only`
* Infrastructure: `Azure Container Apps` `ca-kivo-web` (`pnpm build` standalone)
* Messaging: `N/A — reads domain_events via polling GET /ready`
* Testing: `vitest + playwright (e2e against staging BE) + axe (accessibility) + schemathesis contract --check`
* Package Manager: `pnpm 9` (`pnpm-workspace.yaml` removed — isolated repo; contract via artifact)

**Structure**

```text
kivo-mvp-fe/
├── app/
│   ├── layout.tsx                # RootLayout + QueryProvider + Toaster
│   ├── (auth)/login|signup|verify|forgot|reset
│   ├── (app)/[orgId]/            # OrgGuard requireOrgMembership, OrgContext
│   │   ├── dashboard/            # GET /dashboard/receivables KPIs + Overdue
│   │   ├── customers/            # list/search + new + [customerId]
│   │   ├── invoices/             # list(6 filters) + new + [invoiceId] (Issue/Void)
│   │   ├── payments/             # list + new + [paymentId]
│   │   ├── reports/              # aging + history
│   │   └── settings/business-profile|billing|members
│   └── (public)/i/[token]/       # SSR ETag, minimal PII
├── features/<domain>/api.ts + schema.ts + form.tsx  # per-domain vertical slice
├── components/ui/                # shadcn generated primitive
├── components/layout/            # AppHeader, OrgSwitcher, EntitlementBanner
├── lib/api-client.ts             # fetchWithAuth + X-Request-Id + Idempotency-Key
├── lib/money.ts                  # formatMoney display-only
├── lib/env.ts                   # zod NEXT_PUBLIC_API_URL
├── hooks/useEntitlement.ts
├── generated/                    # openapi.json + openapi.ts + zod (gitignored, sync-contract.sh)
├── scripts/sync-contract.sh      # curl OPENAPI_URL + openapi-typescript
└── tests/
```

## 4. Authoritative Documentation

Inspect `kivo-docs/API_CONTRACTS.md` (13 contexts, 65 endpoints, `GET /health` never DB), `kivo-docs/FRONTEND_SPEC.md` (per-page `purpose|route|permissions|components|states|loading|empty|error|interactions`), `kivo-docs/Security.md:9` tenant isolation, `kivo-docs/REPOSITORY.md:3` route groups, `kivo-docs/ADRs/0014` versioning, `kivo-docs/BACKEND_MODULES.md:15` money pyramid, `README.md`.

Source-of-truth: explicit user req → `ADRs/` → `architecture.md` → FE spec. Never invent `grand_total` calc.

## 5. Core Engineering Principles

Correctness (satisfy `INV-001..009`, preserve `Decimal` string), Simplicity (no new UI pattern when `shadcn` exists), Explicitness (`useEntitlement` server gate), Locality (behavior in `features/invoicing`, not `lib/`), Determinism (idempotent `POST /issue` with `crypto.randomUUID()` per action, persisted in `sessionStorage`), Observability (`X-Request-Id` on every fetch), Security by Default (never `parseFloat` for money).

## 6. Architecture Rules

* FE MUST NOT calculate `grand_total` — use `POST /calculate` preview `preview:true` badge.
* `lib/money.ts` is display-only; `scripts/check-money-usage.sh` fails on `parseFloat|Number(` in `app/ features/`.
* `features/<domain>/api.ts` imports `generated/openapi.ts` — no `features/customers` imports `features/invoices`.
* `lib/api-client.ts` is the only fetch boundary — adds `Authorization`, `X-Request-Id`, `Idempotency-Key`.
* No direct `fetch` to PG/Blob; use BE SAS.
* Tenant isolation: every `(app)/[orgId]` layout calls `requireOrgMembership(orgId)` RSC `redirect('/login')` if fail; never trusts path `orgId`.

## 7. Bounded Contexts

Same 13 as BE, but FE view: `Identity & Access` (`(auth)`), `Organization & Business` (`settings/business-profile`), `Customer` (`customers`), `Invoicing` (`invoices/new|list|[id]`), `Receivables` (`dashboard`), `Payments` (`payments/new`), `Provider` (`payments/[id]` Paystack intent), `Collections` (`reminders` badge), `Communications` (`invoices/[id]/communications` timeline), `Documents` (`/i/[token]` PDF 302 SAS), `Subscription` (`settings/billing` `UsageBar`), `Audit` (`audit-events` timeline), `Reporting` (`reports/aging`).

Each context owns its `features/<domain>/` slice; must not bypass `lib/api-client.ts`.

## 8. Domain Invariants

FE must preserve BE invariants visually: show `DRAFT` editable vs `ISSUED` immutable (Edit hidden), `VOID` opacity-50, `UNPAID→PAID` badge derived (never client-writable), `OVERDUE` `amber` derived, `404` cross-tenant (not `403`), `grand_total` never typed.

## 9. Multi-Tenancy

`MULTI_TENANT` `Tenant=Organization`. Enforced via `requireOrgMembership(orgId)` RSC per layout + `api-client` `Authorization` header. Every query `WHERE organization_id=:ctx` validated BE-side; FE never caches across `orgId`. No `organization_id` in `localStorage` beyond `OrgContext`.

## 10. Authentication and Authorization

`JWT RS256` `15m` + `7d refresh` from `kivo-mvp-be` (`supabase`), `httpOnly` BFF cookie via `app/(auth)`. `requireOrgMembership` → `GET /auth/me` memberships. RBAC `OWNER` MVP, `VIEWER` hidden `New` button (not disabled). `EntitlementGate` hides `New invoice` when `invoices.monthly` but BE still gates `403`.

## 11. Data Access Rules

`N/A` DB — only `lib/api-client.ts` `fetchWithAuth`. Respect `limit 1..100` cursor `base64` vs `generated/openapi.ts` types. Consider `keepPreviousData` for pagination.

## 12. Database Migration Rules

`N/A` — FE has no DB. Never add `prisma` or `dexie` without `ADR`.

## 13. API Rules

REST `JSON` `Decimal as string` (never number), `timestamptz` RFC3339. `extra="forbid"` mirrored in `Zod` `strict()`. Version `URI /api/v1` additive-only.

Handler pipeline `Zod validation → lib/api-client → TanStack useMutation → response mapping → Toaster`. No `grand_total` in request.

## 14. Error Handling

Map `API_CONTRACTS.md:0.4` `error.code` → UI `ErrorState` per `FRONTEND_SPEC.md:0.3`. Never expose stack.

## 15. Idempotency and Reliability

`Idempotency-Key` `crypto.randomUUID()` per submit, persisted `sessionStorage` per action `issue_invoice:{id}`. `20 parallel POST /issue` different keys → 20 distinct numbers tested via `schemathesis` contract.

## 16. Background Jobs and Events

FE polls `GET /document` every 5s until `READY` after `POST /issue` (since `POST /issue` enqueues `domain_events` async). No direct `LISTEN/NOTIFY`.

## 17. External Integrations

| Integration | Purpose | Failure Strategy |
|---|---|---|
| `kivo-mvp-be` (`NEXT_PUBLIC_API_URL`) | All data | `401` → redirect `/login`, `429` → `Retry-After` `Toaster` |

No vendor SDK in domain; `lib/api-client.ts` isolates.

## 18. Secrets and Configuration

Never commit `NEXT_PUBLIC_` secrets beyond `NEXT_PUBLIC_API_URL`. `env.ts` `zod` validates env. No `.env` real credentials.

## 19. Logging and Observability

FE `console.error` + `Toaster` + `X-Request-Id` copy for support. Include `request_id` from BE `error.request_id` in `ErrorBoundary` `Copy request_id`.

## 20. Testing Requirements

`vitest` unit (Zod schema), `playwright` e2e against staging BE (`signup→issue→public view→PDF`), `axe` criticals `0`, `openapi.json --check` contract.

## 21-49. Same as `kivo-mvp-be` AGENTS adapted (Quality, Type Safety TS strict `noAny`, Frontend Rules shadcn variants `cva`, Accessibility WCAG 2.1 AA on `/invoices/new`, Performance `p95<500ms` public `ETag`, Security `grand_total` never typed, Audit read via `GET /audit-events`, Git conventional commits `feat(fe): ...`, Validation `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, DoD `axe` + `openapi.ts` synced).

Repository-Specific Commands:
```bash
pnpm sync-contract.sh   # curl OPENAPI_URL + openapi-typescript
pnpm dev                # next dev -p 3000
pnpm test               # vitest
pnpm typecheck          # tsc --noEmit
pnpm build              # next build
```

# ONDAR-ENG — Development-Only Integration Mode

**Effective:** 2026-10-17  
**Status:** Active engineering policy; repository-level GitHub settings are only enforced when verified.  
**Release certification:** Suspended / NOT EXECUTED.  
**Production readiness:** NOT CERTIFIED.

## Branch contract

- `dev`: sole active integration destination; new feature branches must originate from current `dev`.
- `feature/*`: implement, review and perform feasible local checks; merge into `dev` only.
- `staging` and `main`: frozen reference branches. **No new feature merges, direct pushes, resets, deletions, promotions or deployments from these branches.**
- Existing history on `main` and `staging` must be retained. Reconcile any release-only commits *into* `dev` using reviewed PRs, never in reverse.
- `release/*`: inactive until a deliberately approved release-qualification cycle.

## Development acceptance

A card may be marked **Implemented — Development Verified** after review and relevant locally executable unit, type/lint, database, migration, security and contract checks, with recorded evidence. Do not describe unrun checks as passing.

GitHub-hosted CI, full PostgreSQL integration, end-to-end certification, deployment qualification and production approval remain separate gates. If not run, record **NOT EXECUTED** and the blocker. `dev` merging does **not** imply production safety.

## Runtime and automation safety

- Automatic `staging` / `main` promotion must remain suspended.
- Disable repository Actions in GitHub settings during the funding hold if a complete CI pause is desired; this document alone does **not** disable all workflows.
- Any `dev` deploy/apply workflows specifically patched for this mode must retain their disabled trigger and job guard until deliberate reactivation.
- Audit schedules, `workflow_dispatch`, external deployment integrations, infrastructure apply, branch protections/rulesets and environment approvals; branch freezing by policy is not equivalent to technical enforcement.

## Release-mode activation criteria

1. Confirm GitHub billing/runner availability and re-enable the intended CI suite.
2. Reconcile all outstanding `dev` history and close conflicting integration PRs.
3. Establish protected `dev`, `staging`, and `main` branches with appropriate required checks.
4. Cut a `release/*` candidate from a pinned `dev` commit; run unit, PostgreSQL, migration, security, integration and end-to-end suites.
5. Deploy and validate the identical candidate on staging; fix defects and repeat required checks.
6. Secure explicit release approval, audit the artifact SHA, and only then promote to `main` / production.

No past promotion constitutes certification without retained evidence.

## Administrator action required

Set `dev` as the GitHub default branch; enforce frozen `main` / `staging` via rulesets or branch protections; disable or constrain Actions and deployment credentials until activation; verify no existing environment or external automation can bypass these rules.

**Do not interpret this file as proof that those administrative settings were changed.**

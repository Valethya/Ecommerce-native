# Ecommerce Native — development workflow

## Purpose

This document defines the repository workflow used to implement and review bounded slices safely. It is process guidance, not functional product authority.

The canonical functional authority remains `docs/spec/ecommerce-native-0.15.5.md`. Architectural decisions live under `docs/decisions/`, and implementation sequence lives in `docs/roadmap.md`.

## Baseline rule

Before starting a slice:

1. read the current `master` HEAD from GitHub;
2. confirm all prerequisite PRs are merged;
3. inspect any delta since the last reviewed baseline;
4. create the implementation branch from the verified `master`;
5. do not rely on a stale SHA merely because it appeared in an earlier prompt or document.

GitHub is the source of truth for branch, PR, commit and CI state.

## Slice and branch policy

- One bounded implementation slice should normally map to one branch and one PR.
- Keep the slice aligned with `docs/roadmap.md` and the canonical specification.
- Do not start a dependent slice before its prerequisite is merged unless an explicit exception is approved.
- Do not silently widen a slice when adjacent work becomes technically convenient.

Suggested branch pattern:

`agent/<phase-or-slice>-<short-description>`

Documentation/governance-only work may use:

`docs/<short-description>`

## Pull request lifecycle

1. Open the PR as **Draft**.
2. Keep implementation and blocker fixes in the same PR for that slice.
3. Record the verified base SHA and the scope in the PR description when useful.
4. Run the repository verification suite and CI.
5. Perform an independent adversarial review against:
   - the complete diff;
   - the canonical specification sections touched;
   - `docs/invariants.md`;
   - accepted ADRs;
   - the explicit slice boundaries.
6. If blockers are found, correct them in the same PR and review the new HEAD again.
7. Mark Ready only after the final reviewed HEAD has no unresolved blocker and required CI is green.
8. Merge only the reviewed HEAD. When supported, use the expected HEAD SHA during merge to prevent an unreviewed commit from being integrated.

## Review severity

- **Blocker:** violates canonical behavior, an invariant, security/authorization boundary, data integrity, phase scope, or makes the slice unsafe to merge.
- **Non-blocking improvement:** maintainability, clarity or optimization that does not invalidate the slice contract.

Do not turn optional improvements into hidden scope expansion during blocker remediation.

## Verification expectations

Use the checks that exist for the repository and the slice. At minimum, when applicable:

- dependency installation from the committed lockfile;
- typecheck;
- automated tests;
- production build;
- runtime smoke/health verification;
- concurrency/security tests for affected boundaries;
- full diff review for secrets and unintended files;
- GitHub CI status on the final HEAD.

A documentation-only PR does not need artificial code changes merely to exercise unrelated tests, but existing CI should still be observed where it runs.

## Secrets and external resources

- Never commit passwords, authenticated connection strings, API keys, tokens, cookies, private keys or reusable credentials.
- External infrastructure changes must be explicitly authorized by the current slice.
- Do not modify production, domains, billing, deployments or live data unless the slice explicitly authorizes it.
- Document stable non-secret resource identifiers when they are necessary for reproducibility/governance.

## Functional contradiction rule

If an implementation instruction and the canonical specification genuinely conflict:

1. do not silently weaken the specification;
2. do not invent a workaround that creates a different product contract;
3. stop only the affected portion when possible;
4. document the contradiction precisely;
5. resolve it through an explicit decision/version change before proceeding.

## ADR rule

Create or supersede an ADR when a decision:

- constrains multiple phases;
- selects/rejects a durable architecture boundary;
- changes a previously accepted architectural decision;
- would otherwise be ambiguous or expensive to rediscover.

Do not rewrite accepted ADR history to disguise a changed decision.

## Merge closure

After merge:

- treat the merge commit on `master` as the new baseline;
- update roadmap/phase status only when needed to keep repository governance truthful;
- do not automatically authorize the next planned slice solely because the previous one merged.

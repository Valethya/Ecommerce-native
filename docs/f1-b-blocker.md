# F1-B — implementation blocker

## Status

F1-B implementation is intentionally stopped before authentication/session code is introduced.

## Baseline reviewed

- `master`: `232b329764c3b142e1c1a5d87ba3bf75ecbc7154`
- F1-A PR #1: merged
- F1-A reviewed HEAD: `8ec99748739bdf83d7e075136827d09a1bf6a682`
- Canonical functional source: `docs/spec/ecommerce-native-0.15.5.md`
- Frozen version: `0.15.5`
- Recorded SHA-256: `cb2d7d232acca4f6ea0c7b61f256ae4f3e79677cfc40a9a8efd418d0dc619d21`

## Canonical requirement

Section 18.7 of the canonical specification requires every administrative account to use:

- a password of at least twelve characters;
- mandatory second factor using an authenticator application (TOTP);
- one-time recovery codes.

Section 18.15 reinforces this as an invariant: MFA is mandatory for every administrative account.

The same canonical administrative contract also requires opaque server-managed sessions, CSRF protection for state-changing operations, rotation after authentication/privilege changes, twelve-hour idle expiry, seven-day absolute expiry, revocation, immediate session invalidation on suspension, recent reauthentication for sensitive actions, and server-side authorization.

## Conflict in the F1-B execution brief

The F1-B execution brief explicitly places `MFA` outside the allowed implementation scope while simultaneously requiring implementation to derive from the frozen canonical `0.15.5`, and states that a real functional contradiction must stop implementation of the affected part rather than be silently reinterpreted.

Implementing password-only administrative login would therefore create behavior that directly violates an approved functional invariant. Implementing TOTP would violate the explicit phase execution boundary.

There is no compliant technical interpretation that satisfies both instructions.

## Decision

Do not implement administrative login, sessions, collaborator activation, or any authentication flow until the scope conflict is resolved explicitly.

No temporary password-only login, feature flag, disabled MFA placeholder, fake second factor, or TODO-based bypass is acceptable because any such path would weaken the frozen invariant and could become an accidental production contract.

The canonical specification itself is not modified by this record.

## Non-conflicting observations

The canonical specification also requires individual collaborator accounts and invitation-based activation with a one-use invitation that expires after twenty-four hours. The execution brief allows a minimal invitation mechanism when strictly necessary for the canonical contract, so this point is not itself a blocker.

The unique-owner persistence invariant, predefined permission identifiers, identity persistence shape, and session storage schema could theoretically be implemented in isolation. They are deliberately not committed ahead of the authentication decision because F1-B is one bounded identity contract and the mandatory MFA requirement affects account activation, login, session establishment, recovery material, reauthentication, revocation, tests, and security documentation.

## Required resolution

A subsequent instruction must choose one of the following without silently changing `0.15.5`:

1. authorize the minimum canonical TOTP + one-time recovery-code implementation within F1-B; or
2. formally revise/version the functional specification so MFA is no longer mandatory for this phase/product contract.

Until one of those occurs, F1-B remains blocked by contradictory requirements.

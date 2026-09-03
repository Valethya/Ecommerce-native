# ADR-003 — Server-managed administrative authentication with mandatory MFA

**Status:** Accepted  
**Date:** 2026-09-03

## Context

The canonical functional specification `0.15.5`, especially section 18, requires secure individual administrative accounts, exactly one owner per installation, predefined permissions, mandatory TOTP MFA, one-time recovery codes, opaque server-managed sessions, revocation, reauthentication for sensitive actions and server-side authorization.

These requirements must be implemented without allowing a frontend token, client-side role flag or UI visibility decision to become an authorization authority.

## Decision

1. Every administrative person uses an individual account; shared administrative accounts are not supported.
2. Each installation has exactly one `owner`; additional administrators are collaborators with predefined permissions.
3. Administrative authentication requires a password plus mandatory TOTP MFA and one-time recovery codes according to the canonical specification.
4. Administrative sessions are opaque identifiers managed and validated server-side.
5. Authorization is evaluated server-side for every protected operation using current account state and permissions.
6. Session expiry, rotation, revocation, suspension invalidation and recent reauthentication follow the canonical functional contract.
7. State-changing browser-based administrative operations require CSRF protection appropriate to the chosen session transport.
8. Client-visible data, hidden buttons, route guards or frontend claims are convenience/UI mechanisms only and never authorization authorities.
9. JWTs are not adopted as the administrative session authority merely for implementation convenience. A later change requires a new ADR and must preserve the canonical revocation and authorization semantics.
10. Authentication secrets, MFA seeds, recovery material and session secrets must not be logged or committed.

## Consequences

### Positive

- immediate revocation and suspension semantics remain enforceable;
- authorization reflects current server state rather than stale client claims;
- the architecture directly supports the mandatory MFA contract;
- audit attribution can bind actions to an account and session.

### Trade-offs

- the backend must maintain durable or otherwise authoritative session state;
- CSRF, session rotation and recovery workflows require explicit implementation and testing;
- administrative authentication is intentionally more involved than password-only or stateless-token approaches.

## Functional authority

This ADR does not create new authentication requirements. If any statement here conflicts with `docs/spec/ecommerce-native-0.15.5.md`, the canonical specification governs and the contradiction must be resolved explicitly rather than silently reinterpreted.

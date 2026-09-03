# Phase 1 — operational core

## Status

Active.

Phase 1 establishes the reusable operational core needed to administer one ecommerce installation without coupling the engine to a client-specific production UI.

The canonical functional authority remains `docs/spec/ecommerce-native-0.15.5.md`. This document defines implementation sequence only; it does not replace, weaken or extend the functional specification.

## Delivery slices

### F1-A — foundation — MERGED

- repository and runtime baseline;
- Node.js + TypeScript + Express API process;
- MongoDB/Mongoose persistence boundary;
- validated runtime configuration;
- liveness/readiness endpoints;
- safe HTTP error boundary and request IDs;
- graceful shutdown;
- test harness and CI;
- diagnostic Smoke UI;
- canonical frozen specification governance.

Merged through PR #1.

### F1-B — administrative infrastructure identity — MERGED

- MongoDB confirmed as the persistence technology;
- MongoDB Atlas selected as the managed provider;
- dedicated Atlas project identified for `ecommerce-native`;
- administrative Atlas organization identified;
- Vercel administrative team identified;
- no cluster, deployment, production runtime or application authentication provisioned.

Merged through PR #2.

### F1-C — administrative identity and access — PLANNED

Implement the canonical administrative identity contract required by section 18 of specification `0.15.5`, including only the minimum supporting mechanisms needed for that contract:

- exactly one `owner` per installation;
- zero or more individual collaborators;
- invitation-based administrative activation;
- password policy;
- mandatory TOTP MFA and one-time recovery codes;
- opaque server-managed sessions;
- session expiry, rotation and revocation;
- CSRF protection for state-changing administrative operations;
- predefined permissions and server-side authorization;
- account suspension and immediate session invalidation;
- recent reauthentication where required by the canonical contract;
- security-event evidence needed by this identity boundary.

A minimal technical surface may be used only to exercise the contract. It is not a client-facing production design.

### F1-D — catalog domain — PLANNED

- products;
- variants;
- option combinations;
- SKU uniqueness;
- prices;
- publication/archive rules;
- purchase-limit data required by the canonical catalog contract;
- immutable historical/commercial identity boundaries where applicable.

### F1-E — inventory domain — PLANNED

- physical stock;
- calculated available stock;
- immutable inventory movements;
- manual corrections with reason;
- concurrency protection;
- reservation-aware data boundary prepared for later checkout phases without creating checkout reservations yet.

### F1-F — technical administration surface — PLANNED

Only the minimum disposable UI/API exercise surface needed to operate and verify Phase 1 contracts:

- administrative access;
- product creation/editing;
- variant creation/editing;
- publication/archive;
- stock adjustment;
- visibility of calculated availability.

This surface must not constrain later business-specific UI work.

### F1-G — Phase 1 hardening — PLANNED

- integration tests;
- concurrency tests;
- permission/security tests;
- invariant tests;
- adversarial review;
- merge/readiness closure for the complete Phase 1 boundary.

## Out of scope for Phase 1

- public storefront design;
- cart;
- checkout;
- checkout-created reservations;
- durable purchase/order flow beyond structures strictly required by Phase 1;
- bank transfers;
- payment gateways;
- discounts;
- fulfillment;
- production transactional email.

See `docs/roadmap.md` for the cross-phase implementation sequence.

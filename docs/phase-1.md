# Phase 1 — administration and catalog

## Goal

Create the reusable operational core needed to manage a store's catalog and inventory without coupling the engine to any client-specific UI.

## Delivery slices

### F1-A — foundation

- repository and runtime baseline;
- API process;
- MongoDB boundary;
- configuration validation;
- health endpoints;
- error boundary;
- smoke verification UI;
- test harness.

### F1-B — administrative identity

- exactly one `owner` per installation;
- zero or more individual collaborators;
- predefined permissions;
- secure sessions;
- suspension/revocation rules;
- backend authorization.

A minimal technical UI may be used to exercise these contracts. It is not a client-facing design.

### F1-C — catalog domain

- products;
- variants;
- option combinations;
- SKU uniqueness;
- prices;
- publication/archive rules;
- immutable commercial identity rules.

### F1-D — inventory domain

- physical stock;
- reserved stock boundary prepared for later phases;
- calculated available stock;
- immutable inventory movements;
- manual corrections with reason;
- concurrency protection.

Phase 1 does not yet create checkout reservations.

### F1-E — technical admin surface

Only the minimum UI needed to exercise:

- product creation/editing;
- variant creation/editing;
- publication/archive;
- stock adjustment;
- visibility of calculated availability.

This surface is disposable and must not constrain later business-specific UI work.

### F1-F — hardening

- integration tests;
- concurrency tests;
- permission tests;
- adversarial review;
- merge readiness.

## Out of scope for Phase 1

- public storefront design;
- checkout;
- cart;
- reservations created by checkout;
- orders;
- bank transfers;
- payment gateways;
- discounts;
- fulfillment;
- production email notifications.

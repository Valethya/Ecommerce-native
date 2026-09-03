# ADR-004 — Backend authority over commercial state and transitions

**Status:** Proposed  
**Date:** 2026-09-03

## Context

The reusable engine must support replaceable storefront/admin interfaces and external integrations without allowing any client, browser or provider to become an implicit commercial authority.

The canonical specification repeatedly requires the server to validate prices, inventory, discounts, payment effects, order transitions and administrative permissions. This decision must remain visible across catalog, cart, checkout, payments and fulfillment implementation.

## Decision

1. Commercial rules and authoritative state transitions live in the backend/domain boundary.
2. A frontend may request data, submit commands and render results, but it cannot establish authoritative prices, totals, inventory, discounts, payment state, order state or permissions.
3. All state-changing commands are validated server-side against the current canonical state and the relevant invariants.
4. UI route guards, disabled controls, hidden actions and client-side validation are usability mechanisms only.
5. External services such as payment gateways, email providers or hosting providers are evidence/input sources or delivery mechanisms unless the canonical contract explicitly assigns them authority over a specific fact.
6. Payment events do not directly imply inventory state; inventory changes occur only through the inventory/reservation rules authorized by the domain.
7. Historical commercial facts captured by a durable order are not rewritten by later catalog edits.
8. State machines and transition preconditions are backend contracts. The frontend cannot submit an arbitrary state value to bypass them.
9. Where an external result is uncertain, delayed, duplicated or out of order, the backend resolves convergence according to the canonical functional rules rather than trusting arrival order.

## Consequences

### Positive

- business-specific UIs remain replaceable;
- APIs cannot be bypassed by manipulating browser state;
- payment/integration failures are less likely to corrupt commercial state;
- domain behavior remains testable independently from UI implementation.

### Trade-offs

- some calculations and validations may be duplicated in the frontend for UX but must still be repeated authoritatively on the server;
- integrations require explicit adapters and reconciliation logic rather than direct state assignment.

## Related records

- ADR-001 — Headless engine, one store per installation
- `docs/architecture.md`
- `docs/invariants.md`

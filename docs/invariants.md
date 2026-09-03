# Ecommerce Native — implementation invariant index

## Purpose and authority

This file is a compact implementation/review index of high-impact invariants already defined by the canonical functional specification and accepted architecture decisions.

It is **not** a substitute for `docs/spec/ecommerce-native-0.15.5.md` and does not create new product behavior. If this index and the canonical specification disagree, the canonical specification governs and the mismatch must be corrected explicitly.

Use this file during implementation, code review and adversarial review to identify rules that must not be broken across phases.

## Architecture and installation

- One deployed installation represents one store.
- Reuse means deploying/configuring the same engine independently for another business, not multi-tenancy inside one runtime/database.
- Production storefront/admin UIs are replaceable clients and are not commercial authorities.
- MongoDB is the persistence boundary; MongoDB Atlas is the selected managed provider.
- Provider-specific infrastructure concerns must not become domain authority.

## Administrative identity and authorization

- Every administrative person uses an individual account.
- Each installation has exactly one `owner`.
- There is no public administrative registration.
- MFA is mandatory for every administrative account.
- Administrative MFA uses TOTP plus one-time recovery codes according to the canonical contract.
- Administrative sessions are opaque and server-managed.
- Authorization is validated server-side using current account state and permissions.
- Hiding an action in the UI is not authorization.
- Suspending an administrative account revokes/invalidates its sessions according to the canonical contract.
- A collaborator cannot elevate their own permissions.
- Important administrative actions must remain attributable to actor, session, time and result where required by the canonical contract.

## Commercial authority

- The browser never establishes authoritative prices, stock, discounts, currency, payment state or totals.
- Backend/domain rules validate every state-changing command.
- External integrations do not become commercial authority merely because they emitted an event.
- Historical commercial facts captured in a durable order do not change when the catalog changes later.

## Catalog and cart

- A cart is a temporary purchase intention, not an order or proof of purchase.
- A cart does not reserve inventory.
- Cart prices remain current until durable commercial facts are frozen at order creation.
- A variant appears at most once per cart; adding the same variant increases its quantity.
- Invalid/unavailable cart lines are surfaced explicitly rather than silently removed.
- Cart operations must respect current availability and purchase limits.

## Inventory and reservation

- Physical stock changes through explicit inventory operations/movements.
- Available stock is derived from the canonical physical/reserved boundaries rather than independently edited.
- Inventory movements are durable evidence and are not rewritten to hide corrections.
- Manual inventory corrections require an explicit reason according to the canonical contract.
- Concurrent operations must not create impossible stock states.
- Checkout-created reservation behavior belongs to the checkout/reservation phase, not cart behavior.

## Checkout and orders

- Checkout revalidates authoritative catalog, availability, limits, discounts, fulfillment data and totals before durable creation.
- Order creation freezes the historical commercial facts required by the canonical specification.
- A cart becomes `converted` only after a durable order is successfully created.
- Duplicate/retried checkout requests must not create duplicate durable purchases.
- Payment and fulfillment state remain separate domain boundaries.

## Payments

- Payment status alone is not an inventory authority.
- Payment processing must be idempotent and reconcile duplicate/out-of-order external events.
- Bank-transfer confirmation is an administrative decision where the canonical contract requires manual review.
- Transfer discrepancies such as underpayment or overpayment are resolved manually with the customer rather than through unapproved automatic financial adjustment.
- Late payment results must converge according to the explicit precedence rules in the canonical specification.

## Fulfillment and post-order operations

- Order/fulfillment transitions occur only through explicitly allowed backend transitions.
- Cancellation, refund and return effects must use their explicit domain rules; they are not inferred solely from payment state.
- Inventory consequences of cancellation/refund/return are represented through explicit inventory operations where required.

## Audit and notifications

- Human actions are attributed to the actual administrative actor; automatic actions are not falsely attributed to a person.
- Important activity evidence is not edited or deleted through the administrative panel where the canonical contract forbids it.
- Transactional/security notifications are communication effects, not authorities over domain state.

## Review rule

Every implementation PR should identify which invariants it satisfies or touches. If a proposed change appears to require breaking an invariant, stop that affected work and resolve the functional/architectural decision explicitly before merging.

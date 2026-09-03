# Ecommerce Native — implementation roadmap

## Authority and purpose

This roadmap defines implementation order only.

The canonical functional authority remains `docs/spec/ecommerce-native-0.15.5.md`. A phase or slice does not create new product behavior, weaken an invariant or authorize work assigned to a later phase.

Implementation follows these rules:

1. one bounded slice should normally map to one pull request;
2. a dependent slice starts from the merged baseline of its prerequisite;
3. pull requests remain Draft until independent adversarial review closes their blockers;
4. later functionality is not implied merely because infrastructure for it could be prepared earlier;
5. business-specific production UI is not part of the reusable engine contract;
6. MongoDB is the persistence boundary and MongoDB Atlas is the selected managed provider unless a later approved architectural decision explicitly replaces it.

## Status vocabulary

- `MERGED`: reviewed and integrated into `master`.
- `ACTIVE`: currently authorized for implementation.
- `PLANNED`: sequenced but not yet authorized by this document alone.
- `BLOCKED`: cannot proceed until an explicit prerequisite or contradiction is resolved.

---

# Phase 1 — Operational core

Goal: establish the reusable backend and minimum technical administration needed to operate catalog and inventory securely.

Detailed slices are defined in `docs/phase-1.md`.

- F1-A — foundation — `MERGED`
- F1-B — administrative infrastructure identity — `MERGED`
- F1-C — administrative identity and access — `PLANNED`
- F1-D — catalog domain — `PLANNED`
- F1-E — inventory domain — `PLANNED`
- F1-F — technical administration surface — `PLANNED`
- F1-G — Phase 1 hardening — `PLANNED`

Exit condition: an authorized administrator can securely operate catalog and physical inventory through the reusable engine boundary, with Phase 1 invariants covered by automated tests and adversarial review.

---

# Phase 2 — Cart and discounts

Goal: implement the pre-checkout shopping intent without reserving inventory.

### F2-A — cart core

- opaque guest cart identity;
- server-authoritative cart persistence;
- line add/update/remove/clear;
- one line per variant;
- current-price and availability revalidation;
- cart versioning;
- atomic modifications and idempotency;
- active/converted/expired lifecycle and retention rules.

### F2-B — discount domain

- simple discount codes allowed by the canonical specification;
- eligibility and validity rules;
- usage control and concurrency boundaries;
- server-authoritative calculations;
- no arbitrary rule builder.

### F2-C — cart/discount integration and hardening

- discount application/removal in cart;
- recalculation after cart changes;
- invalid-line and invalid-discount behavior;
- integration, race and adversarial tests.

Exit condition: a guest cart can safely represent a current purchase intention, including allowed discounts, while explicitly creating no stock reservation and no order.

---

# Phase 3 — Checkout, reservation and durable order creation

Goal: atomically turn a valid cart into a durable purchase record while protecting inventory.

### F3-A — checkout validation and commercial snapshot

- guest checkout data contract;
- authoritative recalculation;
- final validation of catalog, limits, prices and discounts;
- fulfillment choice data required by the configured installation;
- immutable commercial snapshot boundary.

### F3-B — inventory reservation lifecycle

- reservation creation at the canonical checkout boundary;
- expiry/release rules;
- atomic stock protection;
- concurrency and idempotency;
- late-resolution behavior required by specification `0.15.5`.

### F3-C — minimal durable order core

- order creation required to complete checkout;
- frozen line/commercial data;
- separate payment and fulfillment state boundaries;
- cart conversion only after durable order creation;
- retry/idempotency behavior.

### F3-D — checkout/order hardening

- transactional/concurrency tests;
- duplicate-submit tests;
- reservation/order consistency tests;
- adversarial review.

Exit condition: checkout can create exactly one durable order with protected inventory and frozen commercial facts, without yet implementing payment-provider behavior.

---

# Phase 4 — Payments

Goal: implement the approved payment contracts independently from checkout and fulfillment.

### F4-A — payment domain foundation

- payment records and canonical payment states;
- server authority and idempotency;
- reconciliation boundaries;
- order/payment relationship without deriving inventory state from payment state.

### F4-B — bank transfer

- transfer instructions fixed by project configuration;
- administrative review and confirmation;
- discrepancy handling for lower, higher or otherwise non-matching amounts through direct manual resolution with the customer;
- no automatic financial adjustment beyond the canonical contract;
- audit evidence for administrative decisions.

### F4-C — hosted payment gateway adapter

- one gateway selected per project configuration;
- hosted-payment initiation;
- authenticated webhook/callback processing;
- duplicate/out-of-order event handling;
- approved-vs-released-reservation precedence defined by the canonical specification.

### F4-D — payment convergence and hardening

- late payment resolution;
- idempotency/reconciliation tests;
- bank-transfer and gateway invariant tests;
- adversarial review.

Exit condition: orders can reach authoritative payment outcomes through bank transfer and/or the configured hosted gateway without corrupting inventory or order history.

---

# Phase 5 — Order operations and fulfillment

Goal: complete the operational lifecycle after order creation/payment.

### F5-A — order administration

- operational order views/commands;
- allowed preparation transitions;
- explicit server-side transition validation;
- historical immutability.

### F5-B — pickup and shipping

- configured pickup/shipping methods;
- fixed zones/rules established per project;
- preparation, dispatch and pickup-confirmation operations;
- any canonical confirmation-code behavior.

### F5-C — cancellation, refunds and returns

- canonical cancellation rules;
- refund lifecycle;
- return handling where approved;
- inventory consequences expressed through explicit inventory operations rather than inferred payment state.

### F5-D — fulfillment hardening

- state-machine tests;
- permission tests;
- concurrency/idempotency tests;
- adversarial review.

Exit condition: an order can be operated from creation through completion, cancellation/refund or return according to the frozen functional rules.

---

# Phase 6 — Notifications and auditability

Goal: add the transversal operational evidence and communications required by the canonical contract.

### F6-A — audit ledger

- actor/session/result attribution;
- immutable important-operation records;
- automatic actions distinguished from human actions;
- visibility/query boundaries required by the admin contract.

### F6-B — transactional notifications

- required customer communications;
- critical administrative/security notifications;
- provider boundary that does not make the external provider authoritative for domain state;
- retry/failure observability.

### F6-C — transversal hardening

- audit coverage across existing domains;
- notification-trigger tests;
- sensitive-data review;
- adversarial review.

Exit condition: important operations are attributable and required transactional/security communications can be emitted without becoming domain authority.

---

# Phase 7 — Engine release readiness

Goal: close the reusable backend as an MVP-ready engine that can receive a business-specific storefront/admin experience without changing its commercial authority model.

### F7-A — API contract closure

- public/admin API consistency;
- error-contract review;
- authorization coverage;
- documentation of supported engine capabilities.

### F7-B — end-to-end and resilience hardening

- cross-domain E2E flows;
- concurrency/race suite;
- idempotency/retry suite;
- failure/recovery scenarios;
- dependency and security review.

### F7-C — deployment readiness

- production configuration contract;
- MongoDB Atlas connection readiness without committing secrets;
- deployment/runbook documentation;
- health/readiness verification;
- backup/operational prerequisites where required by the canonical contract.

### F7-D — release gate

- final adversarial review against specification `0.15.5`;
- explicit list of supported and excluded capabilities;
- no unresolved critical blockers;
- MVP engine release decision.

Exit condition: the reusable engine is technically ready to back a real business-specific ecommerce implementation.

---

## Explicitly outside this roadmap unless separately authorized

The following remain excluded from the initial product contract or require a later deliberate evolution:

- marketplace;
- multiple stores in one installation;
- multiple currencies;
- international commerce;
- multiple warehouses;
- customer accounts;
- subscriptions;
- loyalty/points program;
- shared or cross-device carts;
- accounting integrations;
- visual store builder;
- runtime switching of payment engines or architecture from the admin panel.

A business-specific production storefront or branded admin UI may be developed separately on top of the engine API. Its visual implementation is not a prerequisite for completing the reusable engine phases above.

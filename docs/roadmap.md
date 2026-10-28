# Ecommerce Native — execution roadmap

> **Planning and sequencing only.** Functional authority: [canonical specification 0.15.5](spec/ecommerce-native-0.15.5.md). The frozen specification, including its exclusions, always prevails. This document cannot invent functionality or authorize infrastructure changes. See [freeze record](spec/0.15.5-freeze.md), [ADRs](decisions/README.md), [invariants](invariants.md), and [development workflow](development-workflow.md).

## Verified baseline (2026-10-28)

- Repository: `Valethya/Ecommerce-native`; default branch `master`.
- PR [#1](https://github.com/Valethya/Ecommerce-native/pull/1) F1-A: merged 2026-09-02.
- PR [#2](https://github.com/Valethya/Ecommerce-native/pull/2) F1-B: merged 2026-09-03.
- PR [#3](https://github.com/Valethya/Ecommerce-native/pull/3) governance: merged 2026-09-03.
- PR [#4](https://github.com/Valethya/Ecommerce-native/pull/4) F1-C: merged 2026-09-27. Its merge supersedes the obsolete `PLANNED` status in prior documents. This is integration evidence, **not** a claim of a fresh line-by-line security audit.
- On inspected `master`, the API mounts health and administrative identity routes. No catalog, inventory, cart, checkout, order or payment domain modules were present in the inspected tree. Do not interpret roadmap status as a substitute for CI, code review or runtime verification.
- **Next candidate:** F1-D. Before implementation, verify current `master`, F1-C security assumptions, specification sections and accepted ADRs; obtain explicit authorization for the implementation slice.

## How to use this roadmap (no guessing)

1. Locate the **first unmerged slice** whose dependencies are satisfied. `NEXT` means next *candidate*, not automatic authorization.
2. Before coding, read the complete relevant canonical 0.15.5 sections (not the auxiliary reconstruction), the ADRs, invariants and current `master` tree. Record exact normative references in the PR.
3. Open one bounded Draft PR per slice from verified `master`. Include scope, exclusions, dependencies, tests, risks and acceptance evidence.
4. Do not silently add behavior from a later slice. Where a canonical rule is unclear or contradictory, record the precise question and stop only that affected work until a decision is approved.
5. Run typecheck, tests, build, CI and relevant concurrency/security scenarios; independent adversarial review must cover the **final HEAD**. Merge only reviewed code with no blockers.
6. After merge, update this roadmap's status and evidence link in the same closure workflow or a dedicated governance PR. Never mark a slice MERGED based on intent, a Draft PR or local tests alone.

**Status vocabulary:** `MERGED` = GitHub merge verified; `NEXT` = next eligible planning candidate; `PLANNED` = sequenced, not authorized; `ACTIVE` = explicitly authorized and in implementation; `BLOCKED` = recorded prerequisite/contradiction. `NEXT` and `ACTIVE` never mean released.

**Universal definition of done:** canonical rules traced; authorized scope only; permissions enforced server-side; error and failure paths tested; idempotency/concurrency verified where applicable; no secrets; CI green on reviewed HEAD; independent adversarial review closed; PR merged; roadmap updated. Evidence must be linked, not asserted.

## Phase map and subphases

### Phase 1 — Operational core

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F1-A — Foundation** | `MERGED` | API runtime, MongoDB boundary, configuration, health, CI and smoke verification | PR #1 |
| **F1-B — Administrative infrastructure identity** | `MERGED` | Atlas/Vercel infrastructure identifiers; no production provisioning | PR #2 |
| **F1-C — Administrative identity and access** | `MERGED` | Owner, collaborators, invitations, MFA, sessions, CSRF, authorization and identity evidence | PR #4; integration verified, not a substitute for a fresh security review |
| **F1-D — Catalog domain** | `NEXT` | Products, variants, options, unique SKUs, prices, purchase limits, publication/archive, historical identity boundaries | F1-C |
| **F1-E — Inventory domain** | `PLANNED` | Physical stock, availability, immutable movements, justified adjustments, atomic concurrent changes; no checkout reservation yet | F1-D |
| **F1-F — Technical administration surface** | `PLANNED` | Minimal replaceable administrative exercise surface for catalog/variants/publication/stock; no branded production UI | F1-E |
| **F1-G — Phase 1 hardening** | `PLANNED` | Permission, invariant, race, integration and adversarial verification | F1-F |

### Phase 2 — Cart and discounts

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F2-A — Cart core** | `PLANNED` | Opaque guest cart, lazy creation, one line per variant, authoritative recalculation, lifecycle/retention, atomic updates and idempotency; no stock reservation | F1-G |
| **F2-B — Discount domain** | `PLANNED` | Only approved simple codes, eligibility, limits, usage concurrency, authoritative calculations | F2-A |
| **F2-C — Cart/discount integration** | `PLANNED` | Apply/remove codes, invalid lines, price changes, recalculation, race and retry tests | F2-B |

### Phase 3 — Checkout, reservation and order creation

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F3-A — Checkout validation and snapshot** | `PLANNED` | Guest checkout contract, final validation of product/stock/price/discount/fulfillment and immutable commercial facts | F2-C |
| **F3-B — Inventory reservation lifecycle** | `PLANNED` | Atomic reservation, expiry/release, concurrent checkout, idempotency and canonical late-resolution rules | F3-A |
| **F3-C — Durable order core** | `PLANNED` | Single durable order, frozen lines/totals, distinct payment/fulfillment states, cart conversion after commit | F3-B |
| **F3-D — Checkout/order hardening** | `PLANNED` | Transaction failure, duplicate submission, race, reservation/order consistency and adversarial tests | F3-C |

### Phase 4 — Payments

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F4-A — Payment domain foundation** | `PLANNED` | Payment records/states, authority, reconciliation and idempotency independent of fulfillment | F3-D |
| **F4-B — Bank transfer** | `PLANNED` | Configured instructions, manual verification, discrepancies handled with customer, evidence; no invented automatic adjustment | F4-A |
| **F4-C — Hosted gateway adapter** | `PLANNED` | One configured gateway, hosted initiation, authenticated callbacks, duplicate/out-of-order and late event behavior | F4-A |
| **F4-D — Payment convergence and hardening** | `PLANNED` | Late outcomes, reconciliation, reservation precedence, security and retry tests | F4-B + F4-C when both configured; otherwise approved applicable methods |

### Phase 5 — Order operations and fulfillment

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F5-A — Order administration** | `PLANNED` | Allowed operational views/commands, state-machine transitions and immutable history | F4-D |
| **F5-B — Pickup and shipping** | `PLANNED` | Fixed project pickup/shipping rules, preparation, dispatch, pickup confirmation | F5-A |
| **F5-C — Cancellation, refunds and returns** | `PLANNED` | Canonical cancellation/refund/return flows with explicit inventory operations | F5-B |
| **F5-D — Fulfillment hardening** | `PLANNED` | Permissions, transitions, concurrency, retries and adversarial verification | F5-C |

### Phase 6 — Notifications and auditability

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F6-A — Audit ledger** | `PLANNED` | Attributable immutable records for significant actions and automatic/human distinctions | F5-D; identity-boundary evidence from F1-C remains |
| **F6-B — Transactional notifications** | `PLANNED` | Customer and security communications, delivery retries and provider-failure observability | F6-A |
| **F6-C — Cross-domain hardening** | `PLANNED` | Coverage of past domains, sensitive data review and adversarial verification | F6-B |

### Phase 7 — Release readiness

| Slice | Status | Scope and acceptance boundary | Dependency / evidence |
| --- | --- | --- | --- |
| **F7-A — API contract closure** | `PLANNED` | Public/admin consistency, authorization, errors, supported contract documentation | F6-C |
| **F7-B — End-to-end and resilience** | `PLANNED` | Full commerce scenarios, races, retries, failures and recovery | F7-A |
| **F7-C — Deployment readiness** | `PLANNED` | Production configuration, Atlas readiness, runbooks, backups and health without provisioning by documentation | F7-B |
| **F7-D — Release gate** | `PLANNED` | Final 0.15.5 adversarial review, exclusions, evidence, zero critical blockers and explicit release decision | F7-C |

## Phase exit gates

| Phase | Required demonstrable outcome |
| --- | --- |
| 1 | Authorized admin can operate catalog and physical stock safely; tests cover permissions and inventory races. |
| 2 | Guest cart and approved discounts work without reserving stock or creating orders. |
| 3 | Valid checkout creates one durable order with protected stock and immutable commercial snapshot. |
| 4 | Configured payment methods reach authoritative outcomes without corrupting order/inventory state. |
| 5 | Orders progress through allowed pickup/shipping/cancellation/refund/return operations. |
| 6 | Important actions are attributable and required communications observable and retryable. |
| 7 | End-to-end, resilience, deployment-readiness and final specification review pass; explicit MVP release decision. |

## Slice kickoff template (copy into each Draft PR)

- **ID / title:**
- **Verified master SHA / prerequisite merged PRs:**
- **Canonical 0.15.5 sections and exact requirements:**
- **Accepted ADRs / invariants touched:**
- **Included behaviors and explicit exclusions:**
- **API/data/permissions/concurrency contract:**
- **Tests (success, failure, race, idempotency, security):**
- **External resources / secrets / production changes:** none unless separately authorized.
- **Review evidence, blockers and reviewed HEAD:**
- **Exit gate and roadmap status update:**

## Critical architectural boundaries

- One installation and database per business; one currency, domestic/simple physical commerce, unified stock.
- Server is the sole authority over price, inventory, discounts, orders, payment records and transitions. UI is replaceable and never authoritative.
- MongoDB/Mongoose persistence; Atlas managed provider; backend administrative authentication with mandatory MFA; follow accepted ADRs.
- No production storefront or branded admin UI in engine release scope. Diagnostic smoke UI is not a production template.
- Initial exclusions: marketplace, multistore installation, multicurrency, international commerce, multiwarehouse, customer accounts, subscriptions, loyalty, cross-device/shared carts, accounting integrations, visual store builder, and runtime provider/architecture switching from admin.
- The payment adapter is configured per project; implement only methods actually authorized for that installation. Do not quietly weaken the canonical contract or change phase exit gates.

## Current risks and governance follow-up

1. F1-C merged but documentation was stale: this roadmap corrects that record; `docs/phase-1.md` must agree.
2. F1-C needs a fresh targeted security verification before relying on its boundary for F1-D; no claim that all runtime tests have been rerun in this documentation change.
3. Specification is ~184k characters; each slice must trace exact canonical sections rather than extrapolate from this summary.
4. Phase 7 produces the reusable **engine**, not a complete business storefront. Production store implementation and real provider credentials/configuration are separate authorized work.
5. Time estimates are deliberately excluded until F1-D/F1-E complexity and actual delivery cadence have been measured; number of slices is not percentage of engineering effort.

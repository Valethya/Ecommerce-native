# ADR-001 — Headless engine, one store per installation

**Status:** Accepted  
**Date:** 2026-08-28

## Context

The ecommerce base must be reusable across businesses, while each business requires a distinct visual identity and may need a different frontend implementation.

A shared multi-tenant SaaS would add tenant isolation, tenant-scoped permissions, cross-store data boundaries and operational complexity that are not required by the frozen first-version product.

## Decision

1. The core is headless: commercial behavior lives in the backend.
2. One deployed installation represents one store.
3. Reuse happens by deploying/configuring the same engine for another business.
4. Production UIs are replaceable clients and are not shipped as part of the core contract.
5. A framework-free smoke UI may live in the repository for verification only.

## Consequences

### Positive

- no business-specific visual coupling;
- simpler data model and authorization;
- easier replacement of frontend technology;
- fewer reasons to rebuild the domain when a new client has a different design.

### Trade-off

Each business deployment has its own runtime/database/configuration. If a future product requires a shared SaaS control plane, that becomes an explicit architectural evolution rather than an assumption embedded in version one.

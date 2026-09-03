# ADR-002 — MongoDB persistence boundary and MongoDB Atlas managed provider

**Status:** Accepted  
**Date:** 2026-09-03

## Context

F1-A established MongoDB and Mongoose as the persistence boundary for `ecommerce-native`. During infrastructure planning, Supabase was considered, but the project owner explicitly selected MongoDB and authorized MongoDB Atlas as the managed provider for deployed installations.

The reusable engine must remain portable enough that business/domain code is not coupled to Atlas-specific administration APIs or deployment details.

## Decision

1. MongoDB is the persistence technology and stable application boundary.
2. Mongoose remains the primary application ODM unless a later accepted ADR replaces it.
3. MongoDB Atlas is the selected managed provider for deployed installations.
4. Provider-specific administration, credentials, network configuration and connection provisioning remain outside domain code.
5. The application receives MongoDB connectivity through external runtime configuration; real connection strings and credentials are never committed.
6. One installation represents one store and uses its own persistence boundary according to ADR-001.
7. The current architecture does not adopt Supabase or PostgreSQL.
8. A future change of managed MongoDB provider should not require rewriting commercial domain rules if the MongoDB contract remains compatible.

## Consequences

### Positive

- persistence matches the foundation already implemented and tested;
- local/CI MongoDB and managed production MongoDB share the same database model;
- the engine does not depend on a provider-specific application SDK;
- infrastructure can evolve independently from business rules.

### Trade-offs

- Atlas operational concerns such as database users, network access, backups and scaling must be configured separately from application code;
- MongoDB-specific modeling and concurrency semantics remain architectural constraints unless deliberately replaced.

## Related records

- ADR-001 — Headless engine, one store per installation
- `docs/F1-B-IDENTIDAD-ADMIN.md`
- `docs/architecture.md`

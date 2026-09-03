# Technical architecture — initial baseline

## 1. Deployment model

`ecommerce-native` is **single-store per installation**.

Reusability means deploying the same codebase independently for multiple businesses. It does not mean storing multiple businesses in one runtime or database.

This intentionally avoids tenant identifiers, cross-tenant authorization and shared-store infrastructure that the first version does not need.

See `docs/decisions/ADR-001-headless-single-installation.md`.

## 2. Headless boundary

The backend owns all commercial rules and state transitions.

A storefront or admin frontend may:

- request data;
- submit commands;
- render a business-specific experience.

A frontend may not become authoritative for:

- current price;
- inventory quantities;
- reservation validity;
- payment state;
- order transitions;
- permissions.

See `docs/decisions/ADR-004-backend-domain-authority.md`.

## 3. UI policy

No production UI framework is part of the engine contract.

`examples/smoke-ui` is a framework-free diagnostic client. It should remain intentionally plain and disposable.

Business-specific UIs are expected to be separate applications or layers that consume the API.

## 4. Backend baseline

The first implementation uses:

- Node.js LTS;
- TypeScript;
- Express;
- MongoDB;
- Mongoose;
- Zod for runtime configuration/input validation;
- Vitest + Supertest for automated tests.

MongoDB is the persistence boundary and MongoDB Atlas is the selected managed provider for deployed installations. Provider-specific administration remains outside domain code. See `docs/decisions/ADR-002-mongodb-persistence.md`.

The code starts as one deployable backend. There are no microservices, queues, caches or distributed coordination components unless a future requirement demonstrates a need.

## 5. Data model direction

Phase 1 will add durable models for:

- administrative identities and permissions;
- products;
- variants;
- inventory movements.

The administrative identity/access slice must follow the server-managed, MFA-required architecture recorded in `docs/decisions/ADR-003-administrative-authentication.md`.

Checkout, reservations, orders and payments come later according to the frozen functional specification and `docs/roadmap.md`.

## 6. Reproducibility

Direct dependencies are pinned to exact versions and `package-lock.json` is committed. CI installs with `npm ci` so dependency resolution is reproducible from the repository.

F1-A verification also builds the production JavaScript, starts MongoDB, launches the compiled API, verifies liveness and readiness over HTTP, confirms the diagnostic Smoke UI stays unavailable in production, and terminates the process through `SIGTERM`.

## 7. Runtime safety baseline

The HTTP error boundary preserves safe client-side 4xx errors while returning a generic `500 internal_error` for unexpected failures. Unexpected-error logs contain only a request identifier plus allowlisted error metadata; request bodies, stack traces and arbitrary error objects are not logged by the boundary.

Shutdown has a bounded grace period. On `SIGINT` or `SIGTERM`, the API stops accepting new traffic and disconnects MongoDB after HTTP connections drain. If the configured deadline expires, remaining HTTP connections are forcibly closed and the process exits unsuccessfully rather than hanging indefinitely.

## 8. Governance map

- Functional authority: `docs/spec/ecommerce-native-0.15.5.md`
- Implementation sequence: `docs/roadmap.md`
- Current Phase 1 detail: `docs/phase-1.md`
- High-impact invariant index: `docs/invariants.md`
- Architectural decisions: `docs/decisions/`
- Development/review workflow: `docs/development-workflow.md`

If these documents conflict on functional behavior, the canonical specification governs. Architectural changes must be recorded through the ADR process rather than silently rewriting history.

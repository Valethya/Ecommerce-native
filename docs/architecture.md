# Technical architecture — initial baseline

## 1. Deployment model

`ecommerce-native` is **single-store per installation**.

Reusability means deploying the same codebase independently for multiple businesses. It does not mean storing multiple businesses in one runtime or database.

This intentionally avoids tenant identifiers, cross-tenant authorization and shared-store infrastructure that the first version does not need.

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

The code starts as one deployable backend. There are no microservices, queues, caches or distributed coordination components unless a future requirement demonstrates a need.

## 5. Data model direction

Phase 1 will add durable models for:

- administrative identities and permissions;
- products;
- variants;
- inventory movements.

Checkout, reservations, orders and payments come later according to the frozen functional specification.

## 6. Reproducibility

Direct dependencies are pinned to exact versions.

A committed npm lockfile is required before the foundation branch can be considered merge-ready. The current execution environment cannot reach the npm registry, so the lockfile cannot be produced here without fabricating dependency metadata; it must be generated from a networked development/CI environment and then reviewed.

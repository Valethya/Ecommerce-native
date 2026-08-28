# ecommerce-native

Reusable, headless ecommerce engine for small independent stores.

The same backend can be deployed once per business while each storefront and admin experience remains free to use its own visual language and frontend stack.

## Product boundary

- One installation represents one store.
- The server owns commercial authority: prices, stock, reservations, payments and state transitions.
- Frontends are replaceable clients of the engine, not sources of truth.
- The repository does not ship a production storefront or a branded admin UI.
- `examples/smoke-ui` is a diagnostic interface only. It exists to prove that the engine can be exercised without coupling the product to a UI framework.

## Functional source of truth

The functional contract is frozen at **0.15.5** and is versioned inside this repository:

- canonical specification index: [`docs/spec/0.15.5/README.md`](docs/spec/0.15.5/README.md);
- freeze/governance record: [`docs/spec/0.15.5-freeze.md`](docs/spec/0.15.5-freeze.md).

Implementation must not infer commercial behavior from the smoke UI or from technical convenience when the frozen specification defines an authority, invariant or exclusion.

## Current implementation status

**Phase 1 / F1-A — foundation**

This branch establishes only the technical base:

- Node.js + Express API;
- MongoDB/Mongoose connection boundary;
- environment validation;
- liveness and readiness endpoints;
- baseline HTTP hardening;
- graceful shutdown;
- minimal smoke UI for manual verification;
- initial test harness.

It deliberately does **not** implement catalog, inventory, authentication, checkout, orders or payments yet.

## Runtime baseline

- Node.js `24.19.0` LTS
- MongoDB `8.3.8` for local development
- Express `5.2.1`
- Mongoose `9.9.4`

Direct dependency versions are pinned and the repository contains a committed `package-lock.json`. CI installs from that lockfile with `npm ci`.

## Local development

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d mongo
npm ci
npm run dev
```

Then open:

```text
http://127.0.0.1:3001/__smoke/
```

Or query the API directly:

```bash
curl http://127.0.0.1:3001/health/live
curl http://127.0.0.1:3001/health/ready
```

## Repository commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run check
```

## Frontend strategy

A real business UI should be developed as a separate client against the engine contract. It may use Astro, React, Next.js or another appropriate stack without requiring changes to the ecommerce domain.

The smoke UI must never become the default visual foundation for client projects.
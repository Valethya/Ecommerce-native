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

The functional contract is frozen at **0.15.5**. The source of truth remains the original `ECOMMERCE_NATIVE_ESPECIFICACION_VIVA.md` version 0.15.5.

- [`docs/spec/0.15.5-freeze.md`](docs/spec/0.15.5-freeze.md) records the freeze/governance milestone.
- [`docs/spec/0.15.5/`](docs/spec/0.15.5/) is an auxiliary, non-normative reconstruction. It must not be used to infer, complete, substitute or reconstruct functional rules from the original specification.
- The literal canonical copy expected inside the repository is `docs/spec/ecommerce-native-0.15.5.md`. That copy is still pending because it may only be incorporated from the complete original artifact with literal identity preserved.

Implementation must not infer commercial behavior from the smoke UI, technical convenience or the auxiliary reconstruction when the frozen original specification defines an authority, invariant or exclusion.

## Current implementation status

**Phase 1 / F1-A — foundation**

This branch establishes only the technical base:

- Node.js + Express API;
- MongoDB/Mongoose connection boundary;
- environment validation;
- liveness and readiness endpoints;
- safe HTTP error boundary;
- bounded graceful shutdown;
- minimal smoke UI for manual verification;
- automated unit/integration tests;
- CI runtime smoke against MongoDB.

It deliberately does **not** implement catalog, inventory, authentication, checkout, orders or payments yet.

## Runtime baseline

- Node.js `24.19.0` LTS
- MongoDB `8.3.8` for local development and CI smoke verification
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

## Runtime configuration

`apps/api/.env.example` documents the local configuration. `ENABLE_SMOKE_UI` is ignored in production even when set to `true`. `SHUTDOWN_TIMEOUT_MS` bounds graceful shutdown and defaults to 10 seconds.

## Repository commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run check
```

## CI verification

For pull requests to `master` and pushes to `master`, CI:

1. installs the committed dependency graph with `npm ci`;
2. runs typecheck, tests and production build;
3. starts MongoDB;
4. starts the compiled API in production mode;
5. verifies `/health/live` and `/health/ready`;
6. verifies the Smoke UI is not exposed in production;
7. sends `SIGTERM` and requires a clean process exit.

## Frontend strategy

A real business UI should be developed as a separate client against the engine contract. It may use Astro, React, Next.js or another appropriate stack without requiring changes to the ecommerce domain.

The smoke UI must never become the default visual foundation for client projects.

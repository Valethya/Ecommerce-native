# F1-D — Catalog domain: implementation contract

**Status:** implementation authorized; Draft PR, no merge until evidence and adversarial review.  
**Baseline:** `master` after PR #5, merge commit `51a37170f9bc5e20c7e2d47c5a8519537ab99f1e`.  
**Authority:** frozen `docs/spec/ecommerce-native-0.15.5.md`, especially §14.1–14.14; accepted ADR-001–004, `docs/invariants.md`, and F1-C administrative permissions.

## Domain and persistence

- A product has immutable internal ID, name, description, unique mutable slug, ordered gallery (1–12 for publication), designated primary image, flat collections, per-collection manual position, state `draft|active|archived`, timestamps.
- Every product has at least one internal variant, including simple products. Variants have immutable ID, option-value combination, optional store-unique SKU, server-owned positive price when published, purchase limit (default 50), active flag, optional gallery image and timestamps. Stock fields and calculated availability are owned by **F1-E**, not invented in this slice.
- Up to three option types and one hundred active variants per product; unique values per option and unique combinations per product. Persist canonicalized option identity to enforce uniqueness atomically.
- Use database unique indexes for slug and defined SKU; protect concurrent writes, not only request validation. Avoid a separate authoritative product price.
- Never hard-delete products or variants from the admin interface. Archive returns to draft on restore; published products can be out of stock. Previously ordered variants cannot change their semantic option combination.
- Collections are flat, may be active or archived; products may belong to several or none. Public query must exclude inactive entities.

## API and authorization boundaries

- Administrative catalog reads require `catalog:read`; mutations require `catalog:manage` and the existing F1-C authenticated, MFA-backed session and CSRF protections. Reuse existing middleware; never create an alternative admin authentication path.
- Public reads return only active products, active variants and active collections; server-side pagination, name search, collection/option filters and optional availability filter. Avoid exposing unpublished information.
- Publication is an atomic validated state transition: valid name/unique slug, image, active variant, positive prices, valid limits and unique combinations. No stock required to publish.
- Price edits and identity edits must not rewrite historical orders; the order snapshot belongs to later phases. Audit event contract must preserve actor, timestamp, entity, old/new values and required reason; coordinate storage with F6-A rather than silently omitting events.
- File upload/optimization must be explicit and testable before publication; do not assume an image URL alone satisfies §14.6.

## Tests and exit criteria

1. Simple product always has one internal variant; invalid zero-variant state rejected.
2. Duplicate slug, SKU and option combination rejected under concurrent requests.
3. Limits: 3 option types, 100 active variants, 12 images, default purchase limit 50.
4. Publication gate and archive/restore transitions, including zero stock.
5. No cross-permission administrative access; CSRF/session protections preserved.
6. Public results never leak draft/archived products or inactive variants/collections; pagination and filtering.
7. Immutable IDs and semantic variant identity with commercial history; no permanent deletion.
8. Image validation, primary/fallback references and ordered gallery.
9. Price authority only on variant; audit evidence for material changes.
10. Typecheck, automated tests, build, MongoDB integration, CI, independent adversarial review on final HEAD.

## Explicit exclusions

No stock mutation or reservations (F1-E / F3); no production administrative UI (F1-F); no cart/checkout/orders/payments; no customer accounts, external search, custom product configurator, auto-generated collections, hierarchy, multi-store, multi-currency, or provider provisioning.

## Integration risks / implementation sequencing

1. Reverify F1-C auth, session, CSRF and permission assumptions with targeted tests.
2. Implement schemas/indexes and domain validation with concurrency tests.
3. Implement authorized admin operations and safe public read projections.
4. Implement media pipeline and publication validation; integrate audit evidence without silently implementing F6.
5. Complete CI and adversarial review, then merge and update roadmap.

**Open implementation decision:** Select and document image storage/optimization mechanism compatible with one independent installation per customer before enabling file uploads. Do not invent a production provider or credentials.

**Do not mark F1-D MERGED** until all acceptance evidence exists.

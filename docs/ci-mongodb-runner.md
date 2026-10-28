# CI MongoDB runner note

The F1-A workflow previously used a GitHub Actions service with `mongo:8.3.8`; PR #5 run #87 failed before checkout at `Initialize containers`, and retry #2 failed identically. No application checks ran. The root cause within the container initialization was not fully visible from the available annotations.

The workflow now starts a pinned-major MongoDB 8.0 container explicitly in a shell step, with replica-set flags, readiness polling, diagnostic `docker logs` on failure and a primary-election check. This makes container failures diagnosable in the job log and preserves transaction-capable CI semantics. `mongo:8.0` is a proposed supported image line, subject to live CI validation; do not assume it is proven until CI passes.

Scope: CI only, no production database version/configuration changes. Revisit pinning a digest after a successful run and compatibility review.

# Architecture Decision Records

This directory records durable architectural decisions for `ecommerce-native`.

## Purpose

ADRs explain why an architectural decision exists, what alternatives or pressures shaped it, and what consequences follow from it. They complement `docs/architecture.md`, which describes the current architecture, and `docs/roadmap.md`, which defines implementation sequence.

The canonical functional authority remains `docs/spec/ecommerce-native-0.15.5.md`. An ADR may document how the architecture implements an approved functional rule, but it may not weaken, replace or silently reinterpret that specification.

## When to create an ADR

Create an ADR when a decision is expected to affect multiple phases, constrain later implementation, select or reject an architectural boundary, or would be expensive/ambiguous to rediscover later.

Do not create ADRs for routine implementation details that can change locally without affecting the architecture.

## Status values

- `Proposed`: under review; not yet authoritative.
- `Accepted`: approved and active.
- `Superseded`: replaced by a later ADR; keep the original file unchanged except for a short supersession reference.
- `Rejected`: considered and explicitly not adopted.

## Numbering and naming

Use sequential identifiers:

`ADR-NNN-short-decision-name.md`

Do not renumber existing ADRs.

## Change policy

An accepted ADR is a historical record. Do not rewrite it to represent a materially different decision. Instead, create a new ADR and mark the previous one as superseded.

Minor corrections that do not change the decision, rationale or consequences are allowed.

## Recommended structure

1. Title
2. Status
3. Date
4. Context
5. Decision
6. Consequences
7. Supersedes / Superseded by, when applicable

## Current ADRs

- ADR-001 — Headless engine, one store per installation
- ADR-002 — MongoDB persistence boundary and MongoDB Atlas managed provider
- ADR-003 — Server-managed administrative authentication with mandatory MFA
- ADR-004 — Backend authority over commercial state and transitions

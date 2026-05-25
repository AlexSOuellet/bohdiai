# ADR 0001 — Block Registry Pattern

**Date:** 2026-05-25
**Status:** Accepted

## Context

Storefront pages are assembled from a variable list of blocks stored in the database (`page_blocks` table, ordered by `position`). At render time the code must look up which React component to render for each `block_key` string.

Multiple approaches were possible:
1. Dynamic imports keyed by block_key (code-splitting but complex manifest management)
2. A static registry object mapping string keys to components
3. A switch statement in the renderer (tight coupling, hard to extend)

## Decision

Use a static registry object (`BLOCK_REGISTRY` in `lib/block-registry.tsx`) that maps `block_key` strings to React components. The registry is populated at module load time — no dynamic imports.

Each block component declares typed props specific to its content schema. A single `asBlock()` adapter function casts each component to the generic `BlockComponent` type once at registration. The cast is intentional: the registry dispatches at runtime on `block_key`, which TypeScript can't statically verify. Each block is responsible for only reading fields that exist in its own content schema.

## Consequences

- Adding a new block requires: (1) create the component, (2) add one line to the registry. No other files change.
- Agents can generate new block variants from the skill template without touching registry logic.
- All blocks are bundled in the server component chunk (acceptable — blocks are server components and never run on the client).
- The `asBlock()` adapter makes the type-safety compromise explicit and localized to one function rather than scattered across the registry.

## Alternatives considered

Dynamic `import()` per block_key was rejected because it adds complexity (manifest, error handling for missing keys) without meaningful benefit — blocks are always server-rendered and bundle size isn't a concern for server components.

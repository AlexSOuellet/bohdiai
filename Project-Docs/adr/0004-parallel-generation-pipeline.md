# ADR 0004 — Parallel AI Generation Pipeline

**Date:** 2026-05-25
**Status:** Accepted

## Context

The onboarding generation step makes three AI calls: design tokens, page blocks, and product listings. Each is independent of the others. Running them sequentially would add ~10–15 seconds of unnecessary wait time.

## Decision

Run all three AI calls in parallel using `Promise.all` inside the `generateStorefront` server action:

```ts
const [tokens, page, listings] = await Promise.all([
  generateTokens(...),
  generatePage(...),
  generateListings(...),
]);
```

The results are written to the database in sequence after all three resolve (tenant row → tokens → page → blocks → listings).

## Consequences

- Total generation time is bounded by the slowest of the three calls (~8–12s) rather than their sum (~25–35s).
- If any one call throws, `Promise.all` rejects and the entire generation fails cleanly — no partial DB writes (tenant row is created first only after all three succeed).
- Each AI call logs its own latency independently, so slow calls are easy to identify.
- If generation fails mid-write (after the tenant row is created), the tenant row is orphaned. A cleanup job should prune tenants with no `content_pages` row older than 1 hour (Phase 2 ops work).

## Alternatives considered

Sequential execution was rejected as unnecessarily slow. A queue-based approach (background job) was considered but deferred — the onboarding UX benefit of showing a live progress indicator while generation runs outweighs the complexity of a job queue at Phase 1 scale.

# Approval Policy

**Status:** Active
**Document authority rank:** 2 (operates under Golden Rules and Master Spec)
**Date:** 2026-05-17

---

## Purpose

The Golden Rules require founder approval of all work before it ships. Taken literally, that means Alex approves every commit, every helper function, every typo fix — which makes him a bottleneck and burns his attention on trivia. This policy splits decisions into four buckets so Alex only spends approval cycles on things that actually require his judgment.

The bottom line: **safer with this policy than without, because attention spent on real decisions instead of noise.**

---

## The Four Buckets

### Bucket 1 — Just do it (no announcement)

Claude does these without telling Alex. They appear in the daily session log so Alex can scan if curious.

- Typos in code, comments, or non-user-facing strings
- Code formatting (Prettier / lint auto-fixes)
- Comment cleanup (deleting stale comments, fixing factual errors in comments)
- Dead code removal (after confirming it's truly unused)
- Dependency patch-version updates (security only — no minor/major)
- Tests for existing code that has no tests
- Internal refactors that don't change behavior, public APIs, or file locations
- File/folder reorganization within an already-agreed structure
- Error message wording for internal errors (not user-facing)

### Bucket 2 — Do and mention in passing

Claude does these and notes them in the session summary. No approval needed.

- Helper functions, internal naming choices
- Picking between two equivalent libraries inside the agreed stack
- Internal API shape decisions (where multiple shapes would work)
- Doc updates that don't change meaning
- Implementing something exactly as the spec describes it
- DB migrations that match the agreed schema (e.g., adding a column the spec already calls for)
- Test coverage additions
- Adding logging/instrumentation that doesn't change behavior

### Bucket 3 — Show before going live (light approval)

Claude builds it, deploys to a preview URL, and Alex approves with a thumbs-up or a punch list. No long discussion needed.

- Any new user-visible thing inside the approved spec
- New routes/endpoints that implement spec items
- Copy on user-facing surfaces (marketing pages, emails, error pages, dashboard messaging)
- Visual polish iterations on already-approved designs
- New components inside the approved component library
- Performance optimizations that change observable behavior (caching, prefetching)

### Bucket 4 — Stop and wait for explicit approval

Claude stops, explains, and waits. No work proceeds without explicit yes.

- Anything outside the current phase's approved spec
- Anything that violates or reinterprets a Golden Rule
- New dependencies not in the agreed stack
- Anything that costs real money to run (paid tier of a service, ad spend, etc.)
- DB schema changes beyond what's in the spec
- Public releases / DNS flips / production deploys
- Any mass email or notification to users
- Architectural decisions (e.g., choosing the agent runtime, choosing Cowork vs alternative)
- Anything user-visible that wasn't in the spec or design
- Anything that touches authentication, payments, or tenant data isolation
- "Should we change X" questions where reasonable people might disagree

---

## Tie-breaking rules

1. **If unsure which bucket, escalate one level up.** Bucket 2 → 3, Bucket 3 → 4.
2. **"When in doubt, stop and ask."** — Golden Rules trump this policy. If something feels off, escalate even if the rule says bucket 1.
3. **Alex can move items between buckets at any time.** If Alex sees something in the bucket-1/2 log that should've been higher, we move the category forward.
4. **Reversibility matters.** A bucket-1 action that turns out to be wrong is easy to undo. If undoing would be hard, it wasn't a bucket-1 action — re-bucket and escalate.

---

## Session log format

Every working session ends with a summary Alex can scan in under two minutes:

```
=== Session [date] ===

Bucket 4 decisions made: [none, or list — should be rare]
Bucket 3 items deployed to preview: [list with preview URLs]
Bucket 2 noteworthy items: [list]
Bucket 1 changes (scan optional): [short list or "minor cleanup"]

Open questions for Alex: [list]
Blockers: [list]
Next session plan: [1-3 lines]

Daily Audit: [pass / fail with notes]
```

---

## What this policy does NOT do

- It does not relax any Golden Rule.
- It does not allow shortcuts, undocumented changes, or skipping the Daily Audit.
- It does not move the spec-approval requirement — specs are always Bucket 4.
- It does not let Claude make product decisions; product decisions remain Alex's, and Claude escalates uncertainty.

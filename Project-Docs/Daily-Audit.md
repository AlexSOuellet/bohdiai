# Daily Audit

**Status:** Active
**Document authority rank:** 1 (this is the Golden Rules' audit, written down for daily use)
**Source:** BohdiAI Golden Rules v1.0 §8, plus CI automation and session log format
**Date:** 2026-05-17

---

## When to run

At the end of every working session, before declaring work complete. Any "No" answer must be resolved before the work is considered done.

---

## The 19 Questions (verbatim from Golden Rules §8)

| # | Question | Pass / Fail |
|---|---|---|
| 1 | Does today's work match the current phase spec? | |
| 2 | Does it follow the Master Spec decisions? | |
| 3 | Are all styles driven by design tokens (no hardcoded values)? | |
| 4 | Is tenant isolation enforced via RLS? | |
| 5 | Is the code modular and independently testable? | |
| 6 | Does it work without depending on unbuilt features? | |
| 7 | Has it been tested in isolation? | |
| 8 | Does it handle error states gracefully? | |
| 9 | Is it responsive (mobile-functional)? | |
| 10 | Does AI output stay within niche boundaries? | |
| 11 | Is AI generation unique per tenant? | |
| 12 | Does AI have a working fallback? | |
| 13 | Are tier limits enforced at the API level? | |
| 14 | Are inventory updates atomic? | |
| 15 | Does the component follow the established pattern? | |
| 16 | Has schema validation been applied? | |
| 17 | Is performance acceptable (< 3s storefront load)? | |
| 18 | Does it meet accessibility standards? | |
| 19 | Has it been reviewed and approved by the founder? | |

**Note on N/A:** Some questions don't apply to every session (e.g., #14 on a marketing-page session). Mark as N/A with one line explaining why. N/A is not a pass-by-default.

---

## Resolution Process (from Golden Rules)

- **Fail on a scope question (1, 2):** Stop work on that item. Confirm scope with the founder before proceeding.
- **Fail on a technical rule (3, 4, 5, 10, 11, 12, 13, 14, 15, 16):** Fix the violation before moving to the next task. Do not accumulate technical debt.
- **Fail on quality/performance (6, 7, 8, 9, 17, 18):** Log the issue with a severity level. Critical issues block progress. Non-critical issues are scheduled for the next session.
- **Unsure on any question:** Ask the founder. Uncertainty is not a pass.

---

## CI Automation (what runs on every commit)

These checks enforce a subset of the 19 questions automatically so the audit isn't trust-only:

| Check | Enforces audit question | Tool |
|---|---|---|
| TypeScript compile, no errors | 5, 6 | `tsc --noEmit` |
| ESLint (no `any`, no `console.log`, no commented code, no hardcoded colors) | 3, 5, 8 | ESLint with custom rules |
| Prettier (formatting) | 5 | Prettier |
| Unit + integration tests pass | 5, 7 | Vitest / Playwright |
| Test coverage minimums | 7 | Vitest coverage |
| Supabase migration: every tenant table has RLS policy | 4 | Custom migration check |
| No `if (tenantId === ...)` patterns | (Golden Rule: single codebase) | Custom ESLint rule |
| Lighthouse mobile ≥ 90 perf, ≥ 95 a11y/SEO/best practices | 17, 18 | Lighthouse CI on preview deploy |
| Axe a11y scan: zero serious/critical | 18 | axe-core in CI |
| Dependency vulnerability scan | (Engineering Standards §13) | Dependabot |
| No secrets committed | (Engineering Standards §13) | `gitleaks` or equivalent |

A failing CI check **blocks merge** to main. No exceptions, no `--no-verify`.

---

## Manual Audit (what only humans / sessions check)

These can't be automated and must be checked at end-of-session:

- Q1 — Does the work match the current phase spec? (Requires reading the spec and the diff.)
- Q2 — Does it follow Master Spec decisions? (Same.)
- Q8 — Error states graceful AND on-brand? (Tone, copy, design — human judgment.)
- Q10, 11, 12 — AI behavior within boundaries, unique, falls back? (Run AI generation and inspect.)
- Q13 — Tier limits enforced at API (not just UI)? (Manual probe with a test account.)
- Q14 — Inventory updates atomic? (Code review for race conditions.)
- Q15 — Follows established pattern? (Compare against the reference implementation.)
- Q19 — Founder approval? (Self-evident.)

---

## Session log format

Append to `session-logs/YYYY-MM-DD.md` at the end of each session:

```
=== Session 2026-MM-DD ===

Scope: [what we worked on, in one line]

Bucket 4 decisions: [none / list]
Bucket 3 items deployed to preview: [URLs]
Bucket 2 noteworthy items: [list]
Bucket 1 changes (scan optional): [list or "minor cleanup"]

Daily Audit:
  Q1-Q19: [pass/fail/N/A per question, with one-line notes on fails]
  Resolution actions taken: [list]

Open questions for Alex: [list]
Blockers: [list]
Next session plan: [1-3 lines]
```

---

## Mantras (from Golden Rules)

- "If it is not in the spec, do not build it."
- "If it violates a golden rule, it does not ship."
- "When in doubt, stop and ask."

# BohdiAI — Independent Codebase Audit

**Date:** 2026-05-31
**Auditor:** Claude (acting as an outside engineering firm)
**Mandate:** Objective assessment of the codebase's engineering quality — architecture, design cohesion, type safety, security, testing, data layer, performance, and tooling. This is a *state-of-the-code* report, not a product/feature review and not framed around any product goal.
**Method:** Six independent read-only sweeps across the repo, each owning one dimension, then verification of every high-severity claim against the *running* system (git, the live database, server logs) before reporting. No code was changed.
**Companion document:** Functional pipeline defects (empty nav, dropped fonts, etc.) are covered separately in `Engine-Audit-2026-05-31.md`. This report is about code health; that one is about behavior.

---

## Overall verdict

**This is a well-engineered codebase with genuinely strong fundamentals and no confirmed critical defects.** The discipline on display — maximally strict TypeScript, append-only migrations, full row-level security, atomic database writes, heavy runtime validation, ~99% library unit-test coverage — is above the norm for a project this young.

The real weaknesses are not crises; they are the kind of debt that quietly raises risk as the product grows:

1. **Type safety is eroded at exactly one place that matters most — the database boundary** — because the generated DB types are stale, forcing hand-written casts that turn off the compiler's protection right where data enters the system.
2. **The test suite proves the parts but not the whole.** Coverage is ~99% on library units, yet there is *no* test of the actual product pipeline (onboarding → compose → save → render). That gap is precisely why the functional bugs in the companion doc shipped undetected.
3. **Two storefront-generation code paths coexist** (legacy "blocks" and the new "layout tree"), and the switches that choose between them are scattered. Manageable now, debt later.
4. **Minor performance, CI, and hygiene gaps** that are cheap to fix and not yet biting.

A rough scorecard, by dimension:

| Dimension | Rating | One-line read |
|---|---|---|
| TypeScript strictness | Excellent | Gold-standard config; no `any` in the codebase |
| Security & tenant isolation | Strong | RLS everywhere, secrets server-only, inputs validated |
| Database schema & migrations | Excellent | Normalized, indexed, append-only, atomic writes |
| Architecture & cohesion | Good | Clean module boundaries; dual-path debt accruing |
| Type safety *in practice* | Fair | Stale generated types force unsafe casts at the DB edge |
| Testing | Mixed | Great unit coverage; the revenue path is untested end to end |
| Build / tooling / CI | Good | Solid; CI doesn't run a production build or lint |

---

## What the codebase does well (verified)

These are real strengths, not courtesies:

- **The strictest practical TypeScript config is on** — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, unused-locals/params, and more. There is **no bare `any`** anywhere in the code. This is rare and valuable.
- **Database discipline is exemplary.** Migrations are strictly append-only and timestamp-ordered, with no destructive operations. The schema is properly normalized, uses JSONB only where it belongs, and has the right composite indexes (tenant + slug, tenant + status) plus soft-delete-filtered uniqueness. The two big writes go through atomic, transactional stored procedures — an onboarding either produces a complete, consistent storefront or fails cleanly.
- **Security posture is sound.** Every table in the database has row-level security enabled. The powerful service-role database key is confined to server code and never reaches the browser bundle. Every public API route validates its input with a schema. Authentication uses the correct secure flow.
- **Runtime validation backs up the types.** Untrusted data (the AI's output, anything from JSON columns) is parsed through strict schemas before it's used. This is what keeps the system safe *despite* the type-boundary weakness noted below.
- **Clean module structure.** No circular dependencies; the layout subsystem is self-contained; the generation paths don't bleed into each other.
- **Honest, high unit-test coverage** with a documented, justified exclusion list, plus a smart performance-regression test guarding the layout validator.

---

## Findings, by severity

### High

**H1 — The test suite doesn't cover the product's main pipeline.**
Library units sit at ~99% coverage, but there are **zero tests** on the API routes and **no end-to-end test** of the journey that actually makes the product work: onboarding → AI composition → save to database → storefront render. The orchestration tests that do exist lean heavily on mocks, so they pass even when the real contracts between stages drift. This is the single most consequential code-health finding, because it directly explains the companion doc's functional bugs: the nav, font, and image failures live *in the seams between stages*, and nothing tests the seams. High coverage is currently giving false confidence.

**H2 — Type safety collapses at the database boundary.**
The generated database types (`lib/database.types.ts`) are stale — they're missing the `layout_tree` column and the `design_choices` table that later migrations added. To compile, the code works around this with hand-written `as unknown as` casts in the hottest data paths (the storefront renderer, the layout write path, the resolver). Inside those casts, the compiler is blind: if a query and the code disagree about a column's shape, nothing catches it until runtime. This is the chief reason the otherwise-excellent strict-typing story has a hole. (Mitigated, not closed, by the runtime schema checks.)

### Medium

**M1 — N+1 query in collection loading.** The collection resolver fetches the list of collections, then fires a separate COUNT query *per collection* in a loop. Fine at today's scale (a handful of collections), but latency grows linearly with collection count. Should be one grouped query. (`lib/layout/resolver-supabase.ts`.)

**M2 — Two storefront paths, scattered switches.** The legacy block-based path and the new layout-tree path coexist. The flags that decide which path a niche uses are spread across at least four files, and the two paths use different, untranslated design-data shapes. There's also no single column on a page that says which renderer it needs. None of this is broken, but it's the kind of duplication that breeds subtle bugs as it grows.

**M3 — Inconsistent error handling.** Logging mixes `console.error` and the structured logger across routes. More notably, email-send failures in the waitlist flow are swallowed — the route returns success even when the confirmation email didn't go out, so a user can think they're signed up when they aren't.

**M4 — CI doesn't run a production build or the linter.** The pipeline type-checks and runs tests, but never runs `npm run build`, so production-only build failures wouldn't surface until deploy. Lint also isn't gated in CI. Both are cheap to add and matter before launch.

**M5 — Generated DB types are drifting from the schema.** Same root cause as H2, called out separately because the fix is procedural: regenerate the types after each migration. Right now that step is being skipped, and the casts are the symptom.

### Low

- **L1 — Untracked log files** (`build-test.log`, `sse-out.log`, `sse-start.txt`) sit in the working tree and aren't in `.gitignore`. Harmless today, but they clutter status and risk an accidental commit.
- **L2 — A few redundant or duplicated casts and helpers** (e.g., repeated row-casting in the resolver) that could be factored into one helper.
- **L3 — Non-standard env var name** (`BOHDIAI_ANTHROPIC_KEY` instead of the conventional name) — deliberate, documented, works; noted only for the next engineer's benefit.
- **L4 — Major dependency upgrades available** (Zod 4, Tailwind 4, TypeScript 6). Current versions are stable; these are opt-in and should be scheduled, not rushed.

---

## Claims investigated and dismissed

A real audit is as much about what *isn't* wrong. Each of these was raised during the sweep and **disproven against the live system** — none is a real issue:

- **"Secrets are committed in `.env.local`."** False. The file is gitignored and untracked; the keys are not in the repository.
- **"Tenant routing middleware isn't wired; storefronts will 404."** False. Next.js 16 renamed the middleware file to `proxy.ts`; the server logs show it running on every request.
- **"A table is missing row-level security."** False. A direct database query confirms RLS is enabled on every table in the public schema.
- **"The layout-engine style sheet may not be persisted."** False. The write procedure inserts it, and a live row was confirmed.

(Separately: a GitHub access token was exposed in a chat session on 2026-05-30 and still needs rotating by Alex — that's a real action item, but it's an operational secret-hygiene task, not a codebase defect.)

---

## Risk register (consolidated)

| ID | Finding | Severity | Bites when |
|---|---|---|---|
| H1 | No end-to-end test of onboarding → render | High | Already — explains shipped functional bugs |
| H2 | Type safety bypassed at DB boundary via casts | High | A schema/query mismatch reaches production |
| M1 | N+1 query loading collections | Medium | Tenants accumulate many collections |
| M2 | Dual generation paths, scattered flags | Medium | Adding niches or changing either path |
| M3 | Swallowed email errors / inconsistent logging | Medium | A user's confirmation email silently fails |
| M4 | CI lacks production build + lint gates | Medium | Before/at launch |
| M5 | Generated DB types drift from schema | Medium | Every new migration widens the gap |
| L1–L4 | Logs untracked, minor dup, naming, deps | Low | Mostly cosmetic / future |

---

## The one structural theme

If there's a single thread tying the real findings together, it's this: **the system is rigorously validated at the edges (Zod) and rigorously typed in the middle (strict TS), but the two don't meet at the database boundary, and nothing tests the whole assembled pipeline.** That combination is why a codebase that looks 99% covered and fully strict still let the functional bugs through. Closing H1 and H2 — a real end-to-end test and fresh DB types — would do more for reliability than any other work, and would convert the existing strong foundations into trustworthy ones.

*No fixes were made. This document is assessment only.*

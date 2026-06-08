# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current status, what's next, and the lessons that carry forward. **This file stays short.** Detailed per-session recaps live in `session-logs/` (one file per session). At the end of a session, write the recap to `session-logs/session-NN.md`, add a one-line entry to the index at the bottom of this file, and update only the Current State / Next Actions / Standing Lessons sections here. Do not paste full recaps back into this file — that is what bloated it to 1,200 lines and broke the reader (Session 35 cleanup).

**Last updated:** 2026-06-08, going into Session 35.

---

## Standing lessons (carry forward every session)

- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Recurring offenders caught and removed: niche re-truncation, schema length caps, the name→gender table, worked examples baked into prompts. When you see one, pull it.
- **Don't build when asked a question.** Build only when told to. Claude has jumped to building mid-diagnosis more than once and it costs trust.
- **Cite, don't paraphrase the spec.** Don't state the spec from memory — re-read and cite. The Moment behavior got mis-described twice from memory.
- (These also live in the memory files. The brief keeps them in front of every session.)

---

## Current state

Phase 1 build, on branch `session-12/layout-engine`. The storefront engine is **real and runs live** — Bohdi picks the archetype + skin, the Director + Crew pipeline (`lib/onboarding/crew/`) authors and generates everything, and it publishes a live tenant on production Supabase. Main Street is the primary archetype; its signature front door is the Moment. Two live builds exist — `wallys-wood` (woodworker / rustic) and `claires-candles` (candles / sunset). 1000+ tests green.

Session 34 was design + planning only — no engine code shipped. It produced two written, TDD'd implementation plans (below) and audited bias in the agent video prompts.

## Next actions

Two plans are written and ready to execute next session:

1. **Main Street fixes** — `docs/superpowers/plans/2026-06-08-mainstreet-fixes.md`. Six tasks from the Session 33 live walk: gender-neutral maker image (D42), shrink the oversized type scale, Contact form + wire the dead close CTA, mobile/responsive pass, single-image product detail, and the portable play-first Moment rebuild (D33/D43). **Tasks 1–4 are ready with no decisions. Task 5 (product image approach) and Task 6 (Moment "melt" contract) each carry a design decision — confirm with Alex before building those two.**

2. **Build changes** — `docs/superpowers/plans/2026-06-08-build-changes.md`. Parts A–D ready now: route the Moment video to Seedance 2.0, delete the dead legacy layout-engine path (and its niche bias), forbid text-in-image in the cinematographer shot, log the crew's choices to `design_choices`. **Part E (redefine moods as feelings; goods treatment follows mood) is design-gated — needs Alex to lock five decisions before it becomes tasks: the feeling-definition of each of the seven moods, the color layer, the skin re-tagging, the mood→treatment mapping, and the Templated set design.**

---

## Session log index (full recaps in `session-logs/`)

- [Session 34](session-logs/session-34.md) — Design + planning: wrote the two implementation plans above; bias audit of video prompts
- [Session 33](session-logs/session-33.md) — Built the Director + Crew, ran two live builds, then a punch list
- [Session 32](session-logs/session-32.md) — Bug-fix sweep from a live build, then the Director + Crew design
- [Session 31](session-logs/session-31.md) — Finished Main Street: content engine, home restructure, full multi-page storefront
- [Session 30](session-logs/session-30.md) — Archetype catalog reframe; the Moment as signature front door; selection model
- [Session 29](session-logs/session-29.md) — Deep skin shelf (29 skins); TRY-ON conversion tool; first admin dashboard
- [Session 28](session-logs/session-28.md) — Reviewed 4 live stores; archetype/skin fixes; deep-skin-shelf brainstorm
- [Session 27](session-logs/session-27.md) — Built the REAL storefront engine, ran it live; three real stores shipped
- [Session 26](session-logs/session-26.md) — Main Street section-variation pass; key product decisions locked
- [Session 25](session-logs/session-25.md) — Built the four-beat Main Street renderer; judged NOT a real test
- [Session 24](session-logs/session-24.md) — The SHAPE+SKIN reframe; Main Street as a moment-as-hero sales page
- [Session 23](session-logs/session-23.md) — Main Street built then judged too safe; the Moment IS the hero
- [Session 22](session-logs/session-22.md) — The Gallery: first true maker-shop archetype, built + rendering
- [Session 21](session-logs/session-21.md) — Pivot to ARCHETYPES; Bohdi as editor-in-chief; first archetype shipped
- [Session 20](session-logs/session-20.md) — Intro Moments engine built + run live; background builds started
- [Session 19](session-logs/session-19.md) — Moments engine designed; Higgsfield asset pipeline proven
- [Session 18](session-logs/session-18.md) — Renderer pass: the whole storefront renderer consumes the design system
- [Session 17](session-logs/session-17.md) — Partial design-system engine; canary onboarding burned
- [Session 16](session-logs/session-16.md) — Context recovery, two audits, page-architecture policy
- [Session 15](session-logs/session-15.md) — Storefront speed fix + an over-broad lint cleanup
- [Session 14](session-logs/session-14.md) — Design conversation, no code
- [Session 12 backlog](session-logs/session-12-backlog.md) — Session 12 test results (most items closed in Session 13)

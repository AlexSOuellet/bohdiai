# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current status, what's next, and the lessons that carry forward. **This file stays short.** Detailed per-session recaps live in `session-logs/` (one file per session). At the end of a session, write the recap to `session-logs/session-NN.md`, add a one-line entry to the index at the bottom of this file, and update only the Current State / Next Actions / Standing Lessons sections here. Do not paste full recaps back into this file — that is what bloated it to 1,200 lines and broke the reader (Session 35 cleanup).

**Last updated:** 2026-06-08, end of Session 36, going into Session 37.

---

## Standing lessons (carry forward every session)

- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Recurring offenders caught and removed: niche re-truncation, schema length caps, the name→gender table, worked examples baked into prompts. When you see one, pull it.
- **Don't build when asked a question.** Build only when told to. Claude has jumped to building mid-diagnosis more than once and it costs trust.
- **Cite, don't paraphrase the spec.** Don't state the spec from memory — re-read and cite. The Moment behavior got mis-described twice from memory.
- **Neutrality is not intent.** Over-removing "bias" can strip a load-bearing product decision — making the cinematographer neutral on video-vs-still dropped the "the Moment is motion, prefer video" intent. Bias to remove = an imposed *taste*; product intent (prefer video, never rename the shop) stays.
- **Verify against live data + real code, not memory.** This session a too-quick "cozy skin is mismatched" claim was reversed by querying the DB (the crew picked the warm Hearthstone skin — it was right).
- **Check whether the ask is one or two concrete changes before building a framework.** Session 36: a small fix (the crew picks the same treatment every build) got turned into feeling-definitions, mood families, weight studies, and a comparison harness — Alex stopped it twice ("futility," "over complicating"). The actual fix was variety in the pick + two treatment tweaks. When something feels like it needs a theory, it usually needs a small change.
- (These also live in the memory files. The brief keeps them in front of every session.)

---

## Current state

Phase 1 build, on branch `session-12/layout-engine`. The storefront engine is **real and runs live** — Bohdi picks the archetype + skin, the Director + Crew pipeline (`lib/onboarding/crew/`) authors and generates everything, and it publishes a live tenant on production Supabase. Main Street is the primary archetype; its signature front door is the Moment. ~990 tests green.

Session 36 shipped the two confirmed crew fixes plus a build-failure fix, all TDD, suite green (1005+ tests): **D46** (the crew authors each link's destination, not just its label — new `lib/archetypes/main-street/links.ts` with `LINK_TARGETS`/`linkHref`, authored nav via `resolveNav`, tolerant of legacy rows); **D47** (the cinematographer reaches for video, a still is the last resort); and a **copywriter length-feedback fix** (a live build died on a 600-char description overflow — the retry loop now reports the field's real length + chars to cut so it converges). Then a long, hard design conversation on the mood overhaul that **inverted the whole plan** — see below. Full recap: `session-logs/session-36.md`.

## Next actions

**Next session = finish the mood-overhaul rethink, then build it.** The Part E plan as written is DEAD — Session 36 established that **any treatment works with any mood, so there is NO mood→treatment mapping.** The real problem is the crew converging on the same goods AND about treatment every build (no variety). Resume here:

0. **Answer the open question first (it gates everything):** the variety fix must come from getting the CREW to choose, NOT code making the pick (Alex: "find a way to get the crew to choose randomly is NOT coding it"). But models converge even when told to "choose randomly." Proposed: hand Bohdi a random "roll" in his brief he uses to pick — code supplies the dice, Bohdi reads them. **Unanswered:** does a roll count as "the crew choosing," or is even that too close to coding it (prompt-only, less reliable)? Resolve, then build.
1. Get the crew to pick the goods AND about treatments with real variety (per the answer above).
2. **Rebuild procession** — two-up and staggered, ~a row and a half (currently one product per full-width row, ~3 screens; takes too much space).
3. **Speed up the slideshow** (too slow).
4. **Maker treatment-override in the dashboard** — the treatment is already a stored per-shop field; the picker lands with the website editor.

Notes: the about matters MORE than goods for conveying mood (so it's the higher-value lever); mood still drives colors/skin as before. The five-decision Part E gate (feeling-definitions, color layer, skin re-tagging, mood→treatment map, Templated) is largely moot now that there's no mapping — but the **Studio skin's `Syne` font (Alex dislikes)** and skin re-tagging may still want attention separately.

Also open (lower priority): delete the dead **broadsheet** archetype (chip spawned this session) and the dead `lib/bohdi/` directory (chip spawned earlier); the heroless-archetype Moment variant; founder photo/text sizes are an eyeball judgment call.

---

## Session log index (full recaps in `session-logs/`)

- [Session 36](session-logs/session-36.md) — Shipped D46 (crew authors link destinations), D47 (cinematographer prefers video), and a copywriter length-feedback fix (build-failure); then a long mood-overhaul design conversation that inverted the plan (any treatment fits any mood → no mapping; the bug is convergence; fix = crew chooses with variety, not code)
- [Session 35](session-logs/session-35.md) — De-bloated the brief; shipped both Session-34 plans (8 fixes) + corrected logging; locked + built the D44 Moment; live-build fix loop (shop name, Seedance fast, clickable products, founder beat); punch list D45–D47
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

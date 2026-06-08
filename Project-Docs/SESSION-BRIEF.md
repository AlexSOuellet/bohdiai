# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current status, what's next, and the lessons that carry forward. **This file stays short.** Detailed per-session recaps live in `session-logs/` (one file per session). At the end of a session, write the recap to `session-logs/session-NN.md`, add a one-line entry to the index at the bottom of this file, and update only the Current State / Next Actions / Standing Lessons sections here. Do not paste full recaps back into this file — that is what bloated it to 1,200 lines and broke the reader (Session 35 cleanup).

**Last updated:** 2026-06-08, end of Session 35, going into Session 36.

---

## Standing lessons (carry forward every session)

- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Recurring offenders caught and removed: niche re-truncation, schema length caps, the name→gender table, worked examples baked into prompts. When you see one, pull it.
- **Don't build when asked a question.** Build only when told to. Claude has jumped to building mid-diagnosis more than once and it costs trust.
- **Cite, don't paraphrase the spec.** Don't state the spec from memory — re-read and cite. The Moment behavior got mis-described twice from memory.
- **Neutrality is not intent.** Over-removing "bias" can strip a load-bearing product decision — making the cinematographer neutral on video-vs-still dropped the "the Moment is motion, prefer video" intent. Bias to remove = an imposed *taste*; product intent (prefer video, never rename the shop) stays.
- **Verify against live data + real code, not memory.** This session a too-quick "cozy skin is mismatched" claim was reversed by querying the DB (the crew picked the warm Hearthstone skin — it was right).
- (These also live in the memory files. The brief keeps them in front of every session.)

---

## Current state

Phase 1 build, on branch `session-12/layout-engine`. The storefront engine is **real and runs live** — Bohdi picks the archetype + skin, the Director + Crew pipeline (`lib/onboarding/crew/`) authors and generates everything, and it publishes a live tenant on production Supabase. Main Street is the primary archetype; its signature front door is the Moment. ~990 tests green.

Session 35 shipped a lot: both Session-34 plans (8 fixes), the corrected crew-choice logging, the **D44 Moment** (cold front-door intro that autoplays → rests → waits for "Enter site" → melts into the hero, with the play-once cookie and deep-link bypass), and a "single test" batch of live-build fixes (shop-name passthrough D45, Seedance fast, clickable products, founder-beat intimacy, gender-neutral founder prompt). Four live builds run this session: `night-shade-candles`, `bountiful-breads`, `my-site`, plus the earlier `evening-shadow-canles`. Seedance fast cut build time ~7min → ~4min and cost. Full recap: `session-logs/session-35.md`.

## Next actions

**Next session = the mood overhaul + the two confirmed crew fixes.** All three are documented decisions; build to them.

1. **The mood overhaul (Part E)** — `docs/superpowers/plans/2026-06-08-build-changes.md` Part E. Still design-gated: needs Alex to lock five decisions before it becomes tasks — the feeling-definition of each mood, the color layer, the skin re-tagging, the mood→treatment mapping, and the Templated baseline. **The Studio skin's `Syne` display font (which Alex dislikes) folds into this skin work.**
2. **Links the crew's way (D46)** — the crew authors each CTA/nav DESTINATION alongside its label (point at the real pages: shop/about/events/contact/product); stop hardcoding destinations, and use the authored nav instead of discarding it. Confirmed bug across every live build ("Shop now" → /contact, etc.).
3. **Cinematographer prefers video (D47)** — always reach for video; a still only when there's genuinely no simple ambient motion to capture. (2 of 3 builds wrongly chose stills.)

Also open (lower priority): finish deleting the dead `lib/bohdi/` directory (chip spawned); the heroless-archetype Moment variant (when a heroless archetype exists); the founder photo/text sizes are a judgment call worth an eyeball.

---

## Session log index (full recaps in `session-logs/`)

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

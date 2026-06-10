# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current status, what's next, and the lessons that carry forward. **This file stays short.** Detailed per-session recaps live in `session-logs/` (one file per session). At the end of a session, write the recap to `session-logs/session-NN.md`, add a one-line entry to the index at the bottom of this file, and update only the Current State / Next Actions / Standing Lessons sections here. Do not paste full recaps back into this file — that is what bloated it to 1,200 lines and broke the reader (Session 35 cleanup).

**Last updated:** 2026-06-10, Session 39 (Other-niche test, alt-cap fix, logo rules).

---

## Standing lessons (carry forward every session)

- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Recurring offenders caught and removed: niche re-truncation, schema length caps, the name→gender table, worked examples baked into prompts. When you see one, pull it.
- **Don't build when asked a question.** Build only when told to. Claude has jumped to building mid-diagnosis more than once and it costs trust.
- **Cite, don't paraphrase the spec.** Don't state the spec from memory — re-read and cite. The Moment behavior got mis-described twice from memory.
- **Neutrality is not intent.** Over-removing "bias" can strip a load-bearing product decision — making the cinematographer neutral on video-vs-still dropped the "the Moment is motion, prefer video" intent. Bias to remove = an imposed *taste*; product intent (prefer video, never rename the shop) stays.
- **Verify against live data + real code, not memory.** This session a too-quick "cozy skin is mismatched" claim was reversed by querying the DB (the crew picked the warm Hearthstone skin — it was right).
- **Check whether the ask is one or two concrete changes before building a framework.** Session 36: a small fix (the crew picks the same treatment every build) got turned into feeling-definitions, mood families, weight studies, and a comparison harness — Alex stopped it twice ("futility," "over complicating"). The actual fix was variety in the pick + two treatment tweaks. When something feels like it needs a theory, it usually needs a small change.
- **Don't mutilate content to satisfy an arbitrary constraint; remove the constraint.** Session 37: a string of builds failed on copy length; Claude built a copy-*trimmer* to protect the caps. Alex stopped it — the copy is the good part, the cap was the arbitrary part. Body prose now has no hard cap (the design carries any length); a build never fails or trims on copy. And raising a cap is itself a band-aid — for unbounded model output, "who's to say next time it's larger" — bound it softly (a prompt nudge) or not at all, never with a bigger number.
- (These also live in the memory files. The brief keeps them in front of every session.)

---

## Current state

Phase 1 build, on branch `session-12/layout-engine`. The storefront engine is **real and runs live** — Bohdi picks the archetype + skin, the Director + Crew pipeline (`lib/onboarding/crew/`) authors and generates everything, and it publishes a live tenant on production Supabase. Main Street is the primary archetype; its signature front door is the Moment. Suite green (~885 after the dead-code deletion), tsc clean. **End of Session 37 Alex called a live build the best yet** — "the moment is good, the fonts look good, the content is good, the marquee is good, colors are good" — and is continuing to test.

Session 37 was a big two-part day, all TDD. Morning: the treatment **roll** (D48 — code deals each converging beat a roll Bohdi plays or overrides; rolled/played/overrode logged), deleting the dead mood→treatment rules (D49), and the **Constellation** procession + faster slideshow (D50). Afternoon, from live builds: **D51 — the mood lineup is now seven FEELINGS** (Dark, Rustic, Cozy, Modern, Elegant, Playful, Industrial; color is a layer Bohdi picks inside the feeling, not a mood; Botanical/Sunset/Simple retired; Romantic stays rejected), with skins re-tagged to the feelings, a tenant migration, and the **dead legacy layout-engine path deleted** (`lib/bohdi`, legacy `lib/generation`, broadsheet, probe pages, style-sheet JSON). Plus **D52** (the Moment camera is locked — a moving camera breaks the seamless loop) and **D53** (no hard caps on body prose — the design carries any length, the build never fails or trims on copy; caps stay only on structural display fields; a soft prompt nudge keeps copy punchy and generation fast). Full recap: `session-logs/session-37.md`.

## Audit (Session 38) — what's done, what's open

A full third-party-style audit ran this session across security, dead code, engineering practices, and the data layer. Two deliverables: `project-docs/Audit-2026-06-10.md` (findings) and `project-docs/Audit-Fix-Plan-2026-06-10.md` (the living fix tracker — **start here for the audit backlog**).

Done this session: **A1** (regenerated `database.types.ts` from the live DB and removed all three `as unknown as` casts; added a repeatable `npm run gen:types`; `tsc` clean, 885 tests pass) and **D5a** (dropped the two dead legacy RPCs, migration `20260610000001`). Locked: **Try-On is in launch scope**, so `store_versions` + `lib/tryon/*` are keepers, not dead code.

Open audit backlog (in the fix plan): A2 (transactional storefront write + missing test — half-built stores currently persist on failure), A3 (silent build-status errors), A4 (pipeline timeout budget over the 300s ceiling — caused a real failure), B1 (proxy `x-tenant-id` strip), all of Phase C (the security launch-gate, depends on auth), and Phase D code-file cleanup. **Awaiting Alex's call:** delete-or-gate the preview routes (`app/archetype-test/**`, `app/_reference/functional-studies`) and the design scratch files (`procession-mockup.html`, `_design-mocks/`, `skin-shelf.html`); and whether to retire the legacy `StorefrontPage` fallback so `style_sheets` can be dropped.

## Session 39 — Other-niche test, alt-cap fix, logo rules

Built the "Other → describe what you make" path as a throwaway test (no research, no saved niche) and ran it live. Verdict, in Alex's words: **typed text is the EXCEPTION, curated niche files are the RULE** — free-text-only builds flatten a multi-craft maker and misread unusual crafts (a 3-craft maker collapsed to one; "3D planetary prints" → wall prints). So the launch niche files are back on. Also fixed a build-killing copy cap (`alt` was still hard-capped at 240 and threw a build — a D53 miss; uncapped at all four sites) and reworked the logo: **a real uploaded logo now RULES the header** — sized up, on a fixed near-white plate so it can't go dark-on-dark, wordmark is the no-logo fallback. Suite green (894), tsc clean. Full recap: `session-logs/session-39.md`. Two draft decisions await Alex's readback (D54 text-is-the-exception, D55 logo-rules).

## Next actions (for tomorrow — Alex said "do them both" = logo + niche files)

1. **Logo — more work** (Alex flagged it's not done). Today made it prominent + contrast-safe; tomorrow refine the treatment live and settle the **brand-colors** question — the logo's colors are captured at onboarding but `run-storefront` deliberately drops them before the build (a test even asserts it). Wiring them in needs the design call first: when a maker picks a mood AND uploads a logo, which leads — logo overrides the mood palette, tints it, or just nudges skin selection?
2. **Launch niche files.** First finish the **niche-writer skill** prose-only rewrite (it still emits the retired style-sheet JSON — edit started, held off). Then write the ~18-niche launch set as draft `.md` files (sticker, apparel/t-shirt, personalized gifts, polymer clay, resin, pins/patches, embroiderer, glass, **pet products**, toy, wedding stationery, calligraphy, printables, pattern seller, jam, honey, hot sauce, chocolatier — slugs/type-fit in `content/niches/_queue.yaml`), review for genericness, seed `approved`.
3. **Founder-name fix** (spawn_task chip `task_cf37e76c`): Bohdi invents/omits the maker name in the About copy — force the real onboarding name in like the shop name (D45); never infer gender (D42).
4. **CI is red on the coverage gate** (not test logic): `lib/**` under 90% because Try-On shipped without tests (`write-version.ts` 0%, `convert.ts` ~29%). Every push emails a failure until the Try-On tests land. Deferred today.

Still open from before: **Templated** (the 8th mood / baseline foil); full onboarding-screen revamp; the heroless-archetype Moment variant; the Studio skin's `Syne` font; the audit backlog (A2–A4, B1, Phase C/D in `Audit-Fix-Plan-2026-06-10.md`).

---

## Session log index (full recaps in `session-logs/`)

- [Session 39](session-logs/session-39.md) — Parked the portfolio niches (tattoo/photographer/fine-artist/sewing → draft). Built + live-tested the Other "describe what you make" path → verdict: typed text is the exception, curated files the rule. Fixed the `alt` cap killing builds (D53 miss). Logo now rules the header (prominent + contrast plate). Flagged: founder-name bug, brand-colors dropped, CI coverage red. Niche-file batch + more logo work tomorrow.
- [Session 38](session-logs/session-38.md) — Full codebase audit (security, dead code, practices, data layer) → `Audit-2026-06-10.md` + `Audit-Fix-Plan-2026-06-10.md`. Did A1 (type regen + de-cast + `gen:types`) and D5a (dropped two dead RPCs). Locked Try-On as launch scope. Rest of the audit backlog tracked in the fix plan.
- [Session 37](session-logs/session-37.md) — Big two-part day. Built the treatment roll (D48), deleted the dead mood→treatment rules (D49), Constellation + faster slideshow (D50). Then from live builds: redefined the mood lineup to seven feelings + retired color-as-mood (D51), locked the Moment camera (D52), removed hard caps on body prose (D53), and deleted the dead legacy layout-engine path. Ended on the best build yet.
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

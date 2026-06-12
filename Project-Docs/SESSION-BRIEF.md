# Session Brief — BohdiAI

**Purpose:** the operational state a fresh session needs to start — current status, what's next, and the lessons that carry forward. **This file stays short.** Detailed per-session recaps live in `session-logs/` (one file per session). At the end of a session, write the recap to `session-logs/session-NN.md`, add a one-line entry to the index at the bottom of this file, and update only the Current State / Next Actions / Standing Lessons sections here. Do not paste full recaps back into this file — that is what bloated it to 1,200 lines and broke the reader (Session 35 cleanup).

**Last updated:** 2026-06-12, Session 41 (product photos at onboarding + 3 ridealong fixes + Vision tool-use fix).

---

## Standing lessons (carry forward every session)

- **Bias is the throughline.** Every imposed cap, example, default, or heuristic is suspect. Recurring offenders caught and removed: niche re-truncation, schema length caps, the name→gender table, worked examples baked into prompts. When you see one, pull it.
- **Don't build when asked a question.** Build only when told to. Claude has jumped to building mid-diagnosis more than once and it costs trust.
- **Cite, don't paraphrase the spec.** Don't state the spec from memory — re-read and cite. The Moment behavior got mis-described twice from memory.
- **Neutrality is not intent.** Over-removing "bias" can strip a load-bearing product decision — making the cinematographer neutral on video-vs-still dropped the "the Moment is motion, prefer video" intent. Bias to remove = an imposed *taste*; product intent (prefer video, never rename the shop) stays.
- **Verify against live data + real code, not memory.** This session a too-quick "cozy skin is mismatched" claim was reversed by querying the DB (the crew picked the warm Hearthstone skin — it was right).
- **Check whether the ask is one or two concrete changes before building a framework.** Session 36: a small fix (the crew picks the same treatment every build) got turned into feeling-definitions, mood families, weight studies, and a comparison harness — Alex stopped it twice ("futility," "over complicating"). The actual fix was variety in the pick + two treatment tweaks. When something feels like it needs a theory, it usually needs a small change.
- **Don't mutilate content to satisfy an arbitrary constraint; remove the constraint.** Session 37: a string of builds failed on copy length; Claude built a copy-*trimmer* to protect the caps. Alex stopped it — the copy is the good part, the cap was the arbitrary part. Body prose now has no hard cap (the design carries any length); a build never fails or trims on copy. And raising a cap is itself a band-aid — for unbounded model output, "who's to say next time it's larger" — bound it softly (a prompt nudge) or not at all, never with a bigger number. Session 41 reinforced this: the product description schema cap (max 600) was missed when D53 went in; killed a live build until removed. D53 applies to EVERY body-prose field, not just the ones the Crew touches.
- **Forced tool_use is the default for any structured AI output beyond hex-codes scale.** Raw JSON-in-text works for tiny outputs (a few hex strings); it breaks at ~1k+ chars because the model's quote-escaping is fragile. Every existing crew member uses tool_use for this reason. Session 41 shipped a Vision call with raw JSON parsing, copied from the logo path; it broke on the first real build (1.8k of JSON, unescaped quote at char 1784) and failed silently. New AI integrations default to tool_use; raw-text JSON is the exception and must justify itself.
- (These also live in the memory files. The brief keeps them in front of every session.)

---

## Current state

Phase 1 build, on branch `session-12/layout-engine`. The storefront engine is **real and runs live** — Bohdi picks the archetype + skin, the Director + Crew pipeline (`lib/onboarding/crew/`) authors and generates everything, and it publishes a live tenant on production Supabase. Main Street is the primary archetype; its signature front door is the Moment. Suite green (~885 after the dead-code deletion), tsc clean. **End of Session 37 Alex called a live build the best yet** — "the moment is good, the fonts look good, the content is good, the marquee is good, colors are good" — and is continuing to test.

Session 37 was a big two-part day, all TDD. Morning: the treatment **roll** (D48 — code deals each converging beat a roll Bohdi plays or overrides; rolled/played/overrode logged), deleting the dead mood→treatment rules (D49), and the **Constellation** procession + faster slideshow (D50). Afternoon, from live builds: **D51 — the mood lineup is now seven FEELINGS** (Dark, Rustic, Cozy, Modern, Elegant, Playful, Industrial; color is a layer Bohdi picks inside the feeling, not a mood; Botanical/Sunset/Simple retired; Romantic stays rejected), with skins re-tagged to the feelings, a tenant migration, and the **dead legacy layout-engine path deleted** (`lib/bohdi`, legacy `lib/generation`, broadsheet, probe pages, style-sheet JSON). Plus **D52** (the Moment camera is locked — a moving camera breaks the seamless loop) and **D53** (no hard caps on body prose — the design carries any length, the build never fails or trims on copy; caps stay only on structural display fields; a soft prompt nudge keeps copy punchy and generation fast). Full recap: `session-logs/session-37.md`.

## Audit (Session 38) — what's done, what's open

A full third-party-style audit ran this session across security, dead code, engineering practices, and the data layer. Two deliverables: `project-docs/Audit-2026-06-10.md` (findings) and `project-docs/Audit-Fix-Plan-2026-06-10.md` (the living fix tracker — **start here for the audit backlog**).

Done this session: **A1** (regenerated `database.types.ts` from the live DB and removed all three `as unknown as` casts; added a repeatable `npm run gen:types`; `tsc` clean, 885 tests pass) and **D5a** (dropped the two dead legacy RPCs, migration `20260610000001`). Locked: **Try-On is in launch scope**, so `store_versions` + `lib/tryon/*` are keepers, not dead code.

Open audit backlog (in the fix plan): A2 (transactional storefront write + missing test — half-built stores currently persist on failure), A3 (silent build-status errors), A4 (pipeline timeout budget over the 300s ceiling — caused a real failure), B1 (proxy `x-tenant-id` strip), all of Phase C (the security launch-gate, depends on auth), and Phase D code-file cleanup. **Awaiting Alex's call:** delete-or-gate the preview routes (`app/archetype-test/**`, `app/_reference/functional-studies`) and the design scratch files (`procession-mockup.html`, `_design-mocks/`, `skin-shelf.html`); and whether to retire the legacy `StorefrontPage` fallback so `style_sheets` can be dropped.

## Session 41 — Product photos at onboarding + 3 ridealong fixes + Vision tool-use fix

Optional product-photo upload step at onboarding 4 (after logo, before mood). Drag-and-drop up to 5 photos with prominent Skip. Server action uploads + runs ONE batched Vision call returning per-photo product suggestions and a `makerWork` summary. Director and Cinematographer prompts read `makerWork` to ground in real subject matter; Copywriter reads per-photo suggestions and authors products 1..N around the uploads with stand-ins filling N+1..5. **Graphic Artist is structurally denied access** — the pipeline strips `visionPerPhoto`/`makerWork` from the brief before `designLook`. Skin pick stays niche + mood (D41), accent stays logo (D56). `buildArchetypeStore` pre-populates the product URL map so fal only generates images for slots not covered by uploads. Catalog target is flat 5 across all paths (matches MAX_PRODUCT_IMAGES). Suite: 946 → **989 passing**, tsc clean.

Three ridealong fixes shipped first as independent commits: **founder-name attribution lock** (Copywriter receives `brief.makerName` and locks `founder.attribution` to it, generic fallback when missing), **portrait scrim wraps the text** (siblings in a bottom-anchored wrapper so the scrim follows the text bounding box regardless of quote length, widened to 32ch), **catalog-size step retired** (`productCount` stays as forward-compat on `OnboardingData`).

Two production bugs caught on Alex's live builds. **D53 miss on product description schema** — `lib/archetypes/main-street/builder.tsx` still had `.max(600)` on `description` and `12-600` / `40-700` / `20-400` text in the legacy `authoringSpec` prompt (about story / contact intro). Killed a build. Dropped the cap and the matching prompt text. **Vision raw-JSON parsing failure** — Patriot Woodworking build "took the images, no awareness, ran cheap." Diagnosed via the new `archetype-build: brief` log line + the upload-step output: Vision threw on `JSON.parse` at character 1784, build degraded silently to empty visionPerPhoto/makerWork. Converted to forced tool_use (same pattern every other crew member uses), bumped Vision timeout 60s → 90s, added one retry. Alex confirmed the next build: "much better."

Subagent-driven development paid for itself twice — one implementer caught my plan had `/api/onboarding/generate` as the live route when it's actually `/start`; the code reviewer caught the portrait-scrim test asserted only sibling-ness (which the buggy code also satisfied). Both fixed inline.

Full recap: `session-logs/session-41.md`.

## Session 40 — Logo lockup + brand-color anchoring, spotlight Moment treatment

A two-part day, all TDD on plan→spec→build. Suite went 921 → **946 passing**, tsc clean, branch ahead of origin by 33 commits.

**Part 1 — logo + brand colors.** The "logo plate" from Session 39 read cheap on a transparent logo and we were already extracting brand colors via Vision at onboarding then throwing them away. Built two-track: render-time logo header contrast (delete plate, give header a contrasting surface only when the logo would wash out — derived live from persisted `tenants.brand_colors`, works for late uploads) AND build-time strong accent override (the dominant logo color becomes the skin's accent, baked into the envelope so a late upload never silently repaints). Guard against gray and low-contrast colors so the maker's brand only takes the accent when it's a real readable color. Logo now sits next to the wordmark as a true lockup. Backfill script (`scripts/backfill-tenant-brand-colors.mjs`) lets us test the new treatment on an existing tenant without rebuilding. Live-tested Rhody Strong: Vision returned navy + gold, navy correctly skipped on the dark Hearthstone skin (the guard working as designed — a real-product test of the feature).

**Part 2 — spotlight Moment treatment.** D47's "prefer video" was pushing Bohdi to invent motion (light sweeps, fake fabric wind, products spinning on their own) for static-product niches because the criterion didn't fit them. Reframed as TWO treatments — video for niches with real ambient motion that belongs to the subject (steam, flame, water, hands at work), spotlight for static products (stickers, jewelry, prints). The director now picks the kind from the criterion "would I have to invent the motion to fill the time?". For spotlight, the object rises out of pure black, slow push-in, a single tagline lands over the wordmark — the rise IS the story, no multi-line story arc. Copywriter writes one tagline for spotlight, multi-line for video. Cinematographer executes the director's call (and cross-validates the kind match). Legacy `'image'` kind kept in the schema so old stores still render. New `SpotlightStage` component, full reduced-motion respect. 8 TDD tasks, two-stage subagent review on the substantial ones. NOT live-tested yet — Alex will test in a new session.

Three new draft decisions to read back: **D56 strong-with-guard accent** (skip override for gray or low-contrast vs. skin bg), **D57 two-treatment Moment** (video + spotlight, legacy `image` kept for back-compat only), **D58 spotlight has no story** (one tagline, the rise IS the arc), **D59 director owns the kind** (trajectory carries momentKind, cinematographer executes + cross-validates).

Full recap: `session-logs/session-40.md`.

## Next actions

1. **Live-test more niches with photos uploaded.** Patriot Woodworking after the Vision tool-use fix landed well, but one tenant is not enough signal. Try a candle maker, a baker, a sticker shop to confirm Bohdi's trajectory genuinely shifts on `makerWork` content and the per-photo suggestions land for varied catalogs.
2. **Woodworker niche-file rewrite** (the cutting-board fixation diagnosed at session start). Niche-writer skill job, separate spec. Rebalance exemplars across the real range (turned bowls, signs, furniture, toys, custom commissions), push cutting-board specifics into a vocab sidebar.
3. **Pick-most-prominent-readable refinement** (raised by the Rhody Strong test, still open): instead of always anchoring on the dominant brand color, the build could pick the most prominent brand color that ALSO clears contrast vs. the skin's bg — so a navy/gold logo on a dark skin lands on gold (still the maker's brand) rather than skipping the override entirely. Small, scoped change. Decide after more live builds.
4. **Wordmark-logo doubling toggle** (surfaced by the lockup change, still open): when a logo image already contains the shop name (wordmark-style), the side wordmark text shows the name twice. Add a "my logo includes my shop name" toggle at upload that suppresses the side wordmark.
5. **Outstanding from Session 39 still open:**
   - **CI coverage gate red:** Try-On shipped without tests (`write-version.ts` 0%, `convert.ts` ~29%); every push emails a failure.
   - **Niche-writer skill** prose-only rewrite + **launch niche batch** (~18 files).
5. **Still open from before:** Templated (the 8th mood / baseline foil); full onboarding-screen revamp; heroless-archetype Moment variant; Studio skin's Syne font; audit backlog (A2–A4, B1, Phase C/D in `Audit-Fix-Plan-2026-06-10.md`).

---

## Session log index (full recaps in `session-logs/`)

- [Session 41](session-logs/session-41.md) — Product photos at onboarding (optional step 4, up to 5 photos, Vision reads them, Director + Cinematographer + Copywriter ground in real work; Graphic Artist structurally denied photo data). Three ridealong fixes shipped first: founder-name attribution lock, portrait scrim wraps the text, catalog-size step retired. Two production bugs caught live: D53 miss on the product description schema cap, and Vision raw-JSON parsing → switched to forced tool_use (the pattern every other crew member uses). 43 new tests, 989 passing.
- [Session 40](session-logs/session-40.md) — Logo lockup + brand-color anchoring (delete white plate; render-time contrast; build-time strong accent override with achromatic + contrast guard; backfill script; lockup with wordmark) and spotlight Moment treatment (two-kinds: video for real motion, spotlight for static products; director picks via the inventing-motion criterion; new SpotlightStage component; cinematographer cross-validates kind). 25 new tests, 946 passing.
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

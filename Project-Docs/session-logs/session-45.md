# Session 45 — 2026-06-17

A "fix it all" day. Alex asked Claude to work through the entire open list end-to-end. Eight shippable changes landed, the 18-niche audit cleared, the woodworker rewrite landed, and the launch niche batch got triaged down to 43 traditional-craft entries ready to build next session.

## What shipped

**B1 — proxy boundary hardening.** The proxy was setting `x-tenant-id` and `x-tenant-subdomain` headers from a resolved subdomain without first dropping any inbound values with those names. An outside caller on the apex could send `x-tenant-id: <victim-uuid>` and have it propagate unchecked into every server component and API handler — tenant isolation was reduced to a forgeable hint. Pure helpers in `lib/proxy-security.ts` now sanitize every request before the proxy decides whether to set the headers itself, and apex requests to `/storefront/*` return 404 (it's an internal rewrite target, not a directly-addressable path). 11 unit tests.

**A3 — surface build-status DB errors.** `markRunning`, `updateLabel`, `completeBuild`, and `failBuild` discarded the `{error}` from their Supabase update. A failed `completeBuild` was the documented cause of a build spinning 'running' forever — no error log to find. Progress writes now log on error but stay non-throwing. Terminal writes (`completeBuild`, `failBuild`) log AND throw so the caller sees them. The `/start` route wraps `failBuild` in its own try/catch so a doubly-broken DB never becomes an unhandled rejection. Three new tests.

**A4 — pipeline timeout under the 300s route ceiling + guard test.** Crew stage timeouts had silently grown to 510s sum against a 300s route ceiling. Trimmed: copywriter 180→90s (audit's recommended), graphic-artist 90→60s, directors-cut 120→25s (it's a coherence pass over already-authored artifacts, not a fresh generation). New sum: 295s. Wrapped `directAndProduce` in a 290s overall `withTimeout` belt-and-suspenders. Exported `PIPELINE_DEADLINE_MS`, `STAGE_TIMEOUTS_SUM_MS`, `ROUTE_CEILING_MS` so a guard test asserts both invariants in one place — the budget can't silently regress again.

**A2 — transactional storefront write (draft-then-publish) + orphan sweep.** `writeArchetypeStorefront` wrote tenant → content_pages → listings without any transaction. A mid-write failure left `status='active'` tenant rows that the resolver immediately served, half-built. Two production builds had ended that way. The tenant is now inserted as `status='draft'` and only flipped to `'active'` after content_pages AND listings both land. Since the resolver matches `status=eq.active`, a draft orphan stays invisible. The flip itself throws on failure. Five new tests cover the new behavior. `scripts/sweep-storefront-orphans.mjs` is the one-off cleanup for orphans from past failed builds.

**Brand color refinement.** `dominantBrandColor` used to return the first valid hex regardless of skin, and the render-time contrast guard would silently drop it if it didn't meet 3:1 against the skin bg. A maker with navy + gold logos against a dark skin lost BOTH usable colors that way — navy failed contrast, gold was never tried. `pickBrandColorForSkin` walks the brand-color list in prominence order and returns the first one that is valid, NOT achromatic, AND clears the contrast threshold against the chosen skin's bg. Session 40's Rhody Strong case now lands gold instead. Seven new tests.

**Wordmark-logo doubling toggle.** When a maker uploaded a logo image that already included their shop name, the WordmarkLink rendered both the image AND the text wordmark beside it — name appeared twice. The existing logo-upload Vision call (which already extracted brand colors) now also asks whether the logo prominently includes the shop name and returns a boolean. New `tenants.logo_contains_wordmark` column rides through onboarding state → build input → tenant insert → `loadTenantChrome` → render args → `withLogo()` into `identity.logoContainsWordmark` → WordmarkLink. When true, the text span is hidden and the shop name moves to the logo's `alt` for screen readers. Null (SVG, unanalyzed, pre-feature tenant) treated as false (show both — the safe default). Migration `20260617000002`. Seven new chrome tests.

**Studio Syne font swap (Caprasimo + Reddit Mono).** Alex had flagged the Studio skin's Syne font as one of the open items he hated on real builds — geometric sans dominating every voice, doing double-duty as display AND label. First attempt swapped to Bodoni Moda 900; Alex rejected on first sight ("worse than the first one — parts of the letters are not visible," because didone hairlines disappear at his viewing size). Second pass showed three even-stroke options side-by-side in a specimen HTML: Caprasimo, Alfa Slab One, Kalnia 700. Alex picked Caprasimo (refined retro-modern slab character, no hairlines, no doubling). Reddit Mono takes over the label voice so the display does the talking instead of Syne pulling double-duty.

## Niche work

**Audit of all 18 launch niches against D14.** A general-purpose subagent did the read pass. 17 of 18 passed — explicitly using range-framing language, no "most X are Y" monolithic generalizations, real brand exemplars spread across positionings. One file (leatherworker) needed a minor fix: the exemplar set was too heritage-leather-heavy. Added three contrast exemplars (Polène — Parisian fashion-led sculptural, Cuyana — slow-fashion DTC, Behno — NY women-led ethical) and dropped the one "Most leatherworkers are..." line. Two files (photographer, tattoo_artist) were noted as using business-type archetypes rather than named real brands — passes the rule but less concretely anchored than knitter.md (gold standard).

**Woodworker rewrite from scratch.** The old file fixated on cutting boards (the Session 41 lesson). Full niche-writer-skill rewrite with 6 parallel web searches, then synthesis, then draft. Eight named exemplars across distinct positionings: Thos. Moser (heritage Maine), Sawkille Co. (gallery-tier contemporary), Lostine (Philadelphia design-led), Andrew Pearce Bowls (kitchen-goods specialist), Steven Noggle (NC turned-vessel artist), Sallie Plumley Studio (one-woman custom commission), Offerman Woodshop (narrative-driven slow craft), McLaughlin Woodworks (regional design-build). Plus a section calling out the personalized-gift Etsy positioning as a legitimate sub-segment. Full vocabulary pass on species, joinery, finish. New style sheet with 15 named colors, 16 fonts, 6 wordmark fonts, 14 textures.

**The launch niche batch.** Alex asked Claude to "do them all" — initially Claude pulled 20 from the queue calling them "traditional crafts." Alex pushed back hard: "Are you saying the 20 out of 289 are the only ones you see as traditional crafters?" Multiple rounds of additions and strikes followed. Final locked list: **43 traditional-craft niches**, ranked by approximate maker-population size. The full list and the breakdown of the other 255 queue entries (~145 pure services, ~22 healthcare, ~35 creative/digital, ~12 food service, etc.) are committed at `content/niches/_traditional-craft-batch.md`. Triage note: most of those 255 will be **deleted** from the queue rather than parked — the queue at 298 unsorted entries was noise.

Six niche-writer agents went out before the list was locked — embroiderer, calligrapher, wedding_stationery, stained_glass_artist (batch 1), glass_artist, sculptor (batch 2). All six are on the approved list, so their output is welcome when they land. A bookbinder agent also fired before Alex struck it; its output will be discarded.

## Decisions worth banking

- **Show, don't describe, when the output is visible.** First font swap failed because Claude described why Bodoni Moda fit instead of showing it. Second swap put three options side-by-side in a specimen HTML — Alex picked one cleanly in seconds. Visible artifacts beat written rationale for every visible-output decision (font, color, layout, mood card, etc.). The brainstorming skill doesn't override this — a concrete brief should produce a draft to react to, not a survey of considerations.

- **Filter audience-first, not category-first.** Pulling "traditional crafts" produced 20 from a 298-entry queue. Alex's pushback exposed the filter was too narrow — I'd excluded food/pantry crafts (jam, honey, cheese, hot sauce, chocolate, etc.) and most heritage trades (cooper, sailmaker, etc.) on a "is it traditional?" test instead of "is this a kitchen-table maker selling physical goods?" The latter is the actual launch audience and lets more in cleanly. **Lesson:** when filtering a long list, the filter is the audience, not Claude's category label.

- **A queue at 298 unsorted entries is noise, not a tool.** Carry-forward queues bloat by default. The right state for the queue is "things we'll actually build, ranked." Things we won't build go away. Locking the 43 + flagging the other 255 for triage-or-delete is the right next move.

- **Don't ship partial unless explicitly told to.** Alex called this out mid-session: "can you stop leaving them partially complete from here on out Unless I specifically say to." Saved as memory `feedback_ship_complete_not_partial`. Code + tests + types + verification before any "done" claim.

## Suite

985 → 990+ passing (six new test files added: proxy-security, build-store error paths, pipeline guard test, write-archetype-storefront transactional, logo-contrast brand color, chrome wordmark doubling). `tsc` clean. CI coverage gate still red on Try-On per the standing call to leave it.

## Files touched

Code:
- `proxy.ts`, `lib/proxy-security.ts` + test
- `lib/onboarding/build-store.ts` + test, `app/api/onboarding/start/route.ts`
- `lib/onboarding/crew/{pipeline, director, copywriter, cinematographer, graphic-artist, directors-cut}.ts` + pipeline test
- `lib/generation/write-archetype-storefront.ts` + test, `scripts/sweep-storefront-orphans.mjs`
- `lib/archetypes/main-street/logo-contrast.ts` + test, `lib/onboarding/build-archetype-store.ts`
- `lib/archetypes/main-street/skins.ts` (Studio font swap), `studio-font-specimen.html`
- `app/onboarding/logo-actions.ts`, `app/onboarding/_components/{StepLogo,types}.tsx`, `lib/archetypes/main-street/{chrome,builder,pages,schemas}.{ts,tsx}` + chrome test (wordmark doubling)
- `lib/archetypes/builder.ts` (render signatures), `app/storefront/_components/StorefrontPage.tsx`
- `lib/onboarding/run-storefront.ts` (logoContainsWordmark passthrough)
- Migration `20260617000002_tenants_logo_contains_wordmark.sql` + regenerated `lib/database.types.ts`

Content:
- `content/niches/leatherworker.md` (D14 fix + 3 exemplars)
- `content/niches/woodworker.md` (full rewrite)
- `content/style-sheets/niche-woodworker.json` (new)
- `content/niches/_traditional-craft-batch.md` (locked list + queue triage breakdown)

## What's next

1. **Live-test the Studio font swap** on a real build — Caprasimo at hero scale (84px+) and at small-cap scale (12px label).
2. **Live-test the wordmark-doubling fix** with a maker who has a text-logo (Rhody Strong is a candidate). Vision needs to detect "contains shop name" correctly; the render side needs to hide the text wordmark.
3. **Live-test transactional storefront write** by forcing a partial failure (mid-build crash) and confirming the tenant stays in `draft`, not `active`. Run the orphan sweep script in report-only mode against production once to see what's already there.
4. **Live-test the brand-color refinement** — run a Rhody Strong build with the navy + gold logo against the Hearthstone (dark) skin and confirm gold lands as the accent.
5. **Niche batch build** — dispatch parallel niche-writer agents for the remaining 37 entries from the approved list, in batches of 5–6 to manage agent load.
6. **Triage the 255 remaining queue entries** — walk through with Alex, mark each keep/defer/delete, prune the queue down to something usable.
7. **The 6 in-flight niche-writer agents** should have landed by next session start — review their output, sync to the niches table, commit.
8. **Bookbinder file** if it landed in error — delete before any commits.
9. Still open from before: Templated 8th mood, full onboarding-screen revamp.

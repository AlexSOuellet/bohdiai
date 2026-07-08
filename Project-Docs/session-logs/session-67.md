# Session 67 — Wave A close, Wave B start, image library plumbing

**Date:** 2026-07-08
**Branch:** `session-12/layout-engine` (continued)
**Docs read at start:** CLAUDE.md, SESSION-BRIEF, Full-Plan, Master Spec (full read), Roles-Workflow, Phase-1-Decisions-Log (full read), Session-66-Fix-Plan

## What happened

Three parallel workstreams landed. Wave A closed with A5 (Rustic crate label contrast). Wave B kicked off with B1 (founder attribution wrap) and B2 (shop CTA button wrap). And a new workstream opened at Alex's direction — the image library plumbing (bucket, table, ingest endpoint, spec docs) so cowork can start filling a shared, mood-neutral asset library. Cowork drafted the first batch of five niche files from the Session-45 traditional-craft batch in parallel.

## Wave A / B — landed

### A5 — Rustic crate labels read as stenciled plate on wood

Rustic collections page labels ("Kitchen and Table", "Ready to Ship") were invisible against dark wood photography. Root cause: the label bar was a 70% black scrim with text pulling from `--ms-contrast-fg`, which on Tannery is a near-black brown. Dark brown on a black scrim reads as nothing.

Fix flipped the label from "dark scrim + text" to a solid `--ms-contrast-bg` plate — text stays `--ms-contrast-fg`, count stays the amber accent. Reads as a stenciled plaque nailed to the crate. Because contrast-bg and contrast-fg are always the reversed pair, this works on any skin the editor swaps in later, not just Tannery. Added a soft drop shadow so the plate reads as a physical plaque, not a sticker.

Commit: `98cf3ab`. Fix-plan checkbox: `47e3721`. Files: `chrome.tsx`.

### B1 — Founder attribution wraps instead of ellipsis-truncating

"— Name, Role of ShopName" was clamped to 32ch by the shared `[data-type="sig"]` rule (nowrap + ellipsis + max-width:32ch). Long shop names truncated mid-word across every founder treatment.

Fix: dropped the nowrap and text-overflow chain, kept `max-width: 32ch` as a soft typographic cap so lines wrap instead of truncate. Applies across every founder treatment (Quote, Portrait, Card, Editorial, Letter, Workbench, Signature) plus CollectionsCupboard's `sig`-role cue.

Commit: `3b6eabf`. Files: `chrome.tsx`.

### B2 — Shop-teaser CTA button absorbs any label

"See everything in the shop", "Browse the full catalog", "See the full catalog" truncated mid-word on the pill CTA. Root cause: the shared `[data-type="navLabel"]` rule capped every navLabel to `max-width: 240px` + nowrap + ellipsis. Top nav labels need that clamp (Shop, Collections, About stay tight), but pill CTAs are authored longer copy that should wrap.

Fix keeps the base clamp for actual nav labels and overrides on the two pill CTA classes (`.ms-shopcue-btn`, `.ms-close-cta`). Class specificity beats the attribute-selector rule so no `!important`. New behavior: `max-width: 36ch`, `white-space: normal`, `text-align: center`.

Commit: `93c53c3`. Files: `chrome.tsx`, `Session-66-Fix-Plan.md`.

## Image library plumbing — landed

New scope Alex opened mid-session. Onboarding currently runs fal.ai per build (roughly $0.40–$0.75 per store), which is the biggest cost per onboarding. Cowork will pre-generate a shared library of mood-neutral images and hero videos that onboarding pulls from instead — family CSS filter paints mood at render time, so the same library shot reads Cozy or Dark or Modern based on the maker's family.

### Architecture calls

- **Mood-neutral is the rule** (Family-Style-Sheets.md rule 5 confirmed). Every image is balanced daylight, no color grade. Filter does mood. This is why switching families later doesn't require regeneration.
- **Scene variety per niche stays** (rule 6). Hero images for candles come in three settings — windowsill, mantle, workshop — because a filter can grade color but can't restage a scene.
- **10 images + 3 videos per niche.** 3 hero, 5 product, 2 portrait; 3 hero videos at 3 seconds each.
- **Higgsfield economics:** Nano Banana Pro (Google, 2K) is unlimited on Alex's plan for images. Kling 3.0 Turbo at 720p / 3 sec / 3.5 credits ≈ $0.14 per video. Full library: ~$23 for videos, images free. Breakeven vs fal is around 130 builds.
- **Split generation:** Claude in Chrome generates images (unlimited). Cowork generates videos (paid). Both post to the same helper endpoint.
- **Storage vs DB:** binaries in Supabase Storage under `library/<niche>/`; metadata in a new `library_assets` table. Cowork writes only through a helper endpoint — never touches Storage credentials directly.

### 53 launch niches

The full list came from the Session-45 traditional-craft batch (43) + 8 pre-Session-45 done niches + 2 Alex added (estate_sales, body_marbling). Some walk-back on my initial "16 niches" reads — I under-counted twice before Alex corrected me.

### Built

- **Migration `20260708000001_library_assets.sql`** — `library_assets` table (niche_slug, kind, scene, storage_path, prompt, generator, dimensions, duration_ms, approved, timestamps). `library` Storage bucket (PNG/JPEG/WebP/MP4, public read, service-role writes, RLS-enabled table with no policies).
- **Env var `COWORK_INGEST_TOKEN`** in `lib/env.ts`. Optional so the dev server boots without setup — endpoint returns 503 if unset.
- **`POST /api/library/ingest`** — the single writer. Bearer auth, Zod-validated payload, downloads from Higgsfield URL, uploads to Storage at the enforced path, inserts an approved-false row. Rolls back the upload on DB insert failure. 12 tests cover auth, validation, happy path, video path, all failure modes.
- **Docs:**
  - `Image-Library-Spec.md` — the prompt rules (mood-neutral, photorealistic, no text, locked camera on video). Example prompts for still and video set the bar.
  - `Library-Buildout-Plan.md` — the orchestration doc that ties niche-writer and library-generation workstreams together.
  - `Cowork-Instructions.md` — the consolidated brief cowork actually reads. Alex refined this in place after I wrote v1 — the queue-driven batching pattern (read `_queue.yaml`, take next 6 pending) and the Claude-in-Chrome-for-images vs cowork-for-videos split came from him.

Commits: `c4ffcd9` (plumbing), `7193e80` (Cowork-Instructions), `c08cc08` (env optional fix after Alex hit the required-blocks-dev issue).

## Cowork parallel workstream

While Claude built plumbing, cowork ran the niche-writer skill on the first batch of five niches from the Session-45 traditional-craft batch: **wedding_stationery, resin_artist, embroiderer, calligrapher, macrame_artist**. Each got a 7-section prose body + a paired 15-color / 14+ font / 10-14 texture style sheet. All ten files landed at `status: draft` awaiting Alex's review.

Cowork also caught a broken pointer in the niche-writer skill: it points at `content/style-sheets/niche-leatherworker.json` as the canonical bar, but that file doesn't exist. Cowork worked around it by using knitter / woodworker / embroiderer as reference bars. Skill file needs a re-point (small edit, not done this session).

Cowork's commit: `04ed066`. A trailing-sentence completion on `macrame_artist.md` cowork made but didn't include in its commit was landed as `b2da813`.

**38 of 43 batch niches remain to be drafted.** Cowork asked to keep going on the next 5 (pins_patches, cake_decorator, chocolatier, stained_glass_artist, doll_plush).

## Design direction calls captured

### Niche style sheets aren't retired — they're editor fuel

I flagged mid-session that the current pipeline doesn't consume niche style sheets (verified — `write-archetype-storefront.ts` comment says "no style_sheet in this path", and only 3 files in `lib/` even mention them). Suggested we might retire the skill's style-sheet output. Alex pushed back: style sheets become the maker's curated shelf in Editor Door 2 (use my own colors). A candle maker sees "Beeswax", "Ember", "Old Copper" — not a raw color wheel. That's the anti-Wix-slop pattern.

So cowork keeps producing style sheets. Not wasted output; insurance being paid up front while cowork has capacity. When Editor Door 2 lands (Full Plan Phase 4), the library is ready.

### The niche approval workflow

Alex asked why only one niche shows "active." Verified: the onboarding niche picker filters `status = 'approved'` in the DB (`app/onboarding/page.tsx:16`). The build pipeline reads by slug without a status check — so test onboardings via admin paths work regardless of status. Only 2 niches have `status: approved` in the file frontmatter (candles, knitter); the DB is presumably in the same state.

To make more niches show in the picker: bulk-update `niches.status = 'approved'` in the DB for the ones Alex trusts. Migration or hand-edit — his call, not landed this session.

## Not landed

- **Wave B remaining:** B3 (testimonials vertical rhythm), B4 (Modern navbar split-center wordmark), B5 (Cheerful mobile hero overlap), B6 (Cozy mobile Constellation overlap).
- **Waves C, D, E, F** — still pending per the fix plan. All must land before Phase 2 begins.
- **Niche-writer skill** — needs re-point of the leatherworker.json canonical-bar reference. Small edit.
- **Onboarding wire-up to library** — the ingest plumbing is live but nothing reads FROM `library_assets` yet. Once the library has coverage for a niche, the Graphic Artist crew stage flips to library-first, fal fallback. Deferred until library actually has content.
- **DB `niches.status` bulk-approve** — pending Alex's call on which niches he trusts.

## Standing lessons

- **When Alex corrects a fact, don't guess again — read the source.** Twice I quoted the wrong niche count (16, then 51) before actually reading `_queue.yaml`. The right move on the first correction was to grep the queue, not offer another guess.
- **Plain English means one file cowork can read cover-to-cover.** My initial docs (Library-Buildout-Plan + Image-Library-Spec) split the info across two docs. Alex asked for one. Cowork-Instructions.md consolidates. Cowork also uses it as its authoritative brief.
- **Design decisions I'd retire are often forward-loaded assets.** I suggested retiring style sheets because the current pipeline doesn't read them. Alex saw them as editor fuel for a phase that hasn't shipped. The right question isn't "is this consumed today?" — it's "will this earn its place when the next thing lands?"
- **When cowork reports 40 uncommitted files, actually check.** The number was 4. Cowork was looking at a stale snapshot. Trust but verify agent reports.
- **Stale git locks from crashed processes are safe to clear if truly stale.** Two `.git/*.lock` files from 10:58 orphaned when a cowork commit finished. Same timestamp, no active git process, ~44 minutes old — safe. Verify the timestamp is old and no other process is holding the lock before removing.

## Tests + build state

- 954 tests pass
- tsc clean
- lint clean (4 pre-existing next/image warnings unrelated)
- Migration `20260708000001_library_assets.sql` applied via `node scripts/db-migrate.mjs`
- Types regenerated via `npm run gen:types`

## Next session

- Land B3 and B4 (same fix pattern as B1/B2 — container absorbs, no truncate) before hitting the mobile recompose work in B5 and B6.
- Fix the niche-writer skill's leatherworker.json canonical-bar reference.
- Alex decides which niches to bulk-approve in DB so more show in the picker.
- Cowork continues niche-writer batches (38 remaining in the Session-45 batch).
- Once library has coverage for a few niches, wire onboarding's Graphic Artist stage to read library-first.

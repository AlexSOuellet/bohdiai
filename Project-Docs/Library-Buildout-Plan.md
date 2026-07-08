# Library Buildout Plan

**For cowork:** This is the map. Alex will hand you this file. Walk him through it in the order below. When you hit Workstream 2, also read `Project-Docs/Image-Library-Spec.md` — that's where the prompt rules live.

**For Alex:** Read this once end to end. Then you and cowork work through it together. You're not writing code — you're kicking off batches, reviewing drafts, and approving.

---

## What we're building

An image and video library the onboarding pipeline pulls from instead of running fal on every build. Cuts fal spend, makes onboarding faster, gives every store curated shots Alex has approved.

**53 launch niches.** For each one the library will hold:
- 10 mood-neutral images (3 hero, 5 product, 2 portrait) at 2K
- 3 mood-neutral hero videos at 720p, 3 seconds

**Mood-neutral means:** balanced daylight, no color grade, no dramatic lighting. The renderer applies the maker's family CSS filter at page load — that's what makes the same candle photo read Cozy for one maker and Dark for another. Cowork does NOT bake mood into the shot.

**Two blockers before the library can be filled:**
1. Only 8 of the 53 niches have niche files. Cowork can't write honest prompts without the niche file. So the missing 45 niche files get written first.
2. The database table, Storage bucket, and helper endpoint don't exist yet. Claude builds those.

Both blockers can be worked in parallel.

---

## Workstream 1 — write the 45 missing niche files

**Goal.** Every launch niche has a niche file at `status: approved` before we generate images for it.

**The 45 missing niches:**

wedding_stationery, resin_artist, embroiderer, calligrapher, macrame_artist, pins_patches, cake_decorator, chocolatier, stained_glass_artist, doll_plush, toy_maker, glass_artist, mosaic_artist, knife_maker, frame_maker, rug_maker, honey_producer, coffee_roaster, hot_sauce, jam_preserves, pyrography_artist, cheesemaker, antique_dealer, weaver, woodcarver, wood_turner, pen_maker, spice_blender, tea_blender, lapidary, ferments, sculptor, stamp_maker, confectioner, religious_devotional, engraver, basket_weaver, incense_maker, paper_maker, wigmaker, clockmaker, stone_carver, cooper, estate_sales, body_marbling.

### Steps

1. **Alex opens cowork.**

2. **Alex types the first batch.** Example command:

   > Run the niche-writer skill for wedding_stationery, resin_artist, embroiderer, calligrapher, macrame_artist, and pins_patches. Spawn six agents in parallel.

3. **Cowork spawns six agents.** Each one runs the `niche-writer` skill from `.claude/skills/niche-writer/SKILL.md`. Each agent researches its niche (real brands, category vocabulary, customer concerns) and writes two files:
   - Prose: `content/niches/<slug>.md`
   - Style sheet: `content/style-sheets/niche-<slug>.json`

   Both files land at `status: draft`.

4. **Alex reviews.** For each drafted file, compare against `content/niches/leatherworker.md` — that's the bar. If it holds up, change `status: draft` to `status: approved` in the frontmatter. If it doesn't, tell cowork to redo that slug.

   **Watch for these failures:**
   - Generic palette names ("moss green", "warm brown 1") instead of specific material names ("Walnut Hull", "Old Copper"). Reject.
   - Visual descriptors in Brand exemplars (font names, palette words). Reject.
   - Monolithic generalizations ("Most candle makers are…"). Reject.

5. **Alex repeats steps 2-4 with the next batch of six.** About 8 batches total to cover all 45.

**Timing:** Fully on Alex + cowork's side. Doesn't need Claude. Runs across multiple sessions.

---

## Workstream 2 — generate library images and videos

**Prerequisites before starting a niche:**
- The niche's file is `status: approved`.
- Claude has confirmed the plumbing is live: `library_assets` table exists, `library` Storage bucket exists, `POST /api/library/ingest` endpoint responds.

Alex can start Workstream 2 on a niche-by-niche basis as soon as each niche's file is approved AND plumbing is live. No need to wait for all 45 niche files to be done first.

### Steps

1. **Alex confirms plumbing is live with Claude.** Ask: "Is the library plumbing ready?" If yes, proceed. If no, wait.

2. **Alex opens cowork.** Type:

   > Generate the library assets for candles. Read Project-Docs/Image-Library-Spec.md for the rules, read content/niches/candles.md for the niche context, and post every generation to /api/library/ingest with the bearer token in COWORK_INGEST_TOKEN.

3. **Cowork does the work.** For that niche, cowork:
   - Reads the niche file to understand what the maker actually makes
   - Reads the spec for prompt rules (mood-neutral, photorealistic, no text, locked camera on video, etc)
   - Generates 10 images via Nano Banana Pro at 2K
   - Generates 3 hero videos via Kling 3.0 Turbo at 720p, 3 seconds, locked camera
   - Posts each result to `/api/library/ingest`
   - The endpoint stores the file and adds a row with `approved=false`

4. **Alex reviews the results.** Either query the `library_assets` table directly, or use the small admin page (if Claude has built one). For each good asset: flip `approved` to `true`. Bad ones stay unapproved and never reach a real maker.

5. **Alex repeats step 2 for each newly-approved niche.** Or batches several niches at once.

### Rules cowork must follow (details in `Project-Docs/Image-Library-Spec.md`)

- Mood-neutral. Balanced daylight only.
- Photorealistic, not illustration.
- No text, no logos, no brand marks.
- Subject specific to the niche — no tangential objects (a candle prompt shows candles, never candles-next-to-yarn).
- Video: locked camera only. In-frame motion only. A moving camera breaks the seamless loop.

---

## What Claude builds (in parallel with Workstream 1)

These three things unlock Workstream 2. Claude does them on his own time; Alex just needs to know they're coming.

1. **Migration for `library_assets` table.** Columns: id, niche_slug, kind (hero_image / product_image / portrait_image / hero_video), scene, storage_path, prompt, width, height, duration_ms, generator, approved, generated_at, approved_at, retired_at.

2. **Supabase Storage bucket `library`.** Public read, admin write.

3. **Helper endpoint `POST /api/library/ingest`.** Takes a Higgsfield source URL + metadata, downloads the file, uploads to the bucket, inserts the row. Auth via a bearer token in `COWORK_INGEST_TOKEN`.

Claude notifies Alex when all three are live.

---

## Sequence at a glance

1. Alex kicks off Workstream 1, batch by batch. Reviews drafts as they land.
2. In parallel: Claude builds the plumbing.
3. Once the first few niches are approved AND the plumbing is live, Alex kicks off Workstream 2 for those niches.
4. As more niche files clear approval, Workstream 2 expands to cover them.
5. Once the library covers all 53 niches, Claude switches onboarding to read from the library first, fal as fallback.

---

## Who does what

- **Alex:** kicks off cowork batches, reviews drafts, approves/rejects, reviews library assets.
- **Cowork:** runs niche-writer for missing niches, generates library images/videos for approved niches, posts to the helper endpoint.
- **Claude:** builds the migration, sets up the bucket, writes the helper endpoint, later switches onboarding to read from library.

---

## Reference files

- `.claude/skills/niche-writer/SKILL.md` — the niche-writer playbook
- `content/niches/leatherworker.md` — the quality bar for niche prose
- `content/style-sheets/niche-leatherworker.json` — the quality bar for style sheets
- `Project-Docs/Image-Library-Spec.md` — the rules for generating library assets
- This doc — the map that ties both workstreams together

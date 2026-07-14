# Cowork Instructions — Library Buildout

**Read this whole file before starting.** It has everything you need. Two workstreams below — do Workstream 1 first, then Workstream 2 for each niche as its file is approved.

---

## What we're doing

BohdiAI is building a shared library of mood-neutral images and hero videos that its onboarding pipeline will pull from instead of running fal on every build. Cost drops, onboarding gets faster, and every store shows shots Alex has approved.

The renderer applies a family CSS filter at page-load time to shift the mood (Cozy, Rustic, Dark, Luxury, Cheerful, Modern). You do NOT bake mood into any shot. Neutral daylight, honest color, restrained composition — the filter does the rest.

There are 53 launch niches. For each niche the library will hold ten images and three hero videos. Only 8 niches have niche files today; the other 45 need niche files written before their images can be generated. So Workstream 1 comes first.

---

## Workstream 1 — write 45 niche files

### The 45 missing niches

wedding_stationery, resin_artist, embroiderer, calligrapher, macrame_artist, pins_patches, cake_decorator, chocolatier, stained_glass_artist, doll_plush, toy_maker, glass_artist, mosaic_artist, knife_maker, frame_maker, rug_maker, honey_producer, coffee_roaster, hot_sauce, jam_preserves, pyrography_artist, cheesemaker, antique_dealer, weaver, woodcarver, wood_turner, pen_maker, spice_blender, tea_blender, lapidary, ferments, sculptor, stamp_maker, confectioner, religious_devotional, engraver, basket_weaver, incense_maker, paper_maker, wigmaker, clockmaker, stone_carver, cooper, estate_sales, body_marbling.

### How to run

Invoke the `niche-writer` skill (found at `.claude/skills/niche-writer/SKILL.md`) for each niche. Run in batches of 6 parallel agents. Wait for Alex to review and approve each batch before starting the next.

**Picking the next batch — use the queue.** `content/niches/_queue.yaml` is the source of truth for order and progress. When Alex says "write the next 6," read the queue top-to-bottom and take the first 6 entries whose `status` is `pending` (skip `done`, `in_progress`, and `skip`). Don't make Alex list slugs — the queue already knows what's next.

**Keep the queue honest.** As you work, update `_queue.yaml`:
- Set a slug's `status` to `in_progress` the moment you assign it to an agent.
- Set it to `done` once its draft files land.
This is what makes "next 6" work across sessions — the queue always reflects reality, so a fresh session tomorrow picks up exactly where the last one stopped.

**One session at a time.** Only run one niche-writer session at once. Two sessions would both read the same `pending` entries and duplicate work. One session, as many sittings as needed.

When Alex asks you to start a batch, spawn six agents — one per slug — each running the niche-writer skill. Each agent produces two files at status `draft`:

- `content/niches/<slug>.md` — the prose body
- `content/style-sheets/niche-<slug>.json` — the raw visual materials

(Note: `_queue.yaml` `status: done` means "draft written." The niche file's own frontmatter still starts at `status: draft` and only Alex flips it to `approved`. The two statuses track different things — queue = written yet, frontmatter = approved yet.)

### The quality bar

The bar is `content/niches/leatherworker.md` paired with `content/style-sheets/niche-leatherworker.json`. Every new file has to match that level of specificity. If your output feels generic ("moss green" instead of "Walnut Hull"), do it again before handing it back.

### Failure modes to catch in yourself

- Generic palette names ("primary," "warm brown 1"). Every color must be named for a specific material or thing from the niche's vocabulary.
- Visual descriptors in Brand exemplars (font names, palette words, layout descriptions). Brand exemplars describe positioning and voice, not visual look.
- Monolithic generalizations ("Most candle makers are…", "The typical buyer wants…"). These collapse a wide category into one profile. Describe RANGES with examples across positionings.
- Style sheets with fewer than three character-forward heading fonts. If a font would read as anonymous at 64px, it's body-only.

### Alex's review

Alex opens each drafted file, compares against the leatherworker bar, and flips `status: draft` to `status: approved` on the good ones. He'll tell you which ones need to be redone.

---

## Workstream 2 — generate library images and videos

Only for niches where the niche file is at `status: approved`. Don't touch niches still in `draft`.

### Who generates what

**Images are generated in Claude in Chrome (the browser extension), NOT by Cowork.** The extension drives Higgsfield on Alex's unlimited plan, so the ten images per niche cost nothing. If Cowork generated them through its own Higgsfield connector, each would burn credits — so it doesn't. Cowork's job on images is to write the prompts and, once the extension has produced them, harvest the finished links.

**Videos are generated by Cowork.** The hero videos (up to three, only where a natural loop exists — see below) use Kling 3.0 Turbo and cost ~4.5 credits each, which is not covered by the unlimited plan, so Cowork generates them directly — ideally animating the niche's hero image as the start frame so the clip matches the still.

So the per-niche split is:

- Cowork writes all 13 prompts, grounded in the niche file.
- Claude in Chrome generates the 10 images (free, unlimited).
- Cowork generates the 3 videos (paid, ~4.5 credits each).
- Cowork harvests every finished asset's link from Higgsfield history and posts each to `/api/library/ingest`.

Because posting is generation-agnostic, it doesn't matter to the endpoint who made the image — whoever generates it, the asset lands in Higgsfield's history, and Cowork grabs that link and posts it.

### What to generate per niche

- **3 hero images.** Wide 16:9 at 2K. Each is a different SETTING for the maker's product — a candle on a windowsill, on a mantle, on a workshop bench. Different worlds, same product. The CSS filter can grade color but can't restage a scene, so scene variety is what the library provides.
- **5 product images.** 1:1 square at 2K. Two clean beauty shots on a neutral surface. Three in-context shots showing real use.
- **2 portrait images.** 4:5 at 2K. Gender-neutral figure at work — hands, workbench, focused activity. Never face-forward.
- **Up to 3 hero videos.** 16:9 at 720p, 3 seconds. IN-FRAME motion only — a flame flickering, steam rising, hands turning a piece. LOCKED CAMERA — no pans, no push-ins, no rack focus, no zoom. A moving camera breaks the seamless loop. **Only generate a video where an honest natural loop exists.** Many static-object crafts (a finished frame, a pin, a piece of jewelry) have no natural in-frame motion — for those, skip the video rather than fabricate motion. A niche may end up with anywhere from 0 to 3 videos. Where there's no loop, the storefront falls back to a hero still, so nothing needs to be posted in the video's place.

### Models and settings

- **Images:** `nano_banana_pro` (Google, via Higgsfield), resolution `2k`. Aspect ratio per the shot type: `16:9` for hero, `1:1` for product, `4:5` for portrait. Prompts written by Cowork; generation run in Claude in Chrome (unlimited plan).
- **Videos:** `kling-3.0-turbo`, 720p, 3 seconds, aspect ratio `16:9`. Prompts written and generation run by Cowork (paid).
- **Format:** PNG for images, MP4 for video.

### Rules that apply to EVERY prompt

Balanced daylight or diffused window light. No golden hour, no deep shadow, no colored gels, no dramatic side-light.

Neutral white balance. No dominant color cast.

Photorealistic. Not illustration, not 3D render, not painted, not stylized.

No text. No logos. No brand marks. No price tags.

If people appear, framed by hands and work, never face-forward. Gender-neutral by default.

Backgrounds simple and honest. No busy set dressing that fights the family paint.

Subject specific to the niche's real work. A candle prompt shows candles, not "generic craft objects." Read the niche file at `content/niches/<slug>.md` before generating — it names the products, the vocabulary, and the real settings.

**Video-specific:** locked camera only. In-frame motion only. Loop-safe. State the locked-camera rule explicitly in the prompt. If a niche has no honest natural loop, generate no video for that slot — a hero still stands in at render time. Never fabricate motion just to hit a count.

### Generating the images (via Claude in Chrome) — group by aspect ratio

The ten images span three aspect ratios — hero `16:9`, product `1:1`, portrait `4:5` — but in Higgsfield the aspect ratio is a UI setting, NOT something the prompt text reliably controls. If all eight image prompts are pasted at once, they all come out at whatever ratio is currently selected. So the image prompt block Cowork hands Alex MUST be grouped by aspect ratio, with an explicit "set the ratio" instruction before each group:

- **Group A — set Higgsfield aspect ratio to `16:9`**, then generate the 3 hero prompts.
- **Group B — set aspect ratio to `1:1`**, then generate the 5 product prompts (2 clean, 3 in-context).
- **Group C — set aspect ratio to `4:5`**, then generate the 2 portrait prompts.

Produce the paste block already grouped this way, with the "set aspect ratio to X" line at the top of each group, and also state the ratio inside each prompt's text as a backstop. When harvesting, read the actual pixel dimensions off each generated file so the posted `width`/`height` reflect what was really produced. (Videos are all `16:9` and generated by Cowork, so this doesn't apply to them.)

### Filename convention

`<niche>-<kind>-<scene>-<index>.<ext>` — enforced server-side by the ingest endpoint. You don't build the filename; you send the metadata and the endpoint constructs the path.

- `kind` is one of: `hero_image`, `product_image`, `portrait_image`, `hero_video`.
- `scene` names the setting (windowsill, workbench, clean, context, flame, etc). Lowercase kebab or plain.
- Index is auto-incremented by the endpoint.

### How to upload

**CRITICAL — the POST does NOT run inside a Cowork session.** A Cowork sandbox has no route to the dev server (localhost) or the public internet, so it physically cannot call the endpoint. The Cowork worker's job is to *prepare* the upload, not perform it.

So the worker's final deliverable per niche is a single `assets.json` file written to the repo root — a JSON array of all 13 assets, each with: `niche`, `kind`, `scene`, `sourceUrl` (the harvested Higgsfield link), `prompt`, `generator`, `width`, `height`, and `durationMs` for videos. `width`/`height` are REQUIRED — the endpoint rejects any asset without them, so read the real pixel dimensions off each generated file.

The actual posting is one command Alex runs on his machine, from the repo root:

```
python ingest_post.py --batch assets.json
```

That script reads `COWORK_INGEST_TOKEN` and the endpoint URL from `.env.local`, posts each asset, and writes `ingest_results.json`. The endpoint (running on Alex's machine) then downloads each binary from Higgsfield, uploads to Supabase Storage, and inserts a row with `approved=false`. Run `python ingest_post.py --selftest` first to confirm the server's reachable and the token matches.

For reference, the endpoint contract:

Payload:
```json
{
  "nicheSlug": "candles",
  "kind": "hero_image",
  "scene": "windowsill",
  "sourceUrl": "https://higgsfield.example/generated-abc123.png",
  "prompt": "A single unlit pillar candle on a wide sunlit windowsill, ...",
  "generator": "nano_banana_pro",
  "width": 2048,
  "height": 1152
}
```

For video, include `durationMs` (e.g. `3000`) alongside the image fields, and pass `kind: "hero_video"`.

Response on success:
```json
{
  "id": "<uuid>",
  "storagePath": "candles/candles-hero-windowsill-01.png",
  "publicUrl": "https://<supabase>.co/storage/v1/object/public/library/...",
  "approved": false
}
```

If you get a 401, the bearer token is wrong. If you get 400, the payload is malformed. If you get 502, the source URL couldn't be fetched (retry with a fresh generation).

### Example prompts

**A candles-hero-windowsill prompt:**

> A single unlit pillar candle in cream-colored wax sits centered on a wide painted wooden windowsill, three-quarter angle. Sheer linen curtains pulled back to either side. Late-morning light diffused through the fabric, soft and even. A small potted plant to the left, a folded book to the right. Real wood grain visible under the sill. Honest daylight, no color grade. Photorealistic. 16:9.

What makes it good: names the specific object (pillar candle in cream wax), places it explicitly (wide wooden windowsill, three-quarter angle), specifies the light (diffused morning), builds the scene with two supporting objects (plant, book), asserts photorealism, asserts no color grade. Write every image prompt to this bar.

**A candles-hero-flame video prompt:**

> A single lit pillar candle centered in frame on a plain wooden table, close crop. The flame flickers gently and steadily, no wind. Wax edge softly illuminated by the flame. Neutral daytime ambient light in the background, out of focus. CAMERA IS LOCKED — no pan, no push-in, no zoom, no rack focus. Only the flame moves. Loop-safe motion. Photorealistic. 3 seconds. 16:9.

Same bar — specific subject, specific motion source, explicit locked-camera assertion.

### What NOT to do

Do not add mood cues. "Cozy amber glow," "dark moody shadow," "vibrant playful color" — the filter adds those. Your job is neutral.

Do not add stock photography clichés. "Rustic wooden background with vintage props" reads as AI slop. Honest, specific, restrained.

Do not add text, logos, brand marks, or price tags. Ever.

Do not invent subject variety by adding tangential objects. A candle hero shows candles. A knitting hero shows knitting. A candle next to yarn is exactly the "tangential invention" failure mode.

Do not self-approve. Every row you insert lands `approved=false`. Alex flips it. If you set approved yourself, you break the review gate.

Do not build the filename yourself or upload directly to Supabase. Go through `/api/library/ingest`. It enforces convention and schema.

Do not skip the niche file. Every prompt must be grounded in `content/niches/<slug>.md`. If the file doesn't exist yet, the niche is still in Workstream 1 — wait for it.

---

## When you're stuck

Ask Alex. If a niche file is missing that you need, if the endpoint returns an error you can't parse, if the source URL fails on retry — surface it. Don't guess.

## Files worth knowing about

- `.claude/skills/niche-writer/SKILL.md` — the skill you invoke for Workstream 1
- `content/niches/leatherworker.md` — the prose quality bar
- `content/style-sheets/niche-leatherworker.json` — the style-sheet quality bar
- `content/niches/<slug>.md` — the niche file you ground every image prompt against

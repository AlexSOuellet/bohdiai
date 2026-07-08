# Image Library Spec

**Purpose.** Cowork generates a shared image and video library that BohdiAI's onboarding pipeline pulls from instead of running fal per build. This cuts fal spend, speeds up onboarding by minutes, and gives every store a curated look Alex has eyeballed.

**Non-negotiable rule — mood-neutral.** Every asset in this library is generated MOOD-NEUTRAL. The renderer applies the maker's family CSS filter at page-render time — that's what makes the same candle shot look Cozy or Dark or Luxury. If you bake mood into the shot (warm amber lighting, deep shadow, saturated pop color), the filter fights the shot and it reads as AI slop. Neutral daylight, honest color, restrained composition.

## What to generate per niche

Ten images and three videos per niche.

**Three hero images.** Wide 16:9 at 2K. Each is a different SETTING for the same subject — a candle on a windowsill, a candle on a mantle, a candle on a workshop bench. Different worlds, same maker's product. Grade cannot restage a scene, so scene variety is what a library provides.

**Five product images.** 1:1 square at 2K. Two clean beauty shots on a neutral surface. Three in-context shots — the product in a real-use setting (a candle glowing, a candle set on a table with the wick trimmed, a small group on a shelf). Honest photography, no fake props, no text or logos.

**Two portrait images.** 4:5 at 2K. Gender-neutral figure at their work — hands, workbench, focused activity. Never face-forward. This is the D42 rule.

**Three hero videos.** 16:9 at 720p, 3 seconds, via Kling 3.0 Turbo. IN-FRAME motion only — a flame flickering, steam rising, hands turning a piece. LOCKED CAMERA — no pans, no push-ins, no rack focus, no zoom. A moving camera breaks the seamless loop and the video jumps on restart. Three different subjects across the three clips so a maker isn't seeing the same loop every time.

## Rules that apply to every prompt

Balanced daylight or diffused window light. No golden hour, no deep shadow, no colored gels, no dramatic side-light.

Neutral white balance. No dominant color cast.

Photorealistic. Not illustration, not 3D render, not painted, not stylized.

No text. No logos. No brand marks. No price tags.

If people appear, framed by hands and work, never face-forward. Gender-neutral by default.

Backgrounds simple and honest. No busy set dressing that would fight the family paint.

Subject specific to the niche's real work. A candle prompt shows candles, not "generic craft objects." Ground your prompt from the niche file at `content/niches/<slug>.md` before generating — it names the products, the vocabulary, and the real settings.

## Models

Images: `nano_banana_pro` (Google, via Higgsfield), resolution `2k`.

Videos: `kling-3.0-turbo`, 720p, 3 seconds, aspect 16:9.

Format: PNG for images, MP4 for video.

## Filename convention

Every file follows `<niche>-<kind>-<scene>-<index>.<ext>`.

- `candles-hero-windowsill-01.png`
- `candles-hero-mantle-01.png`
- `candles-product-clean-01.png`
- `candles-product-context-01.png`
- `candles-portrait-workbench-01.png`
- `candles-hero-flame-01.mp4`

Kind is one of: `hero`, `product`, `portrait`. Scene names the setting (windowsill, workbench, clean, context, flame, etc). Index is `01`, `02` for multiples of the same scene.

## Storage and metadata

Upload the binary to Supabase Storage bucket `library` under path `<niche>/<filename>`.

Insert a row into the `library_assets` table:

- `niche_slug` — the niche this belongs to
- `kind` — one of `hero_image`, `product_image`, `portrait_image`, `hero_video`
- `scene` — the scene word from the filename
- `storage_path` — the path in the bucket
- `prompt` — the full prompt string you used
- `width`, `height` — pixel dimensions
- `duration_ms` — for video only
- `generator` — `nano_banana_pro` or `kling-3.0-turbo`
- `approved` — `false`
- `generated_at` — now

## Approval

Every row you insert lands `approved=false`. Alex reviews and flips approved to true. Onboarding only pulls approved rows. Never self-approve.

## The 53 launch niches

baker, candles, ceramicist, fine_artist, jewelry_maker, soap_and_bath, vintage_reseller, woodworker, wedding_stationery, resin_artist, embroiderer, calligrapher, macrame_artist, pins_patches, cake_decorator, chocolatier, stained_glass_artist, doll_plush, toy_maker, glass_artist, mosaic_artist, knife_maker, frame_maker, rug_maker, honey_producer, coffee_roaster, hot_sauce, jam_preserves, pyrography_artist, cheesemaker, antique_dealer, weaver, woodcarver, wood_turner, pen_maker, spice_blender, tea_blender, lapidary, ferments, sculptor, stamp_maker, confectioner, religious_devotional, engraver, basket_weaver, incense_maker, paper_maker, wigmaker, clockmaker, stone_carver, cooper, estate_sales, body_marbling.

**Only generate for niches where `content/niches/<slug>.md` exists.** The niche file is what grounds your prompts. If a niche file is missing, wait — the niche-writer skill produces it. `estate_sales.md` and `body_marbling.md` do not exist yet.

## Prompt-writing bar

An example hero prompt for candles-hero-windowsill:

> A single unlit pillar candle in cream-colored wax sits centered on a wide painted wooden windowsill, three-quarter angle. Sheer linen curtains pulled back to either side. Late-morning light diffused through the fabric, soft and even. A small potted plant to the left, a folded book to the right. Real wood grain visible under the sill. Honest daylight, no color grade. Photorealistic. 16:9.

What makes this a good prompt: names the specific object (pillar candle in cream wax), places it explicitly (wide wooden windowsill, three-quarter angle), specifies the light (diffused morning), builds the scene with two supporting objects (plant, book), asserts photorealism, asserts no color grade. Write every prompt to this bar.

An example video prompt for candles-hero-flame:

> A single lit pillar candle centered in frame on a plain wooden table, close crop. The flame flickers gently and steadily, no wind. Wax edge softly illuminated by the flame. Neutral daytime ambient light in the background, out of focus. CAMERA IS LOCKED — no pan, no push-in, no zoom, no rack focus. Only the flame moves. Loop-safe motion. Photorealistic. 3 seconds. 16:9.

Same bar — specific subject, specific motion source, explicit locked-camera assertion.

## What NOT to do

Do not add mood cues to prompts. "Cozy amber glow" and "dark moody shadow" are the exact things the family filter is meant to add. Neutral is the rule.

Do not add stock photography clichés. "Rustic wooden background with vintage props" reads as AI slop. Honest, specific, restrained.

Do not add text or brand marks. Ever.

Do not invent subject variety by adding tangential objects. A candle hero shows candles. A knitting hero shows knitting. A candle next to yarn is exactly the "tangential invention" D55 refuses.

Do not deviate from the file structure or table schema. The pipeline reads by exact convention.

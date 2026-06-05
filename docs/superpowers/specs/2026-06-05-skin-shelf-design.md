# Main Street skin shelf — design direction

**Date:** 2026-06-05 · **Status:** design agreed, build is next session · **Branch:** `session-12/layout-engine`

This captures the design conversation for growing the Main Street skin shelf. It is the brief the next session builds from. No skins were built this session.

## The problem

Today's shelf has seven skins and they collapse. Two of Session 27's live stores — a rustic baker and a sunset ceramicist — both rendered as `main-street-ember`, because ember is the only warm/homey skin and Bohdi (who picks the skin) had nowhere else warm to go. The dark/rugged corner (tannery / forge / anvil) is rich; the whole warm-and-light half is nearly empty. Mood can't express when there's only one skin per region.

## What we landed on

### 1. The shelf is organized by maker-WORLDS, not three "characters"

Three characters (homey / rugged / delicate) are far too coarse for the real maker range. Reading the launch niche queue, makers cluster into roughly **nine worlds**:

- **Hearth** — warm, handmade, domestic: baker, jam & honey, soap, candles, knit & crochet, quilts. (≈ today's Ember)
- **Workshop** — rugged, made-to-last: leather, wood, blacksmith, knives, cobbler, butcher. (≈ Tannery / Forge / Anvil)
- **Fine** — refined, quiet, luxe: fine jewelry, chocolatier, calligraphy, perfume, milliner. (≈ Atelier / Porcelain — rename off "Atelier")
- **Garden** — botanical, earthy, seasonal: florist, plants, herbalist, apothecary, dried flowers. (≈ Botanical)
- **Studio** — art-forward, the goods ARE the art: painter, printmaker, illustrator, sculptor, art prints. (NEW)
- **Mystic** — esoteric, moody, celestial: witchcraft, crystals, tarot, ritual candles, occult. (NEW — the spec's own "occult ≠ honey-amber")
- **Playroom** — playful, bright, friendly-bold: stickers, enamel pins, polymer clay, toys, plush, comics. (NEW)
- **Press** — graphic, inky, urban: apparel & screenprint, zines, streetwear, sneaker custom. (NEW)
- **Relic** — vintage, nostalgic, aged: vintage reseller, antiques, mid-century, ephemera. (NEW — curator, not maker)

A world is a loose **selection tag**, not a hard bucket. A new niche classifies into a world and inherits its skins (zero design). Worlds replace the `character` field in `SkinTag`. (Filtered to makers-who-sell; deferred Doer trades aren't on Main Street yet.)

### 2. Go DEEP, not one-per-world

A skin is a data entry in a structure that already exists (palette, three type voices, atmosphere, tag, font href). There is no build cost that justifies rationing. The target is **several skins per world (≈3–4), spanning that world's real internal range** — light and dark, loud and quiet, the different kinds of maker inside it. That's roughly **25–30 skins total**. Every one is cheap to add; the only real work is designing each one well.

Example of a world's range: Hearth wants a cozy morning, a golden evening, a bright farm-fresh, a candlelit dark. Mystic wants a deep occult, a soft celestial, a blood-and-ritual red-black. Studio wants a stark light gallery, a moody dark one, a vivid one for colorful painters.

### 3. The differentiation rules (the heart of this)

- **Choices, not statements.** The shelf's job is to give a maker a range of looks they'd actually want to live in — not a gallery of art pieces shouting at each other. Most skins should be calm and usable. Save loud for the worlds that earn it (Playroom, Press). **Do not be bold for boldness' sake** — and do not retreat to safe-and-identical either. Timid-and-same was the failure; tasteful is not.
- **FONT is the primary differentiator; color may overlap.** Two skins can both be warm cream — fine — as long as one is a high-contrast fashion serif, one a sturdy slab, one a clean geometric sans. The *type* carries the identity. (This is exactly why Atelier and Porcelain were twins: similar cream AND similar serif.)
- **No cousins.** No two skins may read the same. The bar is mostly typographic: if two skins share a palette, their faces must be **noticeably** different.
- **Spread across type personalities** — humanist serif, fashion didone, slab, geometric sans, characterful grotesque, condensed poster gothic, rounded, typewriter, hand-cut serif, and so on. That's nine clearly different voices before color even enters.
- **Don't converge on one "characterful" font.** The Fraunces tic (reaching for the same expressive face every time) is just a new flavour of safe. Each skin gets its own face.
- **Plain, evocative names — no design jargon.** Kill "Atelier," "Nocturne," "Risograph," "Celestine." Names surface in the post-edit try-on, so they must read like plain words.

### 4. Selection stays Bohdi's call

Consistent with the no-steering engine and today's goods-treatment decision: Bohdi picks the skin off the menu. A richer, deeper shelf just gives him better matches. The skin tags (world + moods) feed his menu descriptions; nothing hard-maps mood→skin.

### 5. The skin data model is unchanged

`MAIN_STREET_SKINS` entries stay the same shape: `palette` (two surfaces + accent/rule), `type` via `makeType` (three voices), `atmosphere` (grain + photoFilter), `motion`/`spacing` (shared bones), a `SkinTag`, and a font href. Atmosphere should do more work than it does today (grain is shared and faint) — committed grounds, gentle gradients, grain, the photo grade — but it's still data the renderer reads generically. No renderer changes needed to add skins; the bones already read everything from the skin.

## Starting sketches (directions, not final)

The first batch, one per new world plus a Hearth evening — each a different face:

- **Orchard** (Hearth, golden evening) — warm amber ground, cream type, terracotta + bruised-plum. Display: *Hedvig Letters Serif* (warm, hand-cut).
- **Nightshade** (Mystic, occult) — violet-black, moonlight type, electric amethyst + gold hairline + an acid spark. Display: *Gloock* (heavy, carved, gothic).
- **Gallery** (Studio) — warm bone-white, enormous off-center jet-black type, one hot vermillion. Display: *Syne*; body *Newsreader*.
- **Confetti** (Playroom) — saturated bright ground, poppy + ink in tension, rounded heavy display: *Unbounded*.
- **Pressroom** (Press) — bone paper, off-register red+blue overprint blocks, condensed poster type: *Big Shoulders*; mono small print.
- **Heirloom** (Relic) — faded-ochre paper + grain, sepia ink, worn teal + oxblood, vintage *Libre Caslon* display + a typewriter for labels.

Then fill each world to its range (the deep shelf), reworking the existing twins (Atelier/Porcelain) so they differ by face.

## Build approach for next session

1. Design the deep shelf in batches **in chat** — palette + a characterful, non-repeating font pairing + atmosphere per skin. Hold the no-cousins line on every one.
2. Add them as data to `skins.ts` (+ font hrefs, + tags as worlds). Rename `SkinTag.character` → `world`. Update `SKIN_DESCRIPTIONS` in the builder so Bohdi's menu reads them.
3. Build, then **judge on a real onboarding run** — the renderer is niche-neutral, so a skin is only proven once it's worn on a live store. The eyes/quality check still applies.
4. Plain-rename the jargon skins as we touch them.

## Process notes

- **Do not use the brainstorming visual companion.** It spiked memory on Alex's machine (the server + browser rendering layered gradients/grain/font-imports). Visual work happens in chat; the real judge is the build.
- Unrelated but surfaced: ~two dozen MCP servers connect at launch (each its own process). Trim via the `/mcp` command — most aren't needed for these projects.

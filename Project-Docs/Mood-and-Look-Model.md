# Mood & Look Model — Foundation

> **Partly superseded (2026-06-24, Session 51).** Two calls in this doc were reversed: feeling now includes color and fonts (not "color is a passenger"), and Cozy and Rustic are **separate** families (not merged). The current model is in `Family-Layout-Model.md`. How to fully reconcile the two docs is still open.

**Date:** 2026-06-22
**Status:** Direction agreed this session. Per-family specifics (skins, fonts, lighting, filters, wallpapers, imagery treatment) to be defined next session.
**Supersedes:** the rejected "Look Engine / complete Looks" proposal drafted earlier the same day.

This is the foundation we landed on after a long working session. It does **not** yet define each family's concrete pieces — that's the next job. It captures the *model* everything will be built on.

---

## The promise (the fixed point)

**"You tell us what you make, and we build you a site."**

- Minimal input from the maker — just what they make.
- We build the entire site, imagery included.
- We never turn around and ask them for more. No photo uploads. The moment we ask for a photo, we've broken the one thing we promised.
- The whole burden of design and tech is ours. We take it off them entirely.

---

## Why the old approach failed

- Seven moods that, side by side in the editor, all looked the same. Measured: backgrounds clustered in one cream-to-white band.
- Root cause: we tried to define a mood with **color**. Switching moods was a recolor — a repaint on one fixed shape. A repaint reads as template/AI slop, which is exactly what we position against.
- Confirmed by experiment: hand any tool a feeling-word and it renders the convergent cliché ("rustic candle store"). Even successful real makers have converged on one tasteful look. **You can't reach "not seen in this industry" by imitating the industry.**

---

## The core principle

**A mood is defined by type, shape, texture, imagery, and lighting — NOT by color.**

Color is a passenger: it has to be coherent, but it does not define the feeling. The levers that actually carry a mood:

- **Type (fonts)** — a Goudy-ish ornate serif says luxury; a tight technical sans says modern.
- **Shape** — structural/layout devices (e.g., a torn-paper edge) and the bones of the page.
- **Texture ("wallpaper")** — the background is a *texture* (paper, linen, wood, concrete, tapestry), not a flat color fill. A swappable maker choice.
- **Imagery** — photos art-directed to the mood. The single biggest lever, and since we generate/control the imagery, it carries most of the feeling.
- **Lighting / filters** — a grade over the imagery (warm-and-dim vs bright-and-flat) shifts the feeling instantly.

---

## The model

- **Mood families**, batched and fewer. The maker picks **one family** at onboarding — a single simple choice.
- **Within a family**, variants ("skins") are distinguished by the levers above — font, shape device, wallpaper/texture, lighting/filter — **never by color**.
- The **editor** lets the maker nudge the feeling by swapping those levers (a different font, different lighting, a different wallpaper). Instant, reversible, content-safe — nothing regenerates.
- **Imagery moves by filter**, not regeneration. Change the mood → change the filters/grade over the existing photos. (Honest limit: a filter grades, it doesn't restage a shot. That's fine, because we'd never restage a maker's own photo anyway.)

---

## The five families (beta set)

1. **Cozy / Rustic** (batched) — warm, textured, handmade. Rustic vs cozy is distinguished by font + a layout device (torn paper = rustic) + lighting. **Expected to carry the most makers → build this one deepest, with the most internal flex.**
2. **Dark** — moody, edgy, witchy.
3. **Luxury / Elegant** (batched) — the refined, dressed-up family, spanning restrained to opulent. **Elegant** is the quiet end: a refined serif, generous negative space, a light touch of classic ornament, softer lighting. **Luxury** is the loud end: fleur-de-lis motif, tapestry wallpaper, gold, an ornate decorative typeface, rich warm lighting — bordering on gaudy. Distinguished by the levers, not color. The luxury end is the polar opposite of minimalist; the **elegant end sits closest to minimalist**, so type and warmth (refined serif + a classic touch vs. tight sans + bare/cool) are what keep those two apart.
4. **Playful** — bright, fun, bold. *Least-defined of the five; needs a concrete recipe like the others have.*
5. **Modern / Minimalist** (batched) — clean, bare, bright, flat even light, tight sans, structural. Spans **minimal ↔ industrial**. Industrial is the raw/hard variant: concrete or metal wallpaper, mono/technical type, harder cooler lighting, an exposed grid.

---

## What we eliminated or merged (from the original seven)

| Original | Outcome |
|---|---|
| Dark | Kept |
| Rustic | Merged into Cozy/Rustic |
| Cozy | Merged into Cozy/Rustic |
| Modern | Kept, now Modern/Minimalist |
| Cheerful | Folded into Playful |
| Elegant | Now the **restrained end of the Luxury / Elegant family** (batched with Luxury, like Cozy/Rustic). |
| Industrial | Not its own family; **lives as a skin under Modern** |

---

## Open items / to watch (NOT yet decided)

- **Elegant (the restrained end of Luxury/Elegant) sits closest to Minimalist.** They share an open, refined feel; type and warmth keep them apart (refined serif + classic touch vs. tight sans + bare/cool). Watch they don't blur when we define both.
- **Playful needs a concrete recipe** — its font, texture, lighting, and shape — or it's the soft spot in the lineup.
- **Cozy/Rustic will carry the majority** of makers → most internal flexibility, built deepest.
- **Editor scope, undecided:** does the maker nudge only *within* their family (cozy ↔ rustic), or can they also jump families (cozy/rustic → modern)? Not yet answered.
- **Filters grade, they don't restage** — confirmed acceptable, because it only ever applies to the maker's own photos.

---

## Next session

**One family at a time, built all the way through before starting the next.** Start with **Cozy/Rustic**:

1. **Define its pieces** — the skins (cozy ↔ rustic variants), the fonts, the shape devices (torn paper), the wallpapers/textures, the lighting/filters, the imagery treatment. Nothing can be built until these exist.
2. **Build it into onboarding** — pick cozy/rustic and get a real, complete build.
3. **Build it into the editor** — the same skins and levers, swappable live.

Onboarding and the editor read from the **same recipe**: onboarding sets the starting skin, the editor swaps among the same pieces. One kit, two surfaces — build it once. (Editor door 1 already does live re-skinning; we feed it the real cozy/rustic pieces.)

**Test end-to-end on a single real storefront** — spin one up, then flip skins, fonts, lighting, and wallpaper in the editor and watch the feel move within cozy/rustic. Get it fully right, then move to the next family.

The other families (Luxury/Elegant, Modern/Minimalist, Dark, Playful) wait until Cozy/Rustic is real and good.

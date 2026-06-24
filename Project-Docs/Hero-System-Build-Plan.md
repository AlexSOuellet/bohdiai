# Hero System — Build Plan

**Date:** 2026-06-24 (Session 53) · **Status:** BUILT. All 8 heroes + the swap shipped this session (see `session-logs/session-53.md`). Two things outstanding: (1) **the inline-styles refactor is owed and is FIRST work next session** — the heroes were built with inline `typeRoleCss` style objects, which is bad practice; the type layer must move to CSS variables + classes before building more (memory `feedback_inline_styles_are_bad`). (2) Only the hero SLOT is catalog-driven; the rest of the page is still the fixed assembly.

This is the plan to turn Main Street's one fixed hero into eight swappable heroes, grounded in the family work from Sessions 51–52 (`Family-Layout-Model.md`, `Family-Style-Sheets.md`). Plain-English version of the architecture is in those docs; this doc is the concrete build order.

---

## What we're building

Right now `MainStreet.tsx` lists its sections in a fixed order in code, with one hero (the Story/Moment hero). To give a maker a different hero today, you'd hand-edit the file.

We're changing two things:

1. **The pile.** Onboarding generates everything any of the eight heroes could need — up front, once. Each hero takes only the ingredients it uses; nothing is ever missing, so no swap lands on an empty hero.
2. **The swap.** The page's section order moves out of hardcoded code and into a plain list the engine reads. Swapping a hero becomes changing one entry in that list, not rewriting the page.

The page looks identical to today's Cozy/Main Street until someone actually swaps a hero.

---

## The pile — what onboarding must generate for all eight heroes

Every hero draws from the same shared set of ingredients (the "content contract"). Onboarding fills all of it.

**Shared by every hero:**
- **Label** — the small eyebrow line (today: `moment.eyebrow`).
- **Headline** — the big line / brand-as-hero text (today: `moment.brand`).
- **Sub-line** — one supporting sentence under the headline. *(New — today the Story hero uses its fading lines instead of a plain sub. Other heroes need a plain sub-line that is NOT the fading-lines treatment.)*
- **Button(s)** — primary CTA, optional secondary (today: `moment.ctaLabel` / `ctaTarget` / `secondaryCta*`).
- **Media** — the hero clip or photo (today: `moment.media`, a `MediaSlot` that is video or still).

**Extra ingredients only some heroes use:**
- **Fading story lines** — Story's signature move (today: `moment.story`). **Story hero only, Cozy only.** No other hero inherits this. It stays an optional extra nothing else asks for.
- **Collage shots** — Collage wants ~3 still images. *(New — these are generated at onboarding as their own stills. They are NOT frames pulled from the hero video.)*
- **Carousel lineup** — Carousel rotates several featured things. These come from the product catalog / library, not from the hero clip.

So onboarding's job grows by three things versus today: a plain hero **sub-line**, the **Collage still set**, and confirming the **Carousel lineup** source (products). Everything else is already authored.

---

## Video — the rules

- **Video has no still twin.** When the build picks video, it is a video — period. We do not also generate a still version of it, and we never freeze a frame. After the fading story lines finish on the Story hero, the video keeps playing/looping.
- **The clip is just background media.** Any hero with a full-bleed media slot can show it (Story, a full-width image band, a background behind a floating card). Heroes that don't suit a single background video simply don't use it — Collage uses its three onboarding stills, Typographic shows no media at all. Each hero takes what it needs; the video is absent where it isn't used.
- **Only pick video when it's a seamless, meaningful loop.** Not just "the world has some motion." Video is chosen only when the motion forms a loop that is both seamless (no visible cut, locked camera per D52) and meaningful (the motion belongs to the subject — steam, flame, water, hands at work — never invented to fill time, per D55). If the honest answer is "this would be a one-shot clip that has to cut to restart, or motion we'd have to invent," it's a still, not a video.
- **The travel limit we accept and don't hide:** a still can be re-cropped and re-graded to fit another family; a video's *staging* can't be changed after it's made. On a full family switch the dynamic grade shifts the video's color toward the new family, but the scene stays as staged. Color travels; setting doesn't. This only shows up on a full family switch, only for video.

---

## The eight heroes and what each takes

| Hero | Takes from the pile | Notes |
|---|---|---|
| **Story** (Cozy default) | label, headline, sub, media, button, **+ fading story lines** | The only hero with fading lines. Media can be video or still. This is today's MomentHero. |
| **Split** (Modern default) | label, headline, sub, media, button | Media one side, text the other. Video or still in the panel. |
| **Stacked** (Rustic default) | label, headline, sub, media, button | Text block, then a full-width media band. Full-bleed slot — can play video. |
| **Typographic** (Luxury default) | label, headline, sub, button | No media. The words carry it. Video/stills simply unused here. |
| **Collage** (Playful default) | label, headline, button, **+ 3 collage stills** | Uses its three onboarding stills, not the hero clip. |
| **Floating card** (Dark default) | label, headline, sub, media, button | Card floats over a background; background slot can play video. |
| **Carousel** (no default) | label, headline, button, **+ product lineup** | Rotates several products. Content-gated (needs enough to rotate). |
| **Editorial cover** (no default) | label, headline, sub, media, button | Giant masthead, brand-as-hero. Full-bleed slot — can play video. |

Story already exists. The other seven are new components.

---

## The swap — recipe + catalog

- **Recipe:** the page's section order as a plain ordered list of `(sectionType, variantKey)` — e.g. `hero:story`, then `goods`, `founder`, `findus`, `close`, `footer`. Replaces the hardcoded JSX list in `MainStreet.tsx`.
- **Catalog:** a lookup from `variantKey` → component. `hero:story` → the Story component, `hero:split` → the Split component, etc. Self-registering, same family as the existing block-registry pattern (ADR-0001).
- **Renderer:** one generic walker reads the recipe top to bottom, resolves each key in the catalog, renders it with that section's slice of the pile. Names no specific section — same trick as the skin system naming no color or font.

Swapping a hero = changing `hero:story` to `hero:split` in the recipe. No file edit.

---

## Guardrails (not taste — mechanical)

- **Functional floor.** Whatever hero a maker picks, it cannot overflow, must stay readable, must be mobile-safe. Guaranteed by the renderer, never the maker's problem. (This is why we can show all eight heroes to every family and trust the maker's eye.)
- **Content gate.** Carousel and Collage only offer themselves when there's actually enough to fill them (enough products to rotate, enough shots for the collage). Not a family rule — a "do you have the material" rule.
- **No family gating on heroes.** Every family's maker sees all eight in the editor and picks by eye (Alex's call). Defaults pick the safe-fit hero for the auto-build so a fresh build never lands on a fighting combo.

---

## Build order

1. **Settle the pile (the content contract).** Add the plain hero **sub-line**, define the **Collage still set**, confirm the **Carousel lineup** source. Update the schema + the crew (copywriter / cinematographer) to author them. Test-first.
2. **Build one new hero** against the contract so there's a second card to swap to. (Order among the new seven barely matters since we're building all of them.)
3. **Build the swap** — recipe + catalog + generic renderer over Main Street's current fixed assembly. Prove it by flipping the new hero and Story back and forth; today's Cozy output stays byte-for-byte identical when driven by the default recipe.
4. **Build the remaining heroes** against the contract; each registers into the catalog and is immediately swappable.
5. **Wire the family style sheets** (palette + font package + texture/wallpaper per family) so a family switch carries its whole look — separate follow-on, per `Family-Style-Sheets.md`.
6. **Dynamic image grade** (normalize → family grade) — the one genuinely new pipeline piece, follow-on.

Steps 1–4 are the hero system. 5–6 are the family look, built on top.

---

## Open / to confirm with Alex

- The exact **sub-line** wording rule for the copywriter (one sentence? tone?) — settle when we do step 1.
- **Carousel lineup** — confirmed as products from the catalog (not a separate generation)?
- **Dark's default hero** (Floating card) is still marked open in `Family-Style-Sheets.md` — doesn't block the hero build, but resolve before the family-look step.

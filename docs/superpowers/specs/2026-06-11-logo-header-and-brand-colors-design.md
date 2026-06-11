# Logo header treatment + brand-color anchoring — design

**Date:** 2026-06-11
**Status:** Approved direction, pre-plan
**Owner:** Claude (Lead Dev)
**Approver:** Alex

## The problem

Two things came together this session:

1. Session 39 put an uploaded logo on a fixed near-white plate in the header — a box with padding, rounded corners, and a drop shadow ([chrome.tsx:73](../../../lib/archetypes/main-street/chrome.tsx#L73), [chrome.tsx:198](../../../lib/archetypes/main-street/chrome.tsx#L198)). On a transparent logo it reads as a cheap white box. The plate was a blunt contrast guarantee, because the header sits on three different backdrops (over the hero video, on a light skin page, on a dark skin page) and a dark-inked logo vanishes on a dark backdrop.

2. We already extract the logo's dominant brand colors with Claude Vision at onboarding ([logo-actions.ts:65](../../../app/onboarding/logo-actions.ts#L65)) — 2–4 hex codes, background ignored — but `run-storefront` deliberately drops them before the build and they persist nowhere ([run-storefront.test.ts:47](../../../lib/onboarding/run-storefront.test.ts#L47)). So we throw away the exact data that would solve the contrast problem and let the logo color the store.

## The core idea

The logo does two jobs on two different clocks:

- **Header contrast** (bare mark vs. a contrasting header tint — never a box) is a **render-time** property of the logo. Decided every time the page draws, from whether the logo reads light or dark. Works whenever the logo arrives — onboarding or weeks later.
- **Palette anchor** (the logo's strongest ink tints the accent and nudges skin selection, inside the mood — never overrides it) is **build-time**. Baked into the skin and tokens Bohdi picks. Fed by the logo at onboarding; for a logo uploaded after the build it becomes a future opt-in "match my store to my logo" action (rides the website editor, not built yet).

The small enabling piece: **persist the brand colors on the `tenants` row** instead of discarding them, and re-extract on any later upload. That stops both clocks from depending on ephemeral onboarding state.

## Mood vs. logo (the rule, restated)

The mood paints the room — light/dark, contrast, type, the overall feeling. It's the maker's deliberate pick and stays non-negotiable. The logo picks the throw pillows — its strongest ink becomes the accent, and it biases which skin Bohdi reaches for so the skin can host that color. The logo never repaints the room. Two logo colors can't carry a whole storefront, and overriding would throw away the mood the maker chose.

## Design

### 1. Persist brand colors

- Migration: add `brand_colors text[]` (nullable) to `tenants`, next to `logo_url`.
- `writeArchetypeStorefront` writes `brand_colors` when present.
- `run-storefront` stops dropping `brandColors`; it flows into the build. The test asserting it's dropped is updated to assert it's passed and persisted.
- A later logo upload (when the editor exists) re-runs extraction and updates both `logo_url` and `brand_colors`. Out of scope to build the upload UI now; the data model supports it.

### 2. Build-time palette anchor

- The build path consumes `brandColors` as a high-priority input to the Graphic Artist's skin selection and accent assignment, *inside* the mood-aligned skin subset (consistent with the existing mood-gated skin selection).
- Anchor, not override: the strongest non-neutral logo color biases the accent role and biases skin choice toward skins whose palette can host it. The mood still governs world/skin family.
- Empty `brandColors` (SVG, Vision failure, no logo) → Bohdi's free pick inside the mood, unchanged from today.

### 3. Render-time logo header contrast — delete the plate

- Remove `ms-logo-plate` entirely. The logo never sits in a box.
- At render, derive the logo's tone (light vs. dark) from its stored `brand_colors` (relative-luminance of the dominant inks). No extra Vision call.
- Placement rule:
  - **Over the hero:** the scrim already guarantees a dark backdrop, so a light-toned logo sits bare and clean — the common case. A dark-toned logo is the one spot bare can't work and a full-width skin tint would fight the Moment; it gets a **full-width header band** — a contrasting wash that spans the top edge and fades down into the hero. Full-width so it reads as chrome (a header band the site has), never a box around the mark. This softens the cinematic top edge slightly and only triggers for a dark logo on the hero, which is rare.
  - **On a sub-page (skin surface):** if the logo's tone contrasts the skin surface, it sits bare. If it would wash into the skin, the header takes a **full-width contrasting tint** — intentional site chrome, not a box hugging the mark. The nav text flips to read on that tint.
- Empty `brand_colors` (unknown tone) → bare on the surface the mood already guarantees. Maker can swap to a raster to get the full treatment.

## What this is NOT

- Not a re-skin of the shelf. Skins are unchanged; selection gains the logo as an input.
- Not a build-time repaint of existing stores. A late logo never silently re-tints a built store.
- Not the website editor. The post-build logo-upload UI and the "match my store" action are future; this design only makes the data and render model ready for them.

## Open corner (accepted)

SVG logos and failed Vision reads yield no colors and no known tone. Those logos render bare on the mood surface and get no palette anchor. Most uploads are raster PNGs, so this is the corner, not the common path. No mitigation built now beyond the bare fallback; a maker can upload a raster version.

## Testing

- Migration applies; `brand_colors` round-trips through the build and persists on the row.
- `run-storefront` passes `brandColors` into the build (replaces the current drop-it test).
- Tone derivation: dark inks → dark tone, light inks → light tone, mixed → dominant by prominence; empty → unknown.
- Render: plate gone; bare placement when tone contrasts backdrop; contrasting header tint when it doesn't; nav text contrast follows the chosen surface.
- Palette anchor: a strong brand color biases accent + skin within the mood subset; empty colors leave Bohdi's free pick unchanged.

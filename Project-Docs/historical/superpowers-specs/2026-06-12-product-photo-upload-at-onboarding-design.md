# Product photo upload at onboarding — design

**Date:** 2026-06-12 (Session 41)
**Status:** Approved by Alex
**Authors:** Claude (Lead Dev), Alex (Founder)

## Why

Today's onboarding ships a wow store with five generated placeholder products that the maker must replace. The maker's actual work is the strongest input we have about who they are — per D8, the customer's own assets matter more than the niche. We're throwing that signal away during the moment we most need it.

Adding an optional "upload up to 5 product photos" step turns part of the launched store from placeholder into real. It also gives Bohdi a direct read on what the maker actually makes, so his trajectory and Moment can ground in the work instead of guessing from the niche file. (Session 41's woodworker test landed five cutting boards because the niche file leads cutting-board-first; a maker who uploaded three turned-bowl photos would have anchored Bohdi in turned bowls instead.)

Three adjacent fixes ride along with this spec because they touch the same surfaces:

- The catalog-size onboarding step is retired. It gated nothing structural (Main Street is the only archetype and accepts any size), and the new photo step gives a better signal anyway. One fewer screen, one stronger signal.
- The founder-name attribution bug from Session 39 (the Copywriter invents a name for `founder.attribution` because the prompt never receives the maker's real first name). Fixed by passing `makerName` into the Copywriter prompt the same way `shopName` is, per D45.
- The portrait founder treatment has no contrast guarantee — bright zones in the underlying photo wash the serif quote out (Session 41 woodworker build showed the first three lines unreadable against the warm-lit hands at the workbench). Fixed by a render-time contrast scrim on the portrait treatment, same family as the logo-header fix from D56: sample the region where the text lands and only apply a subtle darkening scrim when the underlying pixels are too bright or low-contrast for the skin's text color. This will get worse when makers upload their own About photos, so the fix has to live in the renderer, not in the prompt.

The woodworker niche file's cutting-board fixation is a separate fix — niche-writer skill rewrite, tracked separately.

## What the maker sees

Onboarding screen order after this change:

1. Name (your name + your shop's name)
2. Niche
3. Logo (optional, skippable)
4. **Product photos (optional, skippable) — NEW**
5. Mood
6. Trial
7. Build

Catalog size step (currently step 5) is removed.

The photo screen is the same upload pattern as the logo step. Drag-and-drop or click-to-upload, up to 5 photos, image previews with a remove-X per photo, big visible Skip button. Header reads "Got a few product photos handy?" with sub-copy along the lines of "Upload up to 5 and we'll build with your real work. Skip and we'll use stand-ins you swap later — either way you get a live store in five minutes." Skip is the default-prominent path.

## Storage

Photos go to Supabase Storage using the same upload pattern the logo step uses (server action mints a signed upload URL, client PUTs the file, the resulting public URL goes into onboarding state). Exact bucket and path follow whatever the logo step does — to be confirmed in the implementation plan by reading `StepLogo.tsx` and its server action; this spec does not lock the path.

Onboarding state carries `productPhotoUrls: string[]` (length 0–5). Empty array means the maker skipped.

## The Vision call

One batched call to Claude (Sonnet) with all uploaded photos as image content blocks. The call returns a single structured response:

- `perPhoto`: array, one entry per upload, in upload order:
  - `productType`: short noun phrase ("turned walnut bowl", "small wooden sign", "leather wallet")
  - `suggestedName`: a real product name (2–40 chars)
  - `suggestedShortDescription`: 4–90 chars
  - `suggestedDescription`: 12+ chars, no hard cap (consistent with D53)
  - `suggestedPriceCents`: integer, Vision's best read of category-appropriate pricing
- `makerSummary`: 2–3 sentences describing what this maker actually makes, written for Bohdi to read as part of his brief

The call is structured via a forced tool call (same pattern as the Copywriter), validated by zod, with a short retry on schema misses. Hard timeout of 60s (slower than crew calls because Vision on 5 images is heavier). On timeout or repeated failure, the build degrades to "treat as skipped" — photos are still uploaded and visible in the dashboard, but the build proceeds without Vision input. This is consistent with the broader principle that an onboarding failure must never block the wow.

The Vision read does NOT extract colors, lighting, or palette from the photos. Per Alex's call, maker photos can be inconsistent and we don't want a bad phone shot polluting the skin pick. Skin and accent override stay on niche + mood + logo only.

The Vision read does NOT second-guess the niche. The maker picked it; we don't overrule that. If a tattoo-niche maker uploads candle photos, that's the maker's problem to reconcile and we render their niche choice with their photos.

## How the photos become products

A note on today's numbers: `MAX_PRODUCT_IMAGES` is 5 (fal generates at most 5 product photos) but the Copywriter is told to write 3–10 products with a default of 6 when `productCount=0`. The five generated images are reused across the catalog when the catalog runs longer. Alex's "max of 5" framing matches the image cap.

Under this spec the target catalog size is **5** across all paths — both the photo path and the skipped path. This matches the image cap exactly, makes the math clean (1 photo uploaded → 5 products with 4 stand-ins; 5 photos → 5 all real), and removes the "Copywriter writes 6, only 5 get images, the 6th reuses" ambiguity. The Copywriter target product count becomes a flat 5 regardless of upload state.

With photos uploaded:

- Products 1–N (where N = uploaded count) are seeded from the Vision read. The Copywriter receives the Vision suggestions as a starting hand and authors final names, descriptions, prices. The image URL is the uploaded URL — no fal generation for these.
- Products N+1 through 5 are authored as stand-ins exactly as today, with fal-generated images. The Copywriter knows which slots are real-photo-backed and which are stand-ins, so the stand-ins fit alongside the real work (similar category, similar price point).

The Copywriter prompt is extended with a new section ahead of the existing product spec:

```
THE MAKER'S WORK — N photos uploaded:
- Photo 1: <productType>; price hint <cents>; <shortDescription draft>
- Photo 2: ...
Author products 1 through N around these photos — use the same product type and a faithful description. The image URL is already assigned. Then author products N+1 through 5 as stand-ins that fit alongside.
```

If N=0 (skipped), this section is omitted and the existing behavior runs unchanged.

## How the Vision summary feeds the crew

The `makerSummary` (the 2–3 sentence cross-photo read) is appended to the CrewBrief as a new field `makerWork?: string`. It threads into:

- **Director prompt**: a new section "WHAT THIS MAKER ACTUALLY MAKES — \<makerWork\>" added below the niche body. Director uses it when authoring the trajectory's feeling, customerWhy, visualWorld, and momentConcept.
- **Cinematographer prompt**: receives the same `makerWork` line so the Moment can reference actual subject matter.
- **Copywriter prompt**: receives it implicitly via the per-product Vision suggestions above; no separate `makerWork` line needed because the photo-level data is more specific.
- **Graphic Artist prompt**: NOT given `makerWork` or any photo-derived input. Skin pick stays on niche + mood (D41) and accent stays on logo (D56). This is the Alex call from the brainstorm.

If `makerWork` is undefined (skip path), the Director and Cinematographer prompts run as they do today.

## The founder-name fix (ridealong)

The Copywriter currently has no read on the maker's first name, so `founder.attribution` is invented. The fix is small and lives in the same prompt we're already editing.

`copywriter.ts:53` `buildCopywriterPrompt` adds, near the shopName lock:

```
- founder.attribution: the maker's real first name is "${brief.makerName}".
  Use it exactly in founder.attribution — do not invent, shorten, or invent a
  surname.
```

The pipeline already threads `makerName` through to the Copywriter brief (verified — `CrewBrief extends AuthoringBrief`, and `AuthoringBrief.makerName` is set from `OnboardingData.makerName`). The Copywriter prompt is the only place it isn't read.

Edge case: `makerName` is optional in the schema. The current onboarding requires it (StepName), but a stored brief from before this fix could lack it. When undefined or blank, the attribution clause becomes "the maker's first name was not captured; write a generic attribution like 'The maker' or omit a name." We do not invent.

## Portrait founder-treatment contrast scrim

The portrait treatment (D48, copywriter `founder.treatment === 'portrait'`) renders the founder quote directly over a large portrait image. Today there is no contrast guarantee — whatever the photo's tonal range is, the quote sits on it raw. Session 41's woodworker live build showed this: warm-lit hands at the workbench in the top half of the frame washed the first three lines of the serif quote out completely; only the lower half against darker wood-shavings read.

The fix lives in the renderer (the founder component file for the portrait variant), not the Crew. The shape:

- At render time, sample the image region the text overlays. (For the portrait treatment that's the left third of the image, roughly top-30%-to-bottom-90% vertically.) Sample by drawing the image to a hidden canvas at small dimensions and reading pixels; the same browser-side technique we use elsewhere.
- Compare the average luminance and the contrast against the skin's text color (an exposed CSS variable). If contrast ratio falls below a readability threshold (4.5:1 for body text per WCAG AA), apply a scrim.
- The scrim is a CSS gradient that darkens the text zone, calibrated to the skin's background color so it reads as belonging to the skin, not as a generic black overlay. The scrim is feathered (fades to transparent at its edges) so it doesn't read as a hard rectangle on top of the photo.
- Dark photos and high-contrast photos get no scrim at all. The skin's normal photo treatment runs unchanged.

This is the same guard pattern as the logo-header contrast fix from D56: derive readability from the actual image, only intervene when it fails. The logo path lives at the brand-color extraction layer; this lives at the render layer because the founder portrait is a per-shop image that can change after build (especially once makers upload their own).

The contrast guard generalizes to other text-over-image surfaces. The `letter` and `card` founder treatments don't have the same problem (letter sets text on a paper background; card uses a separate text block). The Moment hero stages are video-first and have their own contrast story. So scope this fix to the portrait founder treatment for now; the same primitive can be lifted into a shared helper if a second case appears.

## Catalog-size step retirement

`StepCatalogSize.tsx` is removed from the flow. `OnboardingFlow.tsx` loses the step and `TOTAL_STEPS` drops to 7 (Name, Niche, Logo, Photos, Mood, Trial, Build).

`OnboardingData.productCount` stays on the type for now and is hard-set to 5 in the build action, since that matches the current cap. The downstream `targetProductCount` clamp in the Copywriter continues to work unchanged.

A note in the spec: if a second archetype is added later that genuinely needs a structural catalog-size signal (Counter's "rotating selection" pattern is a candidate), the question comes back as part of that archetype's spec, not as a Phase-1 onboarding question.

## What stays the same

- Skin selection (D41) — niche + mood drive it, no photo signal in.
- Brand-color accent override (D56) — logo only, no photo signal in.
- The Moment treatment split (D57, D58, D59) — Director still picks video vs spotlight on the "would I have to invent the motion?" criterion. Photos may make that criterion easier to evaluate (a real product photo tells the Director more about what's in front of the camera) but the criterion itself doesn't change.
- The treatment roll (D48) — goods and founder treatments still rolled, Bohdi can still override.
- The build/publish flow — products are published live, not draft. The dashboard "add more products" guided step continues to do its job.

## Wow timing

Adds ~30–60s for the Vision call when photos are uploaded. Build ticker gets a new beat — "Studying your work…" — surfaced only when photos were uploaded. The wait is itself part of the wow: the maker watches the platform notice their actual goods.

If photos were skipped, build timing is unchanged.

## Tests

TDD throughout. The standing rule.

- Onboarding flow: StepPhotos renders with empty, mid-upload, and full states; Skip advances; uploads PUT to signed URLs; remove-X works; advancing carries `productPhotoUrls` into next step.
- Vision call: a real-shape mock returns structured `perPhoto` + `makerSummary`; schema validation rejects bad shapes; timeout/retry path; the "treat as skipped" degradation path on repeated failure.
- Brief plumbing: `makerWork` flows from build action → CrewBrief → Director prompt → Cinematographer prompt; does NOT flow into Graphic Artist prompt.
- Copywriter: with N=3 photos, products 1–3 reference uploaded URLs and are authored from Vision suggestions; products 4–5 are stand-ins with fal-generated images. With N=0, behavior matches today exactly. With N=5, no stand-ins generated.
- Founder name: `makerName` reaches the Copywriter prompt and `founder.attribution` is the maker's real name on a real build; undefined `makerName` produces a generic attribution, not an invented name.
- Pipeline integration: a full pipeline test with N=2 photos confirms the end-to-end shape — both photos become products with uploaded URLs, three stand-ins fill out, Director's trajectory reads `makerWork`, Cinematographer reads it, Graphic Artist does not.
- Portrait scrim: a unit test on the contrast helper confirms it returns scrim=true for a bright image and scrim=false for a dark one; a component test on the portrait founder renders the scrim when the underlying image fails the contrast threshold and omits it when the image passes; the scrim's CSS reads from the skin's background variable (not hardcoded black).

## Migration / backfill

None needed. Existing tenants' content is unaffected. The schema additions (`product_photo_urls` on the onboarding state, `makerWork` on the brief) are forward-only and optional.

## Out of scope

- Photo cleanup (background removal, color correction, lighting adjustment). Deferred to Phase 2's AI Image Studio per the Master Spec.
- Color/palette extraction from photos. Alex's call: maker photos can be inconsistent, don't risk polluting the design.
- Niche correction from photo signal. The maker picked the niche; we don't second-guess it.
- More than 5 photos. Capped to match the current 5-product catalog ceiling.
- Reading EXIF data, geolocation, or any photo metadata beyond what Vision sees in the image itself.

## Adjacent work tracked separately

- Woodworker niche file rewrite (cutting-board fixation per Session 41 diagnosis) — niche-writer skill job, separate spec.

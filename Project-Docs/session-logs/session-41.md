# Session 41 — Product photos at onboarding, three ridealong fixes, and a Vision tool-use lesson

**Date:** 2026-06-12
**Branch:** session-12/layout-engine
**Tests:** 946 → 989 (+43)
**Commits:** 27 (incl. spec + plan)

A single piece of product work landed end-to-end: optional product-photo upload at onboarding, with the maker's actual work feeding the Director's trajectory, the Cinematographer's Moment, and the Copywriter's catalog. Three ridealong fixes shipped first as independent commits — founder-name attribution, portrait-treatment scrim, catalog-size step retirement. Then two production bugs that surfaced on Alex's live tests: a body-prose schema cap that violated D53, and the Vision call using raw JSON parsing where every other crew member uses forced tool-use. End of session: "much better."

## The three diagnoses that opened the session

Alex tested Session 40's work overnight and arrived with three things to triage:

1. **Cutting-board fixation in the Woodworker build.** Looking at `content/niches/woodworker.md`, cutting boards are mentioned 13+ times and lead both exemplars (Andrew Pearce Bowls, Words with Boards), the price-range paragraph, the construction section, and the "what tends to fit visually" paragraph. Classic D14 monolithic-generalization trap. Fix is in the niche file — rebalance exemplars across the real range, push cutting-board specifics into a vocab sidebar. Tracked as a separate niche-writer skill job.

2. **About attribution still wrong.** The Copywriter prompt was never told the maker's first name, so Bohdi invented attributions. `makerName` was captured at onboarding and threaded through to image directives and the ticker but never reached the Copywriter. Same fix shape as D45's shopName lock.

3. **"Do we still need catalog size?"** Honest answer: no. Main Street is the only archetype, accepts any size, D35 explicitly took archetype choice out of onboarding. The question gated nothing structural. One fewer screen, more time-to-wow.

## The bigger ask — photo upload at onboarding

Alex's question after the diagnoses: "should we add an upload for makers to upload a selection of product photos?" The honest read: not as required, but as an optional path with prominent Skip. Today the wow is fake products with fal images the maker has to replace later. Real uploaded photos give Bohdi the strongest possible input — per D8, "the customer's own assets matter more than the niche" — and let the launched store partly BE their real store. Master Spec §5's zero-friction principle still holds; Skip is the default.

Alex confirmed: yes, see how it changes the build, cap at 5, "this will also help Bohdi see what types of products they sell."

A few real product calls landed during brainstorming, all in Alex's words:

- **Bohdi fills the rest.** If the maker uploads 2, Bohdi authors 3 stand-ins to land at 5. Catalog always 5.
- **Content only, not color.** Vision reads the photos for what the maker makes, NOT for palette. Alex: "makers don't always create great photos." Skin pick stays niche + mood (D41), accent stays logo (D56). Keeps a possibly-bad phone shot from polluting the design.
- **Niche stays authoritative.** If a tattoo-niche maker uploads candle photos, that's their problem to reconcile. Vision refines INSIDE the chosen niche; it never overrules it.

## The shape that landed

Spec at `docs/superpowers/specs/2026-06-12-product-photo-upload-at-onboarding-design.md`. Plan at `docs/superpowers/plans/2026-06-12-product-photo-upload-at-onboarding.md`. 18 tasks in 5 phases, executed via subagent-driven development (fresh subagent per task, spec compliance review, code quality review).

A new step at position 4 in onboarding (after logo, before mood). Drag-and-drop up to 5 photos with preview tiles, remove-X, prominent Skip. Server action uploads files to Supabase Storage, then makes one batched Vision call returning per-photo product suggestions (productType, suggestedName, suggestedShortDescription, suggestedDescription, suggestedPriceCents) plus a 2-3 sentence cross-photo `makerWork` summary.

`CrewBrief` gained two optional fields: `visionPerPhoto?` and `makerWork?`. Three crew members read them and one explicitly does not:

- **Director** prompts now include "WHAT THIS MAKER ACTUALLY MAKES — derived from the photos the maker uploaded. Treat this as more specific than the niche file."
- **Cinematographer** receives `makerWork` so the Moment can ground in real subject matter rather than a niche-stereotyped scene.
- **Copywriter** receives per-photo suggestions as a starting hand and is told "products 1..N reference these uploads; N+1..5 are stand-ins that fit alongside." Target product count is now flat 5 across all paths (replacing the old 3-10 clamp), matching `MAX_PRODUCT_IMAGES`.
- **Graphic Artist** is structurally denied access — the pipeline strips `visionPerPhoto` and `makerWork` from the brief before calling `designLook`. The "no palette from photos" rule is now enforced by code, not just by convention.

`buildArchetypeStore` pre-populates the product URL map with uploaded URLs so fal only generates images for the remaining slots. The implementer extracted a pure helper `assignProductPhotos(uploads, generatedPhotos, productJobCount)` to test the assignment logic without mocking the whole engine.

End-to-end plumbing wired through both API routes — `/api/onboarding/start` (the live route, background build with polling) and `/api/onboarding/generate` (the SSE fallback). One implementer caught that the plan had only listed `/generate` and would have silently dropped the fields between routes if I'd shipped that. Build-store.ts's `BuildInput` got a parallel `VisionPerPhotoInput` type so build-store stays UI-import-free for the jsonb column.

## Three ridealong fixes shipped first

Phase A landed before any new code so the bugs stopped shipping immediately:

- **Founder-name attribution lock.** `copywriter.ts` `buildCopywriterPrompt` now derives `makerNameTrimmed = brief.makerName?.trim()` and includes "Lock founder.attribution to "<name>" exactly. Do not invent, shorten, or add a surname." When undefined: "the maker's first name was not captured — write a generic attribution like 'The maker' rather than inventing." Same D45 pattern as the shopName lock.

- **Portrait scrim wraps the text.** The Session 41 Woodworker live build showed a long quote washed out against warm-lit hands at the workbench. The old scrim was a fixed bottom 32% gradient — a long quote pushed UPWARD into unscrimmed image area. Rewrote so scrim and text live as siblings in a shared bottom-anchored wrapper (data-portrait-anchor), the scrim `inset: 0` of that wrapper. Long quote → tall scrim, short quote → short scrim. Widened the text measure from 22ch to 32ch so a long quote reads as a paragraph, not a column. Code review caught the original test asserted only sibling-ness (which the buggy code also satisfied); tightened to assert the anchor wrapper exists AND is inside, not equal to, the image container.

- **Catalog-size step dropped.** Removed `StepCatalogSize.tsx`, removed from `OnboardingFlow.tsx`. `productCount` stays on `OnboardingData` as forward-compat. Used a filesystem-read assertion as the guard (novel for this codebase but justified — render-based test was trivially true at step 1, source-string match is the actual enforcement).

## Two production bugs caught on Alex's live builds

**The 600-char schema cap (D53 miss).** First live build after wiring photos failed: `products.0..4.description: String must contain at most 600 character(s)`. Investigation: `lib/archetypes/main-street/builder.tsx:39` had `z.string().min(12).max(600)` on product description and `12-600` in the legacy `authoringSpec` prompt text at line 88. The Crew's Copywriter prompt was already D53-compliant ("description (12+, no hard cap)") but the engine schema and the parallel try-on path were not. Dropped the schema max and the matching `12-600` / `40-700` / `20-400` prompt text on description, about story paragraphs, and contact intro. Quality floors (min 12 / 40 / 20) stay. The lesson Alex named in D53 — "no hard caps on body prose; who's to say next time it generates larger" — applies to every body-prose field in every schema in the codebase, not just the ones the Crew touches.

**The Vision JSON-parse failure (the real one).** Patriot Woodworking build "took the images, but did no real analysis," and ran cheaper than expected — clear signal Vision had failed silently and degraded to empty data. Diagnostic log added to `buildArchetypeStore` to surface `uploads/visionEntries/makerWorkLength` on the next build. But the actual smoking gun was already in Alex's upload-step terminal output:

```
"product photos vision: extraction failed",
"error":"Expected ':' after property name in JSON at position 1783"
```

Sonnet returned 1.8k of raw JSON across 3 photos × 5 fields + a makerWork paragraph and tripped its own quote-escaping somewhere in the middle. `JSON.parse` choked. The build proceeded with empty visionPerPhoto/makerWork — no awareness of the maker's work, no makerWork section in the Director or Cinematographer prompts, and a cheap build (token cost matched the skip path).

This is a known and well-understood failure mode of "ask the model for JSON in text." It's exactly why every other crew member in this codebase — Director, Copywriter, Cinematographer, Graphic Artist — uses **forced tool_use**. I copied the cheaper logo-Vision pattern (raw JSON in text), which is fine for brand colors (2-4 hex strings, ~80 chars output) and breaks at 1.8k. Converted `readPhotos` to declare a `submit_photo_read` tool with a full `input_schema`, force `tool_choice`, and read `tu.input` directly. The Anthropic SDK guarantees `tool_use.input` is valid structured JSON. No regex, no escape failures, possible forever.

Also bumped the Vision timeout from 60s to 90s (the real call took 14.6s for 3 photos; 5 photos at the original limit was tight), added a single retry before degrading to empty, and added `makerWorkLength` to the success log. Tests updated to mock `tool_use` blocks; new test asserts `tool_choice: 'submit_photo_read'` is in the request so we can't accidentally regress back to free-text JSON.

Alex retried with Patriot Woodworking: "much better."

## Slideshow polish — Ken Burns flip, then the real fix

After the photo upload landed, Alex caught "bohdi zooms in quite a bit on the slideshow treatment." First diagnosis was wrong: I flipped the Ken Burns keyframe from a push-in (`scale(1.005)` → `scale(1.075)`) to a pull-back (`scale(1.075)` → `scale(1.005)`) on the theory that the camera should reveal the maker's composition rather than investigate into it. Same motion budget, different feeling.

Refresh — "did nothing different." The Ken Burns flip was correct in isolation but didn't address the dominant zoom. Real cause: `object-fit: cover` on the 3:2 landscape slide stage was cropping uploaded photos (typically portrait or square) by 15–25% before the animation even ran. The Ken Burns then scaled an already-cropped slice.

Fix: each slide is now two layers — a blurred backdrop (same image, `scale(1.18)`, `blur(32px) saturate(1.05) brightness(0.82)`) fills the stage at any aspect, and the real photo sits CONTAINED on top so the maker's intentional crop is never re-cropped. The Ken Burns drift rides the foreground only; the backdrop stays still as atmospheric depth. Standard Instagram/Spotify pattern. Works universally — for fal-generated wides and maker-uploaded portraits alike. No hardcoding, no per-source branching: the renderer treats every product photo the same way, which happens to be the way that respects any aspect ratio.

Alex: "better." Live test confirmed the new build was both cheaper AND faster than previous ones (Vision tool-use call is more efficient than parse-and-retry, fewer fal generations when uploads fill slots).

## Idea on the table — photo upgrade as opt-in

Alex floated: "what if we offered the maker a photo upgrade? Using their image exactly, recreate with a more professional mockup." Already on the roadmap — Master Spec lists "AI Image Studio — background removal, photo enhancement, lifestyle mockups" under Phase 2.

Conversation landed on shape: opt-in at upload, per-photo (not whole-set), processed during the build phase (not synchronously at upload, to preserve the few-minutes onboarding pacing). The maker ticks "recreate" on any upload tile that needs it; the build generates a polished version for those slots; the rest publish as-uploaded. No silent "fix every photo" default — the rustic candle maker keeps their workshop shots, the kitchen-table maker can recreate the granite-countertop ones. Alex: "no, let me think about it. Since it is already slated for post build…" — parked for now, kept as a near-term Phase 2 candidate worth pulling forward.

## Standing lessons to carry forward

- **Forced tool_use is the default for any structured AI output beyond hex-codes scale.** Raw-JSON-in-text works when the output is tiny (a few hex strings, a single integer); it breaks above ~1k chars because the model's quote-escaping is fragile. The Director, Copywriter, Cinematographer, Graphic Artist all force tool_use precisely for this reason. New AI integrations should default to that pattern; raw-text JSON is the exception, not the rule, and it must justify itself.
- **D53 vigilance.** Every body-prose schema cap is a build risk. When adding or copy-pasting a schema, the question is: "does the design carry any length?" If yes, no max. The Crew's Copywriter prompt got D53 right; the legacy `authoringSpec` and the underlying schema didn't. Bug surface = anywhere body prose has a length cap.
- **The implementer subagents caught two real plan errors.** I had `/api/onboarding/generate` as the live route — the implementer found `/start` is the actual one and updated both routes plus `build-store.ts`. Code reviewer caught the portrait-scrim test was too weak (sibling-ness alone would pass against the buggy code). Worth paying the dispatch cost on multi-file plumbing tasks where my plan might miss a layer.
- **Diagnostic logging is cheap; add it BEFORE assuming where the bug is.** When the photos-but-no-awareness symptom appeared, I almost went straight to refactoring. Adding the `archetype-build: brief uploads=N visionEntries=N` line and asking Alex for the upload-step log surfaced the exact failure mode in one round-trip.
- **The first diagnosis is often the wrong one.** "Bohdi zooms in on the slideshow" pointed at the Ken Burns animation. The animation was a small contributor; the dominant cause was `object-fit: cover` cropping uploaded photos to a 3:2 stage before any animation ran. Shipped the flip, Alex confirmed "did nothing different," went back to the renderer and found the real cause. The pattern: when a fix lands and the user sees no change, the diagnosis was wrong — don't double down on the same theory.
- **No hardcoding when a universal rule works.** The slideshow fix could have been "detect upload URLs, treat them differently." Instead the renderer treats every product photo the same way (contain over blurred backdrop) and the same code respects fal generations and maker uploads. Per-source branching is the kind of hidden coupling that bites later when the source list changes.

## Files + commits

- 18-task plan execution: `2f50ba5`, `92a3e36`, `f1c1c4a` (A2 test tightening), `7eb845a`, `1e0d9ca`, `25eebc2`, `c21a54a`, `4a34973`, `87d97cb`, `badc28e`, `868fc27`, `7a6a724`, `de07925`, `5837722`, `959ba2b`, `f08c87a`, `76d70eb`, `697013e`
- Spec + plan docs: `259aa03`, `18d1d4b`
- Server Action body-size limit: `d87dca0`
- D53 cleanup (product description + about story + contact intro caps): `392fb20`
- Diagnostic build log: `0082adc`
- Vision tool-use fix (the real bug): `97c925e`
- Slideshow Ken Burns pull-back: `eafad6f`
- Slideshow contain over blurred backdrop (the real slideshow fix): `10a640d`

## Next session

- Live-test more niches with photos uploaded. Confirm the Director's trajectory genuinely shifts on `makerWork` content — the test on Patriot Woodworking was good but a single tenant is not enough signal.
- **Photo upgrade as opt-in.** Maker ticks "recreate" on any upload tile they want polished; build runs fal image-to-image on those slots only; the rest publish as-uploaded. Parked end-of-session, kept as a near-term Phase 2 candidate worth pulling forward. Alex is sitting on the decision.
- Woodworker niche-file rewrite (the cutting-board fixation) via the niche-writer skill. Separate spec.
- CI coverage gate still red from Session 39 (Try-On's `write-version.ts` 0%, `convert.ts` ~29%).
- "Most-prominent-readable" brand-color refinement from Session 40 still open — instead of always anchoring on the dominant brand color, pick the most prominent that ALSO clears contrast against the skin's bg.
- Wordmark-logo doubling toggle from Session 40 still open — a "my logo includes my shop name" toggle that suppresses the side wordmark.
- Audit backlog still open: A2-A4, B1, Phase C/D in `Audit-Fix-Plan-2026-06-10.md`.

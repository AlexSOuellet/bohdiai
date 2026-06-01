# Moments Engine — Intro Brick Build Spec

**Date:** 2026-06-01
**Branch:** `session-12/layout-engine`
**Status:** Design approved with Alex. Ready to turn into an implementation plan.

Read alongside `Moments-Engine-Build-Detail.md` (the Session 19 handoff — the proven recipes and craft rules) and `Moments-Engine-Spec.md` (the original direction). This spec narrows that work to a single, buildable target.

---

## Goal

Build the complete path needed to run an onboarding where **Bohdi produces only the intro moment** — the cinematic front-door surface — and nothing else (no home page, shop, about, or cart this session). The point is to see whether Bohdi can:

- choose the right brick for the niche and mood,
- decide between video and a still and justify it,
- write a good asset-generation prompt,
- write the story copy, and
- assemble a finished moment that looks like a real maker's brand, not a template.

Asset generation runs **live through fal** during the run, so we also learn the real per-run cost.

---

## Scope

### In scope
- **Bohdi authoring the full design system** (the design-system foundation — the "DESIGN.md" equivalent). This is the first real piece of the eventual full build, so it's done properly now, not as throwaway styling for the moment. It carries forward into the next session's home/functional-page work.
- Two rendering pieces: a `story` moment and a `spotlight` moment (full-screen, animated, reduced-motion-safe), added to the layout tree and renderer.
- Three selectable bricks presented to Bohdi: **story-over-video**, **story-over-still** (both render through the `story` piece), and **spotlight**. Distinct recipes with distinct "use when" logic and prompt guidance; shared machinery where the composition is identical.
- A fal-backed media-generation tool Bohdi calls to produce the video (Kling 3.0) or the still, behind a thin provider seam so Higgsfield can replace fal later without touching the tool.
- A scoped Bohdi run that reads niche + mood, picks a brick, generates the asset, composes the one moment page, and finalizes.
- Tests, written test-first, for everything our code owns (schemas, both renderers, the tool with fal stubbed, the scoped run).

### Out of scope (this session)
- The home page and all functional pages (Bohdi does not build them this session).
- First-visit-then-replay behavior and the dissolve from the moment into the home page (the front-door wiring).
- The poster brick (still a taste problem; not ready).
- Live Higgsfield generation (no server-side key yet; Alex will obtain one). The provider seam is built so this is a later swap.
- Confirming Higgsfield resale terms (deferred with the provider).

---

## The bricks → two rendering pieces

Both are full-viewport client components (they run timed animations). Both are added to the layout tree's discriminated union and authored through `set_layout`, like the existing primitives. Motion is **slow and linear** — an eased opacity fade reads as a pop; linear reads as a real fade. Reduced motion keeps opacity fades and drops any movement, using the same `data-*` exemption pattern already in `app/globals.css`.

**The look comes from three things at once — baked craft, tenant identity, and mood. None of them is a tradeoff against the others.**

1. **Baked cinematic craft (same for every tenant).** The pieces own composition, motion, dramatic scale, and the scrim — the "this is an ad, not a webpage" feeling, from the proven probes. This never varies; it's what makes every moment feel directed.
2. **Tenant identity.** The pieces read the tenant's **display font and brand color** from the design system Bohdi authors, so the type and color are unmistakably that maker's brand.
3. **Mood.** The mood's `designDirection` (brightness, temperature, type character, scheme) already shapes the design system Bohdi authors *and* drives which brick he picks — and it also sets the moment's tone directly: how dark the scrim sits, whether it leans light or shadowed, the overall temperature. A "dark" mood moment and a "cozy" mood moment should feel different beyond just swapped colors.

All three always apply together.

### `story` piece (covers story-over-video and story-over-still)
Generalizes `app/moment-probe/CandleStoryDemo.tsx`.

- **media slot** — a single child node, either a video or an image, rendered `fill` (covers the viewport). This is the only difference between the two bricks.
- **story** — an ordered list of headline lines. Each fades in, holds, then **cross-fades (replace, not stack)** into the next.
- **brand frame** — eyebrow, brand name (the wordmark), and a CTA (label + href). Fades in last and stays.
- Proven timing to preserve: ~0.9s of media alone before the first line; each line holds ~3.4s; cross-fade ~1.8s linear. (Constants live in the renderer; not Bohdi-authored.)
- No terminal punctuation in headlines.

### `spotlight` piece
Generalizes `app/moment-probe/spotlight/page.tsx`.

- **media slot** — a single image node, `fill`, on a black background.
- The object **rises out of the black** (opacity 0→1 over ~6s — this is the signature), with a faint slow push-in underneath (scale ~1.0→1.1, secondary).
- **content** — one headline line plus the brand frame (eyebrow, brand, CTA), fading in after the object is lit (~4s+), placed in the negative space to one side with a darkening gradient for legibility.
- Reduced motion: keep the opacity rise, drop the push-in.

### The design system is a first-class deliverable
Bohdi authors the **complete** design system via `set_style_sheet` (the existing 6-role type scale, palette, semantic colors, spacing, fonts, textures) — and we treat that as a real deliverable in its own right, not as minimal styling for the moment. It is the first step of the actual full build; the home and functional pages in a later session compose against this same system. So requiring all six type roles is **not** overkill here — it's the foundation, authored once, reused. The moment reads the wordmark/display font and brand color from it. We reuse the existing schema and validator; we do **not** invent a moment-only style format.

---

## Asset generation (fal, with a provider seam)

### Provider seam
A small interface for moment media generation with two operations:
- `generateMomentVideo(prompt, { aspect, durationSec })` → a hosted video URL.
- `generateMomentStill(prompt, { aspect })` → a hosted image URL.

A fal implementation backs it now (extends/sits beside `lib/fal.ts`). Higgsfield becomes a second implementation later — selected by config, no change to the tool or to Bohdi.

### Models / params
- **Video:** Kling 3.0, 6 seconds, 720p, 16:9. (~$0.44/clip on Higgsfield's subscriber rate; fal's price to be measured on the first real run.)
- **Still:** a fal image model, aspect-configurable. Start from the existing FLUX Pro image path used for product images; revisit if quality lags the spotlight bar.
- Generated files are saved to storage (same pattern as existing image generation) and the stored URL is returned.

### Bohdi's tool
A new tool — Bohdi calls it with `{ kind: 'video' | 'still', prompt, aspect }`. It routes to the provider, waits, and returns `{ url }`. Bohdi places that URL into the moment's media slot when he calls `set_layout`. (The video content node already accepts a finished `assetUrl`; the image node accepts a finished URL the same way.)

### Prompt-craft rules Bohdi must follow (taught in his prompt)
Locked-off camera for backdrops (no pan/zoom); only the subject moves (flame flickers, steam rises); slow; seamless loop; no people, no text, no cuts; deliberate handmade/atmosphere specifics, kept soft/in-shadow to lower variance; **atmosphere, never the maker's specific inventory.**

---

## Bohdi's scoped run

A focused run path (a new entry point or a flag on the existing Bohdi run) that:

1. Reads the niche and the mood (mood now carries `designDirection`, wired in Session 18).
2. Authors the **full** design system (`set_style_sheet`) — the foundation for the whole eventual build, and the source of the brand frame's font and color. Done properly here, reused later.
3. **Chooses a brick deliberately** from the three, reasoning from niche + mood: does this niche have motion worth filming (→ story-over-video), is it a single hero object on the luxe/minimal end (→ spotlight), or is it a story where motion would feel gimmicky (→ story-over-still)? Logs the reasoning.
4. Writes the asset prompt per the craft rules and calls the generation tool.
5. Writes the story/headline copy (no terminal punctuation).
6. Composes the **one** moment page via `set_layout` and finalizes.

He is told, in this run, to build only the intro moment. The tools/prompt for this run do not ask him to compose other pages.

The finished moment renders at the test tenant's storefront root.

---

## Testing

**Test-first for everything our code owns.** Each piece gets an automated check written before the code, run continuously, kept permanently:
- Schema tests for the two new node types (valid trees pass, malformed ones fail with structured issues).
- Renderer tests for both pieces (media slot renders, story lines/brand frame present, motion attributes and reduced-motion data hooks present).
- Tool test with the fal provider **stubbed** — a stand-in returns a fake URL instantly, so we verify our plumbing (right prompt passed, URL lands in the right slot) without spending money or calling fal.
- Scoped-run test (Bohdi mocked at the model boundary as existing run tests do) — confirms the run reads niche/mood, sets a style sheet, generates an asset, sets one page, finalizes.

**Judged by eye (one real run).** No automated check can judge "is this a good clip" or "is this a good moment." So after the build we do a single live run: candles, one or two moods, real fal calls, real spend. Then Alex and Claude look at which brick he chose, video-vs-still and why, prompt quality, copy, and the finished look — and read the real per-run cost.

---

## Open items / risks
- **fal cost per clip** unknown until the first real run; Alex will measure it then.
- **Still image quality** on fal vs the Higgsfield Nano Banana stills — may need a better fal image model for the spotlight bar.
- **Existing layout-engine tenants** remain un-renderable (predate the `wordmark` role) — irrelevant here; the test uses a fresh tenant.
- **Brand-frame styling on the moment** — resolved: it's all **three at once**. The cinematic craft (composition, motion, scale, scrim) is baked and identical per tenant; the tenant's display font and brand color always apply on top for identity; and the mood sets the tone (scrim darkness, light-vs-shadowed lean, temperature). Fine-tuning the exact weight/size of the brand frame within that is a small refinement after the first real moment, not an open direction question.

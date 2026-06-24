# Session 53 — the modular hero system: all 8 heroes built + swappable

**Date:** 2026-06-24 · **Branch:** `session-12/layout-engine` · **Status:** heroes done; one tech-debt item flagged for first work next session.

## What we set out to do

Start building the modular hero system from the family work (Sessions 51–52). Turn Main Street's hard-coded section assembly into a swap mechanism and build the eight hero structures, each skin-agnostic (the same structure wears whatever family's colors/fonts the store has).

## What got built (all committed, deployed to prod, 1163 tests green, tsc clean)

**The shared content pile.** Added `moment.sub` — a plain hero sub-line every non-Story hero uses (Story keeps its fading `story` lines and ignores it). Optional in the content schema (legacy parses), required in the copywriter draft (the pile guarantee), authored by the copywriter prompt, flows through `pipeline.ts` unchanged.

**The swap (recipe + catalog).** `hero-catalog.tsx` — a `HERO_CATALOG` keyed by variant, `resolveHero(key)` returns the component, falls back to the default (`story`) for unknown/missing keys (functional floor). `MainStreet` gained `heroVariant?`; default renders Story unchanged. **Scope: only the HERO slot is catalog-driven** — the rest of the page (goods/founder/find-us/close/footer) is still the fixed assembly, because those sections have one design each and their layouts aren't designed yet.

**Reachable preview.** Threaded `heroVariant` through the render context (`builder.ts` → `main-street/builder.tsx` → `MainStreet`) and a `?hero=` query param (`app/storefront/page.tsx` → `StorefrontPage` → `renderArchetypeStore`). Non-persisting preview, same model as `?previewLook=`. `?hero=split` etc. re-render the live home with that hero.

**The eight heroes** (all skin-agnostic — text on the skin surface reads `--ms-*` + type roles; over-media text uses the `--ms-on-media` legibility tokens):
- **Story** — the existing MomentHero (default, unchanged).
- **Split** (+ `split-left` mirror) — text panel beside full-bleed media; Modern's default.
- **Stacked** — nav, centered text block, full-width media band; Rustic's default.
- **Typographic** — no media, the words carry it; Luxury's default.
- **Floating card** — card on the skin surface over full-bleed media; Dark's default.
- **Editorial cover** — giant masthead over media; redesigned mid-session (see below).
- **Carousel** — text column + a scroll-snap rail of products; needs the catalog rows, so `products` was added to the hero contract (`HeroProps`) and threaded from `MainStreet`.
- **Collage** — text column + a cluster of three dedicated stills.

**Collage generation path (the one hero needing more than the pile).** New `moment.collageShots` content field (`CollageShot` = ScenePrompt + url? + alt). The Cinematographer now also designs three still collage scenes (optional on its schema — the prompt asks for three, a miss degrades gracefully per D53, never fails the build); `pipeline.ts` assembles them into `moment`; `builder.tsx` `mediaJobs` emits a 1:1 still job per shot (feature group), `applyMedia` folds the urls back. CollageHero skips unresolved-url shots.

## Mid-session corrections (Alex caught these)

- **Editorial cover masthead was dead CSS.** The masthead font-size lived in a `<style>` rule, but the skin applies font-size INLINE via `typeRoleCss`, and inline beats a stylesheet rule — so the masthead never grew; it rendered at the normal hero size. Fixed by moving the size inline. Verified the inline size lands in the served HTML.
- **Editorial cover read "just like Story."** Both are brand-over-full-bleed-media, so they converged (the exact trap Sessions 50–51 warned about). First redesign (masthead banner + rule + bottom-left coverlines) wasn't enough. The real fix (taking the brand OFF the photo onto a printed-masthead-on-paper layout) was started, then **aborted — Alex had been viewing the wrong URL.** The deployed magazine-banner version stands; whether it's distinct enough is unresolved (revisit when families bring real type/color divergence).

## The flagged tech debt — FIRST WORK NEXT SESSION

**Inline styles.** All eight heroes (following the existing archetype convention in MomentHero/chrome/beats) style type via inline `typeRoleCss` objects. Alex: "you taught me that inline styles are BAD coding practice." He's right — and the masthead bug is a direct symptom (inline can't do media queries → `clamp()` hacks; wins specificity by brute force → override wars; magic-number overrides). The codebase already does the proper thing for colors and font families (skin emits `--ms-bg`, `--ms-disp` as CSS variables; components use `var(...)`); it just stops short of type sizes/weights.

**The fix (do it right, across the whole archetype, not just the new heroes):** extend `skinVarsCss` to emit type roles as CSS variables (sizes/weights/spacing), convert components to CSS classes that reference them, drop the inline type objects. This pays off directly for wiring the six families' type packages. Saved as memory `feedback_inline_styles_are_bad`.

## Lessons

- **Don't propagate a bad pattern because the existing code uses it.** Following MomentHero's inline-style convention spread it across eight new files. "The existing code does it" isn't a justification — hold new code to the standard, fix the convention.
- **Editorial cover ≠ Story needs a different organizing idea, not rearranged text.** Two heroes that are both "brand over full-bleed photo" converge no matter how you move the text. Real divergence = the brand on a different surface / a different idea of what the thing IS. (Reinforces the Session 50–51 convergence lesson.)
- **Verify the user is looking at the right thing before chasing a fix** — two rounds of "same" were partly a wrong-URL artifact.

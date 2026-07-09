# Session 66 — Fix Plan

**Status:** Draft, awaiting Alex's review.
**Written:** 2026-07-07, Session 66.
**Purpose:** Close the gaps surfaced in Alex's six-family walkthrough of the Session-65 onboarding builds. This is the work that lands before we enter Phase 2 of the Full Plan. Nothing here restructures Phase 1; every item polishes what shipped so the "onboarding produces a complete, family-styled storefront" promise reads convincingly.

**Sits under:** `Full-Plan.md`. Everything here is either a fix to a Phase 1 item or a Phase 1.5 / Phase 1.8 rollup pulled forward. Once done, this doc gets archived; Full-Plan Phase 2 begins.

---

## Source of the list

Alex walked all seven Session-65 fresh onboardings in browser (Classic Loafs + Estate Sales of New England for Cozy, Walnut and Oak for Rustic, Heavenly Scents for Modern, Twilight to Darkness for Dark, Knotty Knits for Luxury, Sheri's Dips for Cheerful). The walkthrough surfaced ~18 specific bugs plus three design-direction calls. This plan groups them by shape-of-fix rather than by family, so a single sweep clears multiple families at once.

Raw issue list is preserved at `scratchpad/session-66-issues.md` (working notes; may be deleted once the plan lands).

## Non-negotiables carried forward from Full Plan

- Bohdi authors CONTENT ONLY. No structural / nav / treatment authoring.
- Mood is public. Family is internal.
- No hardcoded English in the renderer. No inline styles. No shortcuts.
- Tests are part of done.
- Ship complete, not partial.
- Visible-output changes are gated by Alex's eyes.

## D57 principle applied to layout

Session-43 D57 said the schema validates SHAPE only — no length caps, the build never fails on copy, the renderer absorbs whatever the crew writes. That principle held for schema. It never got applied to layout. Multiple bugs in this walkthrough are layout containers sized for expected content that then truncate or overlap when the crew writes something a few characters longer. Waves B in this plan applies D57 to layout: containers absorb any length, wrap or reflow, never truncate authored content, never overlap adjacent sections. Same rule, next layer up.

---

## Wave A — Fast mechanical fixes

Small, unrelated, one commit each. Ship confidence and clear noise from the list.

- [x] **A1.** Cozy hero primary + secondary CTA buttons — **redirected: dropped the CTAs entirely and rendered `moment.sub` as a caption line under the h1.** Along the way found + fixed the actual root-cause "filter" on hero text (z-index: the brand frame was UNDER the scrim). All four hero text classes softened via `color-mix`. Copywriter now writes `sub` as a short catchy tagline. (Session 66)
- [x] **A2.** Rename "Reviews" → "Testimonials" throughout — `DEFAULT_STRINGS`, count formatter, nav labels, copywriter prompt. Internal-only names (component names, section keys, CSS classes) kept as `reviews` — no user-visible payoff to rename. (Session 66)
- [x] **A3.** Move Testimonials out of the top nav and into the footer — `MAIN_STREET_NAV` drops it, `MainStreetFooter` gains it between Intro and Privacy. (Session 66)
- [x] **A4.** Modern marquee → shop-section-CTA overlap — **plus** SplitHero nav-inside-half-width fix: the real Modern-navbar issue was that `SplitHero` rendered `<Nav>` inside `.ms-splithero-text` (50% of viewport). Lifted nav out to span full width; text panel got top padding to clear. (Session 66)
- [x] **A5.** Rustic collections page — collection labels ("Kitchen and Table", "Ready to Ship") were unreadable against dark wood photography (label bar was 70% black scrim with dark-brown text pulling from `--ms-contrast-fg` — dark on dark). Flipped to a solid `--ms-contrast-bg` plate with dark stencil text and a soft drop shadow; reads as a stenciled plaque nailed to the crate on any skin. (Session 67)

**Wave A DoD:** Five items shipped, tests updated, Alex has looked at each on a fresh build and confirmed the specific bug is gone.

---

## Wave B — Layout containers absorb any content

Same shape of problem, hitting six layout surfaces. Root cause pattern: containers sized on assumed content lengths. Fix pattern: wrap or reflow to absorb whatever the crew writes; never truncate authored content; never let a section land on top of an adjacent section.

- [x] **B1.** About founder attribution — "— Name, Role of ShopName" was clamped to 32ch by the shared `[data-type="sig"]` rule (nowrap + ellipsis chain). Dropped the nowrap/ellipsis; kept `max-width: 32ch` as a soft typographic cap so lines wrap instead of truncate. Applies across every founder treatment plus CollectionsCupboard's `sig`-role cue. (Session 67)
- [ ] **B2.** Shop-section teaser CTA button label — truncates (Cozy "See everything in t…", Rustic "Browse the full ca…", Modern "See the full catalo…" etc). Button absorbs any label, wraps to two lines if needed on narrow, never ellipsis-truncates.
- [x] **B3.** Testimonials pull-quote treatment (Dark + Luxury) — the stage was `position:relative; min-height:300px` with figures `position:absolute; inset:0`. Any authored quote long enough to wrap past ~5 lines overflowed the stage and the who/where spilled onto the dots + "Read all Reviews" viewall that sat below in DOM. Fix flipped the stage to `display:grid; grid-template-areas:"stack"` and figures to `grid-area:stack` — all figures share one cell that sizes to the tallest, cross-fade still works via opacity. Sheri's (Cheerful/texts) and Knotty Knits (Luxury/pull-quote after fix) both eyeballed clean. Rating + Guestbook needed no change. (Session 68)
- [x] **B4.** Modern + Luxury navbar split-center — the middle wordmark column was `auto` in a `1fr auto 1fr` grid, so a wide wordmark ("Heavenly Scents") consumed the middle and squeezed 1fr side columns until nav labels ellipsis-truncated to a letter + dots. Middle column moved to `fit-content(50%)` so it can't exceed half the nav width, and the wordmark inside the split-center gets `white-space:normal` + `overflow:visible` so a long name wraps to two lines instead of truncating. Link groups keep at least ~25% each. Alex confirmed on Heavenly Scents. (Session 68)
- [x] **B5.** Cheerful mobile Collage hero — the mobile grid inherited desktop `align-items:center` and lacked explicit row anchoring, which let the text and cluster rows pull toward one another instead of stacking cleanly; on short viewports the h1/CTA visually collided with the 3 collage shots. Fix pins mobile grid to `grid-template-rows:auto auto`, `align-items:start`, `align-content:start`, a real gap between rows, and top padding that clears the position:absolute navbar. Alex confirmed. (Session 68)
- [x] **B6.** Cozy mobile Constellation — the "designed drift" negative `margin-top` values (`-7%`, `-9%`, etc.) meant left-wide and right-narrow cards' image bounds landed in the same horizontal middle band and collided visually on a phone, sometimes bleeding into adjacent sections. Kept the width and left/right alternation for the composed feel; replaced negative overlaps with `gap:clamp(20px,4vw,32px)` between cards. Alex confirmed. (Session 68)
- [x] **B7.** Cheerful navbar over Collage hero — shot 2's `top:0; right:2%` puts a colorful product photo directly under the right-side nav labels, and the navbar had no background so dark nav labels landed on the image. Added a vertical fade backdrop `linear-gradient(to bottom, var(--ms-bg) 0%, color-mix 55%, transparent)` scoped to `.ms-collage-hero .ms-hero-navbar` — nav zone keeps a legible surface color, imagery still shows below. Alex confirmed on Sheri's Dips. (Session 68 — added mid-Wave B)

**Wave B DoD:** All six surfaces audited and reflowed. Alex re-runs a build in each affected family and confirms no truncation, no overlap. Automated tests added where practical to guard the container-absorbs behavior against regression.

---

## Wave C — Family textures + section-surface variation

Two related design gaps that combined make Luxury and Modern read as boring compared to Cheerful. Cheerful varies section-to-section because its treatments opt into the contrast surface (dark purple against cream) and use different fonts/register per section. Luxury and Modern were designed uniformly clean — every section paints on the base color. Fix is two-part.

### C1 — Textures / wallpapers actually render

Currently the Family object declares `texture` and `wallpaper` as string labels. Nothing consumes them. Assets from `tmp/mockups/img/wp-*.png` never got uploaded or wired.

- [x] **C1.1.** Copy the six default wallpaper PNGs into `/public/textures/` (platform assets, not tenant content — Supabase Storage is wrong for these; static assets ship with the deploy, CDN-cache via Vercel, no RLS or ingest endpoint needed). Six shipped: `wp-linen.png` (Cozy), `wp-burlap.png` (Rustic — originally barnwood but a wood-plank photo reads as "literal boards" at any visible opacity), `wp-smoke.png` (Dark), `wp-marble.png` (Luxury), `wp-confetti.png` (Cheerful), `wp-concrete.png` (Modern). (Session 68)
- [x] **C1.2.** Added `wallpaperUrl` + `textureOpacity` to the Family type in `families.ts`; populated on all six family entries. Renderer emits `--ms-texture-url` and `--ms-texture-opacity` inline at MainStreetRoot when a family is passed. (Session 68)
- [x] **C1.3.** Added `.ms-family-texture` — a `position:fixed` layer at z-index:0 painting the wallpaper across the whole viewport behind sections. No blend mode (multiply killed the light textures against light backgrounds). Opacities tuned per family: Linen 0.18, Burlap 0.22, Smoke 0.22, Marble 0.15, Confetti 0.30, Concrete 0.22. Threaded `family` through `MainStreet` → `MainStreetProduct` → `MainStreetSubPage` and all page components + `builder.tsx` render entries. (Session 68)
- [x] **C1.4.** Doc update — `Family-Style-Sheets.md` grew a "Wallpapers as shipped" section (current URLs + opacities) and a proposed three-textures-per-family bench for Editor Door 2. Decision locked with Alex: Editor Door 2 texture picker shows BOTH the family bench (platform-curated, 3 per family) AND the niche shelf (niche-writer authored, 3-5 per niche) — so a Rustic candle maker sees different combined options than a Rustic leatherworker, both anchored by the same family default. Specific bench picks proposed but not finalized; ships with Editor Door 2. (Session 68)

### C2 — Section-surface variation on Luxury and Modern

Cheerful, Cozy, Rustic, Dark all have at least one section variant that paints on the contrast surface — that's what gives each family visual rhythm down the page. Luxury and Modern don't; every treatment defaults to the base color.

- [x] **C2.1.** Luxury — flipped Chapters collections + Pull-Quote reviews to contrast via family-scoped rules (`data-ms-family="luxury"` on the root, section rules redefine `--ms-bg / --ms-fg / --ms-fg-muted`). Editorial founder was already contrast via the shared `.ms-founder-band` rule inherited by every family. Result: Luxury hits three contrast surfaces (collections lead → contrast, goods → base, reviews + founder → contrast, findUs + marquee + close → base). Alex confirmed the rhythm reads better than Modern's first pass. (Session 68)
- [x] **C2.2.** Modern — initial plan proposed flipping Cascade + Rating, but Modern's stack (hero → goods → marquee → collections → founder → reviews → findUs) puts founder between collections and reviews, so flipping either created a c-c-c clump adjacent to the auto-contrast founder. Alex caught it. Revised: flip Module goods only (position #2, right after hero). Founder stays auto-contrast at position #5. Result: b-c-b-b-c-b-b-b — clean alternation with no adjacency. (Session 68)
- [x] **C2.3.** Alex confirmed on Heavenly Scents (Modern) after the goods-instead-of-collections/reviews swap. Rhythm reads distinct without the "last four sections all dark" clump. (Session 68)
- [ ] **KNOWN OPEN — contrast pair reads samey across families.** Most skins don't declare a `p.contrast` pair, so the contrast surface defaults to a full bg/fg inversion — a Cozy Cream/Ember flips to Ember/Cream (basically dark charcoal), a Modern Paper/Ink flips to Ink/Paper (near-pure-black), and both read as "white and charcoal" regardless of accent. Family-appropriate contrast pairs (Rustic → walnut on cream, Cozy → deep ember on linen, Modern → warm gray on paper, etc.) is a skin-level design change and lands as follow-up.

**Wave C DoD:** Every family renders its declared texture. Luxury and Modern have visible section-to-section surface variation. Doc updated with the three-textures-per-family bench.

---

## Wave D — Product imagery grade (§1.8 pulled forward)

Dark's uniformly-dark product imagery isn't a Dark-specific bug; it's evidence that §1.8 imagery grade never shipped and the Graphic Artist is baking mood into the fal generation prompts. Every family is over-grading — Cozy is warm-amber-ing every product photo, Rustic is burlap-blending everything, etc. — we just noticed it worst on Dark because dark shadow is the most transformative grade.

Per D30: mood is the visual world (shop chrome, hero, backdrops, type). It is NOT niche material vocabulary (what the products are or how they're photographed). The renderer paints the shop-world grade OVER honest product photography via a CSS filter layer.

- [ ] **D1.** Update Graphic Artist system prompt + image directives — product imagery is honest, well-lit, real color, what the maker actually sells. Mood-styling is removed from product image prompts. Hero, About-portrait, and backdrops still carry the family's imagery direction; product photos do not.
- [ ] **D2.** Ship the family filter grade per `Family-Layout-Model.md` — per-image normalize (exposure + white balance), then apply the family CSS grade (blend-mode + tint + subtle saturation shift) over product imagery at render time. Uploads normalize on the way in; library shots pre-normalized.
- [ ] **D3.** Regenerate one build in each family. Alex confirms: product imagery reads honest and varied in every family, while the shop still feels wholly Dark / Cozy / Luxury / etc.

**Wave D DoD:** Products render as honest photography with a family grade applied at the render layer. No shop reads homogenized. §1.8 comes off the deferred list in Full Plan §1.

---

## Wave E — Sub-page compositions per family

The biggest surface-area item. Currently every home-section "See more" links to a sub-page that duplicates the home teaser. Alex saw this on all six families for Shop, Collections, About, Events, Testimonials. Sub-pages need their own compositions — same family feel, different composition, more content, deeper expression of the beat.

- [ ] **E1.** Design pass — mock up one sub-page composition per (family × page) combination. Six families × five sub-pages = 30 compositions. Sub-page always echoes the family's paint, type, texture, and section chrome; it never re-uses the home-teaser's layout verbatim.
- [ ] **E2.** Build pass — implement each sub-page composition class-only, skin-agnostic (mirroring the goods/collections/reviews pattern). Each sub-page is its own component under `lib/archetypes/main-street/pages/*` with a family switch on the top-level render.
- [ ] **E3.** Content wiring — sub-pages read from the same authored envelope as the home; no new copywriter fields. If a page needs more content than the home teaser sampled (e.g., a full about page needs the maker's fuller story), the crew already authors it — sub-pages just render more of what's already there.
- [ ] **E4.** Alex confirms per-family on live builds — every "See more" click lands on a page that reads as a distinct, well-composed extension of the home teaser, never a clone.

**Wave E DoD:** All 30 sub-page compositions shipped, tested, verified in browser per family. The "See more" click never lands on a duplicate.

---

## Wave F — Session-65 carry-forward audit rollups (§1.5 items)

Two items deferred at end of Session 65, not user-visible but genuinely owed before Phase 2 raises the load on the crew.

- [ ] **F1.** Publish full Anthropic tool schemas as `input_schema` on all four crew stages (Director, Copywriter, Cinematographer, Graphic Artist). Session-65 §1.5 HIGH.
- [ ] **F2.** Wire `AbortController` through `withTimeout` so timed-out Anthropic + fal calls actually cancel rather than orphan. Session-65 §1.5 Audit #12.

**Wave F DoD:** Both audit items marked landed in Full-Plan Phase 1 §1.5. Full test suite green, tsc clean, lint clean.

---

## Proposed order

Waves A and F are small and independent — F can slot in anywhere without blocking. Waves B, C, D each touch layout / CSS / renderer with no cross-dependencies, so they can run in sequence or overlap depending on how Alex wants to gate reviews. Wave E is the biggest and rides on top of the smaller waves (any sub-page work needs the container-absorbs fix from B and the texture layer from C already in).

Suggested sequence: A → B → C + D in parallel → E → F on top. Or if Alex prefers small-and-linear: A → B → C → D → E → F, one wave at a time. Either works.

## Definition of Done for Session 66

- Every item in Waves A–F checked.
- Alex runs a fresh onboarding in each of the six moods and confirms: no truncation, no overlap, no unreadable text, no duplicate sub-pages, honest product imagery, family visual rhythm on Luxury and Modern.
- Full Plan §1.5 marks the two carry-forward items done.
- Full Plan §1.8 marks imagery grade done and comes off the deferred list.
- Test suite green, tsc clean, lint clean.
- Phase 2 begins.

---

## Explicitly NOT in scope

- Anything from Phase 2 of Full Plan (that's the next document to enter).
- Anything from Phase 3+ (editor doors, payments, custom domains).
- Any Session-65 audit item not called out in Wave F.
- Refactor for its own sake — this plan touches only what the walkthrough surfaced.

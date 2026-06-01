# Session Brief — BohdiAI

**Last updated:** 2026-06-01 (Session 18 — did the renderer pass the Session-17 brief demanded. The ENTIRE storefront renderer now consumes the design system (type scale + M3 semantic surfaces) instead of hardcoded Tailwind, so the change is no longer the ~30% that shipped in Session 17 — it's the whole visible surface. Bands and panes now paint a semantic `surface` that carries a guaranteed-readable paired foreground, so text reads on light AND dark bands by construction — the real fix for the nav-blue / unreadable-on-dark problem, applied page-wide. Added a 6th required type role `wordmark` (its own size/weight/font + an optional gradient text-fill), added `surface` to intent, removed the now-dead `scriptFonts` plumbing, and deleted a FALSE claim in Bohdi's prompt that the renderer auto-substitutes a passing contrast color — it never did, and that false comfort is part of why broken contrast shipped. Also fixed a latent unreadable-text bug: text-only collection cards referenced a `--node-palette-fg` variable nothing ever emitted. 765 unit tests pass, typecheck clean, coverage gate passes; the renderer was verified visually on a throwaway `/design-fixture` route (readable on light and dark) then deleted. **THE HONEST FRAME, corrected by Alex in-session: this whole Bohdi-as-Stitch effort is a REDESIGN to make Bohdi produce designed-not-slop, non-templated stores — it is NOT a readability fix. Readability just falls out for free. This session built the renderer plumbing so a real design system can express itself; it does NOT make Bohdi a designer. The actual goal still lives in Bohdi's authoring and composition, untouched.** Gating items before a paid onboarding is worth running: `mood.designDirection` is STILL not passed to Bohdi (read_mood returns only key/label/description/styleSheet — agreed next step, near-one-line fix); Bohdi has never authored a surface (if he skips them, every band falls back to the flat base tone); composition (9 stacked bands) and copy reflex are untouched by design (separate eyes-loop/validator phase); legacy per-route pages (/listings, /collections, /subscriptions, /cart) still render on the old `font-s-*` system, so half the customer journey is a different visual world; and existing tenants (candle-bonanza) are now un-renderable because their stored sheet predates the required `wordmark` role and fails validation — regenerate, do NOT re-render old data. Decision held with Alex: do not run a full onboarding until onboarding is complete. Late in the session the direction advanced past "teach Bohdi to compose better": studying the bohdiai.com sample builds (especially Posy Lane Books) made clear the engine can only build tidy rectangular documents, while the bar wants art-directed "moments" (full-screen, poster, motion, tilt) — generated per niche+mood, never templated. The plan: a **Moments engine** — a generated brand-introduction "moment" at the front door, with the existing functional pages as the tidy documents behind it; first-visit-and-replay behavior; mood selects the pattern. Spec written and committed: `Moments-Engine-Spec.md`. Not yet built. See the Session 18 block below. Prior: Session 17 — built the design-system engine foundation but only wired it to ONE renderer component (Text.tsx). Burned a real candles onboarding (candle-bonanza, sunset mood, ~$2 in API + image gen) on a "test" Claude greenlit that could not show meaningful visible change because ~70% of the rendered page never touches the new system. The storefront looks like Brian's because most of it IS like Brian's. Bohdi DOES author a valid full design system on first try — typeScale with 5 legible roles, M3 seed color, paired semantic colors derived, real font pairing (Fraunces + Outfit), good palette — and the CSS variables ARE emitted into `:root {}`. But: Wordmark, NavLinks, Cart, Button, ProductGrid, FeaturedProduct, CollectionGrid, FeaturedCollection, SubscriptionGrid, FeaturedSubscription, ContactForm, EventsList, every primitive, and every renderer component except Text.tsx still use hardcoded Tailwind classes (`text-sm md:text-base`, `text-2xl md:text-3xl`, etc.) and do NOT consume the type scale CSS vars. Bound nodes also do not consume `--node-palette` for color — nav `<a>` tags in the rendered HTML have no color style, so on a dark band they render as default browser link blue (this is the visible "nav broken"). Semantic colors are emitted but unread by the renderer. `mood.designDirection` was added to the type but Bohdi's prompt doesn't surface it — he picks seeds from prose alone. Composition reflex (9 stacked bands on home, same as Cathy/Brian) is unchanged and was never in scope. Copy reflex (same platitude shapes as Brian's run, some near-identical) is unchanged. 743 unit tests pass and typecheck is clean — meaningless against the actual problem because the contract Text.tsx now satisfies is not the contract the rest of the renderer uses. The honest summary: the foundation exists in code and is committed, but from a maker looking at their storefront, almost nothing visibly changed. See Session 17 block below for the full diagnosis and the renderer pass that must happen first next session. Prior: Session 16 — recovered lost context, ran two full audits (functional engine + independent codebase), and worked out page-architecture/navigation/legal policy. Fixed two seams (nav, fonts), then the conversation turned to the real problem: making Bohdi *appear to be a designer* — Claude Design / Stitch quality, never templated. Landed a committed direction, **build our own Stitch**: Bohdi generates a full design system per tenant, a validator enforces competence on the *system* (not per page), pages compose against its roles. Full build spec for the next session: `Design-System-Engine-Spec.md`. Other new docs: `Engine-Audit-2026-05-31.md`, `Codebase-Audit-2026-05-31.md`, `Page-Architecture-Policy-2026-05-31.md`. See the Session 16 block below. Prior: Session 15 — fixed storefront load time (Brian-test issue #1): layout validation used a slow Zod plain-union; switched to a discriminated union, ~8s → ~5ms per page. Then drifted into an over-broad lint/format cleanup that reformatted ~165 files (cosmetic, no logic change) and ate the session. The other Brian-test issues were NOT addressed. See the Session 15 block. Earlier note — Session 14: a long design conversation, NO code changes. Reframed the top goal: get the build right so storefronts have *feeling* (a maker would hit refresh on it), not just "designer-grade." Diagnosed why Bohdi makes slop (he one-shots, never sees his rendered work, never revises; the sample sites got their feeling from iterative work he skips). Landed a NOW build (materials + work loop + code floor) and key guardrails. Full writeup in `project-docs/Bohdi-Build-Quality-Design.md` — READ IT. Also fixed a misconfigured MCP connector and surfaced an outstanding GitHub-token rotation. See Session 14 block below.)

---

## Session 18 (2026-06-01) — renderer pass: the whole storefront renderer now consumes the design system; surfaces give contrast by construction

**Frame this correctly before you build on it.** This was a REDESIGN-enabling plumbing pass, not a readability fix. The Bohdi-as-Stitch work exists to make Bohdi produce stores that look *designed, not slop* and not templated. Readability/contrast is one amateur tell among several (the others being monotonic composition and platitude copy) — it falls out of the system for free, it is not the point. This session made the renderer able to express a real design system. It does **not** make Bohdi a better designer. Whether a real store looks designed still rides entirely on Bohdi's authoring and on composition, neither of which this session touched.

### What got built

**Schema foundation.**
- `lib/design-system/types.ts` — added `wordmark` as a 6th entry in `TYPE_SCALE_ROLES` (so `TypeScaleSchema`, `validateDesignSystem`, and `compileDesignSystemVars` all pick it up automatically). Added `SURFACE_ROLES` (surface · surface-variant · primary · primary-container · secondary · secondary-container · inverse-surface) and `SURFACE_ON_COLOR` (maps each surface to its paired `on-*` foreground CSS-var name; note inverse-surface → inverse-on-surface).
- `lib/layout/intent.ts` — added `surface` (enum of `SURFACE_ROLES`) to `IntentSchema`.
- `lib/layout/content.ts` — added optional `gradient` ({ from, to: named palette colors; angle? }) to `WordmarkNodeSchema`.

**Renderer.**
- `components/storefront/layout/intent.ts` — new `typeRoleStyle(role)` (reads `--type-{role}-font/-size/-weight/-line-height/-letter-spacing/-transform`) and `surfaceStyleVars(surface)` (returns `{ background: var(--color-{surface}), color: var(--color-{on}) }`). These are the two helpers every component now uses.
- `Page.tsx` — `<main>` sets the base `--color-surface` / `--color-on-surface` so the document has a readable baseline.
- `Band` + `Pane` — paint a surface via `surfaceStyleVars(intent.surface)` instead of using `intent.palette` as a background. **Palette is now accent-only on containers** — a raw palette color has no paired foreground, so it can't be a background. (Pane keeps a `fill`+palette fallback only when no surface is set.)
- Every content component rewritten to read type roles + semantic tokens, structural Tailwind (flex/grid/gap/widths) kept: Text, Wordmark, NavLinks, Button, Cart, ProductGrid, FeaturedProduct, CollectionGrid, FeaturedCollection, SubscriptionGrid, FeaturedSubscription, ContactForm, EventsList, Quote, SocialLinks, Divider, Image. Raw `bg-black`/`text-white`/`bg-black/10`/`border-black/*` and all `text-{size}`/`font-{weight}`/`tracking-`/`leading-` removed. Image/skeleton placeholders use `--color-surface-variant`; primary buttons + add-to-cart + form submit use `--color-primary`/`--color-on-primary`; borders use `--color-outline`; contact inputs paint their own `surface`/`on-surface` so they're legible on any band.
- **Nav-blue fix:** `NavLinks` `<a>` color defaults to `inherit` (picks up the surface's paired foreground) instead of browser blue; `intent.palette` tints it when set.
- **Wordmark:** sized by the `wordmark` type role; `intent.palette` = solid color; `gradient` = clipped linear-gradient text fill from two named palette colors.
- **Latent bug fixed:** text-only `CollectionGrid`/`FeaturedCollection` cards referenced `var(--node-palette-fg)` (never emitted by anything) → unreadable text. Now use a real paired surface (default `surface-variant`).

**Bohdi taught.**
- `lib/bohdi/layout-tools.ts` — `set_style_sheet` description + `input_schema` typeScale now driven by `TYPE_SCALE_ROLES` (includes wordmark, all 6 required); `set_layout` docs teach `intent.surface` (how to set a section background that guarantees readable text) and the wordmark gradient.
- `lib/bohdi/system-prompt.ts` (`LAYOUT_ENGINE_PROMPT`) — six type roles incl. wordmark; the surface model (backgrounds come from surfaces, palette is accent-only); and **the false "renderer auto-substitutes a passing contrast color" claim was removed** and replaced with the truth: there is no automatic contrast rescue, surfaces are the mechanism.

**Dead code removed.** `scriptFonts` plumbing pulled from `StorefrontPage` → `LayoutPage` → `RenderContext` → `deriveCtx` (nothing read it after Session 17's Text.tsx rewrite).

**Tests.** Added `surface.render.test.tsx` (8), `Wordmark.render.test.tsx` (6), `NavLinks.render.test.tsx`, `Button.render.test.tsx`, plus wordmark assertions in `compile.test.ts`. Updated every typeScale fixture (style-sheet, style-sheet-loader, design-system schema/validate/compile, bohdi run/tools/layout-tools) to include the wordmark role. **765 tests pass, typecheck clean, coverage 99.28% stmts / 96.53% branches / 100% funcs / 99.52% lines.** Renderer also verified visually on a throwaway `/design-fixture` route (hand-authored valid design system; readable on light + dark bands) which was deleted after.

### NOT done — the real work, and what gates a paid onboarding

- **`mood.designDirection` still isn't passed to Bohdi.** `read_mood` returns `{ key, label, description, styleSheet }` only; the structured rails (temperature/brightness/typeCharacter/textureAffinity/defaultScheme) live on the mood object but aren't in the return. The prior "wire it if a canary shows he needs it" reason is circular. **This is the agreed next step** (Alex said "we will continue") — a near-one-line change to the `read_mood` handler.
- **Bohdi has never authored a surface.** The first onboarding is the first attempt. If he doesn't put surfaces on his bands, every band falls back to the one base surface — readable but flat/monotone — and the contrast drama never shows. Unknown behavior.
- **Composition (9 stacked bands) and copy reflex are untouched** — by design. They're the separate eyes-loop / composition-validator phase, to be decided with evidence after the floor. Not renderer problems.
- **Legacy per-route pages** (`/listings/[slug]`, `/collections`, `/collections/[slug]`, `/subscriptions`, `/cart`) still render on the old `font-s-*` token system — a layout-engine tenant's product/cart pages are a different visual world. Separate migration under the page-architecture policy.
- **Existing layout-engine tenants are now un-renderable.** `wordmark` is a required role; candle-bonanza's stored style sheet predates it, so `StyleSheetSchema.safeParse` fails at render → no design-system vars → unstyled page. Old tenants must be regenerated. candle-bonanza is still in the DB (disposable) — do NOT bother re-rendering it; a reload tells us nothing (old data, doesn't run Bohdi).
- **Do not run a full onboarding until onboarding is actually complete** (held with Alex). A paid run now would mostly re-confirm known slop plus a coin-flip on whether surfaces even get used.

**Branch:** `session-12/layout-engine`. Three commits this session on top of Session 17's two: `f9aa00a` (renderer consumes the design system), `c07b973` (mood designDirection → read_mood + Moments Engine spec), and the brief update. `mood.designDirection` wiring is DONE. **Next action: the Moments engine** — start with build-sequence step 1 in `Moments-Engine-Spec.md` (hand-build moments across several niche+mood points to derive the exact list of missing expressive "bricks" from range, not from any one example). Do NOT build toward Posy specifically — Posy and the candle-video moment are two examples of the range, not targets.

---

## Session 17 (2026-05-31) — partial design-system engine: foundation built but only Text.tsx consumes it; canary onboarding burned on a test that could not show visible change

**Read this section before doing anything else.** The session looks productive on a `git log`. The actual visible-to-the-maker change is small. Be honest about that when you start tomorrow.

**Why this session existed:** Session 16 landed the "build our own Stitch" direction and the full spec at `project-docs/Design-System-Engine-Spec.md`. Alex said "build it." This session is that build.

**The shift Bohdi sees:** he no longer "picks colors and fonts and calls it a style sheet." `set_style_sheet` now requires a complete design system — primary seed color + scheme, full typeScale (5 named roles with desktop+mobile px sizes), spacing — on top of the existing palette/fonts/textures. A validator enforces the competence floor (font names must exist, sizes ≥ 14px) and returns structured issues so he corrects on his next turn.

**The shift the maker sees:** mostly nothing. Why is below in "what's actually broken in production."

---

### What's actually broken in production (candle-bonanza tenant, the canary that ran today)

Tenant: `candle-bonanza`, `c992230e-75c4-4b89-9b37-8461230cecf9`, sunset mood. Generated AFTER all this session's changes were live in dev. Alex's read after looking at the rendered page: "navigation is still broken, fonts are bad, page looks like it is overrunning sides, same as Brian's, even some of the same copy."

The DB data Bohdi produced is well-formed: typeScale with all 5 roles defined, every size ≥ 14px, mobile sizes ≤ desktop, real font pairing (Fraunces + Outfit), 10 named palette colors, seed `#E8744C`, M3 light scheme, two custom SVG textures. Nav placement is correct in the data: Shop / About / Contact all have `is_in_nav=true` with positions 10/20/30; home excluded. The compiled CSS hits `<style>:root { … }</style>` in the rendered HTML and contains every variable the system should emit (verified via `curl -H "Host: candle-bonanza.localhost" http://localhost:3000/`). So the engine ran. The data is sound. The styles are emitted. None of that is the problem.

What's wrong is downstream, in the renderer. **Only `components/storefront/layout/content/Text.tsx` was updated to read the new system.** Every other content node and every primitive still uses hardcoded Tailwind:

- `Wordmark` (the storefront name "Candle Bonanza" at top-left) — `text-2xl font-semibold tracking-tight md:text-3xl`. Not the headline role from Bohdi's type scale. Same exact size for every tenant.
- `NavLinks` (Shop / About / Contact) — `<a class="text-sm md:text-base font-medium hover:opacity-80 …">`. Same sizes for every tenant. Crucially, the `<nav>` wrapper has `style="--node-palette:var(--palette-cream-light)"` but the `<a>` children have no `color` set, so on a dark Cinder band the links fall back to default browser link color (blue) — this is the visible "nav broken."
- `Cart` icon — fixed Tailwind sizing, no type-scale awareness.
- `Button` — `text-base font-medium` plus variant classes. Not the type scale.
- All bound content (`ProductGrid`, `FeaturedProduct`, `CollectionGrid`, `FeaturedCollection`, `SubscriptionGrid`, `FeaturedSubscription`, `ContactForm`, `EventsList`) — own Tailwind sizing for everything inside them. None of it consumes `--type-*` or `--color-*` vars.
- Primitives (Band, Stack, Row, Split, Grid, Overlap, Bleed, Pane, Marquee, Gutter) — Tailwind utilities for layout/spacing. The non-color side is mostly fine. But anywhere a primitive emits color or text styling (e.g. Band's background uses `--node-palette`, but bound nodes inside it can't be re-themed off the same var), the bound nodes ignore it.

The net: in the rendered candle-bonanza home page, the type scale and semantic-color system control roughly the authored `text` nodes only — eyebrow / headline / sub / body / caption strings Bohdi wrote into the layout tree. That's a fraction of the visible page. Everything around them (the entire nav band, every product card on the shop page, every button label, every grid layout's labels, the cart, the wordmark) is on the OLD system and looks the same across tenants. The site appears templated because most of its visible chrome literally is.

The "page overrunning sides" Alex noted is likely two things stacking: Fraunces 900-weight at 36px mobile with letterSpacing -0.02em on a long headline can overflow narrow viewports if Bohdi authored long headlines, AND a primitive somewhere isn't capping width on mobile (unverified — diagnose first). Worth probing each band/section in dev tools to confirm which.

**The composition problem from Sessions 14-16 is also untouched.** Home page has 9 sequential top-level bands (children of root stack), each with varied internal geometry (row, overlap, marquee, split, stack) but the OUTER shape is still "vertical stack of 9 bands." That was Cathy's tell. It's Brian's tell. It's Candle Bonanza's tell. The design-system engine was always-and-only the *legibility* floor; it was never going to fix the composition reflex. The eyes loop or a composition-rules validator is the next layer — neither is in this build.

**The copy problem is also untouched.** Bohdi's prompt has AI-tell phrases banked from prior sessions ("crafted with care", "every piece tells a story", etc.). He still reaches for the same shapes when generating headlines and about copy. Alex saw near-identical copy to Brian's. That's not a renderer problem — that's a copy-deliberation problem that needs its own work.

### Where it broke as a process

Claude greenlit a canary test when only Text.tsx had been wired through the new system. When Alex asked "is it testable" the honest answer was: "technically yes, but only ~30% of the rendered page changes — most of what you'll look at is still the old renderer, so the test will tell us little." Claude didn't say that. Claude said yes with one caveat about Bohdi possibly failing validation. Alex spent real money (image gen + Anthropic API) on an onboarding that could not show meaningful visible change. Same failure mode Alex has banked before: Claude declares something built when only one slice ships and doesn't surface the gap.

**This is the throughline lesson of the session.** It belongs in feedback memory if not already there: when a system change is partial, the question "is it testable" must be answered with the percentage of the visible surface that actually exercises the change, not "yes the code path runs."

---

### Stack changes
- New dep: `@material/material-color-utilities` 0.3.0 (NOT 0.4.x — 0.4 has a broken internal import path). Used for `Scheme.light(seedArgb)` / `Scheme.dark(seedArgb)` to derive a full set of paired semantic colors (surface/onSurface, primary/onPrimary, etc.) from a single seed color, guaranteed contrast-correct.

**New module — `lib/design-system/`** (TDD, 35 unit tests):
- `types.ts` — `SemanticColors` interface (15 M3 token roles), `TYPE_SCALE_ROLES` const (`['eyebrow','headline','sub','body','caption']`), `TypeScaleRole` type.
- `schema.ts` — Zod: `TypeScaleEntrySchema` (fontName, sizePx ≥14, sizeMobilePx ≥14 and ≤sizePx, weight, lineHeight, optional letterSpacing/uppercase), `TypeScaleSchema` (all 5 roles required), `SemanticColorsSeedSchema` ({primarySeedColor: hex, scheme: 'light'|'dark'}), `SpacingSchema` ({unit: 4-32}).
- `derive.ts` — `deriveSemanticColors(seedHex, scheme)` → 15-key `SemanticColors` object via M3.
- `validate.ts` — `validateDesignSystem(sheet)` → `{ok, issues[]}`. Today's floor: every `typeScale.{role}.fontName` must exist in `sheet.fonts[]`; spacing ≥ 4px. Min font size is already enforced by the Zod schema. Structured issues match the existing `set_layout` error contract.
- `compile.ts` — `compileDesignSystemVars(sheet, semanticColors)` returns `{rootLines, mediaLines}`. Mobile sizes go in `:root {}` (mobile-first); desktop sizes go in `@media (min-width: 768px)` IFF they differ from mobile (no empty @media block). Emits `--color-surface`, `--color-on-surface`, `--color-primary`, `--color-on-primary`, `--color-primary-container`, `--color-on-primary-container`, secondary versions, outline, inverse-surface, inverse-on-surface, plus `--type-{role}-font/-size/-weight/-line-height/-letter-spacing/-transform`, plus `--spacing-unit`. `buildDesignSystemCss()` is a higher-level helper that returns a fully-wrapped CSS string (currently unused — kept for direct callers).
- `index.ts` — barrel re-exports.

**Extended `lib/style-sheet.ts`** — `StyleSheetSchema` now requires three new fields alongside the existing palette/fonts/textures: `semanticColors: SemanticColorsSeedSchema`, `typeScale: TypeScaleSchema`, `spacing: SpacingSchema`. This is the schema Bohdi must satisfy.

**Extended `lib/style-sheet-loader.ts`** — `compileStyleSheet()` now also derives semantic colors via M3 from the sheet's seed, calls `compileDesignSystemVars`, and merges the new lines into the existing `:root {}` block. Appends the `@media (min-width: 768px)` block for desktop type-size overrides when present. The shape of `CompiledStyleSheet` is unchanged (`{cssVariables, googleFontLinks, customFontFaces}`), so the storefront route doesn't need to change.

**Enriched mood schema — `lib/moods.ts`** — every mood now carries a `designDirection` object:
- `paletteTemperature: 'warm' | 'cool' | 'neutral'`
- `brightness: 'dark' | 'mid' | 'light'`
- `typeCharacter: 'serif-leaning' | 'sans-leaning' | 'either'`
- `textureAffinity: 'rich' | 'minimal' | 'either'`
- `defaultScheme: 'light' | 'dark'`

Concrete values per mood: dark → neutral/dark/either/rich/dark · rustic → warm/mid/serif-leaning/rich/light · cozy → warm/light/serif-leaning/rich/light · botanical → cool/light/either/either/light · sunset → warm/mid/either/either/light · simple → neutral/light/sans-leaning/minimal/light · modern → neutral/light/sans-leaning/minimal/light.

These are the rails Bohdi reads when picking his seed color and typefaces. **Niche provides category DNA; mood wins conflicts.** (Locked from D6, D14, D30 — re-confirmed in chat this session.)

**Bohdi's tools — `lib/bohdi/layout-tools.ts`:**
- `set_style_sheet` tool description fully rewritten. Now teaches all five parts of the design system (semanticColors, typeScale, palette, fonts, textures, spacing), the 14px minimum, the requirement that every `typeScale.*.fontName` match a font in the array, and that the renderer reads ONLY from the typeScale values (no fallbacks).
- `input_schema` extended with the three new required fields, including a typeScale property with all 5 roles required and per-role property definitions for fontName/sizePx/sizeMobilePx/weight/lineHeight/letterSpacing/uppercase.
- `handleSetStyleSheet` runs Zod parse first, then `validateDesignSystem` after — so a sheet that parses but has a mismatched fontName gets a structured `{ok: false, issues: [...]}` back. Bohdi corrects on his next turn (same error-recovery contract as `set_layout`).
- Success message is now `"Design system set. Palette: N colors. Fonts: N. Type scale: all 5 roles defined. Seed: #xxxxxx (light|dark)."` so Bohdi gets confirmation of what landed.

**Bohdi's system prompt — `lib/bohdi/system-prompt.ts`:** `LAYOUT_ENGINE_PROMPT` "THE STYLE SHEET" section replaced with "THE DESIGN SYSTEM — build this first, before any page." Walks through the five parts (semanticColors, typeScale, palette, fonts, textures), names the 14px floor, names the fontName-must-match rule, calls out that the renderer reads ONLY typeScale values (no defaults), and tells Bohdi that `set_style_sheet` returns structured validation issues. Niche × mood framing reinforced: mood drives the seeds; niche provides category vocabulary; mood wins conflicts. Mood's `designDirection` is the guide for picking the seed.

**Renderer — `components/storefront/layout/content/Text.tsx`** — fully rewritten. Removed: the five `ROLE_CLASS` Tailwind constants (text-xs/text-4xl/text-base/…), the `MOBILE_ROLE_CLASS` map, the `DESKTOP_ROLE_CLASS_MD` map, the `MOBILE_STEP_DOWN` map, the `SCRIPT_EYEBROW` constants, the `roleClass`/`mobileRoleClass`/`desktopMdClass` exported helpers, the `isScript` plumbing via `ctx.scriptFonts`, and the auto-step-down mobile logic. Kept: tag selection per role (`ROLE_TAG`), alignment classes, intent style vars, palette color via `--node-palette`. The new approach: render text with inline style referencing `var(--type-{role}-size)`, `var(--type-{role}-font)`, `var(--type-{role}-weight)`, `var(--type-{role}-line-height)`, `var(--type-{role}-letter-spacing, normal)`, `var(--type-{role}-transform, none)`. The compiled CSS provides the values; mobile sizes are the default and `@media (min-width: 768px)` overrides them. **Note:** the script-fonts plumbing was REMOVED from Text.tsx but the `scriptFonts` props on `StorefrontPage`/`LayoutPage`/`RenderContext` are still wired in their files. They're now unused dead context but were left in place to keep this change focused on the type-system swap; clean them up next session.

**Tests updated:**
- New: `lib/design-system/schema.test.ts` (17 tests), `derive.test.ts` (5), `validate.test.ts` (4), `compile.test.ts` (9). 35 tests for the new module.
- Updated existing fixtures: `lib/style-sheet.test.ts` and `lib/style-sheet-loader.test.ts` got new `validTypeScale()`/`baseTypeScale` helpers and `semanticColors`/`spacing` added to all sheet fixtures. `lib/style-sheet-loader.test.ts` got 3 new assertions on the design system CSS vars.
- Updated `lib/bohdi/layout-tools.test.ts`, `tools.test.ts`, `run.test.ts` — their `VALID_STYLE_SHEET` fixtures got the new required fields. Message assertion updated to match the new success copy.
- Updated `lib/bohdi/system-prompt.test.ts` — "THE STYLE SHEET" assertion → "THE DESIGN SYSTEM".
- Updated `lib/generation/generate-page.test.ts` and `lib/generation/generate-tokens.test.ts` — switched from minimal hand-rolled `Mood` literals to importing `MOODS` from `@/lib/moods` (the minimal literals no longer satisfy the type since Mood now requires `designDirection`).
- DELETED `components/storefront/layout/content/Text.classes.test.ts` — tested the script-eyebrow class helpers that no longer exist.
- REWROTE `components/storefront/layout/content/Text.render.test.tsx` — 9 tests covering tag selection per role, type scale CSS var references on inline style, alignment class, and data attributes. Replaces the script-eyebrow rendering tests.

**Final numbers:** 743 tests pass (was 704), typecheck clean, coverage 99.28% statements / 96.53% branches / 100% functions / 99.52% lines. lib/design-system specifically: 96% lines / 88% branches / 100% funcs.

**NOT done this session (deliberate or known):**
- **No canary run.** Bohdi has never produced a real design system in production. The first generation is a known unknown — he may fail Zod validation on his first `set_style_sheet` and retry, which adds tokens. The prompt may need tuning after one real run. Plan: ONE candles tenant on ONE mood, look at it with Alex, iterate from there. Cost estimate: similar to Session 16's ~$2.40, possibly higher due to retries.
- **No DB migration.** `style_sheets.sheet` is a JSONB column; the richer payload fits without schema change. Confirmed by reading the column type — no migration needed and none written.
- **`scriptFonts` plumbing through `StorefrontPage`/`LayoutPage`/`RenderContext`/`deriveCtx` is now dead** but not removed. Cleanup follow-up: drop the prop from those signatures next session.
- **Mood `designDirection` is not yet used inside Bohdi's prompt rendering.** Bohdi sees the mood description prose; the structured `designDirection` field exists on every mood but isn't passed into his context explicitly. He has the prose he's always had plus the new "THE DESIGN SYSTEM" section explaining what to author. If the canary shows him not using the rails well, the obvious next move is to inject mood.designDirection into his read_mood response — that's a small, targeted change.
- **Niche-level design DNA still lives in prose** in the niche markdown files. The schema doesn't carry structured palette-temperature / type-character rails per niche yet. Deliberate — we held that line in chat ("mood is what the shop looks like, niche is what the shop sells and talks about" — D30 — niche contributes vocabulary/category knowledge, not seeds). If a canary shows a candles store ignoring candle-world cues, revisit.
- **Open-ended quality (does it have feeling, is it ordinary?) is NOT solved.** This was always going to be the eyes-loop / phase-2 work per the Design-System-Engine-Spec. The competence floor is now built; the taste ceiling isn't.

**Recommended next session opener — DO NOT run another canary first.** The candle-bonanza canary already burned tokens and image-gen for proof we don't need to re-run. The actual next move is the renderer pass: audit every component in `components/storefront/layout/content/` and `components/storefront/layout/primitives/` and rip out the hardcoded color/font/size/weight/letter-spacing/transform Tailwind classes. Anywhere a component currently has `text-2xl`, `text-sm md:text-base`, `font-medium`, `tracking-tight`, etc. for a *visual* property, replace it with a style read from `var(--type-{role}-…)` or `var(--color-…)`. Tailwind classes for *layout structure* (flex, grid, gap-N, justify-*, items-*, w-full, mx-auto, etc.) stay — those are geometry, not design. The principle Alex stated directly: "nothing in the renderer should hardcode color, font, size, weight, letter-spacing, or text-transform. Those live in the design system Bohdi authors. Components only own structure."

Specifically:
- Wordmark must read a type-scale role (probably `headline` or a dedicated `wordmark` role — open question, ask before adding).
- NavLinks must read body-role typography AND honor `--node-palette` for `color` on the `<a>` tags (this is the visible "nav broken" fix).
- Button must read the type scale for its label.
- Cart icon sizing is structure; review if any visual styling needs to come from tokens.
- All bound content nodes (ProductGrid, FeaturedProduct, CollectionGrid, FeaturedCollection, SubscriptionGrid, FeaturedSubscription, ContactForm, EventsList) — every label, price, title, description inside them must use the type scale.
- Primitives mostly handle layout; flag anywhere they emit visual styling and audit it.

Only after that pass should a new canary run. Estimated scope of the pass: a dozen-ish files in `components/storefront/layout/content/`, ~ten primitives, no schema changes, no new modules. Tests need to be updated in lockstep (this is where it stings — many existing render tests assert specific Tailwind classes that will change).

After the renderer pass lands, the OTHER unfinished pieces from this session also need closing:
- `mood.designDirection` is defined but Bohdi never reads it — wire it into `read_mood`'s response so he actually uses the rails.
- `scriptFonts` plumbing through `StorefrontPage` / `LayoutPage` / `RenderContext` / `deriveCtx` is dead code; remove the prop.
- `app/storefront/listings/[slug]`, `/collections`, `/collections/[slug]`, `/subscriptions`, `/cart` are still platform-owned per-route pages on the legacy `font-s-*` token system. A layout-engine tenant lands there and sees a different visual world. Per Session 16's page-architecture policy these need to become per-tenant pages — separate work from the renderer audit, but on the same "things that look like Brian's because they ARE Brian's" pile.

Composition (9 stacked bands) and copy reflex (same platitudes) are still untouched and are NOT renderer problems. Those are Bohdi-prompt / eyes-loop work for whatever comes after the renderer pass.

**Branch:** `session-12/layout-engine`. Two commits pushed: `26f9d70 feat(session-17): design-system engine foundation` and `b0c09e4 docs(session-17): update Session Brief with design-system build detail` (this commit will update the brief again with the honest post-canary diagnosis). Tenant left in DB: `candle-bonanza` — keep it for diagnosing the renderer pass; don't waste another canary regenerating before the renderer is fixed.

---

## Session 16 (2026-05-31) — context recovery, two audits, page-architecture policy

**Why this session existed:** the prior session ("Page load responsiveness", session 15) lost the start of a discussion about using **both Claude and Gemini** to build storefronts (A/B on cost/time/quality; Gemini's native image+video could drop fal.ai). In that session a build-timeout was fixed (the `withTimeout` guards, now committed) and a Brian's-Candles test ran: ~8:13, ~$2.40 ($1.61 Claude + $0.80 fal). Aesthetically a bit better, but functional failures (missing nav on shop, flat product thumbnails on home, bad fonts, still stacked). Recovered all of this from the transcript at session start.

**Key reframe locked with Alex:** you can't fairly A/B Claude vs Gemini until the engine reliably produces a **complete, correct** site — otherwise we're comparing two sites broken by our own code. "The engine" = Claude producing a complete site. So: finish the engine → lock with a test → then race Gemini. Also split the Gemini question in two: native image/video is a real separate win (could drop fal); **Gemini-as-composer will NOT fix the slop** — that's the missing work-loop problem (see session 14), independent of model.

**Two audits written (no code changed):**

1. `project-docs/Engine-Audit-2026-05-31.md` — functional pipeline. Core finding: the engine has no single enforced contract, so Bohdi authors more than the back end delivers; failures are unsewn seams, not Brian-specific. Confirmed seam defects (hit every tenant): **nav empty** (finalize hardcodes `is_in_nav=false`; resolver only returns `is_in_nav=true`), **fonts dropped** (Bohdi assigns font via `intent.type`; renderer appears not to consume it — needs direct confirm), **collection images never resolve** (resolver never selects `featured_image_id`), social/cart are intentional stubs. OPEN/unexplained: flat home-page product thumbnails. Separate deeper problem: **no work loop** (compose→save→done, Bohdi never sees/revises) = the "still stacked" slop; not a seam fix.

2. `project-docs/Codebase-Audit-2026-05-31.md` — independent engineering audit. Verdict: genuinely strong (strict TS, no `any`, append-only migrations, full RLS, atomic writes, ~99% lib unit coverage). **No confirmed criticals.** Disproved three false-alarm "criticals" against the live system: `.env.local` is NOT committed (gitignored), `proxy.ts` IS Next 16's middleware and runs every request, every public table HAS RLS. Real findings: **H1** no end-to-end test of onboarding→render (why the functional bugs shipped despite 99% coverage); **H2** type safety bypassed at the DB boundary via casts because `database.types.ts` is stale (missing `layout_tree`, `design_choices`); M: N+1 collections query, dual-path debt, swallowed waitlist email errors, CI lacks prod build + lint.

**Page-architecture / nav / legal policy DECIDED** (full doc: `project-docs/Page-Architecture-Policy-2026-05-31.md`; needs reconciling into Master Spec / decisions log):
- **Every page is per-tenant.** Two axes: *per-tenant* (themed, applies to everything incl. cart) vs *editable* (content pages only).
- **Content pages** (home, about, shop, legal, events, custom) = per-tenant AND editable (content + layout).
- **Functional surfaces** (cart, checkout, add-to-cart action) = per-tenant in look, platform-owned in behavior, NOT editable.
- **Product detail** = a normal editable page (price, description, photos, copy, layout all editable) with a fixed add-to-cart control the maker can place but not rewire.
- **Navbar:** Shop, About, Contact always (+ build-generated pages like Events/Calendar). **No Home in navbar** (it's the wordmark). **Footer:** Home, Privacy, Terms.
- **Legal:** same default Privacy/Terms on every site (platform templates); "tenant responsible / not legal advice" goes in **bohdiai.com's own ToS**, not the public page; per-tenant legal pages must become seeded-then-editable.
- **"Editable" is a later dashboard feature**, but the data model must support it now → stop building any page that can't later be edited (no new hardcoded pages). This is direction, not a pile to clear before the candles test.

**OPEN decision blocking a correct navbar fix:** how the engine classifies a navbar page (Events) vs footer-only page (Privacy) when a build generates them. Recommendation: known-list (Home/Privacy/Terms footer-only; everything else → navbar) vs Bohdi tags each page. Awaiting Alex.

**Known follow-ups created (tracked, not authorized):** legal pages are hardcoded + orphaned (render with dead legacy block chrome on layout-engine tenants, unlinked) → must become per-tenant seeded editable pages on layout-engine chrome, linked in footer; footer reliability (currently Bohdi-authored) is its own piece; migrate hardcoded routes (product detail, collections) to per-tenant; add responsibility clause to bohdiai.com ToS; dashboard editor (later). Also still outstanding from session 14: rotate the GitHub PAT exposed 2026-05-30.

**Navbar fix — DONE (engine-level, TDD).** Classification resolved as a per-page property (not hardcoded): `lib/generation/nav-placement.ts` (`computeNavPlacement`) seeds each page's `is_in_nav` / `nav_label` / `nav_position` — Shop=10/About=20/Contact=30, Home & Privacy/Terms footer-only, generated pages (Events…) appended at 40+. Wired into `lib/generation/write-storefront-layout.ts` payload. RPC updated via migration `20260531000001_layout_nav_placement.sql` (applied; was hardcoding `is_in_nav=false`). 696 unit tests pass, typecheck clean. **Proven end-to-end:** `lib/generation/write-storefront-layout.integration.test.ts` writes a real storefront and asserts the resolver hands back Shop/About/Contact + a generated Events page in policy order with clean labels, Home excluded (gated `describeIfReal`, skipped in CI, cleans up its tenant). DB confirmed clean afterward (only the 4 pre-existing tenants). The only thing not eyeballed is the literal rendered pixels — but the resolver output is what the navLinks component maps to links, so the data seam is closed. Not committed yet (Alex commits).

**Fonts — DIAGNOSED then FIXED (TDD).** The audit was wrong twice (claimed `intent.type` was dead code; my follow-up "no default font" theory was also wrong). Real cause, confirmed from Brian's actual hero screenshot: fonts DO apply, but the renderer's eyebrow role hardcodes `uppercase` + wide `tracking`, which mangles a connected script (Bohdi used Sacramento on eyebrows). Fix: font-aware eyebrow treatment — `components/storefront/layout/content/Text.tsx` exports `roleClass`/`mobileRoleClass`/`desktopMdClass` that drop uppercase/tracking when the font is a script; the set of script fonts (style-sheet entries with `cursive` fallback) is plumbed StorefrontPage → LayoutPage → RenderContext → deriveCtx → Text. Non-script fonts unchanged (deliberately did NOT remove uppercase globally — that's a separate design call). Tests: 5 pure class tests + 2 RTL render tests. 704 tests pass, typecheck clean. **Pixel proof pending** a real view (dev server is Alex's, or next generation). Scope: fixes the script-eyebrow case Alex saw; other treatment collisions (forced weight on a 400-only script, etc.) not addressed. Separately, the platform per-route pages (listings/collections/cart) still use the legacy `font-s-*` system a layout-engine tenant doesn't populate — that's part of the bigger per-tenant-page migration, not this fix.

**NEXT SESSION — build the Design System Engine ("our own Stitch"). Read `project-docs/Design-System-Engine-Spec.md` first; it's the complete build spec.** Short version: the session pivoted off seam-fixing to the core problem. Bohdi generates a real design system per tenant — paired semantic colors, a full type scale with legible sizes + mobile variants, spacing, component rules (the shape of a Stitch `DESIGN.md`; sample at `C:\Users\Bohdi\Downloads\stitch sample\stitch_bohdiai_editorial_landing_page\...\DESIGN.md`). A validator enforces the competence floor on that system before any page is composed (the answer to "we can't fix every page" — we validate the system, not the pages). Pages compose by referencing the system's roles; the renderer reads the scale instead of hardcoded classes. This **supersedes the Session-16 renderer font patches** (`Text.tsx` script-eyebrow classes) — they get replaced by the type scale, do NOT preserve them. The render→see→revise "eyes" loop is a likely **phase 2**, decided with evidence after the system foundation lands. The unexplained home-thumbnail issue is deferred.

**Committed at end of Session 16 (branch `session-12/layout-engine`, three commits):**
- **Nav fix** (`feat`): `lib/generation/nav-placement.ts` + tests, payload wiring in `write-storefront-layout.ts`, integration test, migration `20260531000001_layout_nav_placement.sql` (applied to the DB). Keep.
- **Font fix** (`fix`, TRANSITIONAL): `Text.tsx` script-eyebrow handling + `Node/Page/StorefrontPage` script-font plumbing + tests. **Isolated in its own commit so it can be reverted cleanly when the design-system engine replaces the renderer's hardcoded type roles. Do NOT build on it** — the type scale supersedes it.
- **Docs** (`docs`): this session's audits, the page-architecture policy, the design-system build spec, and this brief.
- NOT committed (left in working tree): dev logs (`build-test.log`, `sse-*.log/txt`) and `.claude/settings.local.json`.

---

## Session 15 (2026-05-31) — storefront speed fix + an over-broad lint cleanup

**The real fix — storefront responsiveness (Brian-test issue #1):**
- Root cause: `LayoutNodeSchema` in `lib/layout/tree.ts` was a plain `z.union` of ~28 node schemas. A plain union tries each member in order and recurses into the entire subtree on every failed attempt, so validation cost grew exponentially with tree depth. Brian's Candles home tree (~12.6 KB) took ~8s per `PageSchema.safeParse`; with React strict-mode double-render plus layout + page both parsing, ~22s per page load in dev. Load time tracked tree size exactly (home ~22s, about ~10s, shop ~5s).
- Fix: converted to `z.discriminatedUnion('type', [...])` (every node carries a literal `type`). Required unwrapping the redundant outer `z.lazy` on the 9 primitive container schemas in `lib/layout/primitives.ts` so they're plain ZodObjects the discriminated union can introspect. Same tree now validates in ~5ms (~1600×). Regression test added: `lib/layout/tree.discriminated-union.test.ts`. 690 unit tests pass, typecheck clean.

**Lint tooling — was fully broken, now works:**
- `npm run lint` was dead (Next 16 removed `next lint`; config was still legacy `.eslintrc.json`). Migrated to flat config `eslint.config.mjs`, deleted `.eslintrc.json`, set the lint script to `eslint .`.
- Cleaned the surfaced issues: type-only imports; unescaped apostrophes (onboarding); unused vars (scripts); justified `set-state-in-effect` suppressions on 3 onboarding components (intentional patterns); `<img>`→`next/image` in 5 storefront content components (ProductGrid, FeaturedProduct, FeaturedCollection, CollectionGrid, Cart). Per-folder relaxations: console allowed in `scripts/**` and `lib/logger.ts`; `no-html-link-for-pages` off for `app/storefront/**` + `blocks/**` (storefront links are rewrite-resolved tenant paths, not literal Next routes — typedRoutes can't type them, so plain `<a>` is correct).
- Removed a duplicate Next config: there were two (`next.config.js` with image `remotePatterns`, `next.config.mjs` without). Next loads one; `.js` was the active one. Deleted the stale `.mjs`.

**Mess made this session (honest record):**
- Ran `prettier --write` against the whole codebase (broad globs) instead of just edited files, reformatting ~165 files. Almost all cosmetic (line wrapping/spacing) plus LF/CRLF churn from `core.autocrlf=true`. No logic changed, nothing broken — but it bloats this commit and buries the real changes. Alex chose to leave it rather than spend tokens undoing a no-op.
- The session ran long (~3 hrs) largely on that lint/format detour. Only Brian-test issue #1 (responsiveness) was addressed; the other open Brian-test items were NOT touched.

**Watch:** the `<img>`→`next/image` swap in the 5 storefront content components changes how product/collection/cart images render and was NOT visually verified (dev server not run this session). Eyeball storefront product images before trusting.

**This commit also carries prior uncommitted working-tree changes** that pre-dated the session: withTimeout guards in `lib/fal.ts` + `lib/bohdi/run.ts`, the `lib/slop-floor.*` + `lib/with-timeout.*` modules, `scripts/score-slop.ts`, and the Session-14 `Bohdi-Build-Quality-Design.md`.

---

## Session 14 (2026-05-30) — design conversation, no code

**Read `project-docs/Bohdi-Build-Quality-Design.md` first — it's the substance of this session.** Short version:

- **Top goal locked as a priority:** get the build right. The bar is *feeling* (a maker would hit refresh on their own store), not abstract "designer-grade." "Creating for creators — it cannot be ordinary."
- **Diagnosis:** Bohdi one-shots and never sees his rendered output. cathys-candles home = nine identical stacked bands = the AI tell. Instruction/prompt-stuffing does NOT fix behavior (his prompt already says "don't stack bands"). Self-awareness doesn't either — it's instruction pointed inward. The only reliable corrector is something outside the agent that can't be talked to: deterministic CODE, or a HUMAN. AI critics fawn AND rationalize; you can't fix AI with more AI.
- **NOW build (on Claude, no training):** (1) feed Bohdi a *range* of strong examples; (2) a work loop — build → render → he SEES it → judge → revise; (3) a code floor that mechanically rejects slop tells. Code is the gate; Bohdi's words are not an input to the verdict.
- **"Intended" = copy that's specific + fine type/detail craft + total commitment to the maker's world.** Much of it is NOT exotic geometry. The 3 sample mockups (`components/storefronts/`) are EXAMPLES of the bar, not templates and not mood definitions — do not let Bohdi clone them.
- **Product directions discussed but NOT locked (need Alex's confirmation):** drop the "5-minute / live in minutes" promise and sell the craft; fill the build wait with productive onboarding (email setup, photo upload) and/or a "what's next" video, protecting a deliberate reveal; copy should respect the maker's artistry but shown specifically, never as platitudes.
- **Open for Alex:** is there a missing PLAYFUL/JOYFUL mood (Posy/children's-books didn't map to any of the 7)? Build image/video source (fal video / stock / upload)?
- **Parked, explicitly NOT now:** training our own model. Do not spend time on it.

**Housekeeping from this session:**

- **MCP fixed.** The global Claude Desktop postgres connector had been pointing at RhodyStrong's Supabase project (ref `kuxqy…`) since 5/27, not BohdiAI's — that's why DB queries failed. Now two connectors: `postgres-bohdiai` (correct, `jdmizpqtpbmcpspfuihp`) and `postgres-rhodystrong` (preserved). Filesystem connector now serves both `C:\Projects\RhodyStrong` and `C:\Projects\BohdiAI`. (`puppeteer` and the Stripe `mcp` connector show disconnected warnings — unrelated, deferred.)
- **OUTSTANDING SECURITY:** a GitHub PAT (`github_pat_11BPJJN6…`) was exposed in this session's chat and needs rotating by Alex. After rotating, swap the new token into the MCP config without printing it.
- **Failed canary:** a candles × sunset onboarding (Carol's Candle) hung at ~turn 19 before finalize — generated fal images in storage but NO tenant row and NO renderable site. Worth diagnosing the hang before relying on real onboardings.
- **DB state:** tenants = `cathys-candles` (candles/rustic, active) and `rhody-strong` (photo_magnet_maker). Branch unchanged (`session-12/layout-engine`). No migrations.

**Update at the end of every session.**

---

## Action at session start

**Read this whole brief before the first response.** Session 12 built the layout engine end-to-end for candles and ran the first canary (cathys-candles, 7:41 build, $0.75). Session 13 fixed the chronic CI coverage failure that had been red since before session 7 and worked through most of the candles backlog. Database is still empty (cathys-candles was wiped at some point — confirm before next test). The next testing milestone is another candles canary on the session-13 changes to see how it looks with the renderer/prompt fixes applied. Testing costs money so don't run it without a reason.

Session 13 work is committed on branch `session-12/layout-engine` (still on the session-12 branch; was not rebranched). Four commits on top of session 12's last commit (`a1e75c4`):

- `e49189a test(session-13): backfill lib/** coverage to clear 90% CI gate` — 28 new test files, 654 tests passing, coverage 99.73% lines / 96.93% branches / 100% funcs / 99.45% stmts. Additive `export` of internal Zod schemas in generate-{page,listings,collections,subscriptions} so tests exercise the real source. Exported `walkTree` from `lib/layout/tree.ts` for deep-tree tests that would otherwise time out on Zod recursive parsing. `vitest.config.ts` excludes truly-generated files (`database.types.ts`, the two `*-manifest.generated.ts` files).
- `8fb42fb ci(session-13): run Test workflow on all branch pushes, not just main` — `.github/workflows/test.yml` no longer scopes to `main` only.
- `3b775e7 feat(session-13): gate Bohdi's tools by niche; drop voice onboarding step` — `toolsForNiche(slug)` exported from `lib/bohdi/tools.ts`; layout-engine niches see only layout + shared tools, legacy niches see only legacy + shared. Voice step deleted (`StepVoice.tsx` removed; voiceBoothPitch/voiceNegativeSpace removed from OnboardingData, GenerateBody, RunStorefrontInput, BohdiBrief, Bohdi's initial-user-message). Onboarding is now 6 steps (Name, Niche, Logo, Mood, Trial, Build).
- `3351cfd feat(session-13): renderer fixes from candles canary review (#1, #4, #5, #6)` — Band gains `contentWidth: 'narrow' | 'normal' | 'wide' | 'full'` (default normal ≈ max-w-5xl centered; full opts out for full-bleed). Overlap gains `scrim: 'none' | 'light' | 'dark' | 'auto'` (default auto; injects gradient sibling between image base and layered text). CollectionGrid + FeaturedCollection collapse to text-only card when resolved collection has no imageUrl. Text gains `mobile: { role? }` with default auto-step one role down on mobile. Bohdi's `BOHDI_LAYOUT_TOOLS` descriptions updated to teach him the new fields.
- `ffd82da feat(session-13): teach Bohdi the real storefront routes (#3)` — layout-engine system prompt now enumerates `/`, `/about`, `/shop`, `/listings/{slug}`, `/collections`, `/collections/{slug}`, `/subscriptions`, `/cart`, `/contact`, `/#events`. Button tool description repeats the list at the point of decision. Calls out the actual canary bug (linked `/shop/honey-and-beeswax` instead of `/listings/honey-and-beeswax`).

**No new migrations this session.** Database schema unchanged from session 12.

The dev server was NOT started in this session — Alex manages his own per `feedback_no_preview_unless_asked`.

---

## How Claude works with Alex (operating rules for the assistant)

These are throughline rules for every session, not just session 12. The new rules sit at the top.

**Tests are part of done.** New as of session 13, banked at `feedback_tests_are_part_of_done.md`. A feature without a test isn't done, it's demoed. Letting `lib/**` coverage rot from 90% to 13% over the project's history was the biggest single failure mode of the project so far — months of pushes with no way to catch silent regressions. The 90% number isn't the point; the point is that test failure surfaces the moment something breaks, before push, before merge, before a maker hits it. End every session with `npm run test:coverage`. If a file touched in `lib/` is under threshold, the session isn't over.

**Stop asking when the answer is obvious.** From session 12, banked at `feedback_stop_asking_when_obvious.md`. Surface real trade-offs, not industry-standard defaults. Don't overcompensate after a "keep me in the loop." Session 13 had a recurrence — I asked Alex whether to open a PR to trigger CI when I could have just widened the workflow to trigger on all branches. He called it out. The pattern is "if there's a clean technical move, take it; only ask when there's a real fork."

**Run migrations yourself.** From session 12, banked at `feedback_run_migrations_yourself.md`. After committing a SQL migration, run `node scripts/db-migrate.mjs`. Don't surface it as a manual step for Alex.

**Don't narrow scope on approval.** Carried from session 11, at `feedback_dont_narrow_scope_on_approval.md`. When approval comes with an ambiguous referent, confirm scope before executing.

**Respect the rules — never overlook one because it doesn't fit your plan.** Carried from session 10, at `feedback_respect_rules_no_justifying.md`. When caught breaking a rule, acknowledge and fix, never justify.

**When Alex says something is wrong, that is NOT permission to fix it.** Diagnose and surface, then wait for direction. Observations are not requests.

**Don't prescribe. Propose.** Hand over raw materials and trade-offs; let Alex make the call.

**Push back on overengineering, including your own.** When proposing a new abstraction, ask "is this required to ship, or am I doing it because it's interesting?" If the second, stop.

**Plain English in chat. No structured documentation reflex.** No bullet lists when 2-3 sentences would work. No section headings, bold labels, decision IDs, or jargon Alex didn't use first. Session 12 hit this multiple times — the documentation reflex came back when I started long-form explaining schema decisions.

**One question at a time when walking decisions.** Multi-part questions overwhelm.

**Don't invent under pushback.** Acknowledge and wait. Don't fill the gap with a new guess.

**Don't give time estimates.** Frame work by dependency, not weeks or sessions.

**Push back on scope drift.** Name it and surface the trade-off, don't absorb it silently.

**Never start preview/dev servers unless explicitly asked.** Alex manages his own dev environment.

**Tell Bohdi how to think. Don't tell him what to choose.** Quality bar = OK. Variant selection = not OK.

**Stop prompt-tuning to test cases.** When a generation comes out wrong, the reflex is to add a paragraph to Bohdi's system prompt. That's whack-a-mole — LLMs rationalize anything. The real levers are materials, deliberation mechanics, and output review.

**Don't play safe directing the safe AI.** Claude's safe-mode shows up as hedging, fallbacks, building competent-but-not-aggressive implementations of bold-named features.

**No hardcoded pages.** Every storefront route corresponds to a `content_pages` row. With the layout engine, every storefront page is composed by Bohdi end-to-end (header, body, footer all in the same tree). Carried forward.

**Don't direct Bohdi.** New emphasis as of session 12. The Layout Language doc was stripped of all controlling language — no "used for X" example sentences per primitive, no "every page is a stack of bands," no "functional art not brochures." Bohdi's job is artistry; ours is to give him the toolkit and the bar (contrast, sanity, no AI-tells in copy).

**No fallbacks for the dead path.** Set this session. The storefront route does not fall back to the legacy block renderer — it reads layout_tree and 404s if missing. The legacy generation path still exists in code but the storefront does not engineer for its outputs.

---

## State of the build

Bohdi has two distinct workflows now, gated by niche:

**Layout-engine path (candles only):** Bohdi reads the niche + mood, authors a complete style sheet via `set_style_sheet` (6-15 named palette colors with character descriptions, 3-10 named fonts with source/weights/fallback, 0-8 named textures), composes EVERY page including nav and footer as a layout tree via `set_layout` (called once per page: home, about, shop, contact, plus any custom pages), and finalizes. Finalize writes via the new `write_tenant_storefront_layout` RPC. The storefront route reads `content_pages.layout_tree`, fetches the active `style_sheets` row, compiles palette + font CSS variables and Google Font links, runs `resolvePage` against the tenant's catalog, and renders via `LayoutPage`.

**Legacy block path (leatherworker, photo_magnet_maker):** Same as session 11. Bohdi calls set_tokens / set_home_page / set_secondary_pages_copy / set_about_page / set_hero_image / set_about_image / etc., finalize writes through the existing `write_tenant_storefront` RPC, storefront route reads page_blocks. NO storefront-route fallback to this path — only tenants that pre-date this session can be rendered via blocks (and there are none, DB is empty).

**Legacy one-shot pipeline (17 niches, paused):** Alex explicitly said "we are not running the other 17 niches" this session. Generation path still exists but no testing on it.

Onboarding is still 7 steps (Name, Niche, Logo, Mood, Voice, Trial, Build). The streaming progress events from session 11 still apply to both Bohdi paths — Bohdi's run loop emits status + tip events through the SSE route.

Block catalog: 32 active blocks, untouched. Will go away when the layout engine is the only path. Not touched this session.

Database is empty.

---

## What got built this session (session 12)

### Layout Language doc — stripped of controlling language

`Project-Docs/Layout-Language.md`. Every "used for X" example removed from the primitives. The "every page is a stack of bands" claim removed. Split opened from 2 to N panes with explicit ratios summing to 100. "Functional art, not brochures" framing removed (it was Alex's motivation, not the language's job). "Used sparingly" instruction removed from the texture paragraph. Each primitive now described by its geometry only. The doc is the source of truth for what the schema enforces.

### Layout language schema (lib/layout/)

Five files, all Zod + strict TypeScript under the strictest tsconfig (exactOptionalPropertyTypes, noUncheckedIndexedAccess):

- `intent.ts` — Intent { palette?, type?, texture?, density? } and Density enum
- `content.ts` — 18 content node schemas. Authored: text, image, button, wordmark, video, divider, quote. Bound: productGrid, featuredProduct, collectionGrid, featuredCollection, subscriptionGrid, featuredSubscription, contactForm, cart, socialLinks, navLinks, eventsList.
- `primitives.ts` — 10 primitive schemas + types (BandNode, StackNode, RowNode, SplitNode, GridNode, OverlapNode, BleedNode, PaneNode, MarqueeNode, GutterNode). Each with geometry knobs + a per-primitive `mobile` override object. Split takes 2-8 panes with explicit ratios summing to 100. Bleed and pane take a single `child`; the rest take `children` arrays.
- `tree.ts` — LayoutNode union, Page wrapper { slug, name, root, meta? }, `validatePage` walker that runs PageSchema validation then walks the tree checking split ratio sum, overlap anchor bounds, stackOrder permutation integrity, manual-order presence on productGrid/collectionGrid, tree depth limit (12), node count limit (600).
- `index.ts` — barrel re-exports.

### Bound-content resolver (lib/layout/)

- `resolved.ts` — Resolved* types (Product, Collection, Subscription, SocialLink, NavLink, Event, Cart, CartLine). `ResolveContext` interface with fetcher signatures. `resolvePage(page, ctx)` walks the tree, runs all bound-node fetchers in parallel, returns a path-keyed `ResolvedDataByNodePath` map.
- `resolver-supabase.ts` — concrete implementation. `createResolveContextForTenant(tenantId)` returns a ResolveContext that queries listings/collections/content_pages/events. Social links not yet a first-class entity in the schema; returns []. Visitor cart is empty on SSR. Product/collection ordering supports featured/newest/oldest/price-asc/price-desc/manual. Collection image_url not yet wired (collections table doesn't carry it today).

### Renderer (components/storefront/layout/)

35+ files. Server-component renderer with one client component (Marquee). Tailwind paths already covered `./components/**/*.{ts,tsx}` — no config update needed.

- `scale.ts` — SpacingScale/MinHeight/Radius/Border/Shadow/Align/Justify → Tailwind class lookups. Mobile and `md:` variants pre-listed so the Tailwind content scanner picks them up.
- `intent.ts` — Intent → CSS variable references via `--node-palette` / `--node-font` / `--node-texture`. `applyDensity(spacing, density)` shifts spacing one slot. `slugify(name)` for converting "Saddle Tan" → "saddle-tan".
- `Node.tsx` — recursive dispatcher. RenderContext carries optional density + path + resolved. `deriveCtx(node, ctx)` handles density inheritance + resolved forwarding. `childPath(ctx, segment)` builds child paths like `root.children[0]` so bound content nodes can look themselves up in the resolved map.
- `Page.tsx` — LayoutPage(page, resolved?). Seeds root ctx with path='root' and optional resolved map.
- `primitives/` — 10 components. Band, Stack, Row, Split, Grid, Overlap, Bleed, Pane, Marquee (client), Gutter. Each renders desktop + mobile via Tailwind responsive classes. Split uses flex-col mobile + md:grid with inline gridTemplate style. Overlap renders layered + stacked variants and gates via responsive utility classes.
- `content/` — 18 components. Authored render real markup; bound render real catalog data when resolved, skeleton placeholders otherwise. Links use plain `<a>` instead of next/link to keep typed-routes out of tenant-dynamic href territory.

### Style sheet schema + token compiler

- `lib/style-sheet.ts` — Zod schema for { palette, fonts, textures }. Palette entries (name + hex + character). Font entries (name + family + source [google/system/custom] + weights + optional styles + fallback + character + optional customUrl). Texture entries (name + value + character). Slug collisions detected via cross-entry check per set.
- `lib/style-sheet-loader.ts` — `compileStyleSheet(sheet)` returns { cssVariables, googleFontLinks, customFontFaces }. cssVariables emits `--palette-{slug}` / `--font-{slug}` / `--texture-{slug}` for every entry. Google fonts get hrefs (with ital/wght axes when italic styles requested). Custom fonts get @font-face blocks. `googleFontPreconnectLinks()` returns the standard fonts.googleapis.com / fonts.gstatic.com preconnect rels.

### Bohdi's compose tools

- `lib/bohdi/layout-tools.ts` — `BOHDI_LAYOUT_TOOLS` adds `set_style_sheet` and `set_layout` tool defs. Tool descriptions describe each primitive by what it IS geometrically (no "used for X"). All 18 content nodes documented. Intent layer documented. Authored vs bound content separation explicit. `handleSetStyleSheet` validates via StyleSheetSchema and populates accumulator. `handleSetLayout` validates via PageSchema + validatePage, replaces or appends by slug. Both handlers return structured `{ ok: false, issues: [...] }` on validation failure so Bohdi can correct on his next turn.
- `lib/bohdi/types.ts` — BohdiAccumulator extended with `styleSheet: StyleSheet | null` and `layoutPages: Page[]`.
- `lib/bohdi/tools.ts` — new tools concat into BOHDI_TOOLS, handlers added to the dispatch map, finalize branches on `isLayoutEngineNiche(brief.nicheSlug)`.
- `lib/bohdi/layout-engine-niches.ts` — single source of truth: `LAYOUT_ENGINE_NICHES = new Set(['candles'])`.
- `lib/bohdi/system-prompt.ts` — split into LEGACY_PROMPT and LAYOUT_ENGINE_PROMPT with `systemPromptFor(slug)` exported. Layout-engine prompt removes set_tokens / set_home_page / set_secondary_pages_copy / set_about_page / set_hero_image / set_about_image references and walks Bohdi through set_style_sheet once + set_layout per page. Layout-level AI-tells added alongside copy-level AI-tells.
- `lib/bohdi/run.ts` — calls `systemPromptFor(brief.nicheSlug)` instead of the static constant.
- `lib/onboarding/run-storefront.ts` — `BOHDI_NICHES` now includes candles so the dispatcher routes candles through Bohdi instead of the one-shot pipeline.

### Finalize path for layout-engine niches

- `lib/bohdi/layout-tools.ts` — `finalizeLayoutEngine(ctx)`. Asserts styleSheet + layoutPages are set, sanitizes via `sanitizeDeep` (same punctuation rules as legacy), looks up tenant_type_fit, calls `writeStorefrontLayout`, backfills design_choices.tenant_id.
- `lib/generation/write-storefront-layout.ts` — TS wrapper around the new RPC. Casts through a narrow interface at the DB boundary because `database.types.ts` predates the new RPC.

### Storefront route — single path, layout engine only

`app/storefront/_components/StorefrontPage.tsx`. Reads `content_pages.layout_tree`. 404s if missing. Parses the tree through `PageSchema`. Fetches `style_sheets.sheet`, compiles it (CSS variables + Google Font link tags + @font-face), runs `resolvePage` against the tenant's catalog, renders via `LayoutPage` with resolved data. No fallback to the legacy block renderer.

The page_blocks / renderBlock / BLOCKS_MANIFEST / footer-injection path is gone from this file. Other storefront pages (`/listings/[slug]`, `/collections`, `/cart`, etc.) still use their own existing code paths — they're not part of the page composition that Bohdi authors.

---

## What did NOT get built (and what's blocking the candles test)

Named explicitly so the next session does not lose this thread:

**First candles canary — ran. cathys-candles tenant generated end-to-end.** 7:41 build, 14 turns, $0.75, 4 pages composed via set_layout, 14 palette colors / 5 fonts / 2 textures. Storefront renders. Issue list and decisions from reviewing the result are at the bottom of this brief under "Session 12 test results — backlog for next session."

**Social links source.** No table for social URLs today. The resolver returns []. SocialLinks node renders the platforms Bohdi requested as unlinked icon placeholders. Not breaking, but not real.

**Collection image_url.** The collections table doesn't carry an image URL column. CollectionGrid + FeaturedCollection render the collection name + item count without an image until that lands.

**Visitor cart on SSR.** Cart (page variant) shows empty-state on first render. The actual cart sits in the client (sessionStorage or whatever the existing cart layer does). The bound resolver's `fetchCart` returns empty intentionally.

**Existing per-route pages (`/listings/[slug]`, `/collections`, `/collections/[slug]`, `/subscriptions`).** These are still server-rendered by the existing code paths from session 10 and earlier, NOT by the layout engine. A layout-engine tenant will get layout-engine-rendered home/about/shop/contact, but `/listings/abc-candle` will hit the legacy product-detail route. Will need migration but not blocking the first test.

**Bohdi's hero/about image plumbing.** The legacy path uses set_hero_image / set_about_image which write to accumulator fields and finalize injects into specific blocks. The layout-engine path doesn't use these — Bohdi places image nodes directly into his layout trees with assetUrl set from generate_image returns. He has to remember to do this; if he forgets, the hero band has a placeholder. The system prompt covers this but it's a behavior to watch for in the first run.

---

## Open decisions (need to be made before more building)

### 1. Test plan for the candles canary

Alex's call. The first generation will be expensive. Recommend: pick ONE mood (probably Rustic or Cozy — universal for candles), run it once, look at the result with Alex, iterate from there. Do NOT run all 7 moods on the first test.

### 2. Per-route page coverage

The layout engine currently composes home/about/shop/contact. The maker-facing routes for individual listings, individual collections, the cart, the subscriptions index, the legal pages — none of those are composed by Bohdi. They render via the existing pre-layout-engine routes. Two options:

A. Bohdi composes templates for these too (set_layout for "listing-detail", etc.). High control, more work for him every site, more places to validate.
B. These stay as universal storefront chrome the platform owns. Limits Bohdi's reach but ships faster.

Pending decision.

### 3. Hardcoded chrome under app/storefront/

Cart pages, collections index, listings detail — still hardcoded layouts. Same question as #2. The layout engine will resolve this naturally once Bohdi composes these too; the question is whether he does or doesn't.

### 4. Photo magnet maker niche revision

Still biased toward Rhody Strong's product line. Needs revision before more makers in that category onboard. Not session 12 work.

### 5. Commit + push — DONE this session

Branch `session-12/layout-engine` is pushed with all session 12 work. Session 11 was fast-forwarded into main at the start of this session.

---

## Open items (carried from earlier sessions, still applicable)

1. Doer storefront rendering pattern
2. Master Spec touch-up to reflect D1–D31 and recent sessions
3. StepTrial copy — confirm exact price before wiring Stripe
4. Per-tenant AI usage caps (Phase 2 dashboard)
5. Etsy/Shopify import (Phase 2)
6. Marketing copy update — drop "live in minutes"
7. Rate limit reset before launch (MAX_PER_WINDOW back to 3)
8. Sentry + PostHog signup
9. Inspiration URL / site reference — needs proper spec before rebuilding
10. Block swap in dashboard (legacy path)
11. Per-IP rate limit on `/api/contact` and `/api/notify-interest`
12. Stripe Subscriptions integration
13. Page-options dashboard
14. Collection thumbnails (resolved.ts already expects them; collections table needs the column)
15. `collections-row` forcing on home when collections exist (legacy path)
16. Subscription image error handling
17. First-load image timing race
18. Vercel main-branch deploy failure (needs verification once session-12 merges)
19. Strip the other 17 niche files (carried, paused per Alex this session)
20. Build niche style sheets for the other 17 niches — DROPPED for layout-engine niches; Bohdi authors his own. Still needed if legacy niches stay alive.
21. Run Bohdi across multiple niches × moods to verify variety — candles is the first layout-engine target.
22. Drop the BOHDI_NICHES gate entirely — replaced by layout-engine cutover.

---

## Future features banked (post-Phase-1 / launch wave)

Unchanged from session 11. Tenant-side mood regeneration, preview-before-save, mood samples in the picker, sample gallery on bohdiai.com, mood slider in the editor, Vision review on images, per-tenant agent persistence, live-storefront-preview during build, art director (second-pass review), `study_references` tool, `recent_sites` tool, patterns library.

---

## Lessons banked this session (carry forward)

**Stop asking when the answer is obvious.** Big lesson of session 12. Alex called out overcompensation early — surfacing three obvious questions (CSS variables for tokens, RSC vs client, separation of fetch from render) all of which had one reasonable answer. The reflex to "loop Alex in" can become noise. Real forks get surfaced; mechanical decisions get made.

**Run migrations directly.** Migration files are part of the build work, not a TODO for Alex. After committing, run `node scripts/db-migrate.mjs`. Don't say "run it when you're ready."

**Don't direct Bohdi.** Every "used for X" sentence in the language doc, every example use case in a tool description, every "for the first block do Y" instruction is a hand on the wheel. Strip them. The schema enforces the geometry; the prompt frames the artistry; everything else is for Bohdi to figure out.

**Telling Bohdi rules works less than enforcing them in code.** Carried from session 11, applied again. The contrast floor is enforced in the renderer, not just told to Bohdi. The punctuation sanitizer runs at finalize, not just instructed in the prompt. The Layout Language schema validation runs server-side; Bohdi gets structured errors back so he can correct.

**No fallbacks for the dead path.** When a code path is the only path going forward, don't keep an "or use the old way" branch alive. Either commit to the new path or stay on the old one. The storefront route stopped routing to the legacy block renderer this session. Cleaner.

**Doc → schema → code → prompt — same vocabulary all the way down.** The Layout Language doc described primitives geometrically. The Zod schemas reflect that exactly. The renderer honors it. Bohdi's tool description repeats it back to him. When all four are in sync, the system is self-consistent. When they diverge, the prompt becomes the only authority and it isn't enough.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `Project-Docs/SESSION-BRIEF.md` — this file
3. `Project-Docs/BohdiAI-Master-Spec.md` — full product spec (hard rule from CLAUDE.md)
4. `Project-Docs/BohdiAI-Roles-Workflow.md`
5. `Project-Docs/Phase-1-Decisions-Log.md` — D1–D31
6. `Project-Docs/Phase-1-Spec.md` — current phase spec
7. **`Project-Docs/Layout-Language.md`** — architecture record for the layout engine (cleaned of controlling language in session 12)
8. **`project-docs/Bohdi-Build-Quality-Design.md`** — the top-goal design notes from session 14 (why Bohdi makes slop, the NOW build, the guardrails). Read after the Session Brief.
8. Memory at `~/.claude/projects/C--Projects-BohdiAI/memory/MEMORY.md` and the linked files — especially `feedback_stop_asking_when_obvious.md` (new this session), `feedback_run_migrations_yourself.md` (new this session), and the other persistent feedback files

---

## What's in the DB

Database is empty. No tenants. design_choices empty. design_tokens empty. style_sheets empty. content_pages empty. Storage buckets empty.

Niches table: 19 niches at `status=approved` including `candles`. `candles` is the only one wired to the layout-engine path; `leatherworker` and `photo_magnet_maker` stay on the legacy Bohdi block path; the other 16 stay on the legacy one-shot pipeline (paused per Alex this session).

Migrations applied through `20260530000003`.

Migration runner: `node scripts/db-migrate.mjs` (Claude runs this directly — see feedback_run_migrations_yourself).

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output), `tenant-logos` (active — uploaded logos). All empty.

---

## Critical env var note

(Unchanged.) Claude Code injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into child processes. `.env.local` cannot override these. Fix: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` with explicit `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. `.env.local` must also have `FAL_API_KEY`. Vercel needs both env vars set in the dashboard for production deploys.

---

## Tasks at end of session 13

```
#1. [completed] Test pure-logic utilities (sanitize, moods, name-gender, progress, rate-limit, feature-flags, style-sheet, style-sheet-loader)
#2. [completed] Test layout module (intent, content, primitives, tree validator, resolved, resolver-supabase)
#3. [completed] Test Bohdi module (types, layout-engine-niches, system-prompt, layout-tools, tools, run)
#4. [completed] Test generation pipeline (replace local-schema tests with real imports; cover write-storefront-layout, generate-collections, generate-subscriptions, generate-tokens)
#5. [completed] Test thin SDK adapters (anthropic, fal, supabase-browser, supabase-server) and onboarding (run-storefront, ticker-content)
#6. [completed] Final coverage pass — all four metrics over 90%
#7. [completed] Widen CI workflow to run on feature branches
#8. [completed] Gate Bohdi's tools by niche (#8 backlog)
#9. [completed] Drop voice onboarding step (#9 backlog)
#10. [completed] Renderer fixes — band contentWidth, overlap scrim, collection empty-image card, text mobile role (#1, #4, #5, #6 backlog)
#11. [completed] Teach Bohdi the real storefront routes (#3 backlog)
```

All planned session 13 work complete. Task list resets next session.

---

## Session 12 test results — backlog (most items closed in session 13)

The first candles canary generated successfully in session 12 (cathys-candles, 7:41 build, $0.75, 14 turns). Two production bugs were fixed during that test (StepBuild AbortController teardown in Strict Mode; MAX_TOKENS bumped 4096→16000). Alex's eye on the live result produced 11 backlog items. State of each as of end of session 13:

1. **Hero scrim when text on image.** ✅ DONE session 13. Overlap got a `scrim: 'none' | 'light' | 'dark' | 'auto'` field; default auto injects a gradient sibling between image and layered text.

2. **Marquee works great.** No action needed.

3. **Bohdi invents URLs.** ✅ DONE session 13. Layout-engine system prompt now enumerates the canonical routes (`/`, `/about`, `/shop`, `/listings/{slug}`, `/collections`, `/collections/{slug}`, `/subscriptions`, `/cart`, `/contact`, `/#events`). Button tool description repeats the list at the point of decision. Did NOT change Button to format hrefs from a pattern — kept free-text so external URLs and anchors still work; the prompt + tool description is the constraint.

4. **Collection cards collapse when no image.** ✅ DONE session 13. CollectionGrid + FeaturedCollection render text-only card with palette background + foreground when resolved collection has no `imageUrl`. Underlying gap (collections table has no `image_url` column) still applies — would still need a column + dashboard upload to give collections real images.

5. **Bands too wide.** ✅ DONE session 13. Band gained `contentWidth: 'narrow' | 'normal' | 'wide' | 'full'`; default normal (~max-w-5xl, 1024px) centered. `'full'` opts out for true full-bleed. Outer section still bleeds for backgrounds; inner div caps content.

6. **Mobile text scrunched.** ✅ DONE session 13. Text node gained `mobile: { role? }`. Default behavior: auto-step one role down on mobile (headline→sub, sub→body, body→caption). Explicit mobile.role wins.

7. **Still feels stacked.** OPEN. Bohdi reaches for vertical band stack as the safe geometry. Three real forks pending Alex's direction: art-director second-agent pass; prefab partial-tree patterns Bohdi can study; lean harder in the prompt only. Session 13 did NOT touch this — needs Alex's call.

8. **Speed/cost (tools gated by niche).** ✅ DONE session 13. `toolsForNiche(slug)` in `lib/bohdi/tools.ts` filters the tools list. Layout-engine niches no longer see set_tokens / set_home_page / set_secondary_pages_copy / set_about_page / set_hero_image / set_about_image. Should cut several turns and a chunk of token cost per candles build. Needs a fresh canary to measure the actual win.

9. **Drop voice onboarding step.** ✅ DONE session 13. StepVoice deleted; onboarding is 6 steps; voiceBoothPitch / voiceNegativeSpace removed from every layer; Bohdi writes the about from niche + mood + shop name. About page still ships.

10. **Replace build ticker + personalized status copy.** OPEN. Alex doesn't like the rotating tip ticker or the "Sarah, choosing your colors…" personalized status. My lean is "show the real work as it lands" — palette swatches appear as authored, fonts appear with sample text, product images pop in as fal returns them. Pending Alex's call on direction.

11. **CI Test workflow failing.** ✅ DONE session 13. Coverage gate failed for most of the project's history at ~13% lines / 9% branches. Wrote 28 new test files; final coverage 99.73% lines / 96.93% branches / 100% funcs / 99.45% stmts. Also widened `.github/workflows/test.yml` to trigger on all branch pushes (was main-only, which is why feature branches couldn't prove green). The fix surfaced and was banked as `feedback_tests_are_part_of_done.md` — tests are part of done from this session forward, not a follow-up.

## Open at end of session 13

- Items #7 (monotonic stacking) and #10 (build screen UX) — both need Alex's direction before more code.
- Database is empty (cathys-candles wiped). Next candles canary should be run against the session-13 build to measure the speed/cost win from item #8 and verify the renderer fixes (#1, #4, #5, #6) look right in a real generation.
- CI ran for the first time on a feature branch when session 13's commits pushed. Confirm the workflow is actually green on `session-12/layout-engine` before merging to main.
- Branch `session-12/layout-engine` carries both session 12 and session 13 work. Naming is now misleading — eventually rebranch or just merge to main and drop it.


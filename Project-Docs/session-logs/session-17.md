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


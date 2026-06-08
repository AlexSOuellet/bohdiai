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


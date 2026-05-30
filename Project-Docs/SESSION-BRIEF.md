# Session Brief — BohdiAI

**Last updated:** 2026-05-29 (Session 12 — layout engine landed end-to-end for candles. Schema + renderer + tokens + Bohdi tools + system prompt branch + finalize branch + new write RPC + storefront route + bound-content resolver all on `session-12/layout-engine`.)

**Update at the end of every session.**

---

## Action at session start

**Read this whole brief before the first response.** Session 12 built the layout engine end-to-end for a single niche (candles) and wired everything from Bohdi's compose tool through to the storefront render. Database is still empty — the candles canary has not been generated yet. The very next thing in the next session is to TEST this by running candles × one mood end-to-end and seeing what comes out. Testing costs money so the goal across session 12 was to land as much as possible BEFORE the first test. We did.

Session 12 work is committed on branch `session-12/layout-engine` and pushed. Five commits on top of main (main was fast-forwarded with session 11's work at the start of session 12):

- `2493602 feat(session-12): layout language schema (intent, content nodes, primitives, page tree, validator)`
- `14379ab feat(session-12): layout renderer + bound-content resolver scaffold`
- `d0f24af feat(session-12): style_sheets table + StyleSheet schema + token compiler`
- `3ff2863 feat(session-12): Bohdi gets set_style_sheet + set_layout tools`
- `b283f5d feat(session-12): content_pages.layout_tree column`
- `9e4a86c feat(session-12): wire layout engine end-to-end for candles niche`
- `dac4fb5 refactor(session-12): drop legacy block fallback from storefront route`
- `a1e75c4 feat(session-12): bound-content resolver wired end-to-end`
- (this brief commit will be the next one)

Three migrations applied to the linked Postgres:
- `20260530000001_style_sheets.sql` — per-tenant named palette/font roster/texture set as JSONB
- `20260530000002_content_pages_layout_tree.sql` — optional JSONB layout_tree column on content_pages
- `20260530000003_write_tenant_storefront_layout.sql` — RPC that atomically writes tenant + style_sheet + content_pages with layout_tree + collections + listings + subscriptions

The dev server was NOT started in this session — Alex manages his own per `feedback_no_preview_unless_asked`.

---

## How Claude works with Alex (operating rules for the assistant)

These are throughline rules for every session, not just session 12. The new rules from session 12 sit at the top.

**Stop asking when the answer is obvious.** New as of session 12, banked at `feedback_stop_asking_when_obvious.md`. Surface real trade-offs, not industry-standard defaults. Don't overcompensate after a "keep me in the loop." The failure mode this session: I asked three obvious questions about renderer defaults (CSS variables for tokens, RSC vs client, data fetching separation) all of which had only one reasonable answer. Alex called it overcompensating. Real forks get surfaced; mechanical decisions get made.

**Run migrations yourself.** New as of session 12, banked at `feedback_run_migrations_yourself.md`. After committing a SQL migration, run `node scripts/db-migrate.mjs`. Don't surface it as a manual step for Alex.

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

## Tasks at end of session 12

```
#1.  [completed] Write lib/layout/intent.ts
#2.  [completed] Write lib/layout/content.ts
#3.  [completed] Write lib/layout/primitives.ts
#4.  [completed] Write lib/layout/tree.ts
#5.  [completed] Write lib/layout/index.ts
#6.  [completed] Write scale + intent helpers
#7.  [completed] Write 10 primitive renderers
#8.  [completed] Write 18 content node renderers
#9.  [completed] Write Node dispatcher + Page wrapper
#10. [completed] Write bound-content resolver scaffold
#11. [completed] Add Tailwind content path (already covered)
#12. [completed] Write style_sheets migration
#13. [completed] Write StyleSheet Zod schema
#14. [completed] Write style-sheet loader + emitter
#15. [completed] Extend BohdiAccumulator
#16. [completed] Write set_style_sheet + set_layout tools
#17. [completed] Wire new tools into Bohdi tools.ts
#18. [completed] Add layout_tree column to content_pages
#19. [completed] Wire finalize for layout-engine niches
#20. [completed] Branch Bohdi system prompt by niche
#21. [completed] Storefront route reads layout_tree
#22. [completed] Wire resolver fetchers to Supabase
#23. [completed] Renderer reads resolved data via context
#24. [completed] Storefront route resolves before rendering
```

All session 12 build work complete. Task list resets next session.

---

## Session 12 test results — backlog for next session

The first candles canary generated successfully (cathys-candles, 7:41 build, $0.75, 14 turns). Storefront is live at `cathys-candles.localhost:3000`. Two production bugs were fixed during the test (committed at the end of the session):

- StepBuild's AbortController cleanup was tearing down the fetch in React Strict Mode (dev). Removed.
- MAX_TOKENS bumped from 4096 to 16000 — a single set_layout call emits a large JSON tree and was capping out.

Alex's eye on the live result, in his words and order:

1. **Hero is solid.** Big editorial image, eyebrow + headline + sub. Likes the shape. Two issues underneath: some text on the photo is hard to read where the background is bright, and the renderer's contrast enforcement only works against palette colors, not image pixels. Fix path: when an image node has a text node placed on top (overlap), the renderer should automatically lay a scrim band so contrast is enforced.

2. **Marquee with the scent names works great.** Bohdi reached for the marquee primitive on his own. Good sign that primitive earns its place.

3. **Bohdi invents URLs.** A featured-product band linked to `/shop/honey-and-beeswax` (404). Real listing route is `/listings/{slug}`. The layout-engine system prompt does not enumerate the real routes — the legacy prompt did. Fix path: spell out the routes in the prompt AND probably teach button/featuredProduct nodes to format hrefs from known patterns rather than free-text.

4. **Shop page collection thumbnails are huge empty boxes.** Collections table has no image_url column (already flagged in this brief). With no image, the placeholder fills the cell. Light text on light pane on top of that — illegible. Fix path: collapse the collection card to a text-only card shape when there's no image, and the contrast enforcement should catch the light-on-light text.

5. **"Pages feel overrun and too big."** Bands render full-width with no inner max-width on the content. Real editorial caps content at 1100-1280px centered while bands themselves can bleed for backgrounds. Fix path: bands default to a centered content max-width with a `width: 'full'` opt-in for true full-bleed.

6. **"Mobile text gets scrunched."** Narrow viewport collapses text into cramped layouts. Need to audit responsive type scale and gutter behavior on the small-end. Renderer applies the mobile knob per primitive but text nodes themselves don't currently scale type.

7. **Still feels stacked.** Every band on top of the next band. No split, no overlap, no bleed. Bohdi reached for the safest geometry — vertical band stack. Fix path: this is where the art-director pass comes in, calling a page out when its rhythm is monotonic. Until that ships, can lean harder in the prompt OR can prefab partial trees (patterns) Bohdi can study.

8. **Speed/cost.** 7:41 is too slow. $0.75 per generation is expensive at the per-tenant level. The single biggest leak: Bohdi has the full toolbox visible — he called set_tokens + set_secondary_pages_copy + set_about_page + set_hero_image + set_about_image (all legacy) alongside set_style_sheet + set_layout. That's 2-3 wasted turns and a lot of token cost. Fix path: gate the tools list by niche too (not just the system prompt). Layout-engine niches see layout tools + shared only.

Alex's onboarding-step feedback (banked here so it's not lost):

9. **Drop the booth pitch voice step.** A 1-2 sentence pitch can't carry a 1500-3500 character about page, so Bohdi invents the rest and the result reads generic. Approved direction: drop the voice step entirely, Bohdi writes the about from niche + mood + shop name as a polished sample the maker rewrites in post-onboarding personalization. The about page itself stays — every storefront ships with one, no blanks.

10. **Replace the build ticker + personalized status updates with something better.** Alex doesn't like the rotating tip ticker or the "Sarah, choosing your colors…" personalized status copy. My lean is "show the real work as it lands" — palette swatches appear as Bohdi authors them, fonts appear with sample text, product images pop in as fal returns them. Real artifacts of the build, not curated tips. Pending Alex's final call on direction.

Suggested order for next session (Alex's call): #8 (gate tools by niche — speed win) and #9 (drop voice step) are mechanical and unblock cleaner subsequent testing. #1, #4, #5, #6 are renderer fixes. #3 is prompt + minor renderer change. #7 and #10 are the bigger UX/architecture moves.

11. **CI Test workflow has been failing on every push since session 7.** Coverage gate fails: `lib/**` at ~17% lines / 16% functions / 12% branches vs the Engineering Standards 90% threshold. Chronic, not caused by session 12. Three paths: write enough tests to hit 90% (huge ongoing task), drop the threshold to a realistic baseline and raise it incrementally as tests are added, or disable the gate while shipping. Pending Alex's call.


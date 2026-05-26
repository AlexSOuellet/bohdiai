# Session Brief — BohdiAI

**Last updated:** 2026-05-26 (Session 5 — onboarding audit + integration test)

**Update at the end of every session.**

---

## State of the build

The generation pipeline is working end-to-end and fully tested. Session 5 was a full audit of all onboarding code against project rules, followed by fixing everything found. All hardcoded values, dead code, missing tests, and engineering standards violations have been remediated. The storefront write now goes through an atomic Postgres RPC transaction. Integration tests run against the real Supabase database.

**Known remaining gaps (do not start the session without reading these):**
- `/shop`, `/contact`, `/gallery` pages do not exist — they are 404s.
- The AI generates only the home page. Multi-page generation is the top priority for next session.
- No contact form block exists yet.
- Dark-and-stormy still favors cinematic hero — partially mitigated by removing steering language, but may need more testing.
- Hero images are newly niche-specific (prompt fixed this session) but untested at scale across all niches.

---

## What was built this session

### Onboarding full audit and remediation

All onboarding code was audited against the Engineering Standards and project rules. Every violation was fixed:

- **Hardcoded hex values** — `StepMood.tsx` selection ring was using `#e9a13d` and `#e9a13d40`. Replaced with `var(--honey)` and Tailwind `ring-honey/25`.
- **Dead code removed** — `StepProducts.tsx` deleted (not in spec, never wired into the wizard).
- **toSubdomain moved** — extracted from `app/onboarding/_components/types.ts` to `lib/subdomain.ts` so it can be unit tested. 16 unit tests added covering all edge cases.
- **Type guard replacing `as` cast** — `StepBuild.tsx` used `data.moodKey as MoodKey`. Replaced with `isMoodKey()` type guard.
- **`key={i}` → `key={label}`** in animation steps array.
- **User-facing error messages** — raw `err.message` was being shown to users. Now logs internally and shows a friendly "Go back and try again" message.
- **Feature flag gate** — `app/onboarding/page.tsx` now calls `isFeatureEnabled('onboarding')` and returns `notFound()` if disabled. New `lib/feature-flags.ts` module. New `feature_flags` DB table (migration `20260526000003`).
- **`generateStorefront` split** — public wrapper handles rate limiting, try/catch, and logging. Internal `runGeneration` does the actual work. `checkGenerationRateLimit()` call was accidentally dropped in a refactor; restored.
- **Pricing copy** — "14 days free" → "7 days free", $39 → $35 per `StepTrial.tsx` spec.

### Atomic RPC transaction

`lib/generation/write-storefront.ts` rewrote to call a single Postgres RPC (`write_tenant_storefront`) that wraps all 5 DB inserts (tenant, design_tokens, content_pages, page_blocks, listings) in one transaction. Partial-write state is no longer possible. Migration `20260526000002`.

### Integration tests against real Supabase

`lib/generation/write-storefront.test.ts` — 3 tests that write to and read from the real Supabase database:
1. Creates tenant, tokens, page, and blocks correctly.
2. Creates listings when provided.
3. Rolls back everything if the subdomain is already taken.

`afterEach` cleans up in reverse FK order. Tests skip when `CI=true` (CI has dummy credentials). `vitest.global-setup.ts` added to inject `.env.local` into `process.env` via Vite's `loadEnv` before any test file loads.

### Schema validation tests

- `lib/generation/generate-page.test.ts` — 9 schema tests for `GeneratedPageSchema`
- `lib/generation/generate-listings.test.ts` — 8 schema tests for `GeneratedListingsSchema`

### CI fix

`npm run build:manifests` added to the workflow before typecheck. `blocks-manifest.generated.ts` doesn't exist in CI until explicitly built; all downstream TS errors were from this missing file.

### database.types.ts updated

Added `feature_flags` table types. Added `write_tenant_storefront` function signature.

---

### Block description overhaul (all 15 blocks)
All block meta.ts files were rewritten to be pure structural descriptions — what the layout looks like, not when to use it. All steering language ("best for X mood", "suits dramatic brands", etc.) was removed. moodFit opened to all 7 moods on every block so the AI is free to choose any block for any mood.

### Hero selection bias fixes
- `lib/generation/generate-page.ts` — Rule #1 rewritten: removed per-variant guidance ("cinematic suits dramatic brands, split-gallery suits image-heavy brands") which was overriding all other guidance. AI now reads block descriptions and chooses.
- `lib/generation/generate-page.ts` — `shuffled<T>()` Fisher-Yates shuffle added. Hero blocks and products blocks are independently shuffled before context is built, eliminating position bias.
- `lib/moods.ts` — `blockAssemblyHint` for dark-and-stormy had "full-bleed editorial hero" which was pointing directly at hero-cinematic. Removed.

### Mood token color fixes
- `lib/moods.ts` — All 7 mood `tokenHints.palette` strings rewritten to explicitly assign colors to roles (background, surface, text, accent, border) with hex ranges. Previously the AI was misassigning primary colors to the background slot (e.g. forest green as rustic background).
- `lib/generation/generate-tokens.ts` — Removed "be surprising, push into unexpected territory" instruction that was actively encouraging wrong color role assignments (it literally suggested "a deep forest green background" as an example of distinctiveness, which rustic was following).

### Hero image prompt fixes
- `lib/fal.ts` — `generateHeroImage` prompt rewritten to be niche-specific only. Removed `${moodLabel}` (was making FLUX generate mood-themed landscapes instead of craft images). Removed "or natural setting" escape hatch (was generating garden/outdoor scenes for studio crafts). New prompt: maker's workshop, close-up details of materials/tools/finished work, real working studio environment.
- `lib/fal.ts` — `shopName` and `moodLabel` parameters removed from `generateHeroImage` signature (no longer used).
- `app/onboarding/actions.ts` — Updated call site to match new signature.

### Hero cinematic overlay lightened
- `blocks/hero-cinematic/index.tsx` — Gradient overlays reduced: bottom `from-black/80 via-black/40 to-black/60` → `from-black/70 via-black/20 to-black/30`. Left `from-black/70 via-black/30` → `from-black/60 via-black/20`. Images were being crushed to near-black even when niche-specific.

### Hero split-gallery text overflow fix
- `blocks/hero-split-gallery/index.tsx` — `formatHeadline` rewritten to always render `flex-col` (was going `md:inline` on desktop, causing long headlines to overflow the right panel). Explicit font sizes added to both spans (`text-3xl md:text-4xl lg:text-5xl` for italic kicker, `text-4xl md:text-5xl lg:text-6xl` for bold main). `sf-text-hero` removed from h1 since child spans now own sizing.

### Products split-carousel price badge
- `blocks/products-split-carousel/CarouselWrapper.tsx` — Price badge styling changed to `bg-black` (opaque) with `text-s-accent`. Previous `bg-s-surface/90 text-s-accent` was low-contrast on some moods; `bg-black/70 text-white` was rejected as looking cheap. Final: opaque black pill, mood accent color text.

### Products bloom-grid price badge
- `blocks/products-bloom-grid/index.tsx` — Price badge changed from `bg-s-accent text-white` to `bg-black/70 text-white` (accent can be any color including light ones).

### Inspiration URL field removed
- `app/onboarding/_components/StepMood.tsx` — URL inputs removed (3 fields for "sites you love").
- `app/onboarding/_components/types.ts` — `inspirationUrls` field removed from `OnboardingData` and `INITIAL_DATA`.
- Feature was unimplemented (collected data but nothing in the generation pipeline used it) and unspecced. Removed cleanly. Can be re-added when properly specced.

### mood_key stored on tenants
- `supabase/migrations/20260526000001_tenants_mood_key.sql` — Added `mood_key text` column to tenants table.
- `lib/database.types.ts` — Added `mood_key` to Row, Insert, Update types.
- `lib/generation/write-storefront.ts` — `moodKey` now written to tenants row.
- `app/onboarding/actions.ts` — `moodKey` passed to `writeStorefront`.

---

## What's working / verified

- Full onboarding → storefront generation pipeline
- nav-split renders on every storefront (system-injected)
- Hero variety: AI now receives shuffled block list and neutral descriptions — bias significantly reduced
- Mood palettes: rustic generates cream/parchment backgrounds, not forest green; dark-and-stormy generates near-black
- Hero images: niche-specific (letterpress printer gets a printing workshop, candle maker gets a candle studio)
- Products split-carousel price badge readable on all moods
- Atomic DB write — all 5 tables in one transaction, rolls back on any failure
- Integration tests: 3 tests against real Supabase, all passing
- 77 tests passing, TypeScript clean

---

## Layers completed

**Layer 1 — done:** Storefront resolver, Supabase Auth, middleware proxy.
**Layer 2 — done:** Moods, design tokens, block/widget types, manifest build script, onboarding wizard.
**Layer 3 — done:** Generation pipeline (tokens + page + listings + images), DB writes, rate limiting.
**Layer 4 — done:** Storefront renderer, block registry.
**Layer 5 — done:** fal.ai image generation, block variants, animation system, design quality overhaul.
**Layer 6 — done:** Storefront QA, nav, generation correctness.
**Session 4 — done:** Generation quality pass. Hero variety, mood color fidelity, image prompt accuracy, block descriptions, overlay tuning.
**Session 5 (this session) — done:** Onboarding audit + remediation. Atomic RPC transaction. Integration tests. CI fix.

---

## Top priority for next session

**Multi-page generation.** The AI currently generates only the home page. Every storefront needs secondary pages and the AI should generate all of them in one generation run.

Pages to build:
- `/shop` — product listing grid (queries `listings` for the tenant, renders in a grid)
- `/contact` — contact form with Resend submission (not mailto — build it right)
- `/gallery` — portfolio/gallery page for artist/doer niches

Architecture:
1. Build the Next.js route files for each page (same pattern as `app/storefront/page.tsx` — read blocks from DB by slug)
2. Build a `contact-form` block (name/email/message, submit to a new `/api/contact` route that sends via Resend)
3. Build a `gallery` block or adapt existing products blocks for a gallery layout
4. Extend `generatePage` (or create `generateSecondaryPages`) to generate blocks for each relevant secondary page
5. `writeStorefront` saves all pages to `content_pages` + `page_blocks`
6. Update generation prompt: give the AI valid page routes (`/shop`, `/contact`, `/gallery`) so CTAs link to real pages with appropriate copy

Pages generated for every tenant:
- Home (always)
- /shop (always — every seller needs a shop page)
- /contact (always — every maker needs a contact page)

Gallery:
- The /gallery route exists but is not generated by default
- The maker enables it after the fact from the dashboard
- Exception: if the home page generation produces a CTA that links to /gallery, OR any content that implies a gallery exists (e.g. "See Our Custom Work", "Browse Past Projects", "View the Portfolio"), generate the gallery page content at build time so nothing is dead on arrival
- Gallery is not limited to portfolio/doer businesses — woodworkers, jewelers, ceramicists all benefit from showing custom/process work

Once secondary pages exist, relax the CTA href constraint in `generate-page.ts` to allow real page routes.

---

## Open items

1. **Streaming build progress** — `StepBuild` animation is a cosmetic timer. Swap for real SSE streaming.
2. **Doer storefront rendering** — what does a seller+doer storefront look like vs pure seller?
3. **Spec touch-up** — Master Spec `.docx` files haven't been updated to reflect D1–D20.
4. **StepTrial copy** — billing placeholder at $35/month. Confirm exact price before wiring Stripe.
5. **Per-tenant AI usage caps (Phase 2 dashboard)** — 100 AI calls/month included, additional 100 for $5.
6. **Etsy/Shopify import (Phase 2)** — products + photos. Customer list not possible (Etsy withholds buyer emails).
7. **Marketing copy update** — drop "live in minutes." New angle: "A beautiful, full-content site — just add your personal touches and products and you're live."
8. **Rate limit reset** — `lib/rate-limit.ts` MAX_PER_WINDOW is 20 for dev. Reset to 3 before launch.
9. **Sentry + PostHog** — Alex has not signed up yet. Wire up when accounts exist.
10. **hero-editorial** — needs more testing across moods/niches. Was previously narrowed but now opened to all moods.
11. **Inspiration URL / site reference** — removed this session (unimplemented). Needs a proper spec before rebuilding. Intent: maker pastes a URL to a site they like for inspiration; AI uses it to inform tone and feel. Not copying — inspiration only.
12. **Block swap in dashboard** — no mechanism for makers to swap one block variant for another post-generation. Not in Phase 1 scope but noted as a gap.
13. **Dark-and-stormy hero variety** — still needs more test runs to confirm cinematic bias is fully resolved.

---

## Critical env var note

Claude Code injects its own `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into all child processes. `.env.local` cannot override these. Fix: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` with explicit `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. Do not rename this back.

`.env.local` must also have `FAL_API_KEY` from fal.ai dashboard.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `project-docs/SESSION-BRIEF.md` — this file
3. `project-docs/BohdiAI-Master-Spec.md` — full product spec (read in full, every session)
4. `project-docs/BohdiAI-Roles-Workflow.md`
5. `project-docs/Phase-1-Decisions-Log.md` — D1–D19
6. `project-docs/Tech-Arch-Spec.md` — database design
7. `project-docs/Phase-1-Spec.md` — current phase spec

---

## What's in the DB

38 tables. 18 niches (status=approved). Multiple test tenant rows. All migrations applied through `20260526000003`.

- `20260526000002` — `write_tenant_storefront` RPC
- `20260526000003` — `feature_flags` table, seeded with `('onboarding', true)`

Migration runner: `node scripts/db-migrate.mjs`

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output).

---

## Lessons banked

**Claude Code env collision.** Claude Code injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into child processes. Always use `BOHDIAI_ANTHROPIC_KEY`.

**fal.ai concurrent limits.** New accounts hit rate limits with 5 simultaneous FLUX Pro requests. Batch product images 2 at a time. Generate hero image after text generation completes, not alongside.

**Token generation color role assignment.** Without explicit role assignments in palette hints (background = X, accent = Y), the AI will freely swap colors across roles. "Forest green primary" becomes forest green background. Always specify which hex range goes on which CSS variable.

**"Be surprising" backfires.** Telling the AI to avoid predictable palettes caused it to put wrong colors in wrong roles. The instruction literally gave "deep forest green background" as an example of distinctiveness — and rustic shops followed it. Distinctiveness should come from shade variation within a role, not from swapping colors across roles.

**Block description language is selection criteria.** Any phrase in a block description that sounds like a use case ("suits dramatic brands", "best for story-forward shops") will be used by the AI to select or reject that block. Descriptions must be purely structural — what the layout looks like, not when to use it.

**blockAssemblyHint steers hero selection.** "Full-bleed editorial hero" in dark-and-stormy's blockAssemblyHint was pointing directly at hero-cinematic every time. Mood assembly hints must not name layout shapes — they should describe narrative emphasis and section order only.

**Hero image "or natural setting" = garden.** Giving FLUX an escape hatch to "natural setting" results in generic outdoor/garden photography for any niche in a nature-adjacent mood. Remove the escape hatch. Always anchor to the specific craft: "maker's workshop, materials, tools, finished work."

**moodFit must be a real constraint.** Setting moodFit as a "suggestion" caused the AI to always gravitate to the most-capable-sounding hero variant. Enforce moodFit as a rule or all sites look the same.

**Don't estimate.** Frame work by dependencies and sequencing, not weeks or days.

**ScrollReveal on hero card.** Hero card starts at opacity 0 — if IntersectionObserver doesn't fire (timing, margin, hydration), card stays invisible. Never wrap the hero card in ScrollReveal. Hero is above the fold and should render immediately.

**Hero image field key varies by block.** `hero-split-screen` uses `backgroundImageUrl`, `hero-split-gallery` uses `primaryImageUrl`. Injection must look up the field key from the block's content schema, not hardcode it.

**Transparent nav doesn't work on split-screen heroes.** The nav sits over both the photo (dark) and the card panel (light) simultaneously. No single text color works on both. Always use a solid background.

**CSS custom property opacity modifiers don't work as expected.** `bg-s-background/95` renders nearly transparent because Tailwind can't compose opacity with arbitrary CSS variable values. Use `bg-s-background` (no modifier) for reliable solid backgrounds.

**Vitest doesn't auto-inject `.env.local` into `process.env`.** Vitest uses Vite's loadEnv, but the injected vars land in `import.meta.env`, not `process.env`, in the Node test runner. Use a `globalSetup` file that calls `loadEnv('test', process.cwd(), '')` and manually copies values into `process.env` (skipping any already set, so CI workflow vars win).

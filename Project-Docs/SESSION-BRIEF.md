# Session Brief — BohdiAI

**Last updated:** 2026-05-25 (Session 2 — fal.ai images live, block variants built, design system overhauled)

**Update at the end of every session.**

---

## State of the build

The generation pipeline is fully working end-to-end. Running the onboarding flow produces a real storefront with:
- AI-generated design tokens (colors, fonts, spacing)
- AI-generated copy (headlines, about text, testimonials, product names/descriptions)
- fal.ai FLUX Pro images for hero background + up to 4 product photos
- Multiple block variant options the AI chooses between
- Framer Motion scroll-reveal animations on hero blocks
- Grain texture overlay via `sf-noise-grain`

The storefront renderer is live at `[shop].localhost:3000` via the middleware proxy.

---

## What was built this session

**Image generation (replaces Pexels):**
- `lib/fal.ts` — fal.ai FLUX Pro client. `generateProductImage()` and `generateHeroImage()`. Downloads and caches to Supabase Storage `generated-images` bucket. Falls back to direct fal.ai URL if storage fails.
- `lib/pexels.ts` — deleted
- `lib/env.ts` — `FAL_API_KEY` replaces `PEXELS_API_KEY`
- `supabase/migrations/20260525000003_storage_generated_images.sql` — new public bucket
- `next.config.js` — fal.ai CDN domains added, Pexels removed
- Product images batch 2 at a time to avoid fal.ai concurrent rate limits
- Hero image generates after AI text calls complete (not alongside) to avoid rate limits

**Block variants (5 new blocks built by Cowork):**
- `blocks/hero-cinematic/` — full viewport, bottom-gradient, dramatic typography, Framer Motion entrance
- `blocks/hero-split-gallery/` — split panel layout
- `blocks/hero-split-screen/` — split screen layout
- `blocks/products-bloom-grid/` — editorial product grid variant
- `blocks/products-editorial-grid/` — editorial product layout
- `blocks/products-split-carousel/` — split carousel layout

**Animation system:**
- Framer Motion installed
- `components/storefront/ScrollReveal.tsx` — reusable scroll-triggered reveal wrapper, respects `prefers-reduced-motion`

**Storefront navbar:**
- `components/storefront/` — NavStorefront component built by Cowork

**Design system fixes:**
- `app/globals.css` — `sf-noise-grain` class added inside `@layer components` (grain texture overlay), CSS syntax error fixed
- Token generation prompt hardened to produce opinionated, varied palettes — not always the "obvious" color for a mood
- Copy generation prompt hardened with banned phrases and creative copywriter mandate
- `generate-page.ts` — AI now chooses any hero/products variant, not hardcoded to `hero-editorial`/`products-grid`

**Pricing locked:**
- D19 revised: $35–$39/month (working number: $35). AI usage: 100 calls/month included, 100 more for $5. Onboarding excluded from cap.

**Rate limit:**
- `lib/rate-limit.ts` — bumped to 20/hour for development testing. TODO: reset to 3 before launch.

---

## What's working / verified

- Full onboarding → storefront generation pipeline
- fal.ai hero image injection into hero block content
- fal.ai product images cached in Supabase Storage
- Cinematic hero with real photo looks genuinely impressive (Sue's Bakery test)
- Grain texture, scroll animations, varied palettes all rendering
- TypeScript clean, all 23 tests passing

---

## Layers completed

**Layer 1 — done:** Storefront resolver, Supabase Auth, middleware proxy.

**Layer 2 — done:** Moods, design tokens, block/widget types, manifest build script, onboarding wizard.

**Layer 3 — done:** Generation pipeline (tokens + page + listings + images), DB writes, rate limiting.

**Layer 4 — done:** Storefront renderer (`app/storefront/layout.tsx`, `app/storefront/page.tsx`, block registry).

**Layer 5 (this session) — done:** fal.ai image generation, block variants, animation system, design quality overhaul.

---

## Next priorities

1. **More block variants** — remaining moods need hero variants. The 5 moods without `hero-cinematic` still fall back to `hero-editorial`. Hand the updated skill doc to Cowork.
2. **Navbar wiring** — `NavStorefront` was built but needs to be wired into `app/storefront/layout.tsx` with tenant shop name fetch.
3. **Session brief says** open items 1–8 below.

---

## Open items

1. **Streaming build progress** — `StepBuild` animation is a cosmetic timer. Swap for real SSE streaming so each step lights up as real work completes.
2. **Doer storefront rendering** — product design hasn't settled what a seller+doer storefront looks like.
3. **Spec touch-up** — Master Spec `.docx` files haven't been updated to reflect D1–D20. Alex to handle when timing allows.
4. **StepTrial copy** — billing placeholder at $35/month. Confirm exact price ($35 vs $39) before wiring Stripe.
5. **Per-tenant AI usage caps (Phase 2 dashboard)** — 100 AI calls/month included, additional 100 for $5. Onboarding excluded from cap. Build when dashboard exists.
6. **Etsy/Shopify import (Phase 2)** — exit ramp positioning. Products + photos in Phase 2, reviews stretch goal. Customer list not possible (Etsy withholds buyer emails).
7. **Marketing copy update** — drop "live in minutes." New angle: "A beautiful, full-content site — just add your personal touches and products and you're live." Emphasize conversational interface. Update `components/Hero.tsx` and `components/HowItWorks.tsx`.
8. **Rate limit reset** — `lib/rate-limit.ts` MAX_PER_WINDOW is 20 for dev testing. Reset to 3 before launch.
9. **Sentry + PostHog** — Alex has not signed up yet. Both are optional in env.ts. Wire up when accounts exist.

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

36 tables. 8 niches (status=approved). Multiple test tenant rows. All migrations applied through `20260525000003`.

Migration runner: `node scripts/db-migrate.mjs`

Storage buckets: `placeholder-images` (legacy, unused), `generated-images` (active — fal.ai output).

---

## Lessons banked

**Claude Code env collision.** Claude Code injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into child processes. Always use `BOHDIAI_ANTHROPIC_KEY`.

**fal.ai concurrent limits.** New accounts hit rate limits with 5 simultaneous FLUX Pro requests. Batch product images 2 at a time. Generate hero image after text generation completes, not alongside.

**Token generation defaults to safe.** Without explicit instruction to be opinionated, the AI returns the most expected palette for a mood every time. The prompt now explicitly bans this.

**Don't estimate.** Frame work by dependencies and sequencing, not weeks or days.

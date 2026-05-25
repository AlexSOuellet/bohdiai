# Session Brief — BohdiAI

**Last updated:** 2026-05-25 (Layer 3 complete — AI generation pipeline working end-to-end)

**Update at the end of every session.**

---

## Picking up next session

Layer 3 is complete and verified working. The next layer is the **storefront renderer** — the page that reads a tenant's tokens and blocks from the DB and renders their site at `[shop].bohdiai.com`.

**Layer 1 — done:**
- Storefront resolver live in `proxy.ts`. Reads `[shop].bohdiai.com`, looks up tenant by subdomain, injects `x-tenant-id` and `x-tenant-subdomain` into request headers. Unknown subdomains → 404.
- Supabase Auth wiring complete: `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `app/auth/callback/route.ts`, session refresh in proxy. Database types regenerated from live schema (all 36 tables).
- D19 locked: launch price is $25/month.
- Events, event_expenses migrations applied. event_id column on orders applied.

**Layer 2 — done:**
- Mood vocabulary locked (D20). 7 moods in `lib/moods.ts`.
- Design token type. `lib/tokens.ts` — DesignTokens Zod schema + `tokensToCssVars()` utility.
- BlockMeta / WidgetMeta types. `lib/blocks.ts`.
- First foundational block: `blocks/hero-editorial/`.
- First foundational widget: `widgets/cta-button/`.
- Manifest build script: `scripts/build-manifests.mjs`. Runs via predev/prebuild hooks.
- Onboarding scaffold complete. Five-screen wizard at `app/onboarding/`:
  - `page.tsx` — server page, fetches approved niches
  - `_components/OnboardingFlow.tsx` — state machine, accumulates `OnboardingData`
  - `_components/StepName.tsx` — shop name entry
  - `_components/StepNiche.tsx` — searchable dropdown niche picker + subdomain availability check
  - `_components/StepMood.tsx` — mood selection
  - `_components/StepTrial.tsx` — billing placeholder ($25/mo)
  - `_components/StepBuild.tsx` — calls `generateStorefront` on mount, shows animated progress, links to live storefront on completion
  - `_components/ProgressBar.tsx`, `_components/types.ts`
- 8 niches seeded (status=approved): candles, jewelry_maker, baker, soap_and_bath, ceramicist, woodworker, fine_artist, vintage_reseller.

**Layer 3 — done:**
- `app/onboarding/actions.ts` — two server actions:
  - `checkSubdomainAvailable(shopName)` — slugifies + queries tenants table, returns available/taken
  - `generateStorefront(input)` — orchestrates full generation pipeline, writes to DB
- `lib/anthropic.ts` — singleton Anthropic client. Uses `BOHDIAI_ANTHROPIC_KEY` (not `ANTHROPIC_API_KEY`) and hardcoded `baseURL: 'https://api.anthropic.com'` to avoid collision with Claude Code's injected env vars.
- `lib/generation/generate-tokens.ts` — Anthropic call → `DesignTokens` (colors, fonts, spacing, layout)
- `lib/generation/generate-page.ts` — Anthropic call → ordered block+content list (block key, position, content fields, slot widgets)
- `lib/generation/write-storefront.ts` — sequential admin DB writes: tenant → design_tokens → content_pages → page_blocks
- `lib/env.ts` — `BOHDIAI_ANTHROPIC_KEY` required server var.

**Verified working:** full onboarding run for a rustic woodworker generated authentic copy ("Made from the Wood. Built to Last Generations."), correct color palette (#F5EFE0 parchment background, rust accent), Zilla Slab + Lora fonts, all written to Supabase.

---

## Layer 4 — storefront renderer (next)

The page that makes `[shop].bohdiai.com` actually render something.

**What it needs to do:**
1. The subdomain resolver (`proxy.ts`) already injects `x-tenant-id` into every request to a tenant subdomain — that's done.
2. A catch-all route at `app/[...path]/page.tsx` (or a tenant-specific layout) reads `x-tenant-id` from headers, fetches the tenant's `design_tokens` (is_active=true) and `content_pages` + `page_blocks` for the requested slug.
3. Injects design tokens as CSS custom properties (via `tokensToCssVars()` — already built).
4. Renders blocks in position order using the block component registry.
5. Block components read their `content` JSON and render accordingly.

**Key files to build:**
- `app/storefront/layout.tsx` — tenant layout, injects CSS vars from design tokens
- `app/storefront/page.tsx` — home page, fetches and renders page blocks
- `blocks/hero-editorial/index.tsx` — the React component for the one block we have (meta already exists at `blocks/hero-editorial/meta.ts`)
- `widgets/cta-button/index.tsx` — the React component for the one widget we have
- A block registry (`lib/block-registry.ts`) mapping block keys to React components

**Note on routing:** The proxy already handles subdomain → tenant_id mapping. The storefront pages need to live under a route that the proxy rewrites to, or be a separate Next.js app. Check `proxy.ts` to understand how it currently routes tenant requests before building the renderer.

---

## Critical env var note

Claude Code injects its own `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into all child processes. `.env.local` cannot override these because the inherited env vars take precedence. The fix applied: use `BOHDIAI_ANTHROPIC_KEY` in `.env.local` instead, and pass it explicitly with `baseURL: 'https://api.anthropic.com'` in `lib/anthropic.ts`. Do not rename this back.

---

## Required reading at session start

1. `CLAUDE.md` at the project root
2. `project-docs/SESSION-BRIEF.md` — this file
3. `project-docs/BohdiAI-Master-Spec.md` — full product spec
4. `project-docs/BohdiAI-Roles-Workflow.md`
5. `project-docs/Phase-1-Decisions-Log.md` — D1–D20
6. `project-docs/Tech-Arch-Spec.md` — database design
7. `project-docs/Phase-1-Spec.md` — current phase spec
8. `.claude/skills/niche-writer/SKILL.md`
9. `content/niches/_queue.yaml`
10. `content/niches/candles.md`

---

## What's in the DB

36 tables. 8 niches (status=approved). At least 1 tenant row (the test woodworker run). All 6 migrations applied (000001–000005 + the original Phase 0 set).

Migration runner: `node scripts/db-migrate.mjs`

---

## Local environment

`.env.local` has (first line, no BOM):
- `BOHDIAI_ANTHROPIC_KEY=sk-ant-...` ← must be first or at minimum not last; file must end with a newline
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Resend, Sentry, PostHog, SITE_URL, FOUNDER_CAP vars

---

## Open items

1. **Storefront renderer** — next build target. Maker can't see their site yet.
2. **Streaming build progress** — `StepBuild` animation is cosmetic timer. After renderer exists, swap for real SSE streaming so each step lights up as real work completes.
3. **Doer storefront rendering** — product design hasn't settled what a seller+doer storefront looks like.
4. **Spec touch-up** — Master Spec `.docx` files haven't been updated to reflect D1–D20. Alex to handle when timing allows.
5. **StepTrial copy** — billing placeholder, confirm exact copy before wiring real Stripe.

---

## Lessons banked

**Claude Code env collision.** Claude Code injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into child processes. Any Next.js dev server started from Claude Code inherits these and `.env.local` cannot override them. Always use a project-specific key name (`BOHDIAI_ANTHROPIC_KEY`) for Anthropic API keys in this codebase.

**Don't estimate.** Frame work by dependencies and sequencing, not weeks or days.

**Push back is the job.** Staying with the SaaS shape and simplifying it was the right call.

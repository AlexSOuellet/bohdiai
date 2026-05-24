# Session Brief — BohdiAI

**Last updated:** 2026-05-24 (Layer 2 complete — onboarding scaffold done, 8 niches seeded)

**Update at the end of every session.**

---

## Picking up next session

Layer 2 is complete. Layer 3 (AI generation pipeline) is next.

**Layer 1 — done:**
- Events, event_expenses migrations applied. event_id column on orders applied.
- Storefront resolver live in `proxy.ts` (Next.js 16 renamed middleware → proxy). Reads `[shop].bohdiai.com`, looks up tenant by subdomain, injects `x-tenant-id` and `x-tenant-subdomain` into request headers. Unknown subdomains → 404.
- Supabase Auth wiring complete: `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `app/auth/callback/route.ts`, session refresh in proxy. Database types regenerated from live schema (all 36 tables).
- D19 locked: launch price is $25/month.
- Pre-existing Phase 0 type error in `confirm/route.ts` fixed.

**Layer 2 — done:**
- **Mood vocabulary locked (D20).** 7 moods: Dark and Stormy, Rustic, Warm and Cozy, Summer Afternoon, Wild Meadow, Bright Bazaar, Sunday Morning. Lives in `lib/moods.ts`.
- **Design token type.** `lib/tokens.ts` — DesignTokens Zod schema + `tokensToCssVars()` utility.
- **BlockMeta / WidgetMeta types.** `lib/blocks.ts` — schema the AI reads from manifests.
- **First foundational block.** `blocks/hero-editorial/` — story-first, typography-forward hero.
- **First foundational widget.** `widgets/cta-button/` — single CTA button, fills any CTA slot.
- **Manifest build script.** `scripts/build-manifests.mjs` — scans blocks/widgets, emits typed manifests. Runs via predev/prebuild hooks.
- **Onboarding scaffold complete.** Five-screen wizard at `app/onboarding/`:
  - `page.tsx` (server) — fetches approved niches, renders `<OnboardingFlow>`
  - `_components/OnboardingFlow.tsx` — state machine, accumulates `OnboardingData`
  - `_components/StepName.tsx` — shop name entry
  - `_components/StepNiche.tsx` — niche picker, fetches from niches table
  - `_components/StepMood.tsx` — mood selection (7 moods from `lib/moods.ts`)
  - `_components/StepTrial.tsx` — billing placeholder
  - `_components/StepBuild.tsx` — animated AI generation placeholder (Layer 3 hook point)
  - `_components/ProgressBar.tsx` — 5-dot progress indicator
  - `_components/types.ts` — `OnboardingData`, `NicheOption`, `INITIAL_DATA`
- **8 niches seeded (status=approved):**
  - candles (reference, seeded in batch 1)
  - jewelry_maker, baker, soap_and_bath, ceramicist, woodworker, fine_artist, vintage_reseller (batch 2 — migration `20260524000005_seed_niches_batch2.sql` applied)
  - All 8 are live in Supabase. All 8 `content/niches/*.md` files exist.

**Layer 2 decisions locked:**
- **D20.** 7 moods at launch. Vibe slider handles fine-tuning within a mood.
- **Block variants:** No fixed count locked. Lead developer builds one foundational variant; Cowork agents replicate.

---

## Layer 3 — next

The AI generation pipeline. This is what `StepBuild.tsx`'s animation is a placeholder for.

**What it does:** takes `OnboardingData` (shop name + niche slug + mood slug) and:
1. Calls Anthropic API to generate `DesignTokens` (colors, typography, spacing) from niche `body_markdown` + mood description
2. Calls Anthropic API to assemble a page block list (which blocks to use, in what order) from mood's `blockHint` + available blocks in `blocks-manifest.generated.ts`
3. Calls Anthropic API to generate content for each block slot (headline, subheadline, body, CTA) using niche vocabulary
4. Writes the result to DB in a single transaction: row in `design_tokens`, rows in `page_blocks`, updates `tenants` with subdomain

**Entry point:** a server action (or API route) that `StepBuild` calls on mount. Returns a job ID or streams progress. The five animation steps in `StepBuild` map to these five real phases.

**Files to build:**
- `lib/generation/generate-tokens.ts` — Anthropic call → `DesignTokens`
- `lib/generation/generate-blocks.ts` — Anthropic call → ordered block list with slot content
- `lib/generation/generate-content.ts` — Anthropic call → fills content slots per block
- `lib/generation/write-storefront.ts` — single DB transaction committing all output
- `app/api/generate/route.ts` (or server action) — orchestrates the four steps, streams progress

---

## Required reading at session start

Do not skip any of these. The cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation and rules.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — decisions D1–D20.
6. `project-docs/Tech-Arch-Spec.md` — the database design.
7. `project-docs/Phase-1-Spec.md` — the Phase 1 build spec.
8. `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill.
9. `content/niches/_queue.yaml` — the launch queue (8 done, next P0s are photographer, hair_stylist, tattoo_artist, etc.).
10. `content/niches/candles.md` — the reference niche file.

---

## What we accomplished this session (2026-05-24 — Layer 2 build + niche seeding)

### Code shipped

- `app/onboarding/page.tsx` — server page, fetches niches, mounts OnboardingFlow
- `app/onboarding/_components/OnboardingFlow.tsx` — step state machine
- `app/onboarding/_components/StepName.tsx`
- `app/onboarding/_components/StepNiche.tsx`
- `app/onboarding/_components/StepMood.tsx`
- `app/onboarding/_components/StepTrial.tsx`
- `app/onboarding/_components/StepBuild.tsx`
- `app/onboarding/_components/ProgressBar.tsx`
- `app/onboarding/_components/types.ts`
- `content/niches/jewelry_maker.md`
- `content/niches/baker.md`
- `content/niches/soap_and_bath.md`
- `content/niches/ceramicist.md`
- `content/niches/woodworker.md`
- `content/niches/fine_artist.md`
- `content/niches/vintage_reseller.md`
- `supabase/migrations/20260524000005_seed_niches_batch2.sql` — applied

### Decisions locked

- **D20** — 7 moods at launch (Dark and Stormy, Rustic, Warm and Cozy, Summer Afternoon, Wild Meadow, Bright Bazaar, Sunday Morning)

---

## What's in the DB right now

36 tables in the public schema (33 original + events, event_expenses, plus event_id on orders).

8 rows in `niches` table, all `status='approved'`: candles, jewelry_maker, baker, soap_and_bath, ceramicist, woodworker, fine_artist, vintage_reseller.

Migration runner: `node scripts/db-migrate.mjs` — all 5 migrations applied (000001–000005).

---

## Local environment

`.env.local` has:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...`
- `SUPABASE_DB_PASSWORD=...`
- Plus all Phase 0 vars (Resend, Sentry, PostHog, site URL, founder cap)

---

## Open items

1. **Doer storefront rendering.** What does a multi-type tenant (maker + takes commissions) look like on one storefront? The schema supports it; the product design hasn't settled this.

2. **Spec touch-up note.** The Master Spec `.docx` files are source-of-truth originals. The `.md` files in project-docs are the working copies Claude reads. The docx files have not been updated to reflect D1–D20. Open item for Alex when timing allows.

3. **StepTrial pricing display.** The component shows $25/mo billing placeholder text — consistent with D19. Confirm exact copy before wiring real billing.

---

## Lessons banked

**D18 conversation.** The generator-not-SaaS pivot came from a real and legitimate feeling about support overhead. The right answer was to take that feeling seriously, trace it back to specific causes, and address those specifically rather than abandoning the model.

**Don't estimate.** Frame work by dependencies and sequencing, not weeks or days.

**Push back is the job.** Staying with the SaaS shape and simplifying it (rather than pivoting away) was the right call.

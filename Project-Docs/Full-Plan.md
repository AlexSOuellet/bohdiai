# BohdiAI — Full Plan

**Status:** Draft, awaiting Alex's review.
**Written:** 2026-07-05, Session 63 → 64.
**Owner:** Claude (draft) → Alex (approval).

**Supersedes:**
- `Phase-1-Spec.md` (moved to `historical/`)
- `Phase-1-Auth-Plan-DRAFT.md` (moved)
- `Phase-1-Backend-Plan-DRAFT.md` (moved)
- `Onboarding-Readiness-Plan.md` (moved)
- `Family-Wiring-Plan.md` (merged into Phase 1 below)

Once approved, this becomes the operative plan doc. Every session reads it. Every session updates the checkboxes.

---

## Purpose

One authoritative plan running from where we are today through Alex's two top-priority goals and everything needed to support them. Every audit finding lives in a phase — nothing is orphaned. Nothing gets fixed "when we get around to it."

## Top priorities

**In Alex's order:**

1. **Onboarding creates a real, complete storefront.** Still test mode — no beta customers yet. But a maker who runs onboarding gets a fully painted, family-styled, content-complete site. No placeholder shells. No "sample" labels. No hardcoded fallbacks. Whatever Bohdi authors goes into a live tenant that reads and behaves like a real storefront.
2. **Editor is fully functional.** All three doors (try another mood, use my own colors, add my products) working end-to-end on a real test tenant.

Everything in this plan serves those two.

## Non-negotiables (locked)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer), not from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker.
- **No hardcoded English strings in the renderer. No inline styles. No shortcuts.** All strings through the defaults map; all styling through CSS variables and classes. Lint enforced.
- **Tests are part of done.** No feature is complete until it has tests.
- **Ship complete, not partial.** Code + tests + types + verification before "done."
- **No live-site fixes yet.** Beta signups are not open. Security + infrastructure items live in Phase 6.
- **Docs are optimized for CURRENT work.** Retired docs move to `historical/`.

---

## Phase 0 — Foundation and cleanup

**Goal.** Clean base. No features. Everything here removes a source of future confusion, a foot-gun, or an audit-caught mess.

### 0.1 — Documentation reset

- [ ] Archive superseded docs to `Project-Docs/historical/` (list at bottom of this plan)
- [ ] Save July 5th audit findings to `Project-Docs/Audit-2026-07-05.md`
- [ ] Rewrite `SESSION-BRIEF.md` to under 100 lines. Current state + standing lessons only. Detailed session recaps stay in `session-logs/session-NN.md`.
- [ ] Restructure SESSION-BRIEF around the current phase of this plan (not around session dates).
- [ ] Rewrite CLAUDE.md's required-reading section to point at this plan + live docs. Drop pointers to superseded specs.
- [ ] Refresh CLAUDE.md's "Status as of" stanza (6 weeks stale).
- [ ] Mark superseded sections of Master Spec (§6.3 Modular Component Assembly, §6.4 Widgets, §6.7 Build Approach) with a SUPERSEDED banner at the section heading, pointing at this plan.
- [ ] Mark superseded sections of Tech-Arch-Spec (§7 Blocks/widgets libraries, §8 page_blocks) with SUPERSEDED banner.
- [ ] Mark superseded entries in Phase-1-Decisions-Log inline with `SUPERSEDED BY Dxx` (preserve reasoning trail). Known entries to mark: D13 (widgets first-class → retired), D22 (block definitions → retired), D32 (four archetypes → collapsed to Main Street → collapsed to families), D33/D43/D44 (portable Moment → killed by D54), D47 (video default → killed by D55), D51 (seven moods → collapsing to six families).
- [ ] Decide with Alex: are `Daily-Audit.md` and `Approval-Policy.md` real rules or aspirational? Update or archive.
- [ ] Update three ADRs (`0001-block-registry`, `0002-tailwind-token-bridge`, `0003-pexels-image-strategy`) — all describe retired systems. Mark SUPERSEDED at top of each.

### 0.2 — Codebase cleanup (mechanical)

- [ ] CI green — remove deleted `build:manifests` step from `.github/workflows/test.yml`, add missing `BOHDIAI_ANTHROPIC_KEY` + `FAL_API_KEY` env vars (Audit #13)
- [ ] Delete `lenis`, `framer-motion`, `@material/material-color-utilities` from `package.json` (Audit #25)
- [ ] Uncommit `.claude/settings.local.json` + add to `.gitignore`
- [ ] Gitignore or delete stray repo-root artifacts (`dev-server.log`, `sse-out.log`, `build-test.log`, `lighthouse-*.json`, `procession-mockup.html`, `.tmp-shots/`, etc.)
- [ ] Delete throwaway scripts (`verify-fade.mjs`, `verify-zoom.mjs`, `test-main-street-archetype.ts`)
- [ ] Decide: move `scripts/build-soul-splatter-bright.ts` to `tmp/` or commit
- [ ] Clean tailwind.config.ts (drop `./blocks/**` and `./widgets/**` — deleted directories)
- [ ] Clean eslint.config.mjs (drop `blocks/**` rule override — deleted directory)
- [ ] Commit the still-uncommitted Session 63 deletion (path B rip + orphan tests)

### 0.3 — Database cleanup

- [ ] One migration: DROP four dead tables (`page_blocks`, `design_tokens`, `style_sheets`, `editor_history`) + enable RLS on `notify_interest` with admin-only read policy (Audit #20 + #2)
- [ ] Regenerate `lib/database.types.ts` via `npm run gen:types`
- [ ] Delete every `as unknown as {...}` shim around `supabaseAdmin()` (Audit #23). Let tsc surface real mismatches; fix each properly. Known locations: `app/storefront/_components/StorefrontPage.tsx`, `lib/dashboard/load-look.ts`, `lib/tryon/write-version.ts`, `lib/tryon/convert.ts`, `app/admin/tryon/page.tsx`.
- [ ] `.rpc()` or direct SQL for the rate-limit read-modify-write race (Audit #3, later in Phase 6, but the shape gets designed here)

### 0.4 — Renderer sweep: no hardcoding, no inline styles, no shortcuts

**This is the sweep Alex asked for. Once and for all. Dedicated commit, not rolled into family PRs.**

- [ ] Sweep every file under `lib/archetypes/main-street/*` for hardcoded English strings. All 24+ known instances from the audit go through `DEFAULT_STRINGS`. Non-exhaustive list of what to catch:
  - Nav labels (`Shop`, `About`, `Events`, `Contact`, `Cart`)
  - Footer labels (`Home`, `Intro`, `Privacy`, `Terms`)
  - Fallback labels (`Read the full story`, `See the full catalog`, `See all dates`, `Explore`, `This month`, `Also coming up`, `P.S.`)
  - Count words (`pieces`, `items`, `reviews`)
  - Empty-state copy (`No dates this month — check back soon`)
  - Aria-labels (`Open menu`, `Close menu`, `Previous month`, `Next month`, `Show testimonial N`, `Slides`, `Site`, `Menu`, `Highlights`, `A few moments from the shop`)
  - Aggregate labels (`5 out of 5`, `N reviews`)
  - Attribution footnotes (`real messages, shared with permission`)
- [ ] Sweep for remaining inline `style={{...}}` with hardcoded values. Currently one known in MobileNav — audit it and either move to CSS custom property or accept + document.
- [ ] Add ESLint rule blocking inline `style={{...}}` and string literals in JSX under `lib/archetypes/**` and `app/storefront/**`. Rule prevents this pattern from returning.
- [ ] Add `<main>` landmark to home page (`MainStreet.tsx`)
- [ ] Add `<main>` landmark to product page (`MainStreetProduct.tsx`)
- [ ] Add `<main>` landmark + `<h1>` to About page (`pages.tsx`)
- [ ] Add `'use client'` to `MomentHero.tsx` (uses `useState`/`useEffect`/`useLayoutEffect`/`useRef`)
- [ ] Remove unnecessary `'use client'` from nine components: `CollectionsCascade`, `CollectionsChapters`, `CollectionsCupboard`, `CollectionsLanes`, `CollectionsPortals`, `StackedHero`, `TypographicHero`, `SplitHero`, `EditorialCoverHero`, `FloatingCardHero`, `CollageHero` (Audit #26 — actually eleven; verify each)
- [ ] Promote sub-header light/dark surface hex values (`#F7F5F2` / `#1a1a1a`) to `--ms-chrome-light-bg` / `--ms-chrome-dark-bg` tokens (Audit renderer MEDIUM)
- [ ] Add `:focus-visible` treatment to `.arch-main-street` (currently no focus ring)
- [ ] Tests updated to match every change

### Phase 0 Definition of Done

- CI green.
- All 0.1 documentation edits landed.
- All 0.2 codebase cleanups landed.
- Database migration applied. Types regenerated. All shims gone.
- Renderer swept — zero hardcoded English strings, zero inline styles with hardcoded values.
- ESLint rule active.
- 1412+ tests still pass. tsc clean. lint clean.
- Alex has visually confirmed both live storefronts still render correctly.

---

## Phase 1 — Family layer wiring

**Goal.** Every tenant renders through a family (Cozy / Rustic / Dark / Luxury / Cheerful / Modern). Family picks every section variant, section stack, type package, palette, texture, and imagery grade. Bohdi authors CONTENT ONLY.

### 1.0 — Open decisions to lock before writing code

Alex decides these first thing in the Phase 1 session. Nothing here can be guessed by Claude.

- [ ] **Mood ↔ family map.** Seven moods currently (dark / rustic / cozy / modern / elegant / cheerful / industrial), six families. Which mood collapses?
- [ ] **Skins vs family paint.** Retire the 29 skins entirely and paint from family palettes only, or keep skins as within-family variants?
- [ ] **Section stack per family.** Lock the proposal in `tmp/mockups/family-stacks-v2.html` or revisit?
- [ ] **Nav authoring.** Delete `identity.nav` from copywriter and derive from family + tenant data?
- [ ] **Founder + Nav per-family defaults.** Lock now or wire with placeholders?
- [ ] **`tenants.family_key` new column vs. reuse `mood_key`.** Claude recommends new column — keeps public "mood" and internal "family" decoupled forever.

### 1.1 — Family registry

- [ ] Write `lib/archetypes/main-street/families.ts` with six entries seeded from `Family-Style-Sheets.md`
- [ ] Each entry: `sectionDefaults`, `sectionStack`, `typePackage`, `palette`, `texture`, `wallpaper`, `imageryGrade`, `fontHref`

### 1.2 — Mood → family map + tenant persistence

- [ ] Depends on decisions in 1.0
- [ ] Migration to add `family_key` column (if that path) + backfill from `mood_key`
- [ ] Update onboarding to write `family_key` at tenant creation

### 1.3 — Renderer reads family, not content

- [ ] Rewrite `MainStreet.tsx` to read section variants from `family.sectionDefaults.*`, not `content.<section>.treatment`
- [ ] Rewrite `pages.tsx` same way
- [ ] Rewrite `product.tsx` same way
- [ ] Preview URL params (`?goods=`, `?hero=`, etc.) still override for dev
- [ ] **Also lands here (Audit rolls-in):**
  - StorefrontPage duplicate data loads consolidated (Audit #24 — same-envelope-3x-per-request)
  - Storefront queries add `status='active'` + `is('deleted_at', null)` filters (Audit #9)

### 1.4 — Section stack from family

- [ ] Replace hardcoded section order in `MainStreet.tsx` with a walk of `family.sectionStack`
- [ ] Handle "off" positions (Marquee etc.)

### 1.5 — Copywriter authors CONTENT ONLY

- [ ] Delete `goods.treatment`, `founder.treatment`, `collections.treatment`, `reviews.treatment`, `findUs.treatment` from schemas
- [ ] Delete D48 treatment-roll model from `pipeline.ts`
- [ ] Rewrite copywriter prompt — no "you drew" language, no treatment mentions
- [ ] Update copywriter tests
- [ ] **Also lands here:** publish full Anthropic tool schemas as `input_schema` on all four crew stages (Audit HIGH — copywriter, cinematographer, graphic-artist, directors-cut)
- [ ] **Also lands here:** wire `AbortController` through `withTimeout` so timed-out Anthropic + fal calls actually cancel (Audit #12)

### 1.6 — Paint per family

- [ ] Depends on 1.0 decision on skins-vs-family-paint
- [ ] `skinVarsCss` reads family palette + type package + textures instead of 29-skin catalog
- [ ] Retire 29 skins (or restructure as within-family variants)

### 1.7 — Nav derivation

- [ ] Depends on 1.0 decision on nav authoring
- [ ] If derived: delete `identity.nav` from copywriter, derive from family + tenant data (which sections the store HAS)

### 1.8 — Imagery grade

- [ ] Per-image normalize + family grade (per `Family-Layout-Model.md`)
- [ ] Can defer past first runnable onboarding — first-cut builds without dynamic grading still ship coherent output

### 1.9 — Build pipeline hardening (rolls in)

- [ ] Persist collections BEFORE flipping tenant to `active` (Audit #10 — currently a race window where store is live but /collections/[slug] 404s)

### Phase 1 Definition of Done

- All six families have a registry entry.
- Every section variant renders based on family, not content.
- Bohdi's schema has zero `.treatment` fields.
- Copywriter prompt has zero treatment mentions.
- A test build for each family produces visually distinct output.
- Full test suite green. tsc clean. lint clean.
- Alex visually approves before commit.

---

## Phase 2 — Onboarding creates real, complete storefronts (TOP PRIORITY 1)

**Goal.** Prove Alex's first top priority. A maker who runs onboarding gets a full, complete, family-styled site.

### 2.1 — Onboarding runs for every family

- [ ] Run onboarding six times (once per family) with a different niche each
- [ ] Every section renders correctly. Every treatment. Every fallback string comes from `DEFAULT_STRINGS`.
- [ ] Screenshot each build for the record — store in `Project-Docs/family-build-evidence/`

### 2.2 — Fix everything the runs surface

- [ ] Bugs, gaps, weird content — all fixed in this phase, not deferred
- [ ] Missing content fields the copywriter isn't authoring: add to prompt / schema
- [ ] Any family that doesn't visually distinguish enough: revisit the paint / stack

### 2.3 — Content completeness verification

- [ ] Every section, every treatment, every family — real authored content in every build
- [ ] No section renders empty or with a shell
- [ ] No fallback strings hit (they're a safety net, not a norm)

### 2.4 — Live-test on Sheri's store

- [ ] Sheri's store is the strong-brand stress test (deep purple + neon rainbow maximalism)
- [ ] Onboarding produces a build that respects her brand energy
- [ ] Live-test = Alex confirms visually

### Phase 2 Definition of Done

- Six family builds documented with screenshots.
- Zero rendering gaps.
- Sheri's rebuild successful and respects her real brand.
- Alex signs off on "onboarding creates a real, complete storefront."

---

## Phase 3 — Editor Door 1: change mood (TOP PRIORITY 2, part 1)

**Goal.** Alex's second top priority, door 1. A maker can try another mood after onboarding and see their exact content re-rendered under a different family.

### 3.1 — Design

- [ ] Extend `Editor-Design.md` into a full implementation plan for door 1
- [ ] Split-screen layout — controls left, live scrollable real site right
- [ ] Seven mood radio buttons (or six, per 1.0 decision)
- [ ] Full style-sheet preview per mood (palette + real fonts together, not just a color chip)
- [ ] "Use this look" commit action (persists `family_key` change; reversible)

### 3.2 — Build

- [ ] Pure renderer re-skin — no AI, no regeneration
- [ ] Re-render same content under a different family key
- [ ] Instant, no build time

### 3.3 — Live-test

- [ ] Sheri's store: try every family, verify her content flows correctly into each
- [ ] Alex confirms visually

### Phase 3 Definition of Done

- Editor door 1 available in the dashboard.
- Live-tested on a real store with real content.
- Reversible.
- Alex signs off.

---

## Phase 4 — Editor Door 2: use my own colors

**Goal.** The maker can apply their own brand colors, safely.

### 4.0 — Open decisions

- [ ] Does color decouple from family paint, or does the family always paint?
- [ ] Do the maker's colors take over, or blend with the family palette?

### 4.1 — Design

- [ ] Decide the color-vs-family model with Alex
- [ ] Design the door — split-screen like door 1

### 4.2 — Build

- [ ] Reinstall `@material/material-color-utilities` (deleted in Phase 0 as unused; earns its place here)
- [ ] Derive balanced palette from maker's colors — never raw slot assignment (Wix slop trap)
- [ ] Honor "can't break your site"

### 4.3 — Live-test on Sheri

- [ ] Her deep purple + neon rainbow is the stress case

### Phase 4 Definition of Done

- Editor door 2 available in the dashboard.
- Sheri can apply her real colors.
- Alex signs off.

---

## Phase 5 — Editor Door 3: add products / listings

**Goal.** The maker can manage their real catalog.

### 5.1 — Listings CRUD

- [ ] Add / edit / archive products and digital products
- [ ] Seller-defined variations (D4)
- [ ] Pricing, inventory

### 5.2 — Photos with Claude Vision auto-fill

- [ ] Upload → Vision generates suggested title / description / price
- [ ] Maker edits, commits

### 5.3 — Collections management

- [ ] Create / edit / assign products
- [ ] Featured image per collection

### 5.4 — Post-onboarding logo upload

- [ ] Upload logo → re-run brand color extraction → optional accent update

### Phase 5 Definition of Done

- Editor door 3 available in the dashboard.
- End-to-end tested: maker adds a product, edits it, assigns to a collection.
- Alex signs off.

---

## Phase 6 — Pre-beta hardening

Every audit finding not landed in Phases 0-5 lives here. Happens before any real signup opens. Not sooner.

### 6.1 — Security + auth

- [ ] Rate limiter rebuilt: atomic counter (RPC), fails closed on DB error, trusts only Cloudflare-provided identifier (Audit #3)
- [ ] Reset `MAX_PER_WINDOW` from 20 to the real launch number
- [ ] Add authentication guard to `/api/onboarding/start` and `/api/onboarding/generate` (Audit #4)
- [ ] Gate admin try-on: page + API endpoint require session + founder role (Audit #1)
- [ ] Validate `label` and `target` params against enums on admin try-on
- [ ] Fix auth callback open redirect: only accept destinations starting with `/`, reject `//` and `/\` prefixes (Audit #5)
- [ ] Fix Vercel origin bypass: require Cloudflare shared-secret header OR host matching `*.bohdiai.com` (Audit #6)
- [ ] Confine auth cookies to `app.bohdiai.com`; bounce `/signin` on tenant subdomains (Audit #16)
- [ ] Add rate limits to `/api/contact`, `/api/notify-interest`, `/api/waitlist`, `/api/waitlist/resend` (Audit #11 + #18)
- [ ] Add onboarding idempotency: check subdomain existence before `createBuild()` (Audit #17)
- [ ] Validate subdomain shape at API + add DB CHECK constraint (Audit #7)
- [ ] Add `user_id` column to `builds` table + filter build-status endpoint by owner (Audit #8)
- [ ] Confirm route: stop leaking "at least one confirmed" via fallback query (Audit MEDIUM)

### 6.2 — Payments (D62 open)

- [ ] Decide the Stripe mechanism that keeps us out of money flow (D62 — Stripe's "Connect" naming vs. actual custody model needs reconciling)
- [ ] Build online checkout end-to-end
- [ ] Webhook handling with idempotency (processed_events table)
- [ ] Test on real maker Stripe account

### 6.3 — Custom domains (D62 open)

- [ ] Stand up Cloudflare for SaaS
- [ ] Prove end-to-end with one real external domain — cert issues + auto-renews + serves over HTTPS through Vercel origin

### 6.4 — Observability

- [ ] Install `@sentry/nextjs`. Initialize with DSN + environment + release
- [ ] Install `posthog-js` + `posthog-node`. Initialize
- [ ] OR — remove Sentry/PostHog from env schema (`lib/env.ts`) and update privacy policy to match

### 6.5 — AI robustness

- [ ] Reduce copywriter + graphic-artist retries from 4 to 2 (Audit CRITICAL — 4 × 90s = 360s exceeds 300s route ceiling)
- [ ] Per-stage timeout budget audit: sum ≤ 290s reliably even under retry

### 6.6 — Founder invite flow

- [ ] Build founder-admin approval → creates comped Supabase auth account + sends set-password email invite (D61)
- [ ] Comp flag on account bypasses card-required trial

### Phase 6 Definition of Done

- Every security finding fixed.
- Payment integration works end-to-end.
- Custom domain proven with real external domain.
- Sentry + PostHog live OR removed from schema + privacy policy.
- Sign-off from Alex before opening beta.

---

## Ongoing throughout

- **SESSION-BRIEF stays under 100 lines.** If it drifts, trim it. Session recaps live in `session-logs/session-NN.md`, never pasted back.
- **New decisions get logged with clear supersession pointers** if they replace something.
- **If a doc becomes obsolete, move to `historical/` immediately.** Don't let it rot in the main folder.
- **Session-end recap:** one file per session in `session-logs/`, updates the Full Plan checkboxes, updates SESSION-BRIEF's Current State + Next Actions sections only.

---

## Explicitly not in scope for this plan

Revisit when the two top priorities are proven live:

- Multi-tier pricing (freemium / basic / pro)
- Pure service-trade niches (Doer-specific UI: booking calendars, availability)
- AI Image Studio (background removal, photo enhancement, lifestyle mockups)
- Full Market Mode mobile UI (log-a-sale is in Phase 5; the full booth UI is later)
- Migration tools (CSV import for Shopify / Etsy / Square)
- Customer accounts on storefronts
- Reviews tied to verified purchases
- Gift cards
- Promos and discount codes
- Messages / customer inbox
- Blog at bohdiai.com/blog

---

## Required reading at every new session

The current CLAUDE.md list gets rewritten to this in Phase 0.1:

1. `CLAUDE.md` — orientation
2. `SESSION-BRIEF.md` — operational state
3. `Project-Docs/Full-Plan.md` — this document
4. `Project-Docs/BohdiAI-Master-Spec.md` — read in full every session. Retired sections marked as SUPERSEDED
5. `Project-Docs/BohdiAI-Roles-Workflow.md` — rules of engagement
6. `Project-Docs/Phase-1-Decisions-Log.md` — refinements. Superseded entries marked inline

**Pulled as needed for specific work:**
- Family / renderer work → `Family-Layout-Model.md` + `Family-Style-Sheets.md`
- Editor work → `Editor-Design.md` + `Editor-Design-Notes.md`
- Audit context → `Audit-2026-07-05.md`

That is the whole active reading list. Everything else is either archived or reference-only.

---

## Documents archived to `Project-Docs/historical/`

Moved out of the main folder in Phase 0.1. Preserved for history; not read in normal work.

**Superseded planning docs:**
- `Phase-1-Spec.md`
- `Phase-1-Auth-Plan-DRAFT.md`
- `Phase-1-Backend-Plan-DRAFT.md`
- `Onboarding-Readiness-Plan.md`
- `Family-Wiring-Plan.md` (merged into this plan)
- `Bohdi-Build-Quality-Design.md`
- `Hero-System-Build-Plan.md` (done)
- `Main-Street-Archetype-Spec.md`
- `Mood-and-Look-Model.md`
- `Styling-Conventions.md`

**Retired-system docs:**
- `Everyday-Archetype-Spec.md` + `Everyday-Archetype-Plan.md`
- `Design-System-Engine-Spec.md`
- `Layout-Language.md`
- `Block-Variants-Roadmap.md`
- `Codebase-Audit-2026-05-31.md`
- `Engine-Audit-2026-05-31.md`
- `Page-Architecture-Policy-2026-05-31.md`
- `Moments-Engine-Spec.md`
- `Moments-Engine-Build-Detail.md`
- `Moments-Intro-Build-Spec.md`
- `Moment-Probe-Findings-2026-06-01.md`
- `Intro-Pattern-01-Story-Over-Video.md`
- `Functional-Pages-and-Moments-Direction.md`

**Shipped Phase 0:**
- `Phase-0-Spec.md`
- `Phase-0-PreWork-Checklist.md`

**Superseded audit tracker:**
- `Audit-2026-06-10.md`
- `Audit-Fix-Plan-2026-06-10.md`

**Shipped-work planning notes:**
- All of `docs/superpowers/specs/` (planning notes for shipped work — moved to `Project-Docs/historical/superpowers-specs/`)

---

## What we're leaving for Alex to decide when he reviews this plan

- Any phase-ordering he wants to change
- Any work item he thinks belongs to a different phase
- Any addition he wants (things Claude didn't see)
- Whether the Phase 6 items are complete (or too aggressive for beta scope)
- Whether the archived docs list is right (any doc that should stay in the main folder)
- Whether the required-reading list is right

Once Alex approves this plan, it becomes the operative document and Phase 0 kicks off.

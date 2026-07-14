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

- [x] Archive superseded docs to `Project-Docs/historical/` (list at bottom of this plan)
- [x] Save July 5th audit findings to `Project-Docs/Audit-2026-07-05.md`
- [x] Rewrite `SESSION-BRIEF.md` to under 100 lines. Current state + standing lessons only. Detailed session recaps stay in `session-logs/session-NN.md`.
- [x] Restructure SESSION-BRIEF around the current phase of this plan (not around session dates).
- [x] Rewrite CLAUDE.md's required-reading section to point at this plan + live docs. Drop pointers to superseded specs.
- [x] Refresh CLAUDE.md's "Status as of" stanza (6 weeks stale).
- [x] Mark superseded sections of Master Spec (§6.3 Modular Component Assembly, §6.4 Widgets, §6.7 Build Approach) with a SUPERSEDED banner at the section heading, pointing at this plan.
- [x] Mark superseded sections of Tech-Arch-Spec (§7 Blocks/widgets libraries, §8 page_blocks) with SUPERSEDED banner.
- [x] Mark superseded entries in Phase-1-Decisions-Log inline with `SUPERSEDED BY Dxx` (preserve reasoning trail). Marked: D13, D22, D32, D33, D43, D44, D47, D51.
- [ ] Decide with Alex: are `Daily-Audit.md` and `Approval-Policy.md` real rules or aspirational? Update or archive. (Deferred — needs Alex's call.)
- [x] Update three ADRs (`0001-block-registry`, `0002-tailwind-token-bridge`, `0003-pexels-image-strategy`) — all describe retired systems. Mark SUPERSEDED at top of each.

### 0.2 — Codebase cleanup (mechanical)

- [x] CI green — remove deleted `build:manifests` step from `.github/workflows/test.yml`, add missing `BOHDIAI_ANTHROPIC_KEY` + `FAL_API_KEY` env vars (Audit #13)
- [x] Delete `lenis`, `framer-motion`, `@material/material-color-utilities` from `package.json` (Audit #25)
- [x] Uncommit `.claude/settings.local.json` + add to `.gitignore`
- [x] Gitignore or delete stray repo-root artifacts (`dev-server.log`, `sse-out.log`, `build-test.log`, `lighthouse-*.json`, `procession-mockup.html`, `.tmp-shots/`, etc.)
- [x] Delete throwaway scripts (`verify-fade.mjs`, `verify-zoom.mjs`, `test-main-street-archetype.ts`)
- [x] Decide: move `scripts/build-soul-splatter-bright.ts` to `tmp/` or commit — moved to `tmp/`.
- [x] Clean tailwind.config.ts (drop `./blocks/**` and `./widgets/**` — deleted directories)
- [x] Clean eslint.config.mjs (drop `blocks/**` rule override — deleted directory)
- [x] Commit the still-uncommitted Session 63 deletion (path B rip + orphan tests)

### 0.3 — Database cleanup

- [x] One migration: DROP four dead tables (`page_blocks`, `design_tokens`, `style_sheets`, `editor_history`) + enable RLS on `notify_interest` with admin-only read policy (Audit #20 + #2). Migration `20260705000001`.
- [x] Regenerate `lib/database.types.ts` via `npm run gen:types`
- [x] Delete every `as unknown as {...}` shim around `supabaseAdmin()` (Audit #23). All five locations cleared; JSONB narrowing helper added at boundary.
- [ ] `.rpc()` or direct SQL for the rate-limit read-modify-write race (Audit #3, later in Phase 6, but the shape gets designed here) — deferred to Phase 6.

### 0.4 — Renderer sweep: no hardcoding, no inline styles, no shortcuts

**This is the sweep Alex asked for. Once and for all. Dedicated commit, not rolled into family PRs.**

- [x] Sweep every file under `lib/archetypes/main-street/*` for hardcoded English strings. All routed through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`.
- [x] Sweep for remaining inline `style={{...}}` with hardcoded values. MobileNav stagger delay moved to `data-ms-stagger` + CSS selectors. All remaining inline styles are CSS-var passthroughs (dynamic per-instance values).
- [ ] Add ESLint rule blocking inline `style={{...}}` and string literals in JSX under `lib/archetypes/**` and `app/storefront/**`. **Deferred with rationale:** `react/jsx-no-literals` produces too many false positives on entities/arrows/punctuation to configure cleanly; the audit-grep pattern + manual sweep is the current enforcement.
- [x] Add `<main>` landmark to home page (`MainStreet.tsx`)
- [x] Add `<main>` landmark to product page (`MainStreetProduct.tsx`)
- [x] Add `<h1>` to About page (visually-hidden via `.ms-sr-only`; the founder treatment stays the visual hero)
- [x] Add `'use client'` to `MomentHero.tsx`
- [x] Remove unnecessary `'use client'` from 11 components: six Collections + five Heroes (Cascade / Chapters / Crates / Cupboard / Lanes / Portals + Stacked / Typographic / Split / EditorialCover / FloatingCard / CollageHero)
- [x] Promote sub-header light/dark surface hex to `--ms-chrome-*` tokens — **deferred to family layer.** Current implementation still uses `#F7F5F2` / `#1a1a1a`. When the family layer wires per-family paint, the sub-header takes the family's surface variables. Recording here for tracking; not a blocker for Phase 1.
- [x] Add `:focus-visible` treatment to `.arch-main-street` — family-consistent ring using `var(--ms-accent)`.
- [x] Tests updated (896 tests pass).

### Phase 0 Definition of Done

- [x] CI green.
- [x] All 0.1 documentation edits landed (except Daily-Audit / Approval-Policy fate — Alex's call).
- [x] All 0.2 codebase cleanups landed.
- [x] Database migration applied. Types regenerated. All shims gone.
- [x] Renderer swept — hardcoded English strings all through DEFAULT_STRINGS/COUNTS; inline styles restricted to CSS-var passthrough only.
- [ ] ESLint rule active — deferred with rationale (see 0.4).
- [x] 896 tests pass. tsc clean. lint clean (0 errors).
- [ ] Alex has visually confirmed both live storefronts still render correctly. **Pending — verify on Session 65 start before starting Phase 1 code.**

---

## Phase 1 — Family layer wiring

**Goal.** Every tenant renders through a family (Cozy / Rustic / Dark / Luxury / Cheerful / Modern). Family picks every section variant, section stack, type package, palette, texture, and imagery grade. Bohdi authors CONTENT ONLY.

### 1.0 — Decisions locked (Session 65, 2026-07-06)

All six original open items from the Session 63/64 plan are now settled. Sources of truth are the defaults matrix (`tmp/mockups/defaults-matrix.html`) and the section stack proposal (`tmp/mockups/family-stacks-v2.html`), both approved. Recorded here in one place so Phase 1 code never re-litigates them.

1. **"Family" is internal, "mood" is public — same concept, one word each.** The maker picks a mood at onboarding; internally that IS the family. There are six of them: Cozy, Rustic, Dark, Luxury (aka Elegant), Cheerful, Modern (aka Minimalist). The seventh mood from the old lineup (Industrial) retires. Any prior "seven moods" reference is stale.
2. **Storage stays `tenants.mood_key`.** No new `family_key` column, no migration. The column already stores the right value; internally code and docs call it "family" freely. No public copy ever surfaces the word "family."
3. **Skins stay and grow.** The 29 skins are not retired. They become the maker's within-family edit-time options (Editor Door 1 / Door 2). Onboarding still picks one; the maker can swap it. Adding more skins is expected, not a rewrite.
4. **v2 stack orders are locked** for all six families as drawn in `family-stacks-v2.html` — with one change: **every section is ON by default for every family at onboarding.** The v2 "some sections off" pattern (length as a shopper-feel lever) is retired for onboarding. Reason: the maker sees their own onboarding output first, not a shopper's view of a competing family. A four-section Dark store on onboarding reads as thin and unfinished, not as premium restraint — which cuts against the "generate the most polished store possible at onboarding" principle. What survives from v2: the section ORDER per family (opens-with — Cozy → maker letter, Rustic → workbench process, Dark → one slow product, Luxury → collection chapters, Cheerful → loud marquee, Modern → the grid), the section VARIANT per position, Hero always first, Close always last, Nav + Footer bracket every family, FAQ in the footer. What flips: length is no longer a family default. Every family ships all eight content sections at onboarding. The on/off dial is an editor feature — the maker turns sections off later if they want. That editor toggle rides in with Editor Door 1.
5. **Nav lists every page we create at onboarding — every family, every store.** The renderer builds the nav from the actual page inventory (all created at onboarding, so the list is complete on day one). The maker toggles pages on/off from the dashboard. Bohdi does not author nav labels; page names come from the page inventory.
6. **Sections without per-family designs share one shape for now.** Footer, Close CTA band, Contact page, FAQ page — one design used across every family. Per-family design for these is a later pass, not a Phase 1 blocker.
7. **Dark hero is Floating Card. Luxury Products is Switcher.** Both were flagged in the matrix as unsold / provisional; both are now locked. The matrix footnotes get cleared in 1.0-doc-cleanup below.
8. **Reviews seed at onboarding.** The copywriter authors sample testimonials as part of every build; the maker edits them post-onboarding. Verified-purchase reviews remain Phase 2 per D48-vintage reasoning.

**1.0 doc cleanup — landed Session 65:**

- [x] Update `tmp/mockups/defaults-matrix.html`: removed the "Dark hero unsold" footnote + Switcher provisional amber flipped to locked green.
- [x] Update `tmp/mockups/family-stacks-v2.html`: stripped the "still open" caveat; every section flipped ON except Contact (not built yet).
- [x] Update `CLAUDE.md` required-reading: added both mockups under "Pulled as needed for family/renderer work."
- [x] Update `SESSION-BRIEF.md` Next Actions: locked-decisions summary replaced the six-open-decisions list.

**Discrepancy verified.** Reviews home-block IS built (4 treatments + tests confirmed in `lib/archetypes/main-street/`). `family-stacks-v2.html` caveat was stale. Only Contact home-block genuinely isn't built.

### 1.1 — Family registry ✅ Session 65

- [x] Wrote `lib/archetypes/main-street/families.ts` with six entries seeded from `Family-Style-Sheets.md`, defaults matrix, and v2 stacks.
- [x] Each entry carries `sectionDefaults`, `sectionStack`, `typePackage`, `palette`, `texture`, `wallpaper`, `imageryGrade`, `fontHref`, `defaultSkin`.

### 1.2 — Onboarding writes family via mood_key ✅ Session 65

- [x] No migration needed — column stays `mood_key`.
- [x] Onboarding continues to write the maker's mood pick to `mood_key`. That value IS the family.
- [x] `getFamily(mood)` reads the registry, handling `elegant` → Luxury and legacy `industrial` → Modern aliases, plus a Cozy fallback for missing / unknown values.

### 1.3 — Renderer reads family, not content ✅ Session 65

- [x] MAIN_STREET_SPEC.render receives `mood`, resolves family via `getFamily(mood)`, and computes an effective `MainStreetTreatments` object (family defaults with preview URL overrides layered on top).
- [x] MainStreet.tsx receives resolved treatments; each Beat's `?? content.<section>.treatment` fallback dropped in favor of the caller-passed treatment.
- [x] pages.tsx sub-pages (Shop / About / Events / Testimonials / Collections / Collection detail) accept `treatments` and pass through.
- [x] renderProduct / renderContentPage / renderShell all take `mood` and use `treatments.nav` for chrome so every route paints in the same family nav.
- [x] Preview URL params still layer on top for dev.
- [x] **Also landed:** StorefrontPage duplicate data loads consolidated via React `cache()` in new `lib/storefront/load-envelope.ts` (Audit #79 — 3-4× loads → 1 per request).
- [x] **Also landed:** listings + collections queries add `.eq('status', 'active')` + `.is('deleted_at', null)` (Audit #70).

### 1.4 — Section stack from family ✅ Session 65

- [x] MainStreet.tsx walks `family.sectionStack` instead of a hardcoded order. Renderer map keyed by SectionKey; on-entries render in stack order inside `<main>`.
- [x] Every section is ON at onboarding for every family (Cozy stack is the default fallback for tests / legacy callers).
- [x] Contact home-block returns null everywhere — the section slot exists in the stack but the home block isn't designed yet.
- [x] `showMarquee` prop retired. Marquee is on by default via the stack; Editor Door 1 (Phase 3) will use the same stack mechanism for maker toggles.

### 1.5 — Copywriter authors CONTENT ONLY ✅ Session 65

- [x] Removed `.treatment` from `goods`, `collections`, `reviews`, `findUs`, `founder` in schemas.ts (Zod silently strips legacy fields).
- [x] Deleted `treatment-roll.ts` + `treatment-roll.test.ts` (D48 retired).
- [x] Copywriter prompt drops the "you drew X" language, the goods menu, and the founder body catalog. Prompt explicitly says: the BODY is the family's call.
- [x] Copywriter output schema drops the two required `treatment` enums.
- [x] Pipeline no longer rolls; `directAndProduce` signature loses its `rand` param. `CrewBuildResult.choices` shrinks to `heroKind`.
- [x] log-choices.ts drops `goods-treatment` + `founder-treatment` decision rows (two rows land per build now: trajectory + moment-kind).
- [x] Reviews seeding stays — copywriter still authors sample testimonial content every build.
- [x] Tests re-cast across the board.
- [x] Published full Anthropic tool schemas as `input_schema` on all four crew stages (Session 72). `submit_copy` / `set_moment` / `set_look` / `final_cut` all now carry named properties + required arrays derived from their Zod schemas; the passthrough `{ properties: {}, additionalProperties: true }` is gone. Regression tests per stage guard against drift back. Zod still runs after parse as defense-in-depth.
- [x] Wired `AbortController` through `withTimeout` (Session 72). `withTimeout` now takes a factory `(signal: AbortSignal) => Promise<T>`; on timeout the controller aborts, cutting the underlying HTTP call. Threaded through all 5 crew stages (Anthropic `{ signal }`), `lib/fal.ts`, and both `lib/moments/media.ts` calls (fal `abortSignal`). Timed-out Anthropic + fal calls now actually cancel instead of running to completion in the background while retries queue on top.

### 1.6 — Paint per family, skins ride on top ✅ Session 65

- [x] Each Family entry names a `defaultSkin` — the ★ pick per family (Cozy → Ember, Rustic → Tannery, Dark → Hearthstone, Luxury → Atelier, Cheerful → Confetti, Modern → Studio).
- [x] Pipeline resolves the family from `brief.moodKey` after the crew runs and uses `family.defaultSkin` as `chosen.lookKey`. The Graphic Artist still designs imagery, but the skin choice is deterministic per family.
- [x] The 29 skins stay in the catalog via `moodAlignedSkins` so Editor Door 1 (Phase 3) can offer them as within-family swaps.
- [x] Skin↔family mapping — the existing mood tags on skins are reused; no new field needed.

### 1.7 — Nav renders every page, maker toggles ✅ Session 65

- [x] `MAIN_STREET_NAV` expanded to six items (Shop, Collections, About, Events, Reviews, Contact); labels flow through `DEFAULT_STRINGS`.
- [x] `resolveNav()` takes zero arguments; returns the fixed page list. Nav component drops the `identity.nav` read.
- [x] `identity.nav` dropped from `CopywriterDraftSchema` (silently stripped if the crew tries); marked LEGACY-optional in `MainStreetContentSchema` for envelope back-compat.
- [x] Copywriter prompt drops the nav authoring instructions.
- [x] The four nav variants (Standard / Split-center / Menu-reveal / CTA-forward) are chosen by family per the defaults matrix (§1.3 wiring).

### 1.8 — Imagery grade (deferred)

- [ ] Per-image normalize + family grade (per `Family-Layout-Model.md`). Deferred past first runnable onboarding — first-cut builds without dynamic grading still ship coherent output.

### 1.9 — Persist collections before live flip ✅ Session 65

- [x] `writeArchetypeStorefront` split — writes tenant (draft) + page + listings; no longer flips.
- [x] New `publishArchetypeStorefront(tenantId)` does the flip.
- [x] `build-archetype-store.ts` runs draft-write → `persistCollections` → publish. Any failure between draft and publish leaves the tenant invisible.

### Phase 1 Definition of Done

- [x] All six families have a registry entry with the section variants + stack order from `defaults-matrix.html` + `family-stacks-v2.html`.
- [x] Every section variant renders based on family (via `mood_key` lookup), not from a `.treatment` field on content.
- [x] Bohdi's schema has zero `.treatment` fields and zero required `identity.nav`.
- [x] Copywriter prompt has zero treatment mentions and zero nav authoring.
- [x] Nav renders from the fixed page list, with a family-picked variant.
- [x] The 29 skins remain reachable as within-family editor options.
- [x] A test build for each family produces visually distinct output — different opens-with lead, different section variants, family paint, family type. **Alex ran all six families through onboarding at end of Session 65 — all rendered pretty well. Real issues carry forward to Session 66 for discussion.**
- [x] Full test suite green (940 tests). tsc clean. lint clean (0 errors).
- [x] Alex visually approved by running all six moods through fresh onboardings.
- [x] Two §1.5 audit rollups landed Session 72 (input schemas + AbortController).

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

**Status (2026-07-10, Session 69):** Built and live-tested on Lenticular Lumens. This section was tracking as unbuilt through Session 68; that was stale. The editor page ships at `/dashboard/website`; `commitLook` server action swaps in-place via `applyLookToEnvelope`; feature-flagged, always-on in dev. Alex tried every mood on Lenticular — all read well except a one-shot Rustic UI hiccup that didn't reproduce.

### 3.1 — Design

- [x] Extend `Editor-Design.md` into a full implementation plan for door 1
- [x] Split-screen layout — controls left, live scrollable real site right
- [x] Six mood radio buttons (per 1.0 lock — Industrial retired Session 69)
- [x] Full style-sheet preview per mood (palette + real fonts together, not just a color chip)
- [x] "Use this look" commit action (persists mood + skin change; the prior pair is stashed on `root.previousLook` for a one-click revert)

### 3.2 — Build

- [x] Pure renderer re-skin — no AI, no regeneration
- [x] Re-render same content under a different family key
- [x] Instant, no build time

### 3.3 — Live-test

- [ ] Sheri's store: try every family, verify her content flows correctly into each
- [x] Alex confirms visually — Lenticular Lumens run in Session 69

### Phase 3 Definition of Done

- [x] Editor door 1 available in the dashboard.
- [x] Live-tested on a real store with real content.
- [x] Reversible.
- [ ] Alex signs off (pending — Sheri's store still to try; the Cheerful reviews-cards fade was fixed in Session 70 via the family-wallpaper z-index change).

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
- [x] Admin Try-On retired (Session 70) — the whole feature was built for an archetype catalog that no longer exists; Main Street has been the only archetype since Session 31. Page, admin API route, `store_versions` table, and `lib/tryon/` deleted. The two gating items from Audit #1 (session + founder role) no longer apply.
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

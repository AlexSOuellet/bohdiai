# Session Brief — BohdiAI

**Last updated:** 2026-05-20 morning session (LCP fix via ISR + www redirect verified + Phase 1 planning kicked off — foundation-first approach locked)
**Update at the end of every session.**

---

## Picking up next session

**Alex is at work. When he returns we resume the Phase 1 planning brainstorm.** Specifically: the "Every business shape BohdiAI will ever serve" brainstorm — the single page that goes at the front of the Tech Arch Spec and informs the entire database schema design.

**Don't skip:** before that brainstorm, confirm Alex is OK with the foundation-first rule we agreed on this session (see "Phase 1 planning — key decisions locked" below). The rule reframes the Master Spec's phasing and may need a Master Spec amendment.

## Phase 1 planning — key decisions locked this session

1. **Tech Arch Spec is the next deliverable.** Before any Phase 1 code is written, we write `project-docs/Technical-Architecture-Spec.md` that locks the database schema, the design-token JSON shape, the niche-schema JSON shape, RLS policies, and proves the design against the 5-6 hardest queries the app will need.

2. **Foundation-first rule (Alex's call, agreed by Claude as Lead Dev):** Phasing controls which features we BUILD AND SHIP, NOT what the foundation supports. The foundation has to support every kind of business BohdiAI will ever serve — products, services, bookings, events, classes, rentals, subscriptions, commissions, gift cards, real estate, courses, anything. Phase 1 only ships SOME of those features, but the schema is built to fit ALL of them. If a Phase 3 feature forces a Phase 1 table rewrite, we got the foundation wrong.

3. **`listings` over `products`.** The central table will be called something neutral (`listings` or `items`) with a `kind` column (`product`, `service`, `booking`, `event`, ...). Phase 1 only implements `kind = 'product'` UI + service-listing-with-consult-form (so tattoo + estate sales work), but the schema accepts every kind from day 1.

4. **Spec inconsistency surfaced:** The marketing site features Iron & Ash (tattoo parlor) as one of three demo storefronts, but Master Spec §2 + §17 put services in "future." Either we amend the Master Spec to include service-shaped niches in Phase 1, or we swap the tattoo demo for a third product-shaped storefront. **Alex picked path B (informally) — Phase 1 supports service-shaped listings with a "request a consult" contact form, real-time booking engine deferred to Phase 2. Not yet formally amended in the Master Spec.**

5. **Tech Arch Spec proposed structure (Alex approved):**
   - (1) Purpose & scope
   - (2) Every business shape we will ever serve (brainstorm-driven)
   - (3) Core entities (plain-English list)
   - (4) Database schema (tables, columns, indexes, constraints, JSON document shapes)
   - (5) RLS policies
   - (6) Access pattern proofs (5-6 hardest queries written against the schema)
   - (7) Migrations & seed-data strategy
   - (8) Open questions

6. **Working cadence agreed:** Claude drafts one section at a time, Alex approves before next section starts, Claude pauses at any non-trivial design decision and asks before locking.

## What shipped this session

1. **www → apex redirect verified.** `curl -sI https://www.bohdiai.com` returns `HTTP/1.1 308 Permanent Redirect, Location: https://bohdiai.com/`. Last-night's mid-edit save in Vercel Settings → Domains did save correctly. No further action needed.

2. **LCP fix shipped — `force-dynamic` → ISR (`revalidate=30`).** Commit `3259c95` on main, pushed to origin. The hero is text-LCP with no above-the-fold image, so the 3.5s LCP regression was TTFB-bound (every request was blocking on Supabase to count founder slots). ISR makes `/` edge-cached, founder count goes stale ±30s — acceptable headroom against the 25-slot cap. Build verified: `/` now renders as `○ (Static)` with 30s revalidate (was `ƒ Dynamic`). Next Lighthouse run against bohdiai.com should show LCP back to <2s and Performance back to ~97.

3. **Waitlist truncated.** Alex ran `TRUNCATE waitlist;` in Supabase SQL Editor. Counter will read "25 of 25 left" on next ISR refresh or Vercel redeploy.

4. **Master Spec, Roles-Workflow, Phase-0-Spec read at session midpoint.** Alex pulled Claude up on skipping the cite-or-shut-up protocol at session start. Future sessions: do the full required-reading before any task, including small ones.

## Local environment gap (raise next session)

- **Local `.env.local` still has the disabled legacy `service_role` Supabase key.** Supabase disabled all legacy anon/service_role keys on 2026-05-18; production runs on the new "secret key" system. Local key needs updating from Supabase Dashboard → bohdi-ai → Project Settings → API Keys → copy the current Secret key (starts with `sb_secret_…`) into `.env.local`'s `SUPABASE_SERVICE_ROLE_KEY=` line. Until this is done, Claude cannot run admin scripts locally against the production Supabase project (which is why the `TRUNCATE waitlist;` had to be run by Alex in the dashboard).
- **Read-only Postgres MCP installed.** `mcp__server-postgres__query` exists but is read-only by design. If we want Claude to do admin SQL directly, swap to the official Supabase MCP later. Not urgent.

## Where we are right now

**`https://bohdiai.com` is live on Vercel** with a valid Let's Encrypt cert. The Next.js stack is on the current Active LTS (Node 22, Next 16, React 19). CVE count went from 24 → 2 (and the 2 remaining are postcss inside Next's bundled deps — npm audit's "fix" wrongly suggests downgrading to Next 9). CI workflow is wired (typecheck + Vitest+coverage + Playwright). Coverage gate is live for `lib/**` at 90%.

**Remaining polish (not launch-blocking):**
- **LCP follow-up.** Post-launch Lighthouse against `https://bohdiai.com` (mobile): **Performance 89** (was 97), **Accessibility 97**, **Best Practices 100** (was 96 — favicon fix worked), **SEO 100**. The 8-point Performance regression is entirely LCP: 3.5s, score 63. Every other metric is excellent (FCP 1.3s/98, TBT 70ms/99, CLS 0.002/100). Cause is some combination of (a) ~15 kB First Load JS increase from Next 15 → 16 + React 19, (b) real-network latency the local prod test didn't have, (c) the LCP element likely lacking `priority` / `fetchPriority="high"`. Fix is a 30-min next-session task: identify the LCP element via Lighthouse's `largest-contentful-paint-element` audit on a real run, add `next/image` priority hints. Not launch-blocking.
- **www → apex redirect.** Alex was mid-edit in Vercel Settings → Domains setting up the 308 redirect (`www.bohdiai.com` → `bohdiai.com`). Save status uncertain. Verify next session by `curl -sI https://www.bohdiai.com` — if it shows `HTTP/1.1 308` and `location: https://bohdiai.com/`, done. Currently both serve 200 OK directly, which is functional but not canonical.
- **Phase-0-Spec.md sync** to current design (low priority).

## What happened in this late-night session (2026-05-19, the upgrade-chain session)

1. **Node 20.11 → 22.22.2** (commit `e6cb821`). Node 20 reached EOL April 2026; jumped straight to current Active LTS instead of just unblocking-version 20.19. `.nvmrc` pinned. `engines.node: >=22.0.0`.

2. **Vitest 2 → 4, jsdom 25 → 29, @types/node → 22, @testing-library/react → latest** (commit `ac0b91e`). Now that Node is current, all the year-old pins are unpinned. CVE count dropped 9 → 5 just from transitive cleanup.

3. **Next.js 14.2.15 → 15.5.18 + React 18 → 19** (commit `00a7180`). The big jump. Async-request-API codemod for `searchParams` in `app/confirm/error/page.tsx`. `experimental.typedRoutes → typedRoutes`. Converted 6 internal `<a href="/">` → `<Link>` (Header + 4 pages) for eslint-config-next 15. Cleared stale `tsconfig.tsbuildinfo` (carried Next 14 type cache and was masking the upgrade).

4. **Next.js 15 → 16.2.6** (commit `9ccf058`). Auto-modified `tsconfig.json` (jsx → react-jsx, added `.next/dev/types`). No code changes — async-API codemod from the 15 step covered 16.

5. **CI + coverage + favicon** (commit `2c5e291`). `.github/workflows/test.yml` runs typecheck → vitest+coverage → playwright. Dummy env vars; tests already mock the network. Coverage gate scoped to `lib/**` at 90% (currently 100%). `scripts/generate-favicon.mjs` rasterizes `icon.svg` → 32×32 PNG → manually wraps ICO header (sharp can't write ICO). Closes the Lighthouse 404.

6. **ESLint 8 → 9** (commit `dceb1ab`). First Vercel deploy of the upgrade chain ERESOLVE-failed because eslint-config-next@16 needs eslint ≥9. Local install was permissive; Vercel's npm install is stricter. Bumped to eslint 9. Next 16 no longer runs `next lint` so flat-config breakage doesn't bite us.

7. **DNS flip — bohdiai.com → Vercel** (no commit; DNS-only). Apex `A` was at GoDaddy parking IPs (`15.197.148.33`, `3.33.130.190`), proxy ON. Replaced with `A → 76.76.21.21` proxy OFF. `CNAME www` retargeted to `cname.vercel-dns.com` proxy OFF. Deleted leftover `_domainconnect` CNAME. All MX/TXT (Email Routing + SPF + Cloudflare DKIM + Resend DKIM) preserved. Vercel issued Let's Encrypt cert within ~3 min. `https://bohdiai.com` returns 200 OK with `Server: Vercel` and `<title>BohdiAI — Your Business Online. Finally Made Easy.</title>`.

## What happened in the prior evening session (2026-05-19)

1. **Privacy + Terms pages shipped.** Drafted [app/privacy/page.tsx](../app/privacy/page.tsx) and [app/terms/page.tsx](../app/terms/page.tsx) in Alex's warm/direct voice, mirroring the `/confirmed` styling. Privacy covers email-only collection, why, where it lives (Supabase + Resend), GDPR erasure path via alex@bohdiai.com. Terms covers non-binding waitlist, no warranties, Rhode Island governing law. Footer hrefs moved off `"#"` placeholders to `/privacy` and `/terms`. Commit `d95a8de`.

2. **Test infrastructure landed (Vitest + Playwright + axe-core).** Commit `6aed71e`. Specifically:
   - **Vitest 2** (jsdom) for unit tests. Pinned to v2 because Vitest 4 needs Node 20.19+ and the local environment is on Node 20.11 — this is a deliberate trade-off and is tracked under "Tech debt parked" below.
   - **Playwright 1.60** for E2E with Chromium desktop + Pixel 5 mobile projects. `webServer` config launches `next dev --port 3100`.
   - **@axe-core/playwright** for WCAG 2.1 AA scans.
   - **9 unit tests** for `lib/validation.ts` (waitlist + resend zod schemas).
   - **6 Playwright smoke specs** for Waitlist form (4 specs: validation, success, already-on-list, server error — all using `page.route()` mocks so tests do NOT touch Supabase or Resend) and BrowserDemo (2 specs: dot click + auto-cycle).
   - **3 a11y specs** (home, privacy, terms) that fail on any serious or critical WCAG violation. `.store-frame` is excluded with documented reasoning — the demo storefronts are decorative marketing art with intentional cream-on-cream contrast.
   - npm scripts: `test`, `test:watch`, `test:e2e`.
   - **All 33 tests green** on the final run (9 Vitest unit + 12 Playwright smoke × 2 projects + 3 × 2 a11y).

3. **Real bugs caught and fixed.** Commit `a4d7124`:
   - **BrowserDemo z-index bug.** The `<section id="how">` had `z-content` and was layered above the BrowserDemo's outer div (which had no z), so it intercepted pointer events in the thin strip where the dot navigators live. Fixed by bumping BrowserDemo to `z-sticky`. Caught by Playwright `clicking a dot jumps to that storefront`. **Affected real users** in that strip, not just tests.
   - **Dot button touch target.** Dots were 9×9px — fails WCAG 2.5.8 AA (24×24px minimum). Wrapped the visible 9px dot in a 24×24px (or 24×36 active) clickable button so the design is unchanged but the hit area is compliant. Caught by Lighthouse target-size audit.
   - **Muted text contrast.** `--muted: #7e7464` on bg `#0a0805` was 4.35:1 — just under WCAG 4.5:1 for normal text. Bumped to `#8a8070` (~4.6:1). Affects footer copyright + Last-updated stamps. Visually almost identical.
   - **Privacy/Terms inline link styling.** Mailto + service links were honey-warm color only, no underline (only on hover) — fails WCAG `link-in-text-block` because color alone is insufficient distinction. Now always underlined with `decoration-honey-warm/40` normal → `/100` on hover.
   - **Storefront marketing art accessibility.** Added `aria-hidden="true"` + `role="presentation"` to the storefront render container in BrowserDemo. Those storefronts have fake products / fake CTAs that don't navigate — they're marketing art, not real content. Screen readers correctly skip them now; the brand name + URL pill above the frame still announce the demo. Note: Lighthouse's color-contrast rule deliberately does NOT honor aria-hidden (sighted users with cognitive disabilities still see the text), which is why Lighthouse Accessibility is 97 and not 100. We accept this trade-off — the cream-on-cream bakery aesthetic is the marketing point.
   - **`app/icon.svg` created.** Brand B mark gradient. Closes one of the two Lighthouse Best Practices console errors (the legacy `/favicon.ico` 404 remains — no Windows-friendly way to generate a binary `.ico` without imagemagick, deferred as cosmetic).

4. **Lighthouse mobile audit (against prod build at `next start --port 3100`):**
   - Performance: **97**
   - Accessibility: **97** (was 93 before target-size fix)
   - Best Practices: **96** (single `favicon.ico` 404 keeping it off 100)
   - SEO: **100**
   - Target was ">90 across the board" — comfortably exceeded.

5. **Daily-Audit Q3 reframed.** Commit `845d606`. Q3 ("Are all styles driven by design tokens?") now explicitly scoped to Phase 1+ tenant-rendered component variants only. Marked N/A for Phase 0 marketing artwork. Documents why so future audits don't repeat the May 19 token-refactor detour.

6. **Course correction on "defer it" reflexes.** Alex pushed back twice and was right both times:
   - On the Next.js upgrade. I initially recommended deferring 14.2.15 → 16.x as a "separate decision." Alex asked "won't it be even bigger later?" — yes, exactly. Reversed. Now next session's #1 priority. Codebase will only grow before launch; doing the upgrade *before* DNS flip means going live on a current, patched version of Next.
   - On a broader principle. Alex set the rule: **"If anything is going to have to be done eventually and will benefit the app, it needs to be done."** I had silently pinned Vitest/jsdom to year-old majors instead of raising the Node upgrade, declared CI a "separate decision" without re-raising it, and skipped wiring coverage thresholds despite installing the tool. All flagged below under "Tech debt parked."

## Tech debt parked (raise next session)

These were silently deferred earlier in this session. Alex's standing rule applies — get them done.

1. **Node 20.11 → 20.19+ upgrade.** Required to unpin Vitest from v2 → v4 and jsdom from v25 → v29 (the current Node hangs ~6 patch versions short of what those expect). Also a prerequisite for Next 16. Do this as part of the Next upgrade session.
2. **Coverage gates not wired.** `@vitest/coverage-v8` is installed but there is no `npm run test:coverage` script, no thresholds in `vitest.config.ts`, no CI gate. Engineering-Standards §7 specifies 90/85/75% with CI gates. Wire when CI exists.
3. **CI not wired.** Tests run locally only. GitHub Actions workflow that runs Vitest + Playwright on PRs is on the to-do list but unscoped. Decide during the Next upgrade session whether to land CI before or after the upgrade.
4. **Phase-0-Spec.md sync.** Design has evolved well past what's documented in [Phase-0-Spec.md](Phase-0-Spec.md). Worth a sync edit but not launch-blocking.
5. **Favicon `.ico`.** `app/favicon.ico` would close the last Lighthouse Best Practices console error (404 in the console) and bump Best Practices 96 → 100. Modern browsers already get `app/icon.svg`. Small but worth doing — sharp can't write ICO directly, so manually wrap a 32×32 PNG in the ICO header (~20 min).
6. **Engineering-Standards §7 "no DB mocks" deviation in waitlist smoke tests.** Tests mock the `/api/waitlist` network response with `page.route()` so they don't pollute Supabase or fire real Resend emails. This is a deliberate carve-out for marketing-form smoke tests (the failure mode we care about is the form, not the API). Decision was raised inline and approved — documenting it here so it stays approved.

## NEXT SESSION priorities (in order)

**Read the "Tech debt parked" section above before starting — items #1, #2, #3, #5 below pull directly from it. Do not skip them.**

1. **Node 20.11 → 20.19+ upgrade.** Prerequisite for the Next 16 upgrade *and* for unpinning Vitest/jsdom from year-old majors. Do this first so the Next upgrade has a clean Node baseline.
2. **Next.js major upgrade: 14.2.15 → 15.x → 16.x BEFORE DNS flip.** `npm audit` currently flags 24 advisories against `next@14.2.15` (1 critical, 3 high, 1 moderate; most are config-gated and we don't expose the vulnerable surface, but the count is real). Doing the upgrade now is *safer* than deferring: codebase is at its smallest, no live users, smoke tests now exist as a safety net, and we want to be on current Next *before* Phase 1 adds tenant middleware + tenant-aware caching (where Next 15's flipped fetch caching default is a silent footgun). Order: 14 → 15 (the bigger jump — async `cookies()`/`headers()`/`params`, fetch no longer cached by default, React 19) → run all 33 tests + manual smoke → 15 → 16 → re-run `npm audit` → unpin Vitest from v2 to current + jsdom from v25 to current as a follow-on.
3. **Wire CI (GitHub Actions).** `.github/workflows/test.yml` running typecheck + Vitest + Playwright on every PR. Tests already mock the network so no real Supabase/Resend secrets needed in CI — only placeholder env vars so the dev server boots. Lands AFTER the Next upgrade so CI is testing the post-upgrade code, not 14.2.15.
4. **Wire coverage gates.** Add `npm run test:coverage` script + thresholds in `vitest.config.ts` per Engineering-Standards §7 (90% `lib/`, 85% `app/api/`, 75% components-with-logic). Gate the CI job on coverage thresholds. Phase 0 only has `lib/validation.ts` (already 100%) so this is forward-looking — but it bites the first time Phase 1 code lands without tests, which is the whole point.
5. **Generate `app/favicon.ico`.** Closes the last Lighthouse Best Practices console error (96 → 100). ~20 min, manual ICO-header wrap around a 32×32 PNG (sharp can't write ICO).
6. **DNS flip `bohdiai.com` → this Vercel project** once 1–5 are clean on preview.
7. **Phase-0-Spec.md sync.** Edit the spec to match what actually shipped. Needs Alex in the loop for the "is this scope creep or final design?" calls. Can land after DNS flip; not a launch blocker.
8. **After launch lands → begin drafting Phase 1 spec.** Target: private beta mid-August 2026.

## Lessons banked from this session (do not repeat)

- **"If it has to be done eventually and benefits the app, it needs to be done."** Alex's standing rule. Stop reflexively deferring CVE upgrades, Node upgrades, coverage wiring, etc. Surface them, recommend, and act in the same session unless they're genuinely out of scope.
- **Tests catch real bugs.** The BrowserDemo z-index bug and the dot button target-size bug both affected real users, not just tests. The test safety net pays for itself the day it lands.
- **Decorative marketing art needs `aria-hidden` + axe `.exclude()`.** The two work in tandem: `aria-hidden` is honest semantics, `.exclude()` is honest measurement. Lighthouse won't honor either for color-contrast (sighted-user reasoning), and that's an accepted trade-off — not a thing to keep trying to fix.
- **Windows orphan node processes block dev/test workflows.** TaskStop kills the wrapper shell but not the spawned children. Alex closed Claude Desktop and manually killed nodes mid-session to unstick. If port 3100/3000 hangs in future sessions, suspect orphan processes first.
- **`process.env.X` fails Next/TS strict build.** Must use bracket notation: `process.env['X']`. Caught in `playwright.config.ts` during `npm run build`.

## Lessons banked from previous sessions (still active)

- **Read the Master Spec at session start, every session.** CLAUDE.md enforces this.
- **Cite the spec before opining on architecture.** If I can't cite it, I'm guessing. Stop and re-read instead. CLAUDE.md enforces this.
- **`replace_all` for color migration is dangerous when the search target also exists in the migration scaffold.** Define new tokens *after* sweeping the file, not before.
- **Don't conflate "built it as a React component" with "built it as a reusable template."** Three single-file storefront components are marketing art, not a template library.

## Files to know

1. **Posy Lane Books cutoff fix.** The KidsStore demo was overflowing the BrowserDemo container on mobile + desktop (poster padding + h2 + chip strip too tall). Tightened in `globals.css`: poster padding 55→44 desktop / 48→36 mobile, h2 64→54 desktop / 38→32 mobile, cover image width 62→50% mobile, thumbs strip padding/gap/font reduced, `min-height: 0` on `.poster` so flex shrinks. Verified locally.

2. **Storefront token refactor.** Replaced raw hex inside `.store-sourdough` / `.store-tattoo` / `.store-kids` with scoped CSS custom properties at the top of each block (`--paper`, `--ink`, `--blood`, `--sky`, etc). Hit a real bug mid-flight: `replace_all` swept through the token *definitions themselves*, turning them into self-references (`--paper: var(--paper)`) and breaking the storefronts. Fixed by redefining all three palette blocks with literal hex values. Lesson: when using `replace_all` for hex → `var(--name)`, define the tokens *after* the replacement, not before. **NOTE:** this refactor turned out to be architecturally unnecessary (see point 4 below) but causes no harm and stays in place per Alex's call.

3. **Stray hex audit.** Searched the rest of the codebase. Found ~15 hex literals in `app/opengraph-image.tsx`, `components/BrowserDemo.tsx`, `components/Community.tsx`, `components/HowItWorks.tsx`. These were NOT cleaned up because of point 4.

4. **Course correction — I was opining on architecture without reading the Master Spec.** Alex caught me framing the 3 demo storefronts as "seed templates" and inventing Phase 1 architecture by guessing. The actual Phase 1 architecture (Master Spec §6) is:
   - Per-tenant design tokens in Supabase JSON, injected as CSS variables at render time
   - AI-generated token values bounded by per-niche schemas (candle makers = warm tones, jewelry = cool tones)
   - ~15–18 modular React component variants (3–4 hero variants, 3 grid variants, etc), composed per-tenant via tenant data
   - Lead developer (me) builds the token schema + 5 foundational components; agents build remaining variants + niche schemas + design boundaries in parallel
   - The 3 demo storefronts I built earlier are NOT seed templates — they're monolithic single-file marketing art with no Phase 1 architectural role

5. **Spec docs ported from .docx to .md.** Created [BohdiAI-Master-Spec.md](BohdiAI-Master-Spec.md) and [BohdiAI-Roles-Workflow.md](BohdiAI-Roles-Workflow.md) so I can load them at session start without docx extraction. The .docx files remain canonical.

6. **CLAUDE.md tightened.** Added a "Required reading at session start" list (CLAUDE.md → SESSION-BRIEF.md → Master Spec → Roles & Workflow → current Phase Spec) AND a hard rule: before opining on architecture, I must cite the relevant Master Spec section. If I can't cite it, I haven't earned the right to opine. Guessing already cost a session.

## Open questions for next session

1. **Privacy + Terms:** Footer links are still `href="#"` placeholders. Waitlist already collects emails. Real GDPR-friendly pages or placeholder "Coming with launch"?
2. **DNS flip:** When to point `bohdiai.com` → this Vercel project? Needs your Cloudflare access.
3. **`.build` rebuild-effect direction:** Today the old infinite cycle was killed. Want a subtle 30s periodic re-trigger for the "watch your store rebuild" feeling, or keep the current one-shot fade-in? Earlier this session you said "refade sounds nice" but we didn't build it.
4. **Daily Audit Q3 reframe:** Q3 ("design tokens, no hardcoded values") was the trigger for today's whole token detour. With the actual architecture in hand: Q3 should apply to Phase 1 *component variants* (which are token-driven by design), NOT to Phase 0 marketing artwork like the 3 demo storefronts. Worth a quick edit to Daily-Audit.md so future audits don't re-trigger the same misunderstanding.

## NEXT SESSION priorities (in order)

1. **Next.js major upgrade: 14.2.15 → 15.x → 16.x BEFORE DNS flip.** `npm audit` currently flags 24 advisories against `next@14.2.15` (1 critical, 3 high, 1 moderate; most are config-gated and we don't expose the vulnerable surface, but the count is real). Doing the upgrade now is *safer* than deferring: codebase is at its smallest, no live users, smoke tests now exist, and we want to be on current Next *before* Phase 1 adds tenant middleware + tenant-aware caching (where Next 15's flipped fetch caching default is a silent footgun). Order: 14 → 15 first (the bigger jump — async `cookies()`/`headers()`/`params`, fetch no longer cached by default, React 19), all tests green + manual smoke, then 15 → 16. Re-run `npm audit` after.
2. **DNS flip `bohdiai.com` → this Vercel project** once the upgrade ships clean to preview.
3. **After launch lands → begin drafting Phase 1 spec.** Target: private beta mid-August 2026.

## Lessons banked from today (do not repeat)

- **Read the Master Spec at session start, every session.** CLAUDE.md now enforces this.
- **Cite the spec before opining on architecture.** If I can't cite it, I'm guessing. Stop and re-read instead. CLAUDE.md now enforces this.
- **`replace_all` for color migration is dangerous when the search target also exists in the migration scaffold.** Define new tokens *after* sweeping the file, not before. (Or use targeted edits instead of `replace_all`.)
- **Don't conflate "built it as a React component" with "built it as a reusable template."** Three single-file storefront components are marketing art, not a template library. The Phase 1 template library is independent modular variants assembled per tenant via data.

## Files to know

- `_design-mocks/hero-atmospheric.html` — source-of-truth mock, frozen reference
- `app/page.tsx` — wires the 10 sections into the Scene shell
- `app/layout.tsx` — fonts + skip-to-content + JSON-LD
- `app/globals.css` — atmospheric backdrop + 3 storefront stylesheets + keyframes
- `app/privacy/page.tsx` + `app/terms/page.tsx` — legal pages, shipped this session
- `app/icon.svg` — brand B favicon (modern browsers; legacy `/favicon.ico` still 404s)
- `tailwind.config.ts` — design tokens
- `components/` — 16 files (10 sections + Scene + Embers + Rotator + Typewriter + SectionKicker + BrowserDemo)
- `components/storefronts/` — SourdoughStore + TattooStore + KidsStore (marketing art, NOT seed templates)
- `lib/validation.ts` + `lib/validation.test.ts` — waitlist/resend zod schemas + 9 unit tests
- `e2e/waitlist.spec.ts` + `e2e/browser-demo.spec.ts` + `e2e/a11y.spec.ts` — 15 Playwright specs
- `vitest.config.ts` + `vitest.setup.ts` — unit test harness
- `playwright.config.ts` — desktop + mobile projects, webServer launches dev on port 3100
- `scripts/compress-portrait.mjs` + `scripts/download-storefronts.mjs` — image pipeline (reproducible)
- `project-docs/Styling-Conventions.md` — rank-2 operating doc (Tailwind + atmospheric tokens)
- `project-docs/BohdiAI-Master-Spec.md` — **rank-2 product spec** (.docx is canonical)
- `project-docs/BohdiAI-Roles-Workflow.md` — **rank-2 process doc** (.docx is canonical)
- `project-docs/Phase-0-Spec.md` — Phase 0, shipped (design has evolved past it — sync edit pending)
- `project-docs/Approval-Policy.md` + `Engineering-Standards.md` — still authoritative
- `project-docs/Daily-Audit.md` — the 19-question audit; Q3 reframed this session

## Operational notes (unchanged)

- **Vercel CLI installed and linked** to `alex-ouellet-s-projects/bohdiai`
- **GitHub repo:** https://github.com/AlexSOuellet/bohdiai
- **Live preview:** https://bohdiai.vercel.app
- **Supabase:** us-east-1, `bohdi-ai`, secret-key system
- **Stack:** Next.js 14.2.15 · Tailwind · TypeScript strict · Supabase · Vercel · Resend · Cloudflare

## Don'ts (working preferences, unchanged)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch when needed.
- Don't paste secrets in chat.
- Don't ship subtle motion — Alex wants visible (but no theater — cart-ticker is the cautionary tale).
- Don't build desktop-only — mobile-first.
- `overflow: clip` (not `hidden`) for atmospheric clipping — `hidden` creates a Chrome scroll container that breaks anchor links.
- Styling decisions: Styling-Conventions.md wins.
- Keyframes used by `@layer components` rules: declare in `globals.css`, NOT `tailwind.config.ts` (Tailwind won't emit them otherwise).
- Don't invent architecture. Cite the Master Spec or stop and ask.

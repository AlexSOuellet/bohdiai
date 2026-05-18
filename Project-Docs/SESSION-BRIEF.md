# Session Brief — BohdiAI

**Last updated:** 2026-05-18 (end of mock build-out + audit session)
**Update at the end of every session.**

---

## Where we are right now

The design mock is **feature-complete**. All 8 sections built, mobile-responsive at ≤720px, animations dialed in, anchor navigation working, and a real Chrome browser quirk diagnosed and fixed. Daily audit passed (see [session-logs/2026-05-18.md](session-logs/2026-05-18.md)).

**Next action: port the mock to Next.js and deploy as the new `bohdiai.com`.**

The current live preview at https://bohdiai.vercel.app still shows the bare-bones "literary boutique" design from Phase 0. The mock at `_design-mocks/hero-atmospheric.html` is the replacement.

## What's in the finished mock

**File:** `_design-mocks/hero-atmospheric.html` (~2000 lines, single self-contained HTML)
**Direction:** "Atmospheric" — near-black background with warm honey light effects. Reference: https://godly.website/website/create-video-716

**Final section order** (was reordered mid-session for trust-signal flow):
1. **Hero** — atmospheric scene with 3 cycling storefronts (June's Sourdough / Iron & Ash Tattoo / Posy Lane Books), each a completely different *kind* of website. Honey-pill "Beta opening — summer 2026" at top. Browser frame locked at 700px desktop / 620px mobile. **3 honey dot indicators below the frame** — click to jump between storefronts. **Hover anywhere on the frame to pause** auto-cycle.
2. **How It Works** — 3 numbered steps with connecting honey line (horizontal desktop, vertical mobile). Typewriter prompt cycling through 5 business intros, glowing AI orb, live URL badge.
3. **Trades marquee** — 2 horizontal scrolling rows of business-type chips at readable speeds (140s/160s — slowed from 80s/90s). Sourdough/Tattoo/Picture-book-author highlighted in honey. Tap-to-pause on mobile.
4. **Waitlist** — Honey-bordered card with **two-button toggle** (Founder Beta 25 spots / Notify me), live counter with honey progress bar (mocked at 17/25 — will be real from Supabase in production), email input + submit. Inline success state on submit (no modal).
5. **Who's Behind** — Alex's portrait (`assets/alex-portrait.png`) with **CSS radial-gradient mask** that feathers edges into the dark page. Revised "I've spent 30 years..." quote with honey accent on "home computers" and "AI." Signed "Alex Scott · Founder, BohdiAI."
6. **Pledge** — Three signed pledges in italic Cormorant, each with a glowing honey dot on a vertical rule. Same Alex signature as Who's Behind. Pledge #2 softened to data we can actually deliver (customer list / emails / order history). Pledge #3 rewritten to "Your shop's data stays in your shop" (was confusing "Subscription only" wording).
7. **Community** — Skool card with "On Skool" platform pill, "Witsend Breakthroughs" lockup, "Just opened" status pill, CTA linking to real Skool URL. "Free to join. You don't need a BohdiAI account."
8. **Footer** — Brand + tagline / Product / Community / Contact columns. "© 2026 BohdiAI · Built in Rhode Island." Real YouTube channel link wired (https://www.youtube.com/@TheAlexScott).

**Animation tuning** (session-end): removed the sweep bar (pure decoration), removed cart-counter ticker (read as fake), slowed "+1 new order" pill 7s→13s, slowed trades marquees ~2x. Static "Cart · 3 / 2 of 6 / 1" numbers per storefront instead of tick-tick theater.

**Critical bug fixed:** `.scene` had `overflow: hidden` which silently creates a Chrome scroll container. Anchor links were scrolling `.scene` internally instead of the document, leaving navbar/hero at negative y coordinates. **Fix: `overflow: clip`.** Worth a line in Engineering Standards before the port.

## NEXT SESSION: Port the mock to Next.js + deploy

**Goal: `bohdiai.com` shows the new design within a few days.**

Realistic time: **3-5 days of focused work** (closer to 3 if no surprises).

Order of operations:
1. **Split the mock into React components** in `components/` — roughly: Header, Hero, BrowserDemo, HowItWorks, TradesMarquee, Waitlist, WhoBehind, Pledge, Community, Footer (~10 components).
2. **Move CSS over** — keep as global CSS for now. No premature conversion to Tailwind. Convert hardcoded hex/rgba values to design tokens (per audit Q3).
3. **Move the 17 storefront images** from the gen-tool CDN to `/public/storefronts/` (or Supabase Storage if we want a CDN). Keep `alex-portrait.png` in `/public/`.
4. **Wire the waitlist form to the existing API route** (already works in Phase 0 — just connect the new UI to the existing endpoint). Replace mocked 17/25 counter with the real count from Supabase.
5. **Delete the old components** that the new design replaces (Header, Hero, HowItWorks, Breadth, WhosBehindThis, Waitlist, Community, Pledge, Footer — keep only the logic layer like the waitlist API).
6. **Fix the audit gaps** before going live: email input `<label>`, `aria-live` on status pills, skip-to-content link, Lighthouse mobile ≥ 90.
7. **DNS flip** `bohdiai.com` to the new design.

## After the marketing site is live → Phase 1 (beta product)

Alex's target: **private beta in roughly 2 months** (so ~mid-August 2026).

Phase 1 spec doesn't exist yet. Draft it AFTER the marketing site is live, so we can plan the actual product (multi-tenant maker auth, AI storefront generation, [shop].bohdiai.com subdomains, Stripe/Square webhook integration) with a clear scope.

## Files to know

- `_design-mocks/hero-atmospheric.html` — the finished mock (the source of truth for the port)
- `_design-mocks/assets/alex-portrait.png` — founder portrait used in Who's Behind
- `app/` and `components/` — current Phase 0 Next.js site (mostly to be replaced)
- `lib/`, `supabase/migrations/` — keep these, the waitlist API + DB stay
- Phase 0 spec: [Phase-0-Spec.md](Phase-0-Spec.md) — shipped, but the design has evolved well past it
- Daily audit: [Daily-Audit.md](Daily-Audit.md)
- Today's session log: [session-logs/2026-05-18.md](session-logs/2026-05-18.md)
- Approval Policy and Engineering Standards still authoritative

## Operational notes (unchanged)

- **Vercel CLI installed and linked** to `alex-ouellet-s-projects/bohdiai`
- **GitHub repo:** https://github.com/AlexSOuellet/bohdiai
- **Supabase:** us-east-1, `bohdi-ai`, secret-key system in use
- **Stack:** Next.js 14.2.15 · Tailwind · TypeScript strict · Supabase · Vercel · Resend · Cloudflare

## Deferred backlog (pick up after the port)

- Fix silent email-send failures (Golden Rule violation, ~30 min)
- Wire Sentry + PostHog stubs (waiting on accounts)
- Clean test rows in waitlist table
- DNS flip to bohdiai.com (handled as part of the port)

## Don'ts (working preferences)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch.
- Don't paste secrets in chat.
- Don't ship "subtle" motion — Alex wants visible (but no theater — the cart-counter ticker is the cautionary tale).
- Don't build desktop-only — mobile-first from now on.
- When clipping atmospheric/decorative effects in production: use `overflow: clip`, NOT `overflow: hidden`. Hidden creates a Chrome scroll container that breaks anchor links.

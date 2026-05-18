# Session Brief — BohdiAI

**Last updated:** 2026-05-18 (end of Phase 0 build session)
**Update at the end of every session.**

---

## Where we are right now

**Phase 0 is technically shipped to a Vercel preview URL** at https://bohdiai.vercel.app. The full stack works end-to-end:

- Marketing page renders all 9 sections (Header, Hero, How it works, Trades, Who's behind this, Waitlist, Community, Pledge, Footer)
- Waitlist form: email + Founder/Notify radio, live "X of 25 founder spots left" counter, founder cap behavior
- `POST /api/waitlist` writes to Supabase with confirmation token
- Resend sends confirmation email from `BohdiAI <alex@bohdiai.com>`
- `GET /confirm?token=...` confirms + sends welcome email + redirects to `/confirmed`
- Confirmed end-to-end with real Gmail on 2026-05-18

Domain is **bohdiai.com** (NOT `bohdi.ai`, which is owned by a third party). Brand is still **BohdiAI**.

## What's NOT done yet (next session priorities)

**Alex's stated next focus: page look-and-feel review.** That's the right call before DNS flip.

In priority order:

1. **Visual review on real devices and browsers.** Page is at https://bohdiai.vercel.app. Walk through it on desktop (Chrome, Safari, Firefox), tablet, mobile. Look for: copy that doesn't sit right, palette tweaks, spacing issues, hero text rotation timing, whether the "Who's behind this" copy lands the way Alex wants, whether the storefront-stack illustration reads correctly, whether the trades grid feels too dense, whether the dark Community card pulls focus the right way.
2. **"Who's behind this" copy review.** Current draft is a 2-paragraph card by Claude. Alex hasn't reviewed it yet. Spec called for him to pick from 2-3 versions — we shipped one for speed. If he doesn't like it, draft alternatives.
3. **og:image visual review.** Dynamically generated at `/opengraph-image` via next/og. Test by sharing the URL in iMessage / Slack / Discord and seeing how the preview card looks.
4. **Lighthouse pass.** Target: mobile Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95.
5. **Fix silent email-send failures.** Currently if Resend errors, the API still returns success and the user gets "Check your email" but no email. Per Golden Rule "no silent failures," this needs to fail loud. ~30 min fix.
6. **Wire Sentry + PostHog stubs** so they activate when keys are added. Alex still hasn't created those accounts.
7. **Clean up test rows in the `waitlist` table** (diag2, diag3, posttest, etc.). One SQL delete.
8. **DNS flip** — change `SITE_URL` back to `https://bohdiai.com`, point DNS at Vercel via Cloudflare. Last step before announcing.

## Operational tools wired up this session

- **Vercel CLI is installed and linked** to `alex-ouellet-s-projects/bohdiai`. Claude can now run `vercel env`, `vercel deploy`, `vercel logs`, etc. without Alex touching the dashboard. Auth lives in Alex's user profile (one-time `vercel login` already done).
- **GitHub repo:** `https://github.com/AlexSOuellet/bohdiai` (under Alex's personal account, not the planned `bohdi-software` org — deferred decision, fine for now).
- **Supabase project:** us-east-1, `bohdi-ai`, RLS enabled on `waitlist`, no policies. New secret-key system in use (legacy keys disabled after a service_role leak in chat earlier in this session — both Supabase and Resend keys were rotated).

## Stack confirmed working

Next.js 14.2.15 (App Router) · Tailwind · TypeScript (strictest) · Supabase (Postgres + RLS) · Vercel (Node 24 build, iad1 region) · Resend · Cloudflare (DNS + Email Routing for `alex@bohdiai.com`)

## Open blockers (waiting on Alex)

- Sentry + PostHog accounts (low priority — can do anytime)
- Whether to migrate repo to `bohdi-software` GitHub org (deferred — fine to ship under personal account)
- Whether to set up GitHub Action for auto-migrations before Phase 1 (recommended)

## Files to know

- All Phase 0 source code under `app/`, `components/`, `lib/`, `supabase/migrations/`
- Design originals in `Design files/BohdiAI/` (still reference `bohdi.ai` in places — update when Phase 1 needs them)
- Phase 0 spec: [Phase-0-Spec.md](Phase-0-Spec.md) — APPROVED, followed Path A (strict spec, not the richer design)
- Pre-work checklist: [Phase-0-PreWork-Checklist.md](Phase-0-PreWork-Checklist.md) — completed
- Approval Policy and Engineering Standards still authoritative

## Don'ts (current session preferences)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch.
- Don't add anything not in the Phase 0 spec — Bucket 4 escalation.
- Don't paste secrets in chat. Alex puts secrets into Vercel directly OR fills `.env.local` — but the file-diff system notification will surface them to Claude if filled while Claude is watching. Rotate after.
- Slow down on long step-by-step procedures. Alex prefers smaller, clearer chunks over big batches.

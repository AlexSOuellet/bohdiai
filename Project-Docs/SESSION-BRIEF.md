# Session Brief — BohdiAI

**Last updated:** 2026-05-17 (end of planning session)
**Update at the end of every session.**

---

## Where we are right now

Planning is **complete**. Phase 0 spec, Approval Policy, Engineering Standards, and Daily Audit are all approved. All 9 Phase 0 open questions are answered and locked. No code has been written yet.

Alex's pre-work (accounts, DNS, email routing) is **scheduled for tomorrow morning**.

## What happens in the very next session

1. **Alex completes** [Phase-0-PreWork-Checklist.md](Phase-0-PreWork-Checklist.md). Tells Claude when each step is done.
2. **Alex shares non-secret values in chat:**
   - Supabase project URL
   - Sentry DSN
   - PostHog project API key + host
3. **Alex puts secrets directly into Vercel env vars** (NOT in chat):
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `SENTRY_AUTH_TOKEN` (for source-map upload)
4. **Claude scaffolds** Next.js 14 App Router + Tailwind + TypeScript strictest config + Sentry + PostHog + Supabase client.
5. **Claude ports** the design from `Design files/BohdiAI/` (Coming Soon.html + parts.jsx + app.jsx) into Next.js components, preserving palette/fonts/structure exactly.
6. **Claude builds:**
   - Waitlist form (email-only, founder/notify radio, founder cap)
   - `POST /api/waitlist` → insert row, send confirmation email via Resend
   - `GET /confirm?token=...` → mark confirmed, send welcome email, redirect to `/confirmed`
   - `/confirmed` and `/confirm/error` pages
   - `POST /api/waitlist/resend` for unconfirmed addresses
   - Cloudflare redirect: `learn.bohdiai.com` → Witsend Breakthroughs Skool URL
   - og:image draft (1200×630 cream/honey card)
   - 2-3 "Who's behind this" copy drafts for Alex to pick
   - Supabase migration for `waitlist` table
   - SEO/a11y/perf passes
7. **Claude deploys to Vercel preview URL** and shares with Alex.
8. **Alex reviews** end-to-end (signup, confirm, welcome email all arrive; design matches; founder cap works).
9. **Claude flips DNS** to production once Alex approves.
10. **Phase 0 ships.** Update this brief.

## Open blockers (waiting on Alex)

- Pre-work checklist completion
- og:image: nothing to wait on — Claude drafts during build
- "Who's behind this" copy: Claude drafts during build, Alex picks
- Witsend Breakthroughs Skool URL: ✅ have it (`https://www.skool.com/wits-end-breakthrough-7869`)

## Open decisions Claude must escalate (none right now)

If anything comes up during build that's outside the Phase 0 spec, escalate per the Approval Policy (Bucket 4 — stop and wait).

## What to do AFTER Phase 0 ships

In order:

1. **Tech Architecture Spec** — DB schema, design token JSON shape, niche schema JSON shape, Vibe Slider math, full multi-tenant data model. Claude drafts, Alex reviews section by section.
2. **Cowork evaluation session** — half-day deep dive: can Cowork host the "agent" role with role-scoped instructions, parallel runs against the same repo, review/approval workflow, cost model.
3. **Phase 1 Doc** — concretize the Master Spec MVP into a sequence of buildable feature specs.
4. **Onboarding prototype** — clickable HTML/Figma of the 5-screen onboarding + "watch it build" moment, BEFORE writing Phase 1 code.
5. **Decide:** launch niche list (3-5 niches), Basic tier product cap (5 vs 10), AI usage caps per tier, content-filtering pipeline.

This is the planning gap referenced in the proposed timeline (Weeks 2-3).

## Where things live

- Project docs: `project-docs/` (markdown going forward; .docx files are reference originals)
- Design files: `Design files/BohdiAI/` (port these into Next.js for Phase 0)
- Memory (Claude's persistent context): `C:\Users\Bohdi\.claude\projects\C--Projects-BohdiAI\memory\`

## Don'ts (current session preferences)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch.
- Don't add anything not in the Phase 0 spec — Bucket 4 escalation.
- Don't paste secrets in chat. Alex puts secrets into Vercel directly.

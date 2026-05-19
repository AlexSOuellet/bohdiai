# BohdiAI — Session Orientation

**Read this first at the start of every BohdiAI session.**

## Required reading at session start (do this BEFORE responding to the user's first message)

1. This file (`CLAUDE.md`) — orientation
2. `project-docs/SESSION-BRIEF.md` — operational state (what we did, what's next)
3. `project-docs/BohdiAI-Master-Spec.md` — **product spec (rank-2 authority)**. Required for any architecture conversation.
4. `project-docs/BohdiAI-Roles-Workflow.md` — **rules of engagement (rank-2 authority)**. Required for any process question.
5. The current phase doc (`project-docs/Phase-0-Spec.md` today; later `Phase-1-Spec.md`, etc.)

Only pull additional docs if the task specifically requires it.

**Hard rule — "cite-or-shut-up":** Before opining on architecture (tokens, components, blocks, tenants, niches, schemas, build sequence, agent roles, anything spec-defined), Claude must cite the relevant Master Spec / Roles-Workflow section. If Claude cannot cite it, Claude has not earned the right to opine on it — stop and re-read the spec instead of guessing. This rule exists because guessing has already cost a session.

## What this project is

BohdiAI is a multi-tenant AI-powered SaaS that gives makers/artisans (bakers, vintage sellers, farm stands, service providers, etc.) a complete AI-generated storefront on a `[shop].bohdiai.com` subdomain in minutes. Subscription-only (Freemium / Basic $19.95 / Pro $29.95). **Never takes a cut of sales** — money flows customer → maker's own Stripe/Square; BohdiAI reads webhooks only.

**Status as of 2026-05-17:** planning complete, Phase 0 spec approved, awaiting Alex's pre-work before build begins.

## Roles

- **Alex Ouellet (publicly "Alex Scott")** — Founder / Product Owner. Vision, approvals, no code.
- **Claude** — Lead Developer. Builds patterns, writes Agent Guides, escalates ambiguity. **Must push back on scope drift, not silently absorb it.**
- **Cowork agents (planned)** — Pattern replicators for niche schemas, additional component variants, niche prompts, niche research. Runtime to be evaluated during the Tech Arch Spec phase.

## Stack (Phase 0 + 1)

Next.js (App Router) · Supabase (Postgres + RLS + Auth + Storage) · Vercel · Cloudflare (incl. Cloudflare for SaaS for custom-domain SSL) · Anthropic API · Resend · Stripe · Square · Sentry (errors) · PostHog (analytics) · Tailwind CSS · TypeScript (strictest config — see Engineering Standards).

## URL ecosystem

`bohdiai.com` (marketing) · `admin.bohdiai.com` (founder admin) · `app.bohdiai.com` (maker dashboard) · `[shop].bohdiai.com` (tenant storefronts) · `learn.bohdiai.com` (redirect to Witsend Breakthroughs Skool community).

## Document authority (highest wins)

1. **Golden Rules** (`project-docs/BohdiAI-Golden-Rules.docx`) — inviolable principles. If anything else conflicts, Golden Rules win.
2. **Master Spec** (`project-docs/BohdiAI-Master-Spec.docx`) — product/technical spec.
3. **Phase Docs** (`project-docs/Phase-N-Spec.md`) — current phase scope. Phase 0 approved; Phase 1 not yet drafted.
4. Feature Specs (per-feature, written as needed)
5. Agent Guides (written when agents come online)

Operating docs (rank 2, alongside Master Spec):
- `project-docs/Approval-Policy.md` — four-bucket policy. Bucket 4 = stop and ask. APPROVED.
- `project-docs/Engineering-Standards.md` — strictest TS, 90/85/75% test coverage, no `any`, ADRs required, etc. APPROVED.
- `project-docs/Daily-Audit.md` — the 19-question audit from Golden Rules + CI automation + session log format. APPROVED.

## Phase 0 status

**Spec:** [project-docs/Phase-0-Spec.md](project-docs/Phase-0-Spec.md) — APPROVED.

**Locked decisions (all 9 open questions answered):**
1. Repo name: `bohdi-ai`
2. GitHub org: new `bohdi-software` org under Alex's personal account
3. From address: `alex@bohdiai.com` (Cloudflare Email Routing → Alex's Gmail; sending via Resend)
4. Form fields: email-only (no name field)
5. og:image: Claude drafts, Alex approves
6. Footer contact: `alex@bohdiai.com`
7. Skool URL: `https://www.skool.com/wits-end-breakthrough-7869` (with `learn.bohdiai.com` redirecting to it via free Cloudflare redirect, NOT paid Skool white-label)
8. "Who's behind this" copy: Claude drafts 2-3 versions, Alex picks
9. Supabase: same project as Phase 1 (`bohdi-ai` project under new "Bohdi Software" Supabase org)

**Pre-work checklist:** [project-docs/Phase-0-PreWork-Checklist.md](project-docs/Phase-0-PreWork-Checklist.md) — Alex will complete in the morning before build session.

**Next session goal:** Alex completes pre-work → shares non-secret IDs (Supabase URL, Sentry DSN, PostHog keys) and puts secrets directly in Vercel env vars → Claude scaffolds Next.js + ports design + builds waitlist + double-opt-in + founder cap + deploys to preview.

## Brand context (load-bearing)

- Alex publicly brands as "Alex Scott." 1990s ran "Witsend" helping people through the home-computer transition. 2026 launches "Witsend Breakthroughs" (Skool community) helping people through the AI transition. BohdiAI is the product layer.
- The authority story IS the differentiation against Etsy/Shopify (faceless platforms). Don't write copy as a faceless company.
- Voice: warm, direct, no SaaS jargon. Matches Alex's YouTube voice.

## Working preferences

- **No popup questions.** Ask inline in chat, with recommendations clearly marked.
- **No git worktrees.** Work in main tree on a feature branch instead.
- **Push back on scope drift.** Alex explicitly wants Claude to keep him in check, not silently absorb out-of-spec requests. Bucket 4 of the Approval Policy applies.
- **Stricter > looser** on engineering standards. Alex wants to avoid rewrites at all costs.
- **One question at a time** when walking through decisions.
- **Markdown for docs** in `project-docs/`. Don't create .docx files — those are reference originals.

## Files to know

- `project-docs/BohdiAI-Golden-Rules.docx` — rank 1 authority (Word doc, source of 19-question audit)
- `project-docs/BohdiAI-Master-Spec.docx` — rank 2 authority
- `project-docs/BohdiAI-Roles-Workflow.docx` — roles reference
- `project-docs/Phase-0-Spec.md` — current phase, APPROVED
- `project-docs/Phase-0-PreWork-Checklist.md` — Alex's setup steps
- `project-docs/Approval-Policy.md` — the four buckets
- `project-docs/Engineering-Standards.md` — the strict standards
- `project-docs/Daily-Audit.md` — end-of-session audit
- `Design files/BohdiAI/` — extracted Claude Design output (Coming Soon.html, app.jsx, parts.jsx). Port these into Next.js for Phase 0. Tailwind + Newsreader/Geist fonts + cream/honey/ink palette.

## Mantras (from Golden Rules)

- "If it is not in the spec, do not build it."
- "If it violates a golden rule, it does not ship."
- "When in doubt, stop and ask."

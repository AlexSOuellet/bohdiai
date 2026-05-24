# BohdiAI — Session Orientation

**Read this first at the start of every BohdiAI session.**

## Required reading at session start (do this BEFORE responding to the user's first message)

1. This file (`CLAUDE.md`) — orientation
2. `project-docs/SESSION-BRIEF.md` — operational state (what we did, what's next)
3. **`project-docs/BohdiAI-Master-Spec.md` — READ IN FULL, every session, every time.** This is the product design. It carries across sessions because Claude has no memory between sessions. Skimming or "pulling sections as needed" is not allowed. Read the whole thing before responding to the user's first message.
4. `project-docs/BohdiAI-Roles-Workflow.md` — rules of engagement (rank-2 authority). Required for any process question.
5. The current phase doc (`project-docs/Phase-1-Spec.md`)
6. `project-docs/Phase-1-Decisions-Log.md` — refinements on top of the Master Spec captured during Phase 1 planning. The Master Spec wins where the decisions log is silent; the decisions log wins where it has spoken.

Only pull additional docs if the task specifically requires it.

**Hard rule — "cite-or-shut-up":** Before opining on architecture (tokens, components, blocks, tenants, niches, schemas, build sequence, agent roles, anything spec-defined), Claude must cite the relevant Master Spec / Roles-Workflow section. If Claude cannot cite it, Claude has not earned the right to opine on it — stop and re-read the spec instead of guessing. This rule exists because guessing has already cost a session.

**Hard rule — plain English in chat:** Alex talks to Claude in conversational English and wants the same back. The defaults to avoid:

- No bullet lists when 2-3 sentences would work. Lists are for genuinely parallel items, not for "organized-looking" responses.
- No headings, no bold labels, no section dividers in chat. Save formatting for documents.
- No reference IDs in chat — "D5", "§6.2", "per Master Spec §8" all read like a doc index. If you need to refer to a prior decision, describe it in a few words ("the variations-table decision," "the foundation-first rule").
- No designer or engineer jargon Alex didn't use first. "Warm/cool/traditional," "additive schema design," "extension tables" — these mean nothing to most makers and Alex has explicitly called them out.
- Short sentences over long ones. Conversational over comprehensive.
- When tempted to summarize with a structured response, ask whether a paragraph would land better. Almost always yes.

The structured-list reflex is a documentation habit. It belongs in `.md` files, not chat.

## What this project is

BohdiAI is a multi-tenant AI-powered SaaS that gives makers/artisans (bakers, vintage sellers, farm stands, etc.) a complete AI-generated storefront on a `[shop].bohdiai.com` subdomain in minutes. Subscription-only (one tier at launch, ~$35–$49/mo). **Never takes a cut of sales** — money flows customer → maker's own Stripe/Square; BohdiAI reads webhooks only.

**Status as of 2026-05-24:** Phase 0 shipped and live. Phase 1 planning complete — D1 through D18 locked. All 33 database tables live in Supabase. Phase 1 Spec written. Build begins next session.

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
3. **Phase Docs** (`project-docs/Phase-N-Spec.md`) — current phase scope. Phase 0 shipped. Phase 1 spec written and active.
4. Feature Specs (per-feature, written as needed)
5. Agent Guides (written when agents come online)

Operating docs (rank 2, alongside Master Spec):
- `project-docs/Approval-Policy.md` — four-bucket policy. Bucket 4 = stop and ask. APPROVED.
- `project-docs/Engineering-Standards.md` — strictest TS, 90/85/75% test coverage, no `any`, ADRs required, etc. APPROVED.
- `project-docs/Daily-Audit.md` — the 19-question audit from Golden Rules + CI automation + session log format. APPROVED.

## Phase 0 status — SHIPPED ✓

bohdiai.com is live. Double-opt-in waitlist works. Full stack validated. See `project-docs/Phase-0-Spec.md` for the complete record.

## Phase 1 status — READY TO BUILD

All planning complete. D1 through D18 locked in `project-docs/Phase-1-Decisions-Log.md`. Database live in Supabase (33 tables, RLS on, migration runner at `scripts/db-migrate.mjs`). Phase 1 Spec at `project-docs/Phase-1-Spec.md`.

**Next session goal:** Start Phase 1 build. First priority is the storefront resolver (subdomain → tenant_id middleware), then Supabase Auth wiring, then onboarding flow. See Session Brief and Phase 1 Spec for full sequence.

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
- `project-docs/Phase-1-Spec.md` — current phase spec, ACTIVE
- `project-docs/Phase-0-Spec.md` — Phase 0 record (shipped)
- `project-docs/Tech-Arch-Spec.md` — database design, schema live in Supabase
- `project-docs/Approval-Policy.md` — the four buckets
- `project-docs/Engineering-Standards.md` — the strict standards
- `project-docs/Daily-Audit.md` — end-of-session audit
- `content/niches/candles.md` — reference niche file
- `content/niches/_queue.yaml` — launch queue of ~260 niche candidates
- `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill
- `Design files/BohdiAI/` — extracted Claude Design output. Tailwind + Newsreader/Geist fonts + cream/honey/ink palette.

## Mantras (from Golden Rules)

- "If it is not in the spec, do not build it."
- "If it violates a golden rule, it does not ship."
- "When in doubt, stop and ask."

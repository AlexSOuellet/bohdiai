# BohdiAI — Session Orientation

**Read this first at the start of every BohdiAI session.**

## Required reading at session start (BEFORE responding to the user's first message)

1. This file (`CLAUDE.md`) — orientation.
2. `Project-Docs/SESSION-BRIEF.md` — operational state (where we are, what's next). Under 100 lines by mandate.
3. **`Project-Docs/Full-Plan.md` — THE OPERATIVE PLAN.** Six phases from now through the top-priority goals. Every session updates its checkboxes as work lands.
4. **`Project-Docs/BohdiAI-Master-Spec.md` — READ IN FULL, every session, every time.** Retired sections carry a SUPERSEDED banner; the rest is live. Skimming or "pulling sections as needed" is not allowed.
5. `Project-Docs/BohdiAI-Roles-Workflow.md` — rules of engagement.
6. `Project-Docs/Phase-1-Decisions-Log.md` — refinements on top of Master Spec. Superseded entries carry a `SUPERSEDED BY Dxx` inline pointer.

**Pulled as needed for specific work:**
- Family / renderer work → `Family-Layout-Model.md` + `Family-Style-Sheets.md`.
- Editor work → `Editor-Design.md` + `Editor-Design-Notes.md`.
- Audit context → `Audit-2026-07-05.md`.

Everything else in `Project-Docs/historical/` is archive material — read only when explicitly referenced.

**Hard rule — "cite-or-shut-up":** Before opining on architecture (tokens, components, tenants, niches, schemas, build sequence, agent roles, anything spec-defined), Claude must cite the relevant Master Spec / Roles-Workflow section or Full Plan phase. If Claude cannot cite it, Claude has not earned the right to opine on it — stop and re-read the spec instead of guessing.

**Hard rule — plain English in chat:** Alex talks to Claude in conversational English and wants the same back. Defaults to avoid:

- No bullet lists when 2-3 sentences would work. Lists are for genuinely parallel items.
- No headings, no bold labels, no section dividers in chat. Save formatting for documents.
- No reference IDs in chat — "D5", "§6.2", "per Master Spec §8" all read like a doc index. Describe the decision in words instead.
- No designer or engineer jargon Alex didn't use first.
- Short sentences over long ones. Conversational over comprehensive.
- The structured-list reflex is a documentation habit. It belongs in `.md` files, not chat.

## What this project is

BohdiAI is a multi-tenant AI-powered SaaS that gives makers/artisans a complete AI-generated storefront on a `[shop].bohdiai.com` subdomain in minutes. Subscription-only (one tier at launch, ~$35–$49/mo). **Never takes a cut of sales** — money flows customer → maker's own Stripe/Square; BohdiAI reads webhooks only.

**Status as of 2026-07-06 (end of Session 64):** Phase 0 (Foundation + cleanup) complete. Codebase clean, database cleaned, renderer fully swept for hardcoding and inline styles, docs archived and superseded sections marked, Full Plan approved as operative doc. **Phase 1 (Family layer wiring) starts next session** — six open decisions to lock with Alex before writing code (Full-Plan §1.0). Two live test tenants: `soul-splatter` and `soul-splatter-bright`. 896 tests pass, tsc + lint clean.

## Roles

- **Alex Ouellet (publicly "Alex Scott")** — Founder / Product Owner. Vision, approvals, no code.
- **Claude** — Lead Developer. Builds patterns, escalates ambiguity. **Must push back on scope drift, not silently absorb it.**
- **Cowork agents (planned)** — Pattern replicators for niche schemas, additional variants. Runtime evaluated when Cowork comes online.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + RLS + Auth + Storage) · Vercel · Cloudflare (incl. Cloudflare for SaaS for custom-domain SSL) · Anthropic API · fal.ai · Resend · Stripe · Square (planned) · Sentry + PostHog (env-configured; installation deferred to Phase 6) · Tailwind CSS · TypeScript (strictest config — see `Engineering-Standards.md`).

## URL ecosystem

`bohdiai.com` (marketing) · `admin.bohdiai.com` (founder admin) · `app.bohdiai.com` (maker dashboard) · `[shop].bohdiai.com` (tenant storefronts) · `learn.bohdiai.com` (redirect to Witsend Breakthroughs Skool community).

## Document authority (highest wins)

1. **Golden Rules** (`Project-Docs/BohdiAI-Golden-Rules.docx`) — inviolable principles. Overrides everything.
2. **Master Spec** (`Project-Docs/BohdiAI-Master-Spec.md`) — product/technical spec. Retired sections carry SUPERSEDED banners.
3. **Full Plan** (`Project-Docs/Full-Plan.md`) — the operative build plan for now through top-priority goals.
4. **Decisions Log** (`Project-Docs/Phase-1-Decisions-Log.md`) — refinements. Superseded entries marked inline.
5. **Roles-Workflow** (`Project-Docs/BohdiAI-Roles-Workflow.md`) — process.
6. Feature Specs (per-feature, written as needed).

## Non-negotiables (locked in Full Plan)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer), never from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker.
- **No hardcoded English in the renderer. No inline styles. No shortcuts.** All strings through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`; all styling through CSS variables + classes.
- **Tests are part of done.** No feature is complete without tests.
- **Ship complete, not partial.** Code + tests + types + verification before "done."
- **No live-site fixes yet.** Beta signups are not open. Security + infra items live in Phase 6 of the Full Plan.

## Brand context (load-bearing)

- Alex publicly brands as "Alex Scott." 1990s ran "Witsend" helping people through the home-computer transition. 2026 launches "Witsend Breakthroughs" (Skool community) helping people through the AI transition. BohdiAI is the product layer.
- The authority story IS the differentiation against Etsy/Shopify (faceless platforms). Don't write copy as a faceless company.
- Voice: warm, direct, no SaaS jargon. Matches Alex's YouTube voice.

## Working preferences

- **No popup questions.** Ask inline in chat, with recommendations clearly marked.
- **No git worktrees.** Work in main tree on a feature branch instead.
- **Claude does all commits.** Alex never commits. Commit at natural points on the feature branch.
- **Push back on scope drift.** Alex explicitly wants Claude to keep him in check, not silently absorb out-of-spec requests.
- **Stricter > looser** on engineering standards. Alex wants to avoid rewrites at all costs.
- **One question at a time** when walking through decisions.
- **Markdown for docs** in `Project-Docs/`. Don't create `.docx` files — those are reference originals.

## Files to know

- `Project-Docs/BohdiAI-Golden-Rules.docx` — rank 1 authority (Word doc).
- `Project-Docs/BohdiAI-Master-Spec.md` — rank 2 authority (SUPERSEDED sections marked).
- `Project-Docs/Full-Plan.md` — operative plan.
- `Project-Docs/SESSION-BRIEF.md` — operational state, under 100 lines.
- `Project-Docs/Audit-2026-07-05.md` — full audit findings.
- `Project-Docs/Family-Layout-Model.md` + `Family-Style-Sheets.md` — current family design.
- `Project-Docs/Editor-Design.md` + `Editor-Design-Notes.md` — current editor design.
- `Project-Docs/Tech-Arch-Spec.md` — DB design (§7, §8 SUPERSEDED — blocks/widgets/layout-engine gone).
- `Project-Docs/Engineering-Standards.md` — strict TS standards.
- `Project-Docs/historical/` — archived docs (superseded systems, shipped phases, retired plans). Read only when explicitly referenced.
- `content/niches/` — niche markdown files.
- `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill.
- `scripts/db-migrate.mjs` — `node scripts/db-migrate.mjs` applies migrations. Claude's job.
- `scripts/gen-types.mjs` — `npm run gen:types` regenerates `lib/database.types.ts`. **Run after any migration that changes tables/columns.** Never hand-write types or work around the generated ones.

## Mantras (from Golden Rules)

- "If it is not in the spec, do not build it."
- "If it violates a golden rule, it does not ship."
- "When in doubt, stop and ask."

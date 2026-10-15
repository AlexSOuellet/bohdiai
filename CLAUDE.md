# BohdiAI — Session Orientation

**Read this first at the start of every BohdiAI session.**

## Required reading at session start (BEFORE responding to the user's first message)

1. This file (`CLAUDE.md`) — orientation.
2. `Project-Docs/SESSION-BRIEF.md` — operational state (where we are, what's next). Under 100 lines by mandate.
3. **`Project-Docs/Modular-Plan.md` — THE OPERATIVE PLAN (since Session 102, 2026-10-13).** Every piece of content has its own home; designs are fixed shapes; every site can add shared sections; no custom work ever. **`Project-Docs/Open-Work.md`** lists every open item; update it as work lands. (`Full-Plan.md` is history.)
4. **`Project-Docs/BohdiAI-Master-Spec.md` — READ IN FULL, every session, every time.** Retired sections carry a SUPERSEDED banner; the rest is live. Skimming or "pulling sections as needed" is not allowed.
5. `Project-Docs/BohdiAI-Roles-Workflow.md` — rules of engagement.
6. `Project-Docs/Phase-1-Decisions-Log.md` — refinements on top of Master Spec. Superseded entries carry a `SUPERSEDED BY Dxx` inline pointer.

**Pulled as needed for specific work:**
- Family / renderer work → `Family-Layout-Model.md` + `Family-Style-Sheets.md` + `tmp/mockups/defaults-matrix.html` (per-family section variant + style picks) + `tmp/mockups/family-stacks-v2.html` (per-family section order + on/off — LOCKED). Both mockups are load-bearing for Phase 1 wiring; read them before opining on family defaults.
- Editor work → `Editor-Design.md` + `Editor-Design-Notes.md`.
- Audit context → `Audit-2026-07-05.md`.

Everything else in `Project-Docs/historical/` is archive material — read only when explicitly referenced.

**Hard rule — check, don't recall:** Before telling Alex how something is built or stored, check the real code and database. Session 102's contradictions all came from answering from memory.

**Hard rule — "cite-or-shut-up":** Before opining on architecture (tokens, components, tenants, niches, schemas, build sequence, agent roles, anything spec-defined), Claude must cite the relevant Master Spec / Roles-Workflow section or Modular Plan step. If Claude cannot cite it, Claude has not earned the right to opine on it — stop and re-read the spec instead of guessing.

**Hard rule — plain English in chat:** Alex talks to Claude in conversational English and wants the same back. Defaults to avoid:

- No bullet lists when 2-3 sentences would work. Lists are for genuinely parallel items.
- No headings, no bold labels, no section dividers in chat. Save formatting for documents.
- No reference IDs in chat — "D5", "§6.2", "per Master Spec §8" all read like a doc index. Describe the decision in words instead.
- No designer or engineer jargon Alex didn't use first.
- Short sentences over long ones. Conversational over comprehensive.
- The structured-list reflex is a documentation habit. It belongs in `.md` files, not chat.

## What this project is

BohdiAI is a multi-tenant AI-powered SaaS that gives makers/artisans a complete AI-generated storefront on a `[shop].bohdiai.com` subdomain in minutes. Subscription-only (one tier at launch, ~$35–$49/mo). **Never takes a cut of sales** — money flows customer → maker's own Stripe/Square; BohdiAI reads webhooks only.

**Status as of Session 105 (2026-10-15):** The design lineup was reset (read "The lineup" in `Modular-Plan.md`). Makers first; contractors set aside until they return as their own leg. A standard site is a family (layout) + a skin (colors, fonts and background; on Scenic the maker picks the photo from the scene library or provides their own). Eight families: cozy, rustic, dark, elegant, cheerful, modern, plus **Scenic** (from Shoreline) and **Spotlight** (from Showreel). Custom sites (handmade touches, paid): Rose n' Cat, Cut-Pro, Mazzone. Going away: old family samples, Halfmoon, True Coat, Ember & Pine/Torch, contractor selling on bohdiai.com; Rustic Rhody moves to a family. One builder for every new site. Every family must be able to sell. Proposed order (Alex to confirm): family selling, the one builder, Scenic + Spotlight, prove it, clean up.

**Status as of Session 104 (2026-10-14):** Nothing is written into the code any more: every word a site shows, buttons and labels included, lives per site in `site_words` (all 51 sites filled, proven identical). Saltmarsh got the design-review polish and its fairs stay on Saturdays. Alex: the sites look good first; the backend screens wait. Open: the line at the top of the page has two homes (About you and the moment); talk it through with Alex before touching it.

**Status as of Session 103 (2026-10-13):** The fix began. Modular Plan steps 1 (safeguards) and 2 (homes) are done, and step 3 is underway: family pages read every piece from the homes, and a copy built purely from them matches its old sample word for word. Next: the maker-backend screens for the moment, section words and the new About you pieces. The build fills every piece; the maker edits it.

**Status as of Session 102 (2026-10-13):** The structure was reset. Family sites and contractor sites keep their content in one page record, so they can't use the backend or switch designs. The newer maker sites store content correctly but hardcode their headings. The work now follows `Modular-Plan.md`, and the next session starts with Alex reviewing it, then Phase 1 (safeguards). Sites are still built by hand for now, with automation added step by step, ending in same-day self-serve signup.

**Status as of Session 87 (2026-09-29):** Direction changed on 2026-09-23 and again on 2026-09-29. Everything is manual: no onboarding and no site editor, and every site is hand-built by Alex + Claude inside the BohdiAI structure (service providers, makers, charities). A Penny-style maker backend will be built. The whole app runs on **Cloudflare Workers**, and Vercel is retired. Read `SESSION-BRIEF.md` and `Cloudflare-Move.md` first; the Session 75 status below is history.

**Status as of end of Session 75 (2026-07-18):** The storefront is done — onboarding builds a complete, family-styled store and every page a shopper sees works, run live through all six feelings. Editor door one (swap the feeling) is live. Everything a maker does after that is missing: no listings management, no cart, no checkout, no orders, no payments, no market sales, four of six dashboard pages absent, and no founder admin at all. The database is fully built for all of it (38 tables) — the gap is application surface, not schema.

The plan was rewritten this session to reach launch, in three named phases: **Beta** (founding members running real stores with real money), **Go Live** (public signup), **Growth** (after). The old six-phase plan is archived. Read `Launch-Audit-2026-07-18.md` for the verified built-vs-missing picture. 976 tests pass, tsc + lint clean.

## Roles

- **Alex Ouellet** — Founder / Product Owner. Vision, approvals, no code.
- **Claude** — Lead Developer. Builds patterns, escalates ambiguity. **Must push back on scope drift, not silently absorb it.**
- **Cowork agents (planned)** — Pattern replicators for niche schemas, additional variants. Runtime evaluated when Cowork comes online.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + RLS + Auth + Storage) · **Cloudflare Workers** via OpenNext (deploy = push to `main`; Workers Builds builds it; Vercel retired 2026-09-29) · Cloudflare DNS + email routing · Anthropic API · fal.ai · Resend · Stripe · Square (planned) · Sentry + PostHog (env-configured; installation deferred to Phase 6) · Tailwind CSS · TypeScript (strictest config — see `Engineering-Standards.md`).

## URL ecosystem

`bohdiai.com` (marketing) · `admin.bohdiai.com` (founder admin) · `app.bohdiai.com` (maker dashboard) · `[shop].bohdiai.com` (tenant storefronts) · `learn.bohdiai.com` (redirect to Witsend Breakthroughs Skool community).

## Document authority (highest wins)

1. **Golden Rules** (`Project-Docs/BohdiAI-Golden-Rules.docx`) — inviolable principles. Overrides everything.
2. **Master Spec** (`Project-Docs/BohdiAI-Master-Spec.md`) — product/technical spec. Retired sections carry SUPERSEDED banners.
3. **Modular Plan** (`Project-Docs/Modular-Plan.md`) — the operative build plan since Session 102; every open item in `Open-Work.md`. (`Full-Plan.md` is history.)
4. **Decisions Log** (`Project-Docs/Phase-1-Decisions-Log.md`) — refinements. Superseded entries marked inline.
5. **Roles-Workflow** (`Project-Docs/BohdiAI-Roles-Workflow.md`) — process.
6. Feature Specs (per-feature, written as needed).

## Non-negotiables (locked in Full Plan)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer), never from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker. (2026-10-15: family names don't have to be moods, e.g. Scenic, Spotlight.)
- **No words in the code. No inline styles. No shortcuts.** Every word a site shows lives in that site's own data (`site_words`, `site_sections` and the other homes); all styling through CSS variables + classes.
- **Tests are part of done.** No feature is complete without tests.
- **Ship complete, not partial.** Code + tests + types + verification before "done."
- **No site is truly live yet (Alex, 2026-10-13).** Cut-Pro and Rose n' Cat will be real; Saltmarsh is the demo. Everything pushed to `main` still deploys, so verify before merging.

## The modular rules (Modular Plan; Alex 2026-10-13). Read before touching any design, home or database table.

1. **Every piece of content has its own home** (a table or field) that any design can read.
2. **Pages hold settings only.** A page record says which design and which look, never words, photos or dates.
3. **Designs only display.** A design never stores content of its own.
4. **No hardcoding.** No display words inside a design. Section headings come from the site's own content.
5. **No standard site ever requires custom work.** A new need becomes a shared added section, skin or family any site can use. Custom sites (a paid option, 2026-10-15) may have handmade touches, but their content still lives in the same homes.

**NOTHING is ever written into the code (Alex, 2026-10-14).** Every word a site shows, buttons, form labels, menu names, messages and screen-reader labels included, lives per site in `site_words` (one row per spot: `card.form.send` → "Send message"; blanks are named, "Order {n}"). Section headings live in `site_sections`. A design only names its spots (`<design>/words.ts`, every leaf blank) and reads the site's words into them (`lib/site-words`). A new site's words are written when it's built (`scripts/site-words.ts copy` from a site of the same design). No backend screen for these words yet (Alex). This replaces the 2026-10-13 line that kept platform words in code.

**The safeguards (they don't depend on Claude remembering):**
- **Database changes:** before any table or column is created or changed, tell Alex in chat, in plain words, what it is and why, and wait for his yes. He approves database changes so Claude can't bend the database into a shortcut. A project hook (`.claude/hooks/db-change-gate.mjs`) also stops for approval at the moment a change is applied.
- **Database rule:** a trigger on `content_pages` and `store_drafts` refuses any page record carrying words, photos or dates (`supabase/migrations/20261013000001_page_records_settings_only.sql`; proof: `node scripts/check-page-rule.mjs`). Never weaken it to get a save through. Move the content to its home.
- **Test:** `lib/archetypes/modular-rules.test.ts` fails on page-record content a design reads, on any unsorted word in a strings file, and on words typed straight into a design or shop page. Its register (`modular-rules.register.ts`) can only shrink. Never add an offender to it to get a build green.
- **Plain list first:** before any new design or home is built, show Alex a plain list of where each piece of content goes, and wait for his yes.

## Brand context (load-bearing)

- Alex goes by his own name, Alex Ouellet (never "Alex Scott", dropped 2026-10-12). 1990s ran "Witsend" helping people through the home-computer transition. 2026 launches "Witsend Breakthroughs" (Skool community) helping people through the AI transition. BohdiAI is the product layer.
- The authority story IS the differentiation against Etsy/Shopify (faceless platforms). Don't write copy as a faceless company.
- Voice: warm, direct, no SaaS jargon. Matches Alex's YouTube voice.

## Working preferences

- **No popup questions.** Ask inline in chat, with recommendations clearly marked.
- **No git worktrees.** Work in main tree on a feature branch instead.
- **Claude does all commits.** Alex never commits. Commit at natural points on the feature branch.
- **Branches are short-lived.** One branch per piece of work, merged into `main` (which deploys) once verified and deleted, usually the same session. At the end of a session, `main` should be the only branch.
- **Push back on scope drift.** Alex explicitly wants Claude to keep him in check, not silently absorb out-of-spec requests.
- **Stricter > looser** on engineering standards. Alex wants to avoid rewrites at all costs.
- **One question at a time** when walking through decisions.
- **Markdown for docs** in `Project-Docs/`. Don't create `.docx` files — those are reference originals.

## Files to know

- `Project-Docs/BohdiAI-Golden-Rules.docx` — rank 1 authority (Word doc).
- `Project-Docs/BohdiAI-Master-Spec.md` — rank 2 authority (SUPERSEDED sections marked).
- `Project-Docs/Modular-Plan.md` — operative plan; `Project-Docs/Open-Work.md` — every open item. (`Full-Plan.md` is history.)
- `Project-Docs/Launch-Audit-2026-07-18.md` — what's actually built vs. what launch needs, verified against code.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Session Brief — BohdiAI

**Last updated:** 2026-05-21 evening (Tech Arch Spec drafted end-to-end — ~25 tables across 20 sections, three new decisions locked, foundation audit complete)

**Update at the end of every session.**

---

## Picking up tomorrow

The database design is structurally complete. The Tech Arch Spec at `project-docs/Tech-Arch-Spec.md` now covers every table needed for Phase 1 launch plus a foundation audit for post-launch features. Roughly 25 tables across 20 sections, all following the same shape (table definition, column-by-column rationale, why these choices, RLS sketch, what's NOT in this table).

What's left before the spec is fully shippable:

1. The Master Spec amendments listed in the decisions log (§2, §6.2, §6.3, §8, §17) still aren't written. Each section of the Master Spec has been superseded by one or more decisions but the Master Spec itself still reads as if those decisions hadn't been made. Anyone reading the spec fresh will see contradictions until these are reconciled.

2. Two product-design questions remain open and the database supports either answer: what a Doer's storefront actually looks like (portfolio? scheduling? contact form?), and how a multi-type tenant (Seller + Doer) renders on one storefront. Neither blocks database work but both block onboarding and storefront-rendering work.

3. The actual mood vocabulary for D6 (the curated mood list the customer picks from at onboarding) still needs to be defined. Examples in the decisions log are "dark and stormy," "rustic," "warm and cozy" — but the full launch list isn't picked.

4. RLS policy SQL is described in each spec section but not written as final SQL. That lands during implementation, not now.

Natural next move is either tackling the Master Spec amendments (cleanup work that closes out planning) or shifting into implementation — Supabase schema migrations, the Zod validators that protect the JSON columns, the build script for the blocks library, the markdown loader for niche content. Alex's call.

---

## Required reading at session start

Do not skip any of these. The cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation, the cite-or-shut-up rule, and the plain-English-in-chat rule.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full. Note: sections §2, §6.2, §6.3, §8, and §17 are now superseded by the decisions log. The decisions log wins where it has spoken, the Master Spec wins where the log is silent.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — twelve product/architecture decisions that govern the Tech Arch Spec.
6. `project-docs/Tech-Arch-Spec.md` — the full database design.

---

## What we accomplished today

The session was a single sustained pass through the database design. Started the morning at two tables drafted (tenants, tenant_members from yesterday). Ended the evening with the spec structurally complete.

### Spec sections drafted in batches

**Batch 1 — subscriptions and design tokens (sections 3-4).** Subscriptions is one row per subscription period rather than one mutable row per tenant, so upgrades, downgrades, cancels, and returns leave a clean append-only trail. Freemium tenants get a row too with Stripe fields null, so feature-gating code never branches on "is there a sub or not." The tier column is intentionally duplicated onto the tenants table as a read-optimized cache for hot-path gating. Design tokens is one JSON document per snapshot per tenant; tokens are stored as resolved values (the actual colors and spacings), with the AI reasoning in a semantic dial space at edit time that's never persisted. Rollback creates a new snapshot row pointing at the restored one rather than reactivating the old one.

**Batch 2 — the composition cluster (sections 5-9).** Editor history is one stream covering every change a maker makes — visual, content, structural. Captures the maker's words, the AI's interpretation, the before-and-after state. Rollback is itself logged as a new entry. Niche schemas and the blocks library both ended up NOT being database tables (see D11 below) — they live as markdown files and code constants respectively. Page blocks holds the per-tenant compositions; content_pages is metadata only (URL, type, status) with the visible content in page_blocks rows.

**Batch 3 — listings and commerce (sections 10-14).** Listings is one unified table for products, digital products, services, classes, events, and appointments — type-specific behavior in nullable columns and a metadata JSONB. Variations is three tables (attributes, options, variants) — same pattern Shopify uses. Collections is many-to-many via a join with per-collection ordering. Customer profiles is per-tenant (the same person shopping at three BohdiAI stores has three profile rows) with addresses and wishlists as separate tables. Orders/order_items/payments snapshot listing data at purchase time so order history survives listing edits or deletions.

**Batch 4 — peripheral commerce (sections 15-19).** Carts are server-side persistent state for cross-device continuity and abandonment recovery (no browser-only storage). Reviews require a verified purchase via FK to order_items, one review per purchased item. Gift cards are two tables (cards + transactions) following bank-account pattern; gift card purchase goes through the normal listings table with a new `gift_card` listing_type. Uploads is one polymorphic media table with deduplication by SHA-256 hash. Promos uses a type discriminator plus JSONB for rules (`applies_to`, `conditions`) — the only sane way to handle the inherent complexity of discount rules.

**Batch 5 — foundation audit (section 20).** A fast pass through every post-launch feature area (messaging, marketing campaigns, fulfillment, integrations, analytics, customer segments, audit logs) asking the same question per area: does this require a change to a launch table? The answer was no for everything except fulfillment — see D12 below.

### Three new decisions locked

**D10 — paid tiers include a 7-day trial with card required.** Freemium turned out to not be a trial; it's too restrictive (essentially a landing page). When a maker picks Basic or Pro at onboarding, they get a 7-day trial with deferred payment, card on file required, auto-charge on day 8 unless they cancel. One trial per tenant forever (no serial trial-hopping). Seven days splits the difference between Shopify's three and Squarespace's fourteen. The subscriptions table already has the columns (trial_start, trial_end, status `trialing`) — no schema change needed.

**D11 — niche content lives in files, blocks library lives in code.** Niche schemas are prose the AI consumes; prose belongs in markdown, not JSON columns. Files live at `/content/niches/<slug>.md` with YAML frontmatter for structured metadata and markdown body for AI-readable prose. Loaded at build time into a typed manifest. Blocks are React components in `/blocks/<section_type>/<key>.tsx` whose exported `meta` constant is collected at build time into a single typed manifest. Both calls eliminate drift bugs (component without a catalog row, niche row without content) and replace the Master Spec's implied admin-form niche management with a PR workflow. Reversible if wrong — markdown to database is an afternoon.

**D12 — shipments as a first-class table from day one.** The orders table doesn't carry tracking columns. Every order has one shipments row at launch; multi-shipment is supported without migration when a maker needs it (the day they split a 5-item order across two boxes). Alternative was keeping tracking on orders and adding shipments later, which would have created a dual-source-of-truth period. Doing it now while the spec is unbuilt was free; doing it post-launch would have been a real data migration.

### Architectural guardrails Alex set this session

Two principles Alex pushed back to install that shape how this work runs going forward.

**Additive is safe, subtractive is painful.** Adding tables, columns, constraint values, or features that are designed correctly doesn't bother Alex. Removing them does, because removals introduce data migration risk and break existing references. The Tech Arch Spec is built with this principle throughout — JSON columns instead of typed columns where the schema is expected to grow, type discriminators with JSONB rules instead of strict per-type tables, snapshot-style versioning instead of mutable rows.

**No unilateral removals.** Claude can drive additions but every removal — of a table, column, value, or previously agreed approach — gets surfaced for Alex's explicit approval before it lands. This was set after Claude removed a couple of things in earlier drafts (the niche_schemas and blocks_catalog tables, the orders tracking columns) without flagging them as removal decisions. Now: additions drive forward, removals stop and ask.

---

## Where the spec stands

**Sections 1-19 are full table drafts.** Each follows the same shape: table definition with SQL, column-by-column rationale, why these choices, RLS sketch, what's NOT in this table.

**Section 20 is the foundation audit** for post-launch features. Each future area gets a paragraph noting what tables it'll need and whether any launch-table change is required.

**Roughly 25 tables total.** A few sections contain multiple tables (variations is three, gift cards is two, orders/payments is now four with shipments, customer_profiles is three, promos is two).

**RLS is described, not written.** Each section sketches the access rules in plain English. Final RLS policy SQL lands when we implement.

**Files in code/files, not database** (per D11):
- `/content/niches/<slug>.md` — niche schemas
- `/blocks/<section_type>/<key>.tsx` — block components and their metadata

---

## Open items still ahead

The big ones, in rough priority order:

1. **Master Spec amendments** — five sections (§2, §6.2, §6.3, §8, §17) of the Master Spec are now contradicted by the decisions log. Reconciling them is cleanup that closes out planning. Hasn't been done yet.

2. **Doer storefront design** — what a tattoo artist's page actually looks like, what a plumber's looks like, how either differs from a maker's. Product-design question, not database. The database supports any answer.

3. **Multi-type tenant rendering** — how a restaurant (Seller + Doer) renders on one storefront. Product-design question.

4. **The mood list for D6** — the curated mood vocabulary the customer picks from at onboarding. Need the actual list (how many, what names, how each maps to design tokens and block assembly).

5. **Niche schema content shape** — the markdown body shape per niche file (what prompts, what variations, what design hints). Need a template before we can start populating.

6. **Block library scope** — which block variants ship at launch, which are post-launch. Foundation supports any number; launch scope needs picking.

7. **Implementation kickoff** — actually building the Supabase migrations, the Zod validators, the markdown loader, the build script for the blocks manifest. Eventually.

---

## Local environment gap (still open)

The `.env.local` file still has the disabled legacy service_role Supabase key. Until Alex updates it (Supabase Dashboard → bohdi-ai → Project Settings → API Keys → copy the current Secret key into the `SUPABASE_SERVICE_ROLE_KEY=` line), Claude can't run admin scripts against production Supabase from this machine. Not urgent — only matters for direct database operations outside the app.

---

## Files modified this session (committed at end of session)

- `project-docs/Tech-Arch-Spec.md` — sections 3 through 20 added; orders table restructured for shipments per D12
- `project-docs/Phase-1-Decisions-Log.md` — three new decisions added (D10, D11, D12)
- `project-docs/SESSION-BRIEF.md` — this rewrite

---

## Lessons banked this session

**Don't remove anything without asking.** Established mid-session as a guardrail. Additions are fine to drive; removals stop and surface for approval. Applies to tables, columns, constraint values, and previously-agreed approaches. Caught a real pattern — Claude had been quietly dropping things from "Sections to come" lists and changing the orders table without flagging the changes as decisions.

**The plain-English rule still bites.** Caught several times this session reaching for bullet lists and section IDs when conversational paragraphs would have landed better. The reflex is documentation-shaped because the work is documentation-shaped; chat replies need active suppression of the reflex.

**Draft batches, not individual tables.** Doing one table at a time meant losing the cross-table context — relationships and shared decisions surfaced only when neighboring tables were in view. Switching to four-or-five-table batches let the design hold together as a unit and made the discussions more productive.

**Push back on the spec when the spec is wrong.** Two of the three new decisions (D11 — niches as files, D12 — shipments as a table) override what the Master Spec implied. Both came from Alex asking variants of "what's actually best" rather than "what does the spec say." The Master Spec is partial and sometimes wrong; treating it as gospel produces worse engineering than treating it as the starting point for an honest conversation.

---

## Previous session summary (kept for context)

Yesterday: started database design (tenants and tenant_members drafted), nine product decisions captured, CI fix, LCP regression fix (force-dynamic → ISR). Phase 0 still live and earning at bohdiai.com.

Phase 0 itself: marketing site live, double-opt-in waitlist working, founder cap behavior, full Next.js + Vercel + Supabase + Resend + Cloudflare stack, design system port from Claude Design output. Done and shipped.

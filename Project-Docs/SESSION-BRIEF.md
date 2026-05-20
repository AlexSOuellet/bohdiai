# Session Brief — BohdiAI

**Last updated:** 2026-05-20 evening (database design started — Tech Arch Spec exists with two tables drafted, decisions log rewritten with full context, plain-English rule added to CLAUDE.md)

**Update at the end of every session.**

---

## Picking up tomorrow

Alex stopped for the night after we started drafting the actual database. The Tech Arch Spec at `project-docs/Tech-Arch-Spec.md` has the tenants table and the tenant_members table done, both approved. The next table to draft is subscriptions — the SaaS billing relationship between BohdiAI and the tenant, tracking which tier they're on and the live state from Stripe.

Resume by drafting the subscriptions table. Alex's instruction was that Claude (as Lead Developer) drives the database design — proposes the table, the columns, the relationships, and the rationale, then Alex reviews and corrects. Do not ask Alex "where should I start" or "which table next." The order is in the Tech Arch Spec's "Sections to come" list.

---

## Required reading at session start

Do not skip any of these. Alex enforced this mid-session and the cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation, the cite-or-shut-up rule, and (new this session) the plain-English-in-chat rule. Read the whole file.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full. Note: several sections are now superseded by the decisions log (§2, §6.2, §6.3, §8, §17). The decisions log wins where it has spoken, the Master Spec wins where the log is silent.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — the nine product decisions that govern the Tech Arch Spec.
6. `project-docs/Tech-Arch-Spec.md` — the live database design we are working on.

---

## The plain-English rule (read this — it changed how Claude works)

Alex called this out hard near the end of the session: Claude's defaults toward structured-looking responses — bullet lists, headings, section IDs, bold labels — feel like over-complication in chat. That habit belongs in documentation, not conversation. The CLAUDE.md file now has a hard rule about this. In chat, talk like a person. Sentences and short paragraphs beat bullet lists. No "D5" or "§6.2" references — describe the prior decision in a few words instead ("the variations-table decision," "the foundation-first rule"). No designer or engineer jargon unless Alex used it first. Save formatting for documents.

The CLAUDE.md change is local on disk but not yet committed. It will take effect for new sessions once committed.

---

## What we accomplished today

The session ran from morning to evening with three phases.

### Morning — operational fixes

The LCP regression flagged in the previous session was investigated. The hero is text-LCP with no above-the-fold image, so the actual cause was the page being rendered fresh on every request (force-dynamic) to count founder slots. Switched to ISR with a 30-second revalidate window. The page is now edge-cached and TTFB drops dramatically. Pending: re-run Lighthouse against bohdiai.com mobile to confirm LCP back under 2 seconds.

The www-to-apex 308 redirect was verified live with curl.

Alex truncated the waitlist table via the Supabase SQL editor so the founder counter reads 25/25 again.

Both fixes were committed and pushed (commits `3259c95` and `7401395`).

### Afternoon — Phase 1 planning

A long, pivoting conversation that resulted in nine product decisions governing the Tech Arch Spec. Highlights below; full context is in `project-docs/Phase-1-Decisions-Log.md`.

The "shapes" framework Claude had started building (19 transaction shapes — one-time product, time-block service, online auction, etc.) died mid-conversation. Alex found the framing carried interpretations he didn't share. The replacement is much simpler: every tenant is a Seller, a Doer, or both. Those are the only two types. Things Claude had wanted to make sub-types (Teacher, Host, Subscription Provider, Display) are either things Doers do or are not types at all (Subscription is a payment model, Advertiser is universal behavior, Display is a tier feature).

The original niche schema concept from the Master Spec (a structured per-niche document defining fields, badges, AI prompts, design boundaries, and component preferences) shrunk dramatically. Field definitions are replaced by seller-defined variations Etsy-style — sellers add whatever variations they want per product, no pre-built field lists per niche. The remaining parts of the original niche schema concept (AI prompts, design suggestions) become AI input data, not structured database content. There's no 100-schema upfront research effort.

Design is mood-driven, not niche-driven. The customer picks a mood at onboarding from a curated list — "dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape" — and the AI generates both the design tokens and the block assembly to match. Niche stereotypes are out: an occult candle maker picks "dark and stormy," not the warm-honey-and-amber default the Master Spec's §6.2 originally implied. Master Spec §6.2 needs amendment.

AI is the design engine, but the AI needs the right data. Alex's experience is that AI design defaults to one of two looks ("dark background with purple highlights" or "cream background with pastels") regardless of what you ask for. The customer's mood pick is one input, but their own assets (photos, brand) matter more. Niche knowledge is one input among many, not the dominant one.

The full e-commerce feature roadmap (Etsy-and-Shopify level — customer accounts, gift cards, coupons, shipping labels, POD integration, reviews, analytics, social links, customer messaging) is in scope eventually. The launch subset is shop organization, content pages, customer accounts, reviews, promos, gift cards, analytics, and social media links. Everything else is post-launch but the foundation must support it now.

The overarching rule that governs everything: foundation-first phasing. The database has to support every roadmap feature even if its UI ships years later. Later phases only add — they never rewrite Phase 1 tables.

### Afternoon — CI fix

CI had been silently failing on every push since the workflow was added two days ago. Alex was getting emails about it. Root cause: package-lock.json was missing peer-dependency entries because Claude's global npm config had legacy-peer-deps=true, which omits peer deps from the lock file. CI uses modern resolution and rejected the lock as out-of-sync. Fixed by regenerating the lock file with --no-legacy-peer-deps and adding a project-local .npmrc pinning legacy-peer-deps=false so anyone running npm install in this repo gets the same behavior as CI. Run 26174846368 passed on first try. Committed and pushed (commit `31e187a`).

### Evening — Tech Arch Spec started

Alex grounded the conversation: the immediate task is designing the database to hold everything we'll build later. Not designing tenant-facing features. Not picking architecture. The database. He also corrected Claude (as Lead Developer) for asking "where should I start" — that's a founder-level question and Claude should drive it.

The Tech Arch Spec was started at `project-docs/Tech-Arch-Spec.md`. Two tables drafted and approved by Alex.

The tenants table is the root entity. Every other table will reference tenant_id. Decisions made while drafting:

- The subdomain is fixed at onboarding and only changeable by admin intervention — to protect the maker from breaking their own shared links and SEO.
- Tenant types are stored as an array (`{seller, doer}`) rather than two boolean columns, so adding a third type later doesn't require a schema migration.
- Multi-currency, time zone, contact email, and physical address are all included even though only USD ships at launch — they're cheap to add now and avoid migrations later.
- Soft delete (deleted_at column). The audit period before hard deletion is not yet decided — Alex offered to keep accounts indefinitely with a 6-month archived state requiring admin restore, but that was a suggestion not a decision. The schema supports any policy.
- Owner is **not** a column on tenants. The user-to-tenant relationship lives in tenant_members instead.

The tenant_members table bridges Supabase auth.users and tenants. One row per (user, tenant) relationship with a role of either admin or customer. Decisions made:

- Customers and admins live in the same table with a role column, per Alex's suggestion. One person logging in might be an admin of their own shop and a customer of someone else's — same login, different rows.
- Role is text with a check constraint, not a Postgres enum, so we can add new role values later without an alter-type migration.
- Soft removal (status column with active or removed), so audit history makes sense when someone is taken off the admin list.
- No separate invitations table — Alex's call. Multi-admin self-service is a "look up by email and add" action, not an invitation flow.

The customers table Claude had originally planned (section 9) was dropped. Customers are tenant_members with role='customer'. Customer-specific data (saved addresses, wishlists, payment methods) will go in a customer_profiles table that joins to tenant_members.

---

## What's next on the Tech Arch Spec (in order)

The remaining table sections to draft, per the spec's "Sections to come" list:

3. Subscriptions — Stripe billing state for the tenant's BohdiAI subscription (freemium/basic/pro)
4. Design tokens — per-tenant, with version history
5. Niche schemas — shared across tenants, holding AI starting inputs and component preferences
6. Listings — the unified table for everything a tenant offers (products and services)
7. Variations — seller-defined attributes per listing
8. Collections — how listings get grouped
9. Customer profiles — extra data for tenant_members with role=customer
10. Orders, order_items, payments — commerce
11. Reviews
12. Gift cards
13. Content pages — about, FAQ, policies
14. Uploads, files, media
15. Future-supported tables — messaging, marketing, fulfillment, integrations — designed for the foundation, UI ships later

Subscriptions is next.

---

## Open items still to be decided

Listed in full in the decisions log. The biggest ones:

- The Master Spec needs amendments at §2, §6.2, §6.3, §8, and §17 to match the decisions made today. None of those edits have been written.
- What a Doer's storefront actually looks like (scheduling? portfolio? contact form? all of those?). Not decided.
- How a multi-type tenant (Seller + Doer) renders on one storefront. Not decided.
- What a niche schema is in practice (JSON, markdown, prompt template, database row?). Not decided.
- The actual curated mood list. Not decided.
- The audit-period policy for closed tenants.
- The variations table structure (specific columns, types).

The Tech Arch Spec drafting will surface most of these as it progresses. They become "decide while drafting" moments.

---

## Files modified or created today (committed)

- `app/page.tsx` — switched from force-dynamic to ISR (commit `3259c95`)
- `package-lock.json` and `.npmrc` — regenerated lock without legacy peer deps, pinned the setting locally (commit `31e187a`)
- `project-docs/Phase-1-Decisions-Log.md` — created, then rewritten with full context (in the evening session)
- `project-docs/SESSION-BRIEF.md` — updated multiple times

## Files modified today (not yet committed)

- `CLAUDE.md` — added the plain-English-in-chat hard rule
- `project-docs/Phase-1-Decisions-Log.md` — full rewrite (the original 15-decision shorthand version was committed earlier in the day; this evening rewrite consolidates to 9 decisions with full context and is in the working tree)
- `project-docs/Tech-Arch-Spec.md` — new file with tenants and tenant_members sections
- `project-docs/SESSION-BRIEF.md` — this update

Commit and push at end of session if Alex approves.

---

## Local environment gap (still open)

The `.env.local` file still has the disabled legacy service_role Supabase key. Until Alex updates it (Supabase Dashboard → bohdi-ai → Project Settings → API Keys → copy the current Secret key into the `SUPABASE_SERVICE_ROLE_KEY=` line), Claude cannot run admin scripts against production Supabase from this machine. Not urgent — only matters when we need to do direct database operations outside the app.

---

## Lessons banked (do not repeat)

Several patterns surfaced this session that should not recur.

**The drift-through-faithful-restatement pattern.** Claude has been restating Alex's words back faithfully while embedding interpretation underneath. The interpretations don't show up in the readback, so Alex reads what looks like agreement and then the interpretations come out in implementation. Alex pointed to specific examples this session: adding "SBA 500-employee" reference Alex didn't invoke, inventing "restaurant POS systems" as an out-of-scope example Alex didn't give, picking specific interpretations of vague terms (deciding the magnet-maker's "special print processing" is a field on each product when it might be a workflow), declaring thresholds Alex didn't set (1-chair salon yes, 10-chair salon no), and turning Alex's "maybe" into "you want." The fix is to make interpretations visible before acting — list the gaps as explicit questions rather than folding them into a polished response.

**Asking "where should I start" when Claude should drive.** Claude is the Lead Developer per the Master Spec and Roles-Workflow. Alex is the founder. He sets vision and approves. He does not pick which database table to draw first. Repeatedly asking him for direction on technical implementation decisions inverts the roles. Alex called this out specifically and it should not recur — when there's a technical decision within spec boundaries, propose and proceed; ask only when ambiguity is genuinely product-level.

**Treating suggestions as decisions.** When Alex floats an idea ("maybe we should build niche schemas first," "if they come back after six months they would need to request a restore"), the right move is to engage with the idea on its merits, not to immediately commit it to the spec. Tentative thoughts stay tentative until explicitly committed.

**Plain English in chat.** The structured-list reflex is a documentation habit and belongs in `.md` files, not chat. Alex asked for plain English multiple times this session. The CLAUDE.md change should prevent this from recurring in new sessions.

**The Master Spec is partial.** Many obvious e-commerce features (customer accounts, gift cards, coupons, shipping labels, POD integration) were on Alex's mental list but not in the documented spec. A new session can only see what's documented. That's why the decisions log and the Tech Arch Spec are now the authoritative sources for everything captured today.

---

## Previous session summary (kept for context)

Earlier sessions covered Phase 0 launch — the marketing site at bohdiai.com, double-opt-in waitlist, founder cap behavior, the full Next.js + Vercel + Supabase + Resend + Cloudflare stack, CI workflow setup, Node 22 + Next 16 + React 19 upgrade chain, design system port from the Claude Design output. Phase 0 is done and live. Phase 1 planning began today.

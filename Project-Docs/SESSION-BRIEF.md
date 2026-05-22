# Session Brief — BohdiAI

**Last updated:** 2026-05-22 evening (DB build session — every table in the Tech Arch Spec landed in Supabase, 32 tables total, RLS enabled with 60 policies across three audiences, migration runner built and working)

**Update at the end of every session.**

---

## Picking up next session

The database is live. Every table from the Tech Arch Spec (§1 through §19) exists in the bohdi-ai Supabase project with row-level security enabled and policies in place. The migration runner at `scripts/db-migrate.mjs` is the canonical way to apply new migrations from now on — write the .sql file, run the script, done.

Natural next moves, in rough order of unblocking power:

1. **Seed the niches table.** The candles content at `content/niches/candles.md` becomes the first row. After that, every other niche from the launch queue gets written into the database via the niche-writer skill (the skill writes markdown today; it'll need a minor update to write to the niches table instead, or we keep the file as the source and seed from it).

2. **Wire Supabase Auth.** Onboarding can't proceed without it. Email/password and magic link both work; auth.users rows feed the tenant_members FK. Once auth wires up, the niches admin write policy can be tightened beyond service-role-only (currently the spec says "staff and approved Cowork agents identified by a role on tenant_members" — we don't have a staff role yet).

3. **Storefront resolver.** Next.js middleware that reads `[shop].bohdiai.com`, looks up the tenant by subdomain, and makes the tenant_id available to route handlers. RLS on most public-read tables doesn't filter by tenant — the app layer does that after the resolver picks the right one.

4. **Onboarding flow build.** Five screens per Master Spec §5. Needs the mood list (still open) and the niches table seeded.

5. **The blocks and widgets manifests.** Build script that scans `/blocks/**/*.tsx` and `/widgets/**/*.tsx` and emits typed manifests. No DB work — pure code per Tech-Arch-Spec §7.

6. **Mood vocabulary** — the curated list customers pick from at onboarding. Examples exist; the launch set doesn't.

7. **Cowork agent runtime** — the dispatcher / loop infrastructure that lets agents work through the niche queue autonomously.

---

## Required reading at session start

Do not skip any of these. The cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation, the cite-or-shut-up rule, and the plain-English-in-chat rule.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — seventeen decisions now (D1–D17).
6. `project-docs/Tech-Arch-Spec.md` — the database design. **The schema in this file is now live in Supabase** as of 2026-05-22 evening. Two deviations from the literal SQL in the spec, both noted below in the lessons section.
7. `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill.
8. `content/niches/_queue.yaml` — the launch queue of ~260 candidate niches in priority order.
9. `content/niches/candles.md` — the reference niche file.

---

## What we accomplished this session (2026-05-22 evening — DB build)

The implementation kickoff. Every table from the Tech Arch Spec was written as a migration file under `supabase/migrations/`, applied to the bohdi-ai Supabase project, and verified against the spec. RLS was enabled on all 32 tables and 60 policies were written covering three audiences (service role, authenticated admins/customers, anonymous storefront visitors).

### Migration runner

Built `scripts/db-migrate.mjs`. Reads `.env.local` for the database connection, tracks applied migrations in a `_migrations` table, applies pending files in sorted order, supports `--status` and `--mark-applied` flags. Uses direct Postgres connection (not the pooler — the pooler hostname requires knowing the region, the direct host is derivable from the project ref). Added `pg` and `@types/pg` to devDependencies.

This is the canonical migration mechanism going forward. Write a .sql file under `supabase/migrations/` and run `node scripts/db-migrate.mjs`. New migrations apply; previously-applied ones are skipped.

### Credentials state

The legacy JWT-format service_role key in `.env.local` was disabled by Supabase. Alex generated a new `sb_secret_...` named key (labeled "bohdiai-server" in the dashboard) and pasted it in. Also added a new line `SUPABASE_DB_PASSWORD=` to `.env.local` and pasted the Postgres password from the Supabase dashboard (Project Settings → Database). Both work — the runner connects, queries, and writes successfully.

### Tables landed

Twenty migrations, applied in dependency order:

- **Foundations:** tenants (§1), tenant_members (§2), subscriptions (§3), design_tokens (§4), niches + niche_versions (§6)
- **Trigger helper:** the shared `set_updated_at()` function attached to every table whose spec mentions an updated_at trigger (back-attached to tenants since it was created first)
- **Editor + content:** editor_history (§5), content_pages (§9), page_blocks (§8)
- **Catalog:** listings (§10), variation_attributes + variation_options + listing_variants (§11)
- **Organization:** collections + listing_collections (§12)
- **Customers:** customer_profiles + customer_addresses + wishlist_items (§13)
- **Commerce:** orders + order_items + payments + shipments + shipment_items (§14)
- **Cart:** carts + cart_items (§15)
- **Reviews:** reviews (§16)
- **Gift cards:** gift_cards + gift_card_transactions (§17) — also added 'gift_card' to the listings.listing_type check constraint
- **Media:** uploads (§18)
- **Promos:** promos + promo_redemptions (§19)

Plus the RLS policies migration which created two security-definer helper functions (`is_tenant_admin(uuid)` and `is_tenant_customer(uuid)`) and 60 row-level policies across all 30 spec tables.

### Two deviations from the literal Tech Arch Spec

These need to be reflected in `Tech-Arch-Spec.md` when there's time.

**Niches FK columns** (spec §6.2). The spec writes `created_by uuid references tenant_members(user_id)` and the same for `last_updated_by` and `approved_by`. That can't compile — `user_id` in tenant_members is not unique (one user can be a member of many tenants, which is the whole point of the table). Switched the three FKs to `references auth.users(id) on delete set null` — matches the pattern editor_history uses and tracks the actual user, which is the spec's intent.

**The updated_at trigger function.** Every section that uses `updated_at` says "maintained by a database trigger (covered in a later section)" but no later section ever actually defines it. Lives in migration `20260522000002_updated_at_trigger.sql` as `public.set_updated_at()` and gets attached as `before update for each row` on every applicable table. Spec should pick up a brief mention of where the function lives.

### RLS policy structure

Three audiences:

- **service_role** — bypasses RLS entirely (Supabase default). Everything server-side runs through this: Stripe webhooks, checkout API, AI editor backend, founder admin, migration runner. All sensitive writes (subscriptions, payments, editor history, niche admin writes) are service-role only.
- **authenticated** — logged-in Supabase Auth users. Their tenant relationships come from tenant_members. The `is_tenant_admin(tenant_id)` and `is_tenant_customer(tenant_id)` helpers resolve "what role does this user have in tenant X." Both are SECURITY DEFINER to avoid infinite recursion when a policy on table X queries tenant_members which has its own policies.
- **anon** — anonymous storefront visitors. Read-only access to active/published public content: active tenants, active design tokens, approved niches, published content pages, visible page blocks on published pages, active listings + their variations/options/variants, active collections + memberships, published reviews, active uploads, active sale-type promos. Nothing else.

Three policy gaps worth noting:

- **Anonymous carts.** The carts policies only cover authenticated customers. Anon carts (session_token based) can't be expressed in RLS — there's no way for a policy to validate "this anon visitor owns session token X." Spec acknowledged this; anon cart operations have to go through server endpoints using service role.
- **Uploads.** The public-read policy is permissive (any active, non-deleted upload). Real file security is enforced by Supabase Storage bucket policies and signed URLs, not by this metadata row. Worth tightening if a need surfaces.
- **Niches writes.** Only service role writes today. Spec says writes should be open to "staff and approved Cowork agents identified by a role on tenant_members." We don't have a staff role yet; that policy lands when we add one.

---

## What's in the DB right now

33 tables in the public schema:

```
_migrations (runner state, service-role only)
waitlist (Phase 0, unchanged)
tenants, tenant_members, subscriptions, design_tokens
niches, niche_versions
editor_history
content_pages, page_blocks
listings, variation_attributes, variation_options, listing_variants
collections, listing_collections
customer_profiles, customer_addresses, wishlist_items
orders, order_items, payments, shipments, shipment_items
carts, cart_items
reviews
gift_cards, gift_card_transactions
uploads
promos, promo_redemptions
```

Helper functions in the public schema: `set_updated_at()`, `is_tenant_admin(uuid)`, `is_tenant_customer(uuid)`.

All 33 tables have RLS enabled. 60 policies live across 30 of them (`_migrations`, `waitlist`, `niche_versions` are service-role-only with no policies).

---

## Local environment

`.env.local` now has two new lines beyond what Phase 0 needed:

- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (the new named secret key, not the legacy JWT)
- `SUPABASE_DB_PASSWORD=...` (the Postgres password from the Supabase dashboard, needed by the migration runner)

The runner uses these to build a direct Postgres connection string at `db.<ref>.supabase.co:5432`. No region hardcoding, no pooler — works from anywhere.

---

## Open items still ahead

In rough priority order:

1. **Niches table seed.** Get the candles content into the database as the first niche row. Decide whether the niche-writer skill writes to the table directly going forward or keeps producing markdown files and a seed script imports them.

2. **Supabase Auth wiring.** Onboarding can't proceed without it. Once it's in, tighten the niches admin write policy past service-role-only.

3. **Storefront resolver.** Next.js middleware that maps subdomain/custom domain to tenant_id. Unblocks every public storefront route.

4. **Onboarding flow.** Five screens per Master Spec §5. Needs the mood list and seeded niches.

5. **Blocks and widgets manifests.** Build script per Tech-Arch-Spec §7. Pure code, no DB work.

6. **Mood vocabulary.** The curated launch list — still open.

7. **Cowork agent runtime.** Dispatcher and orchestration so agents can work through the niche queue autonomously.

8. **Spec touch-up.** Reflect the two deviations (niches FK fix, updated_at trigger location) in Tech-Arch-Spec.md.

---

## Lessons banked this session

**Push back on credential punting.** Early in the session I kept telling Alex to paste SQL into the Supabase dashboard instead of fixing my own tooling. He called it out — "stop telling me to do it and fix what you need to." The right move was to install pg, write a runner, ask for the database password once, and apply migrations from this machine ever after. Same principle as the cowork-agents-replicate-patterns rule: do the setup work once so the rest is automatic.

**Verify before trusting the brief.** The session brief said the service_role key in `.env.local` was disabled. I almost asked Alex to update it on faith. Quick test (`fetch` against the REST URL with the existing key, got 401) confirmed the brief was right. Always verify when the brief makes a factual claim about state.

**Spec deviations get called out, not silently absorbed.** The niches FK referencing a non-unique column would have compiled if I'd added a unique index on user_id, but that would have silently broken the multi-tenant-membership model. The right call was flag the issue, propose the auth.users fix, note it in the migration comment and the commit message, and add it to follow-ups for the spec.

**Plain English in chat is still hard during long technical work.** Caught myself wanting to drop section IDs and table names into mid-sentence narration multiple times. Trying to keep updates to one sentence at a time, with file references only when relevant.

---

## Previous session summary (kept for context)

Earlier on 2026-05-22 (afternoon): Master Spec reconciliation, widgets concept added as D13, niches moved from files to a database table per D17, niche-writer skill built with audit script, launch queue of ~260 niches assembled in priority order. Five Master Spec sections rewritten (§2, §6.2, §6.3, §8, §17), new §6.4 inserted for widgets, Tech Arch Spec §6 rewritten as the niches table, tenants table gained six new columns.

2026-05-21: Tech Arch Spec drafted end-to-end (~25 tables across 20 sections), three decisions locked (D10 trial mechanics, D11 file-based niche and block storage, D12 shipments as a first-class table from day one), foundation audit complete.

Phase 0: marketing site live, double-opt-in waitlist working, founder cap behavior, full Next.js + Vercel + Supabase + Resend + Cloudflare stack, design system port from Claude Design output. Done and shipped.

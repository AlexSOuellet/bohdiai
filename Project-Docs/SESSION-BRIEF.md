# Session Brief — BohdiAI

**Last updated:** 2026-05-24 (Layer 2 build session — mood vocab, manifests, first block/widget, candles niche seeded)

**Update at the end of every session.**

---

## Picking up next session

Layer 2 is partially complete. Onboarding flow scaffold is next.

**Layer 1 — done:**
- Events, event_expenses migrations applied. event_id column on orders applied.
- Storefront resolver live in `proxy.ts` (Next.js 16 renamed middleware → proxy). Reads `[shop].bohdiai.com`, looks up tenant by subdomain, injects `x-tenant-id` and `x-tenant-subdomain` into request headers. Unknown subdomains → 404.
- Supabase Auth wiring complete: `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `app/auth/callback/route.ts`, session refresh in proxy. Database types regenerated from live schema (all 36 tables).
- D19 locked: launch price is $25/month.
- Pre-existing Phase 0 type error in `confirm/route.ts` fixed.

**Layer 2 — done so far:**
- **Mood vocabulary locked (D20).** 7 moods: Dark and Stormy, Rustic, Warm and Cozy, Summer Afternoon, Wild Meadow, Bright Bazaar, Sunday Morning. Each carries an AI-readable description, block assembly hint, and directional token hints. Lives in `lib/moods.ts`.
- **Design token type.** `lib/tokens.ts` — DesignTokens Zod schema + `tokensToCssVars()` utility. Maps token objects to CSS custom properties injected by the storefront layout.
- **BlockMeta / WidgetMeta types.** `lib/blocks.ts` — the schema the AI reads from manifests when assembling pages.
- **First foundational block.** `blocks/hero-editorial/` — story-first, typography-forward hero. Suits dark/rustic/minimal moods. Exports meta for the build script.
- **First foundational widget.** `widgets/cta-button/` — single CTA button, fills any CTA slot. Exports meta.
- **Manifest build script.** `scripts/build-manifests.mjs` — scans `blocks/**/meta.ts` and `widgets/**/meta.ts`, imports via tsx, emits typed `lib/blocks-manifest.generated.ts` and `lib/widgets-manifest.generated.ts`. Runs automatically via predev/prebuild hooks.
- **Candles niche seeded.** `supabase/migrations/20260524000004_seed_niches.sql` applied. Row live in Supabase with status=approved. This unblocks onboarding.

**Layer 2 — remaining:**
- **Onboarding flow scaffold.** Five screens per Phase 1 Spec §5. Mood list and candles niche are now ready. This is the next task.

**Layer 2 decisions locked this session:**
- **D20.** 7 moods at launch: Dark and Stormy, Rustic, Warm and Cozy, Summer Afternoon, Wild Meadow, Bright Bazaar, Sunday Morning. Each maps to a distinct block assembly pattern. Vibe slider handles fine-tuning within a mood; moods handle structurally different starting points.
- **Block variants:** No fixed count locked. Lead developer builds one foundational variant per block type; Cowork agents build as many as needed for meaningful visual variety. Volume to be calibrated once Alex can see what a block variant looks like.

---

## Required reading at session start

Do not skip any of these. The cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation and rules.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — eighteen decisions (D1–D18).
6. `project-docs/Tech-Arch-Spec.md` — the database design. The schema is live in Supabase as of 2026-05-22, with deviations noted in the spec status section.
7. `project-docs/Phase-1-Spec.md` — the Phase 1 build spec.
8. `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill.
9. `content/niches/_queue.yaml` — the launch queue.
10. `content/niches/candles.md` — the reference niche file.

---

## What we accomplished this session (2026-05-24 — Layer 1 build)

Planning from the previous session plus Layer 1 build.

### Decisions locked

- **D18** — BohdiAI stays a SaaS, launch scope narrowed. See decisions log.
- **D19** — Launch price is $25/month. Deliberate audience-first pricing for kitchen-table makers.

### Code shipped (Layer 1)

- `supabase/migrations/20260524000001_events.sql` — events table + RLS
- `supabase/migrations/20260524000002_event_expenses.sql` — event_expenses table + RLS
- `supabase/migrations/20260524000003_orders_event_id.sql` — event_id column on orders
- `proxy.ts` — storefront resolver (Next.js 16 proxy convention)
- `lib/supabase-server.ts` — SSR server client
- `lib/supabase-browser.ts` — browser client
- `app/auth/callback/route.ts` — PKCE magic link callback
- `app/auth/error/page.tsx` — auth error stub
- `lib/database.types.ts` — regenerated from live schema (all 36 tables)
- `lib/env.ts` — updated with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY validation

---

## What's in the DB right now

33 tables in the public schema (as of 2026-05-22 evening):

```
_migrations (runner state)
waitlist (Phase 0)
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

Pending migrations (to be applied at start of next build session):
- `events` table
- `event_expenses` table
- `event_id` column on `orders`

Helper functions: `set_updated_at()`, `is_tenant_admin(uuid)`, `is_tenant_customer(uuid)`.

All 33 tables have RLS enabled. 60 policies live across 30 of them.

---

## Local environment

`.env.local` has:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (the named secret key, not the legacy JWT)
- `SUPABASE_DB_PASSWORD=...` (Postgres password, needed by the migration runner)
- Plus all Phase 0 vars (Resend, Sentry, PostHog, site URL, founder cap)

Migration runner: `node scripts/db-migrate.mjs` — reads `.env.local`, tracks applied migrations in `_migrations` table, applies pending `.sql` files in sorted order.

---

## Open items

1. **Exact launch price.** Range is $35–$49/month. Exact number not locked. Make the call before building the billing/subscription flow.

2. **Mood vocabulary.** Full curated launch list. Examples exist; the complete set for onboarding screen 3 doesn't.

3. **Doer storefront rendering.** What does a multi-type tenant (maker + takes commissions) look like on one storefront? The schema supports it; the product design hasn't settled this.

4. **Niche launch set.** How many niches need to be approved before the first beta maker can sign up? The candles file exists; the rest of the launch set needs to be written via the niche-writer skill.

5. **Spec touch-up note.** The Master Spec `.docx` files (Golden Rules, Master Spec, Roles-Workflow) are source-of-truth originals. The `.md` files in project-docs are the working copies Claude reads. The docx files have not been updated to reflect D1–D18. This is an open item for Alex to handle when timing allows — the `.md` files are current and authoritative for development purposes.

---

## Lessons banked

**D18 conversation.** The generator-not-SaaS pivot came from a real and legitimate feeling about support overhead. The right answer was to take that feeling seriously, trace it back to specific causes (custom domains, AI editor cost, no hard cap on makers), and address those specifically rather than abandoning the model. The support burden of a SaaS is a function of scope choices, not an inherent property of the model. Narrowing launch scope addresses the burden; pivoting to a generator just hides it.

**Don't estimate.** Gave time estimates multiple times during this session and got called out on it. The memory file says not to. Estimates have been off by ~7x historically. Frame work by dependencies and sequencing, not weeks or days.

**Push back is the job.** This session had several moments where the right move was to hold the line on the original model rather than accommodate the new framing. The SaaS shape was right for the audience from the beginning. Staying with it and simplifying it (rather than pivoting away from it) was the right call.

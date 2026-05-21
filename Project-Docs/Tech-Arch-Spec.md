# BohdiAI — Technical Architecture Spec

The database design that everything else builds on. Designed to hold every feature on the BohdiAI roadmap, not just the launch subset. Adding a roadmap feature later should mean new tables and new columns, never altering or migrating existing ones.

**Authority:** Rank 3 (alongside Phase docs). Sits above Feature Specs and Agent Guides.

**Approval:** Each section runs by Alex before it lands. Once approved, downstream specs and code cite it.

---

## 1. Tenants

The root entity. A tenant is one business using BohdiAI. Every other table in the database carries a `tenant_id` foreign key and uses row-level security to keep one tenant's data isolated from another's.

### 1.1 Table definition

```sql
create table tenants (
  id               uuid primary key default gen_random_uuid(),
  subdomain        text not null,
  custom_domain    text,
  business_name    text not null,
  tier             text not null check (tier in ('freemium', 'basic', 'pro')),
  types            text[] not null check (types <@ array['seller', 'doer']::text[] and array_length(types, 1) >= 1),
  primary_niche    text,
  status           text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  stripe_account_id text,
  square_merchant_id text,
  currency         text not null default 'USD',
  time_zone        text not null default 'America/New_York',
  contact_email    text,
  phone            text,
  address_line1    text,
  address_line2    text,
  city             text,
  state            text,
  postal_code      text,
  country          text default 'US',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create unique index tenants_subdomain_unique on tenants (lower(subdomain)) where deleted_at is null;
create unique index tenants_custom_domain_unique on tenants (lower(custom_domain)) where custom_domain is not null and deleted_at is null;
create index tenants_status_idx on tenants (status) where deleted_at is null;
```

### 1.2 Column-by-column

- **`id`** — primary key, UUID, never reused even if a tenant closes their account.
- **`subdomain`** — the `[storename]` part of `[storename].bohdiai.com`. Unique among active tenants. Case-insensitive uniqueness. A tenant cannot change their subdomain after onboarding without admin intervention (avoids broken links and SEO loss).
- **`custom_domain`** — optional fully-qualified domain like `junessourdough.com`. Available to Basic and Pro. Self-serve for Basic, assisted for Pro. Unique among active tenants. Null for freemium.
- **`business_name`** — the display name shown on the storefront. Can be edited freely.
- **`tier`** — Freemium, Basic, or Pro. Drives feature gating across the platform.
- **`types`** — array of Seller and/or Doer. A restaurant gets `{seller, doer}`. A plumber gets `{doer}`. A magnet maker gets `{seller}`. Enforced by check constraint to only allow these two values, with at least one required.
- **`primary_niche`** — text label like `'candle_maker'` or `'tattoo_artist'`. Used as input to AI generation and analytics. Not a foreign key — niches are not a hard-coded table because new niches get added without code changes per the spec. A separate niche-reference table can be added later if we ever need to enforce values.
- **`status`** — active, suspended (admin-initiated, billing or abuse), or closed (tenant initiated). Suspended tenants' storefronts return a "this store is currently unavailable" page; their data is preserved.
- **`stripe_account_id`** — the maker's own Stripe account ID, captured during the guided payment setup walkthrough. Null until they connect. This is their account, not a Stripe Connect connection — BohdiAI is not in the money flow.
- **`square_merchant_id`** — same idea, for makers who use Square.
- **`currency`** — three-letter ISO code. USD by default. Multi-currency is on the roadmap but not at launch; storing it now means single-currency tenants are correctly tagged and the column doesn't need adding later.
- **`time_zone`** — IANA time zone. Drives every date/time displayed on the storefront and in the dashboard. Defaults to Eastern but onboarding asks.
- **`contact_email`** — the business's public contact email (shown on the storefront). Distinct from the auth email the maker logs in with, because they may not want their personal email public.
- **`phone`**, **`address_*`** — optional business contact and physical address. Address used for shipping origin and tax-jurisdiction lookups later. All optional because a digital-only tenant has none of this.
- **`created_at`**, **`updated_at`** — standard timestamps. `updated_at` maintained by a database trigger (covered in a later section).
- **`deleted_at`** — soft-delete timestamp. Set when a tenant closes their account. Their data stays for an audit period (TBD) before hard deletion. All unique indexes and active-tenant lookups filter on `deleted_at is null`.

### 1.3 Why these choices

- **Types as an array, not separate boolean columns.** Future-proof for additional types if we ever add one. A `text[]` with a check constraint is easy to query (`'seller' = any(types)`) and easy to extend.
- **No `owner_user_id` here.** The relationship between tenants and users (who can log in and manage the tenant) lives in a separate `tenant_members` table covered in the next section. That allows multiple users on one tenant later (a husband-wife bakery, a partnership), even if we don't ship multi-user at launch. Putting `owner_user_id` on `tenants` would force a rewrite when we add multi-user.
- **Primary niche as text, not FK.** Niches are open-ended and added without code changes. A FK would force every new niche to be a database insert before it can be used. Text keeps the freedom; a reference table can be added later if we want to enforce a controlled vocabulary.
- **Address split into separate columns**, not a single JSON blob. Searching, sorting, and joining (for tax lookups) all need indexable columns. JSON would be premature flexibility.
- **Soft delete, not hard delete.** Customers placed real orders against this tenant; their order history needs to survive a tenant closure for the customer-facing receipt experience. Hard deletion happens after an audit period.

### 1.4 Row-level security

A tenant can only read and write their own row. The Supabase auth `uid()` is resolved to a tenant via the `tenant_members` table (covered next). Admin role bypasses RLS via service-role key, used only by the founder admin and trusted server code.

Full RLS policy SQL will be added once `tenant_members` is defined, since the policy references it.

### 1.5 What's NOT in this table

Anything that varies independently of the tenant's identity goes in its own table:

- Design tokens (separate table, can have version history per tenant)
- Subscription state (separate, has its own lifecycle tied to Stripe webhooks)
- Niche schemas (separate, shared across tenants in the same niche)
- Domain-related state (separate, custom domain provisioning has its own status machine)
- Settings that need history (notification preferences, business hours by day) — separate tables

This keeps `tenants` stable. Things that change frequently or independently belong elsewhere.

---

## 2. Tenant members

The bridge between Supabase's `auth.users` and `tenants`. One row per relationship between a logged-in user and a tenant, marked with the role they have. A single user can have rows linking them to multiple tenants — they might be an admin of their own shop and a customer of someone else's, with the same login.

### 2.1 Table definition

```sql
create table tenant_members (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  role            text not null check (role in ('admin', 'customer')),
  status          text not null default 'active' check (status in ('active', 'removed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  removed_at      timestamptz
);

create unique index tenant_members_user_tenant_unique
  on tenant_members (user_id, tenant_id)
  where status = 'active';

create index tenant_members_tenant_role_idx on tenant_members (tenant_id, role) where status = 'active';
create index tenant_members_user_idx on tenant_members (user_id) where status = 'active';
```

### 2.2 Column-by-column

- **`id`** — primary key.
- **`user_id`** — points to `auth.users` (Supabase Auth's built-in table). Cascade delete: if a user fully deletes their auth account, their memberships go with it.
- **`tenant_id`** — points to `tenants`. Cascade delete: if a tenant row is ever hard-deleted (rare), memberships go with it.
- **`role`** — `admin` or `customer` at launch. Admins manage the storefront, products, orders. Customers shop and track their orders. Constraint allows expansion later (manager, gift-card-only, etc.) by adding values.
- **`status`** — `active` or `removed`. Removal is soft — the row stays for audit (who used to be an admin, who's an ex-customer who might come back).
- **`created_at`** — when the membership was established.
- **`updated_at`** — last change (role change, status change).
- **`removed_at`** — when status moved to removed. Null for active members.

### 2.3 Why these choices

**One row per (user, tenant) relationship.** A user has one role per tenant, not multiple. If the shop owner wants to also shop on their own store, they don't need a separate customer record — they're already the admin. The unique index enforces this for active rows.

**Soft removal, not hard delete.** When an admin removes a co-manager, we keep the row marked `removed`. That matters for audit ("who deleted this product?" — they're no longer an admin but their action history needs to make sense). Same for customers — a deleted account that comes back gets re-associated cleanly.

**Cascade delete on `user_id`.** If a user fully deletes their account in auth (legal requirement for GDPR-style data erasure), the memberships go with it. This is different from soft removal — it's the user-side erasure, not the tenant-side removal.

**No invitation handling in this table.** Pending invitations (admin invites another user who hasn't signed up yet) belong in a separate `tenant_invitations` table covered later. This table only holds active or formerly-active memberships, not promises of future ones.

**Role as text with a check constraint, not an enum type.** Easier to add new values later. Postgres enum types require an `alter type` migration; text + check just needs the constraint updated.

### 2.4 Row-level security

A user can read their own membership rows. An admin of a tenant can read all members of that tenant. Writes are admin-only for that tenant, except `customer`-role self-registration which goes through an API endpoint with server-side controls.

Full RLS policy SQL after auth-trigger details are settled (covered when we wire Supabase Auth).

### 2.5 What's NOT in this table

- **Pending invitations.** Separate `tenant_invitations` table when we get there.
- **Per-user-per-tenant profile data** (display name, avatar, shipping address). Lives in a `tenant_member_profiles` table (or possibly merged into customer-specific tables for shipping/billing). The reason: an admin and a customer of the same tenant need very different profile fields.
- **Granular permissions.** If we ever need "admin who can manage products but not billing," that's a `role_permissions` table layered on top, not more columns here.

---

## 3. Subscriptions

The billing relationship between BohdiAI and the tenant. Tracks which tier the tenant is on, the live state from Stripe, and the full history of subscription changes. Distinct from the maker's own Stripe account on the `tenants` table — that one handles their customer sales; this one handles their bill to us.

Freemium tenants get a row too, even though no money changes hands. Uniform handling keeps every tenant's tier reachable through the same join, and avoids special-case code that asks "is there a subscription, or are they freemium?"

### 3.1 Table definition

```sql
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  tier                   text not null check (tier in ('freemium', 'basic', 'pro')),
  status                 text not null check (status in (
                           'trialing', 'active', 'past_due', 'canceled',
                           'incomplete', 'incomplete_expired', 'unpaid', 'paused'
                         )),
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_price_id        text,
  billing_interval       text check (billing_interval in ('month', 'year')),
  unit_amount_cents      integer,
  currency               text default 'USD',
  trial_start            timestamptz,
  trial_end              timestamptz,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  canceled_at            timestamptz,
  ended_at               timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index subscriptions_tenant_active_unique
  on subscriptions (tenant_id)
  where ended_at is null;

create unique index subscriptions_stripe_subscription_unique
  on subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index subscriptions_tenant_history_idx on subscriptions (tenant_id, created_at desc);
create index subscriptions_status_idx on subscriptions (status) where ended_at is null;
create index subscriptions_period_end_idx on subscriptions (current_period_end)
  where ended_at is null and status in ('active', 'trialing');
```

### 3.2 Column-by-column

- **`id`** — primary key.
- **`tenant_id`** — the tenant this subscription belongs to. Cascade delete: if a tenant is ever hard-deleted, their subscription history goes with it.
- **`tier`** — `freemium`, `basic`, or `pro`. Matches the `tenants.tier` column, which is the cached "what they're effectively on right now" for fast feature-gating. This table is the source of truth; the tenants column is updated by the Stripe webhook handler whenever this changes.
- **`status`** — mirrors Stripe's subscription statuses. Freemium rows use `active`. `trialing` is during a free trial (if we ever offer one). `past_due` and `unpaid` are escalating dunning states. `canceled` is fully ended. `incomplete` and `incomplete_expired` are Stripe-specific states for failed initial payments. `paused` is a future-supported state for vacation holds.
- **`stripe_customer_id`** — Stripe customer identifier. Null for freemium tenants who never entered payment details. Populated the moment they upgrade.
- **`stripe_subscription_id`** — Stripe subscription identifier. Null for freemium. Unique among non-null values, so a Stripe webhook can be looked up by this without ambiguity.
- **`stripe_price_id`** — the Stripe price object the subscription was created against. Captured because we'll likely change prices over time and need to know which historical price each subscription was on (grandfathering).
- **`billing_interval`** — `month` or `year`. Null for freemium. Annual plans aren't at launch but the column is here for D1's foundation-first reason.
- **`unit_amount_cents`** — the actual price the tenant is paying at the time of subscription, in cents. Captured here (not just looked up from Stripe) so grandfathered pricing survives even if the Stripe price object is later archived or changed.
- **`currency`** — three-letter ISO code. USD at launch; column exists because we'll bill in other currencies eventually.
- **`trial_start`**, **`trial_end`** — trial period boundaries. Both null if no trial.
- **`current_period_start`**, **`current_period_end`** — the current billing period boundaries from Stripe. Used to display "next bill date" in the dashboard and to drive feature gates that reset monthly (AI generation caps, image studio quota).
- **`cancel_at_period_end`** — true when the tenant has clicked "cancel" but their paid period hasn't ended yet. They keep paid access until `current_period_end`, then the subscription transitions to `canceled` and a new freemium row is created.
- **`canceled_at`** — timestamp of the cancel action (whether immediate or scheduled). Distinct from `ended_at`, which is when access actually stopped.
- **`ended_at`** — when this subscription row stopped being the active one for the tenant. Set on cancellation completion, on tier change (the old row ends, a new row begins), or on hard cancellation. Active subscription = `ended_at is null`.
- **`created_at`**, **`updated_at`** — standard timestamps. `updated_at` maintained by trigger.

### 3.3 Why these choices

**One row per subscription period, not one row per tenant.** When a tenant upgrades from Basic to Pro, the Basic row gets `ended_at` set and a new Pro row is inserted. This gives us complete subscription history for free — when did they upgrade, when did they downgrade, when did they cancel and come back — without a separate audit table. Standard pattern from billing systems that have been burned by mutable subscription rows.

**Freemium tenants get a row.** Avoids the "is there a row or not?" branch in every feature-gate query. Status is `active`, Stripe fields are null. When they upgrade, that freemium row ends and a paid row begins.

**`tier` is duplicated on `tenants`.** Yes, on purpose. Feature gating happens in hot paths — every page load, every API call — and joining to subscriptions for each check would be wasteful. The tenants column is the read-optimized cache; this table is the source of truth. The webhook handler writes both.

**`unit_amount_cents` captured locally.** Stripe lets you archive a price object, and we'll change prices over time. Without capturing the amount on this row, a grandfathered tenant could appear to be paying $19.95/mo when the Stripe price object now says $24.95. Local capture means the historical record is honest.

**Status values are Stripe-aligned.** Webhook handlers can pass Stripe's status string straight through after validation, no translation layer. Freemium and paused are the only additions to Stripe's vocabulary.

**Unique index on tenant + `ended_at is null`.** A tenant can only have one active subscription at a time. The partial unique index enforces this without preventing historical rows from existing.

**Cascade delete on `tenant_id`.** If a tenant is hard-deleted (rare; happens after the audit window), their subscription history goes with them. The Stripe-side record is the authoritative permanent record for accounting.

### 3.4 Row-level security

A tenant's admin can read their own subscription rows. No tenant can read another tenant's subscription. Writes are server-only — coming from the Stripe webhook handler (service role) or from the upgrade/cancel API endpoints (also service role after auth validation). No direct client writes to this table at any tier.

Full RLS policy SQL will land alongside the webhook handler implementation, since the policy depends on how the service role is invoked.

### 3.5 What's NOT in this table

- **Payment method details.** Card numbers, expiration dates, last-four — all live in Stripe. We never store them. If we need to display "card ending in 4242" in the dashboard, we fetch it from Stripe on demand.
- **Invoice line items.** Invoices are Stripe-side records. If we ever build an in-app invoice history, that's a `subscription_invoices` cache table fed by webhooks, not columns here.
- **Tier feature definitions.** What Basic includes vs. Pro lives in code (or in a future `tier_features` table if it needs to be data-driven for marketing tests). This row only says *which* tier; the platform decides what that tier allows.
- **Add-on purchases.** Future paid add-ons (extra AI tokens, concierge setup) belong in a separate `add_on_purchases` table since they have a different lifecycle from the recurring subscription.
- **AI usage counters.** Monthly caps (AI editor interactions, image generations) reset against `current_period_end`, but the counters themselves live in a usage table covered later. This table is the period boundary; the counters reference it.

---

## 4. Design tokens

The per-tenant visual configuration. One row per snapshot — every meaningful change creates a new row, the old rows stay. Exactly one snapshot per tenant is "active" at any time; that's the one the storefront renders against.

Tokens are stored as a JSON document, not as individual columns, because the token vocabulary grows over time and we never need to query or join on individual token values. Adding a new token later is purely additive — old snapshots simply don't have the key, new snapshots do, the renderer treats missing keys as defaults. No schema migration ever required to extend the visual vocabulary.

The canonical token schema lives in application code as a strict TypeScript type plus a Zod validator. Every write — from the AI editor, the onboarding generator, or admin scripts — goes through that validator before reaching the database. The database stores JSON; the application treats it as a strongly-typed object end to end.

### 4.1 Table definition

```sql
create table design_tokens (
  id                         uuid primary key default gen_random_uuid(),
  tenant_id                  uuid not null references tenants(id) on delete cascade,
  tokens                     jsonb not null,
  label                      text,
  source                     text not null check (source in (
                               'onboarding', 'ai_chat_edit', 'vibe_slider',
                               'admin_manual', 'rollback'
                             )),
  restored_from_snapshot_id  uuid references design_tokens(id),
  is_active                  boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint design_tokens_is_object check (jsonb_typeof(tokens) = 'object')
);

create unique index design_tokens_active_unique
  on design_tokens (tenant_id)
  where is_active = true;

create index design_tokens_tenant_history_idx on design_tokens (tenant_id, created_at desc);
create index design_tokens_tenant_labeled_idx on design_tokens (tenant_id, label) where label is not null;
```

### 4.2 Column-by-column

- **`id`** — primary key. Stable across the snapshot's lifetime; rollback creates a new row that references the original, doesn't mutate it.
- **`tenant_id`** — the tenant this snapshot belongs to. Cascade delete: if a tenant is hard-deleted, their entire snapshot history goes with them.
- **`tokens`** — the full resolved token set as JSONB. Complete document, not a delta. Every snapshot stands alone — the renderer reads exactly one row and has everything it needs. Shape covered in §4.4.
- **`label`** — optional maker-given name like "My September look" or "Holiday palette." Null for most snapshots; populated when the maker explicitly names one they want to come back to. Indexed for fast "show me my saved looks" queries.
- **`source`** — what created this snapshot. `onboarding` is the AI-generated first version. `ai_chat_edit` is a change driven by a maker's natural-language request to the editor. `vibe_slider` is a save from a Vibe Slider session. `admin_manual` is a direct edit by the founder via admin tools or a Claude-run script. `rollback` is a restore of an older snapshot. Tracking source matters for analytics (how often does the AI editor get used vs the Vibe Slider) and for debugging (when a tenant complains their site changed, the source explains how).
- **`restored_from_snapshot_id`** — null for most rows. Populated when source is `rollback`, pointing at the snapshot that was restored. The restore creates a fresh row with the same tokens, not a reactivation of the old row, so history stays append-only and the rollback action itself is visible in the timeline.
- **`is_active`** — true for exactly one row per tenant. The storefront renderer queries `where tenant_id = ? and is_active = true` and gets the one snapshot to render against. Switching the active snapshot is a transaction that sets the old active row to false and the new one to true.
- **`created_at`**, **`updated_at`** — standard timestamps. `updated_at` only really moves when `is_active` flips or `label` gets edited; the tokens themselves never get mutated in place.

### 4.3 Why these choices

**Snapshots, not mutable rows.** Every change is a new row. The maker can roll back to any prior look without us needing a separate version table. History is the table. This costs a small amount of storage — a token blob is a few hundred bytes — and buys complete auditability and confident rollback. A tenant who hates what the AI did five edits ago can get exactly that state back, byte for byte.

**JSONB, not JSON.** JSONB is the indexed binary form. We never query inside the document today, but if we ever need to (analytics on "what percentage of stores use a serif heading font"), JSONB makes it possible without changing the schema. The storage cost is the same.

**`is_active` as a column with a unique partial index.** The alternative is a `current_design_tokens_id` foreign key on the tenants table. I picked the column-here approach because it keeps all snapshot lifecycle on the snapshot side and the partial unique index gives us a hard guarantee that exactly one is active per tenant. The tenants table doesn't need to know about token state at all.

**Rollback creates a new row.** A rollback is a maker action, just like any other edit, and deserves to be visible in the timeline. Setting an old row back to `is_active` would hide the rollback event and confuse the history view ("why is there a 30-day gap and then this old row is suddenly current again?"). New row, source=`rollback`, restored_from pointer — the timeline reads cleanly.

**Check constraint that the JSON is actually an object.** A trivial guardrail that prevents a row with `tokens = "null"` or `tokens = 42` or `tokens = []` from ever existing. The Zod validator catches more, but this is a free database-level backstop for the most embarrassing failure modes.

**No `deleted_at` on snapshots.** Snapshots aren't deletable. If a tenant has 200 snapshots and only wants to see the last 10 in the editor, that's a UI-level pagination, not a delete. Storage is cheap, history is precious. Hard cascade only when the tenant itself is deleted.

### 4.4 Token document shape

The tokens column holds a single JSON object organized into nested groups. The canonical shape is defined in application code (TypeScript type plus Zod schema); this section documents the intent so spec readers know what's in there.

Groups at launch:

- **colors** — primary, accent, background, surface, text, text_muted, border, success, warning, error. Each as a hex or HSL string.
- **typography** — heading_font (font family), body_font (font family), heading_weight, heading_letter_spacing, body_size, body_line_height.
- **spacing** — base_unit (numeric, drives the spacing scale), section_padding, card_gap, content_max_width.
- **shape** — border_radius_small, border_radius_medium, border_radius_large.
- **layout** — hero_style (string reference to a hero variant), product_grid_style, footer_style.
- **effects** — shadow_intensity (low/medium/high), motion_intensity (subtle/medium/lively).

Tokens added in later phases (image overlay opacity, button hover behavior, gradient definitions, custom font URLs, etc.) slot into existing groups or add new groups without any schema work.

Reasoning the AI does in terms of semantic dials (warmth, formality, density, energy) happens in the editing pipeline and produces token values for storage. The dials themselves are not stored — they're a coordinate system the AI uses to make coordinated changes, not data the maker ever sees.

### 4.5 Row-level security

A tenant's admin can read all snapshots for their tenant. Anonymous storefront visitors can read only the active snapshot for the tenant whose storefront is being rendered (resolved via subdomain or custom domain). All writes are service-role only — the AI editor, the onboarding generator, and admin scripts all execute server-side and write under the service role after their own auth checks.

Full RLS policy SQL will land alongside the storefront renderer implementation, since the public-read policy depends on how the tenant gets resolved from the request.

### 4.6 What's NOT in this table

- **The dial values the AI reasons in** (warmth, formality, density, etc.). Computed at edit time, not stored. The result of the dial movement is stored as resolved token values in the JSON document.
- **Edit prompts and AI interpretations.** Live in a separate `editor_history` table covered later. That table joins to design_tokens by snapshot id so each history entry knows which snapshot it produced.
- **Token vocabulary definitions** (what tokens exist, what values they accept, what their defaults are). Lives in application code as a Zod schema. Source of truth is code, not data.
- **Block composition and page structure.** Tokens are the visual layer only. Which blocks appear on a page, in what order, with what settings — that's covered by the upcoming page_blocks and blocks-catalog tables.
- **Asset references** like uploaded logos or custom font files. Stored in the uploads/media table. Tokens may reference asset IDs but the assets themselves live elsewhere.

---

## 5. Editor history

The audit and rollback log for every change a maker (or the AI on their behalf) makes to their site. Captures the maker's own words, the AI's interpretation of those words, what actually changed, and the before-and-after state of the affected row. One stream of changes per tenant covering design, content, and structural edits — the same table whether the change was a token tweak, a product update, or adding a new page.

Two reasons this exists. Transparency — when a maker asks "what did you just do to my site," the answer is one row in this table, in their own words plus a readable interpretation. Rollback — every change can be undone because the before-state was captured, regardless of which table it touched.

### 5.1 Table definition

```sql
create table editor_history (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  user_id                  uuid references auth.users(id) on delete set null,
  prompt                   text,
  ai_interpretation        text,
  action_type              text not null,
  target_table             text not null,
  target_row_id            uuid,
  before_state             jsonb,
  after_state              jsonb,
  design_tokens_snapshot_id uuid references design_tokens(id),
  status                   text not null default 'applied' check (status in ('applied', 'reverted', 'failed')),
  reverted_by_history_id   uuid references editor_history(id),
  source                   text not null check (source in (
                             'ai_chat', 'vibe_slider', 'direct_edit',
                             'onboarding', 'admin_manual', 'rollback'
                           )),
  created_at               timestamptz not null default now()
);

create index editor_history_tenant_timeline_idx
  on editor_history (tenant_id, created_at desc);

create index editor_history_target_idx
  on editor_history (target_table, target_row_id);

create index editor_history_tenant_status_idx
  on editor_history (tenant_id, status);
```

### 5.2 Column-by-column

- **`id`** — primary key.
- **`tenant_id`** — the tenant whose site was changed. Cascade delete with the tenant.
- **`user_id`** — who initiated the change. Set null on user deletion (preserves the history even if the user account is gone). Null for system-initiated changes (onboarding).
- **`prompt`** — the maker's own words. Null for non-chat actions (Vibe Slider, direct click-to-edit, onboarding generation).
- **`ai_interpretation`** — the AI's plain-English readback of what it understood the prompt to mean ("you want the headline to feel handwritten, so I'm switching to a script font and softening the weight"). Null for non-AI actions.
- **`action_type`** — short machine-friendly label like `design_token_update`, `page_create`, `page_block_add`, `page_block_reorder`, `listing_create`, `listing_update`, `content_update`. Free text rather than enum so new action types don't require a migration as features are added.
- **`target_table`** — which table the change landed in. Free text. Combined with `target_row_id`, this gives "what's the full history of this specific row."
- **`target_row_id`** — the row that was affected. Null when the action created multiple rows (a "build me a landing page" that creates one content_pages row and four page_blocks rows — that case gets multiple history entries linked by a shared parent, or one summary entry with null target).
- **`before_state`** — JSONB snapshot of the row before the change. Null for create actions. Used for rollback and for diffing in the UI.
- **`after_state`** — JSONB snapshot of the row after the change. Null for delete actions. Used for the visible diff and to confirm the change landed as intended.
- **`design_tokens_snapshot_id`** — when the change was a design token update, this links to the new snapshot in `design_tokens`. Token changes are special-cased this way because design_tokens already keeps its own snapshot history; we don't duplicate the full token JSON here, we just reference the snapshot id.
- **`status`** — `applied` for normal changes, `reverted` when this change has been undone by a later rollback, `failed` for attempts that errored before landing (kept for debugging).
- **`reverted_by_history_id`** — when status is `reverted`, points to the rollback entry that undid this. Self-referential.
- **`source`** — what kind of editing surface triggered this. `ai_chat` is the natural-language editor. `vibe_slider` is the slider UI. `direct_edit` is click-to-edit. `onboarding` is the initial AI build. `admin_manual` is a founder-side change. `rollback` is a revert action.
- **`created_at`** — when the action ran.

### 5.3 Why these choices

**One table, all change types.** A single chronological stream of changes per tenant matches how chat-driven editing actually works — the maker sees one timeline, not separate timelines for design, content, and structure. Querying "what happened to my site today" is one query, not three.

**Before-and-after captured as JSONB.** Rollback works regardless of what changed. A token update, a listing edit, a page rearrangement — all undo the same way: read the `before_state`, write it back, log a new history entry with source=`rollback`. No special-case undo logic per table.

**Design token changes reference design_tokens by id instead of inlining the JSON.** Token snapshots are already a first-class versioned thing with their own table and rollback model. Storing them twice would create drift risk. The history entry references the snapshot id; the snapshot has the actual tokens.

**Rollback is itself a logged action.** When a maker undoes a change, that undo gets its own history entry with source=`rollback`, and the original entry's status flips to `reverted`. The timeline shows the rollback happening rather than the original change vanishing. Same principle as design token snapshots — history is append-only.

**`action_type` and `target_table` as text, not enums.** New action types and new tables get added often as features ship. Free text keeps additions zero-friction. The values are application-defined; we lean on code review and the editor surface to keep them consistent, not on the database.

**No `updated_at`.** History rows are immutable. Once written, they don't change except for `status` flipping when reverted. The `reverted_by_history_id` carries the rollback timestamp by joining to that row.

### 5.4 Row-level security

A tenant's admin can read all history rows for their tenant. No tenant reads another tenant's history. Customers don't read history at all (they shouldn't see edit logs). Writes are service-role only — every editor surface writes through server-side code.

### 5.5 What's NOT in this table

- **The full content of design token snapshots.** Stored once in `design_tokens`; referenced here by id.
- **AI cost and token-usage telemetry.** Lives in a separate telemetry table when we build it. This table is the maker-facing audit log; cost tracking is internal.
- **Failed parses or validation rejections.** When the AI tries to write a malformed update and the Zod validator rejects it, the rejection doesn't land here — nothing actually changed. Logged elsewhere for debugging.
- **System-level changes that aren't tenant-initiated** (a platform-wide block deprecation, a billing change pushed by a Stripe webhook). Those have their own logs.

---

## 6. Niche content (file-based, not in database)

Per D11, niche schemas do not live in the database. They live as markdown files in the application repo at `/content/niches/`, one file per niche, loaded at build time and cached at runtime.

This section is included in the Tech Arch Spec because the architecture is incomplete without it — a reader looking for "where does niche content live?" needs to find the answer here. The shape and rationale matter even though no database table backs it.

### 6.1 Where it lives

Each niche is a single markdown file at `/content/niches/<slug>.md`. The slug is the same identifier used in the `tenants.primary_niche` column — `candle_maker.md`, `tattoo_artist.md`, `dog_groomer.md`, `plumber.md`.

The file has YAML frontmatter for structured metadata and a markdown body for prose content the AI consumes.

```markdown
---
slug: candle_maker
display_name: Candle Maker
tenant_type_fit: [seller]
status: active
search_keywords:
  - handmade candles
  - soy candles
  - scented candles
common_variations:
  - scent
  - size
  - wax_type
block_preferences:
  - hero_centered_overlay
  - product_grid_three_column
  - about_story_left
---

## Product description guidance

Candle products are typically described with scent profile, burn time, and the atmosphere they create. Customers care about how the candle will feel in their home, not just the technical specs...

## About page guidance

Candle makers often have origin stories rooted in self-care, gift-giving, or a creative outlet...
```

### 6.2 How it gets used

A loader function at build time reads every file in `/content/niches/`, validates the frontmatter against a Zod schema, and emits a typed manifest. Runtime code imports the manifest; no file I/O happens per request.

When the AI generates a product description, it loads the relevant niche's prose sections from the manifest and combines them with its base prompt. When onboarding picks design starting points, it reads the `block_preferences` array. When the niche picker renders in onboarding, it reads `display_name` and `tenant_type_fit` from the manifest.

The `tenants.primary_niche` column holds the slug. If a tenant references a niche slug that doesn't exist in the manifest (because we removed or renamed a file), the application falls back to a generic default niche rather than erroring. Validation at build time catches this for known tenants; runtime fallback handles edge cases.

### 6.3 Why files, not a table

Niches are prose content the AI reads. Authoring prose in markdown is materially better than authoring in JSON-in-a-database-column — natural format, readable diffs, PR review workflow, Git history for free. Niches change rarely (add a few at launch, a few more as you grow, then mostly leave alone), so the "every change is a deploy" cost is near-zero.

The build process is the validator. A markdown file with malformed frontmatter fails the build, not production. A niche referenced by code but missing a file fails the build. Drift between code and content is structurally impossible.

The Master Spec §11 implied a founder-admin screen for niche management. That trade is real: with files, "managing niches" means opening a PR, not editing a textarea. The PR review workflow is actually better quality control, and the workflow already runs through me. If a non-technical user ever needs to add niches from a web UI, we revisit. Migration to a database table would be an afternoon of work.

### 6.4 What's NOT here

- **Per-tenant niche customization.** Niches are shared platform content. Tenant-specific behavior lives in their tenant rows (design_tokens, listings, page_blocks).
- **Niche-specific code branches.** Nothing in code says `if (niche === 'candle_maker')`. The niche file provides data; generic code consumes it.
- **Product field definitions.** Killed by D4. Sellers define their own variations.
- **Hard design constraints.** Killed by D6. Design is mood-driven; niche preferences are starting hints only.

---

## 7. Blocks library (code-based, not in database)

Per D11, the blocks library does not live in the database. Each block is a React component file in the repo whose exported metadata is collected at build time into a single manifest the AI and the editor read.

Same reasoning as niches: catalog metadata that's tightly coupled to component code belongs with the component code, not in a separate database table that can drift from the implementation.

### 7.1 Where it lives

Each block is a TypeScript file at `/blocks/<section_type>/<key>.tsx`. The file exports both the React component and a typed metadata constant.

```typescript
// /blocks/hero/hero_split_screen_v1.tsx
export const meta = {
  key: 'hero_split_screen_v1',
  section_type: 'hero',
  display_name: 'Split-screen hero with image',
  description: 'A two-column hero with a large image on one side and a headline plus call-to-action on the other. Works well for product-led businesses with strong visual identity.',
  tier_required: 'freemium',
  tenant_type_fit: ['seller', 'doer'],
  content_schema: z.object({
    headline: z.string(),
    subhead: z.string().optional(),
    image: z.string().url(),
    cta_text: z.string().optional(),
    cta_url: z.string().url().optional(),
  }),
  preview_image_url: '/block-previews/hero_split_screen_v1.png',
  status: 'active',
  introduced_at: '2026-06-15',
} as const;

export function HeroSplitScreenV1(props: z.infer<typeof meta.content_schema>) {
  // component code
}
```

### 7.2 How it gets used

A build script scans `/blocks/**/*.tsx`, imports every file, collects the exported `meta` constants, and emits a single typed manifest (`blocks-manifest.ts`). The manifest is what the AI reads to know what blocks exist and what each one accepts. The page renderer dynamically imports the actual component when a page_blocks row references its key.

Validation happens at build time: every meta object is parsed through a master Zod schema, every key must be unique, every active block must have an importable component, every block referenced in seed data must exist. A typo or missing block fails the build, not production.

### 7.3 Why code, not a table

Catalog rows in a database can drift from component code. A row for a deleted component is a runtime crash waiting to happen; a component without a row is invisible to the AI. Keeping metadata and code in the same file eliminates the entire class of drift bugs.

Editing a block's metadata is editing a code file regardless — the React component and the metadata describe the same thing and change together. Splitting them across two storage layers (database for metadata, code for component) creates two places to update for every change and one place to forget.

The Master Spec §6.6 talked about agents building component variants. With this structure, agents build by creating new block files (component + metadata in one file) and opening PRs. Same workflow as adding niches. PR review catches mistakes before they reach production.

Deprecation works the same way as the table version would: the `status` field in meta moves to `deprecated`, the block disappears from new compositions, existing page_blocks rows still render via dynamic import.

### 7.4 What page_blocks references

The `page_blocks.block_key` column holds a string matching a `meta.key` somewhere in the manifest. There is no database foreign key (you can't FK to a code constant), so validation happens at the application layer on write: the writer checks the key against the manifest and rejects if it doesn't exist or is in `draft` status. The catalog-immutable-keys rule still applies — once a block ships, its key never changes, only new keys get added.

### 7.5 What's NOT here

- **Per-tenant block customization.** Same as niches — tenants compose from the library, they don't fork it.
- **Block instance content.** Lives in page_blocks. The block file describes the class; instances are rows.
- **Compatibility rules between blocks.** Not enforced today. If we ever need them, separate manifest, same pattern.

---

## 8. Page blocks

The per-tenant compositions. One row per block placed on a page. Together with `content_pages`, this table defines what every storefront actually shows.

When the AI builds a page in response to "give me a landing page for my holiday collection," it inserts one row in content_pages and several rows here — one per block on the page, each referencing a catalog block by key and carrying the actual content the block displays.

### 8.1 Table definition

```sql
create table page_blocks (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null references tenants(id) on delete cascade,
  page_id                     uuid not null references content_pages(id) on delete cascade,
  block_key                   text not null,
  position                    integer not null,
  content                     jsonb not null default '{}'::jsonb,
  is_visible                  boolean not null default true,
  created_by_history_id       uuid references editor_history(id) on delete set null,
  last_updated_by_history_id  uuid references editor_history(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint page_blocks_content_is_object check (jsonb_typeof(content) = 'object')
);

create unique index page_blocks_page_position_unique
  on page_blocks (page_id, position);

create index page_blocks_tenant_page_idx
  on page_blocks (tenant_id, page_id, position);

create index page_blocks_block_key_idx
  on page_blocks (block_key);
```

### 8.2 Column-by-column

- **`id`** — primary key.
- **`tenant_id`** — the tenant. Denormalized from page_id for RLS efficiency (every query filter starts with tenant_id).
- **`page_id`** — the page this block sits on. Cascade delete: if the page is deleted, its blocks go with it.
- **`block_key`** — string matching a `meta.key` in the build-time blocks manifest (§7). No database foreign key (the manifest lives in code, not a table); validation happens at the application layer on write. Once a block ships its key is immutable, so a row always points at a renderable block.
- **`position`** — integer order on the page. The unique index on `(page_id, position)` enforces no two blocks at the same position. Reordering moves positions around in a transaction.
- **`content`** — JSONB with the actual content filling the block's slots, conforming to the block's `content_schema`. The application validates against the catalog's schema on write.
- **`is_visible`** — toggle to hide a block without deleting it (handy for seasonal content the maker wants to bring back later).
- **`created_by_history_id`**, **`last_updated_by_history_id`** — full traceability back to the editor_history rows that created and most recently updated this block. Set null if the history row is somehow purged.
- **`created_at`**, **`updated_at`** — standard timestamps.

### 8.3 Why these choices

**One row per block placement.** Storing the page composition as one row per block (rather than one big JSON array of blocks on the content_pages row) makes reordering, editing, and adding individual blocks first-class database operations with their own history entries. A page with 8 blocks has 8 rows here; editing one block updates one row, not a giant JSON document.

**Integer position with unique constraint.** Simple and explicit. Reordering is a transaction that updates the positions. Alternative would be a linked list with `next_block_id`, which is more complex and breaks easily.

**Content validated against catalog schema on write.** The catalog defines what slots a block accepts; the application validates the content row against that schema before writing. The database can't enforce this (you can't FK-validate JSON shape against another row's JSON schema in Postgres), but the application layer ensures it. Same pattern as design tokens — Zod validator at the boundary.

**Tenant_id denormalized.** Could be derived by joining through page_id, but every RLS policy and every query starts with tenant_id. Storing it directly avoids the join.

**History pointers as nullable FKs.** Connects every block to its origin and last change for full transparency in the editor UI. Nullable because history could theoretically be cleaned up someday (we don't plan to, but the schema doesn't lock us in).

**`is_visible` instead of soft delete.** A hidden block is meant to come back. A deleted block is gone. They're different states. Hard delete via cascade is fine because page_blocks rows are easy to recreate from history if a real undo is needed.

### 8.4 Row-level security

A tenant's admin reads and writes their own page_blocks. Anonymous storefront visitors read page_blocks for the tenant whose subdomain they're visiting, but only where `is_visible = true` and the parent page is published. All writes are service-role triggered after admin auth.

### 8.5 What's NOT in this table

- **Block library metadata.** Lives in code per §7. This table only references blocks by key.
- **Page-level settings** (title, slug, SEO meta). Live on content_pages.
- **Tenant design tokens.** Live in design_tokens. Blocks render against whatever the active snapshot says.
- **A/B variant assignments.** When we add A/B testing, that's a separate table layered on top, not columns here.

---

## 9. Content pages

The pages on a tenant's storefront. One row per page. Page content lives in page_blocks; this table is the metadata: what kind of page it is, what URL it lives at, whether it shows in nav, whether it's published.

Every tenant gets a handful of system pages auto-created at onboarding (storefront landing, about, FAQ, basic policy stubs). Tenants can create additional pages — gallery, custom marketing landings, holiday collections, anything.

**Interpretation flagged for discussion:** the Doer-vs-Seller question from yesterday is still open. I'm drafting content_pages generically — a page is a page regardless of tenant type, the page_blocks composition is what differs. A Doer's "services" page is a content_pages row with services-oriented blocks; a Seller's product listing page is a content_pages row with product-grid blocks. If you'd rather have separate tables or a hard distinction at this layer, push back here.

### 9.1 Table definition

```sql
create table content_pages (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  slug                text not null,
  page_type           text not null,
  title               text not null,
  meta_description    text,
  meta_keywords       text,
  status              text not null default 'draft' check (status in ('draft', 'published', 'unlisted')),
  is_system_page      boolean not null default false,
  is_in_nav           boolean not null default false,
  nav_position        integer,
  nav_label           text,
  parent_page_id      uuid references content_pages(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz,
  deleted_at          timestamptz
);

create unique index content_pages_tenant_slug_unique
  on content_pages (tenant_id, lower(slug))
  where deleted_at is null;

create index content_pages_tenant_status_idx
  on content_pages (tenant_id, status) where deleted_at is null;

create index content_pages_tenant_nav_idx
  on content_pages (tenant_id, is_in_nav, nav_position)
  where deleted_at is null and status = 'published';
```

### 9.2 Column-by-column

- **`id`** — primary key.
- **`tenant_id`** — owner tenant. Cascade delete.
- **`slug`** — URL path component. A page at `myshop.bohdiai.com/holiday-collection` has slug `holiday-collection`. The storefront home page has slug `''` or a special root marker. Unique per tenant (case-insensitive) among non-deleted pages.
- **`page_type`** — short label categorizing the page: `storefront`, `about`, `faq`, `shipping_policy`, `returns_policy`, `privacy_policy`, `terms`, `contact`, `gallery`, `custom_landing`, `services`, `appointments`, `collection_page`, etc. Drives default block compositions and certain platform behaviors (the storefront page is special-cased as the home). Free text — new page types added without migration.
- **`title`** — page title used in the browser tab, SEO, and as the default nav label.
- **`meta_description`**, **`meta_keywords`** — SEO metadata. AI-generated on page creation; maker can edit.
- **`status`** — `draft` is not visible to the public, `published` is live, `unlisted` is live at the URL but excluded from sitemaps and nav (useful for marketing landings the maker doesn't want indexed).
- **`is_system_page`** — true for pages auto-created at onboarding that the maker can edit but not delete (storefront, about, basic policies). False for user-created pages.
- **`is_in_nav`** — should this page appear in the storefront's primary navigation.
- **`nav_position`** — order among navigation items when is_in_nav is true.
- **`nav_label`** — optional short label for the nav; falls back to title if null.
- **`parent_page_id`** — optional reference to a parent page for hierarchical structures (a "Policies" parent with shipping, returns, privacy children). Set null on parent deletion so children become top-level rather than orphaned.
- **`created_at`**, **`updated_at`**, **`published_at`**, **`deleted_at`** — standard timestamps. `published_at` first time status flipped to published. `deleted_at` soft delete.

### 9.3 Why these choices

**Pages are pages regardless of tenant type.** A Doer's services page and a Seller's collection page are both content_pages rows. What differs is the page_blocks composition. This keeps the table generic and avoids forking the schema by tenant type, which would cascade into forking RLS policies and queries. The composition is where the type-specific behavior lives.

**Slug uniqueness per tenant, case-insensitive.** Two tenants can both have `/about`. Within one tenant, slugs must be unique among non-deleted pages. A deleted page's slug becomes available again immediately.

**System pages are flagged, not separated.** Onboarding creates a few mandatory pages (storefront, about, basic policies). They live in the same table as user-created pages but `is_system_page=true` prevents deletion. The maker can edit their content, change their nav position, even unpublish them, but can't delete the row.

**Parent_page_id for hierarchy.** Simple self-referential FK rather than a separate hierarchy table. Most pages are top-level; a few might nest. When the parent is deleted, children become top-level rather than orphaning.

**Page content lives in page_blocks, not here.** A content_pages row is metadata: what's the URL, what's the type, is it published. The actual visible content is in the page_blocks rows that reference this row. Separation lets the maker rearrange blocks without touching page metadata and lets the AI compose blocks independently of page settings.

**Soft delete.** A deleted page might have inbound links, SEO history, customer bookmarks. Soft delete lets us serve a graceful 410-gone page rather than a hard 404, and lets the maker recover a page they didn't mean to remove.

**`status` distinct from soft delete.** Draft pages aren't deleted; they're not yet published. Unpublishing isn't deleting either. These are three different states and each has its own handling.

### 9.4 Row-level security

A tenant's admin reads and writes their own content_pages. Anonymous storefront visitors read published, non-deleted pages for the tenant whose storefront they're visiting. Customers (logged-in tenant_members with role=customer) read the same set as anonymous visitors plus possibly some account-scoped pages later.

### 9.5 What's NOT in this table

- **The page's visible content.** Lives in page_blocks. This table is metadata only.
- **Versioning of page content.** The page row itself isn't versioned; editor_history captures changes to both the page metadata and the blocks. If we ever need true page versioning (snapshots of an entire page composition), it's a separate table.
- **Sitemap and robots.txt configuration.** Derived from `status` and `is_in_nav` plus a few platform rules; not stored here.
- **Custom domain mapping per page.** All pages on a tenant render under the tenant's domain (subdomain or custom). Page-level domain routing isn't a thing.

---

## 10. Listings

The unified table for everything a tenant offers — products, digital downloads, services, classes, events. Per D3, a Seller's listings are products; a Doer's listings are services, appointments, or classes. Unified table because the core fields are shared (name, description, price, photos, status) and the differences live in type-specific columns or in related tables.

**Interpretation flagged for discussion:** I'm drafting this as one table for both products and services rather than two separate tables. The argument for one is that 80% of the columns and behaviors are shared (cart, checkout, order creation, reviews, collections), and divergence (scheduling for services, shipping for products) is well-handled by nullable type-specific columns. The argument for two would be cleaner type safety. I went with one because it keeps queries and code paths simple and matches how Etsy/Shopify model this. Push back here if you'd rather split.

### 10.1 Table definition

```sql
create table listings (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  listing_type           text not null check (listing_type in (
                           'product', 'digital_product', 'service',
                           'class', 'event', 'appointment'
                         )),
  slug                   text not null,
  name                   text not null,
  short_description      text,
  description            text,
  base_price_cents       integer not null check (base_price_cents >= 0),
  currency               text not null default 'USD',
  status                 text not null default 'draft' check (status in (
                           'draft', 'active', 'sold_out', 'archived', 'unavailable'
                         )),
  inventory_tracked      boolean not null default false,
  inventory_count        integer check (inventory_count is null or inventory_count >= 0),
  low_stock_threshold    integer,
  requires_shipping      boolean not null default true,
  requires_scheduling    boolean not null default false,
  weight_grams           integer,
  dimensions             jsonb,
  media_ids              uuid[] not null default '{}',
  post_purchase_note     text,
  primary_collection_id  uuid,
  payment_model          text not null default 'one_time' check (payment_model in (
                           'one_time', 'subscription', 'deposit', 'quote'
                         )),
  subscription_interval  text check (subscription_interval is null or subscription_interval in ('week', 'month', 'year')),
  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  published_at           timestamptz,
  deleted_at             timestamptz
);

create unique index listings_tenant_slug_unique
  on listings (tenant_id, lower(slug))
  where deleted_at is null;

create index listings_tenant_status_idx on listings (tenant_id, status) where deleted_at is null;
create index listings_tenant_type_idx on listings (tenant_id, listing_type) where deleted_at is null;
create index listings_tenant_published_idx on listings (tenant_id, published_at desc)
  where status = 'active' and deleted_at is null;
```

### 10.2 Column-by-column

- **`id`**, **`tenant_id`** — standard. Cascade delete with tenant.
- **`listing_type`** — what kind of thing this is. `product` ships, `digital_product` downloads, `service` is labor with optional scheduling, `class` is group instruction with a date, `event` is a one-time gathering, `appointment` is a scheduled one-on-one slot. New types can be added without migration by widening the check constraint.
- **`slug`** — URL path component, unique per tenant case-insensitive. Lives at `[shop].bohdiai.com/listings/[slug]`.
- **`name`** — the display name shown everywhere.
- **`short_description`** — single-line summary for cards, search results, social previews.
- **`description`** — full description, markdown. The maker writes this or the AI generates from photos plus niche prompts.
- **`base_price_cents`** — the listing's base price in cents. Variants (see §11) may override per-SKU. For `quote` payment_model this is a starting-from price.
- **`currency`** — ISO code. Defaults from tenant.
- **`status`** — `draft` not visible, `active` live and orderable, `sold_out` visible but not orderable, `archived` not visible but preserved, `unavailable` temporarily off (maker is on vacation).
- **`inventory_tracked`** — does this listing track stock at all. False for unlimited digital products, true for handmade items.
- **`inventory_count`** — current count when tracked. Null when not tracked. Cart adds and order completions decrement.
- **`low_stock_threshold`** — surfaces a warning to the maker when inventory drops to this level.
- **`requires_shipping`** — true for physical products, false for digital/service/appointment. Drives checkout flow (shipping address required vs not).
- **`requires_scheduling`** — true for service/class/event/appointment. Drives whether the checkout includes a time-slot picker (when we ship the scheduling feature).
- **`weight_grams`**, **`dimensions`** — for shipping calculation. Dimensions as JSONB with length/width/height to keep the shape flexible.
- **`media_ids`** — ordered array of UUIDs referencing uploads/media (covered later). Array index = display position.
- **`post_purchase_note`** — optional note included in the order confirmation email per Master Spec §8.
- **`primary_collection_id`** — optional FK to a collection used for breadcrumb/canonical-URL purposes. A listing can be in many collections (see §12); this picks the canonical one. Not a hard FK because deleting a collection shouldn't break the listing — set null on collection deletion via the join-table cleanup.
- **`payment_model`** — how the customer pays. `one_time` is standard. `subscription` is recurring (per D3, subscription is a payment model not a listing type — a baker's monthly recipe is a `digital_product` with `payment_model=subscription`). `deposit` collects partial payment now and the rest later. `quote` is "contact for pricing" with no immediate checkout.
- **`subscription_interval`** — required when payment_model is subscription. Week, month, or year.
- **`metadata`** — JSONB catch-all for listing-type-specific extras (event date, class capacity, service duration, digital file URL). Validated against type-specific schemas in application code. JSONB so adding a new field for a new listing type doesn't require migration.
- **`published_at`** — first time status flipped to active. Drives "new arrivals" sort.
- **`deleted_at`** — soft delete. Order history must survive listing deletion.

### 10.3 Why these choices

**One table, many listing types.** Cart, checkout, orders, reviews, collections all work the same way whether the line item is a candle or a tattoo session. Splitting into separate tables (products / services / events) would duplicate 80% of the schema and force every cross-cutting query to UNION across multiple tables. Type-specific behavior lives in nullable columns and the metadata JSONB, which is the standard pattern for polymorphic catalogs.

**`payment_model` separate from `listing_type`.** Per D3, subscription is not a type — it's a payment model that can apply to any listing. Splitting these means a baker's monthly recipe and a one-time candle can both be `product` listings with different payment models.

**`metadata` JSONB for type-specific extras.** A class has capacity and a date. An appointment has duration and buffer time. A digital product has a file URL. Putting all of these as columns would mean 80% null rows. JSONB keeps the table narrow and lets each type define its own metadata shape via application-side validators.

**Media as array of UUIDs.** Order matters and re-ordering is common; arrays preserve order trivially. A separate `listing_media` table would be needed if we want per-image captions or alt-text edits independent of the media file — flagging that as a possible future split if needed. For now, captions and alt-text live on the media row itself in uploads.

**Soft delete with order-history preservation.** Orders snapshot the listing name/description at order time (see §14), so a deleted listing's orders still display correctly. The soft delete keeps the listing row available for refund processing and analytics.

**Inventory as a column, not a separate stock table.** Considered a stock-movements table for audit. Decided overkill at launch — the listing row's `inventory_count` plus order_items' record of what sold reconstructs the history. If we ever need true stock-movement audit (returns, adjustments, transfers), we add a `stock_movements` table later additively.

### 10.4 Row-level security

A tenant's admin reads and writes their own listings. Anonymous storefront visitors read `status = 'active'` listings for the tenant whose storefront they're visiting. Customers (logged-in tenant_members with role=customer) read the same set as visitors.

### 10.5 What's NOT in this table

- **Variants/SKUs.** Live in the variants tables (§11). A listing with options is the listing row plus variant rows for each orderable combination.
- **Per-image captions/alt-text.** Live on the media row in uploads. The listing references media by id.
- **Collection memberships.** Live in the join table (§12). The `primary_collection_id` is a convenience pointer, not the source of truth.
- **Reviews.** Separate table (§15) joined by listing_id.
- **Pricing history / sale prices.** Promos and sales live in a separate promos table (post-launch per D9). A listing's `base_price_cents` is its current price.

---

## 11. Variations

Per D4, sellers define their own variations per listing — open vocabulary, not pre-built per-niche fields. A candle might have scent + size + wax type. A tattoo session might have size + style + color. A class might have date + skill level. Whatever the seller needs.

Three tables. The first defines the attributes a listing has (scent, size, wax). The second defines the options within each attribute (vanilla, lavender, sandalwood). The third defines the orderable combinations — the SKUs — each with their own price, inventory, and media. Same pattern Shopify uses.

A listing with no variations has zero rows in any of these — it's just the base listing row.

### 11.1 Table definitions

```sql
create table variation_attributes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  listing_id    uuid not null references listings(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index variation_attributes_listing_name_unique
  on variation_attributes (listing_id, lower(name));

create index variation_attributes_listing_position_idx
  on variation_attributes (listing_id, position);

create table variation_options (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  attribute_id  uuid not null references variation_attributes(id) on delete cascade,
  value         text not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index variation_options_attribute_value_unique
  on variation_options (attribute_id, lower(value));

create index variation_options_attribute_position_idx
  on variation_options (attribute_id, position);

create table listing_variants (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  listing_id          uuid not null references listings(id) on delete cascade,
  sku                 text,
  option_combination  jsonb not null,
  price_cents         integer check (price_cents is null or price_cents >= 0),
  inventory_count     integer check (inventory_count is null or inventory_count >= 0),
  media_ids           uuid[] not null default '{}',
  status              text not null default 'active' check (status in ('active', 'sold_out', 'archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint listing_variants_combination_is_object check (jsonb_typeof(option_combination) = 'object')
);

create unique index listing_variants_combination_unique
  on listing_variants (listing_id, option_combination);

create unique index listing_variants_sku_unique
  on listing_variants (tenant_id, lower(sku))
  where sku is not null;

create index listing_variants_listing_status_idx on listing_variants (listing_id, status);
```

### 11.2 Column-by-column

**variation_attributes** — one row per attribute defined on a listing.

- **`name`** — the attribute name like `scent`, `size`, `wax_type`. Lowercase enforced for uniqueness; display can capitalize.
- **`position`** — display order. Determines which attribute shows first in the variant picker.

**variation_options** — one row per option value within an attribute.

- **`value`** — the option value like `vanilla`, `16oz`, `soy`. Unique within its attribute.
- **`position`** — display order within the attribute's option list.

**listing_variants** — one row per orderable SKU combination.

- **`sku`** — optional human-friendly SKU like `CANDLE-LAV-16-SOY`. Unique per tenant when populated.
- **`option_combination`** — JSONB object like `{scent: 'lavender', size: '16oz', wax_type: 'soy'}`. Unique per listing — no two variants of the same listing can have the same option combination.
- **`price_cents`** — overrides the listing's base_price when set. Null means "inherit base price."
- **`inventory_count`** — null means "inherit listing inventory" (or "not tracked"). Most listings with variants track inventory per variant; some don't (e.g., a digital product with a "size" variant that's just a file format).
- **`media_ids`** — optional variant-specific images (the lavender candle photo). Falls back to listing media when empty.
- **`status`** — `active` is orderable, `sold_out` is visible-but-not-orderable, `archived` is hidden.

### 11.3 Why these choices

**Three tables, not one.** The attribute-options-variants split is the standard pattern (Shopify, WooCommerce, BigCommerce all use this shape). The reason: attributes and options describe the picker UI ("show me a scent dropdown with these values"), while variants describe the orderable SKUs ("the lavender-16oz-soy combination costs $24 and has 5 in stock"). They're related but separate concerns. Collapsing them into one table forces JSON gymnastics that get ugly fast.

**`option_combination` as JSONB rather than join rows.** A variant could be modeled as a join table linking it to specific option ids. JSONB is simpler and faster to read (one row per variant gives you the full combination), at the cost of the database not enforcing that the values match actual option rows. The application layer validates on write. Trade is worth it because variants are read constantly (every product page render, every cart calculation) and writes are rare (only when the seller edits the listing).

**Unique constraint on `option_combination` per listing.** No two SKUs can have the same combination. Prevents the bug where a seller accidentally creates two "lavender-16oz-soy" variants and the cart shows both.

**Per-variant inventory and price as nullable.** Most variants override; a few inherit from the listing. Null-means-inherit keeps the data lean and the inheritance model explicit.

**Cascade delete from listing.** Deleting (hard-deleting) a listing wipes its variations cleanly. Soft-deleting a listing leaves variants intact for order history reference.

**No `variant_combinations` audit table.** Considered storing "this variant combination was created on X date." Decided overkill — editor_history captures the create/update event with before/after state.

### 11.4 Row-level security

Same as listings — tenant admins read/write their own, anonymous storefront visitors read active variants of active listings.

### 11.5 What's NOT in this table

- **Bundle pricing** ("buy 3 candles, save $5"). Per D4 we noted this is likely needed — lives in a separate bundles table when we get to promos.
- **Per-variant shipping weight overrides.** Could be added; for now variants inherit listing shipping data. Add a `weight_grams_override` column if needed.
- **Variant-level descriptions.** A variant's description is implied by its option combination. If a specific SKU needs prose ("this lavender batch was hand-poured October 2026"), that's a `description` column we add then.

---

## 12. Collections

How a tenant organizes their listings. A baker's "Birthday Cakes" and "Wedding Cakes" collections. A maker's "Holiday 2026" and "Everyday Items" collections. A plumber's "Emergency Services" and "Scheduled Maintenance" collections.

A listing can belong to many collections; a collection holds many listings. Many-to-many via a join table.

### 12.1 Table definitions

```sql
create table collections (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  slug                text not null,
  name                text not null,
  description         text,
  featured_image_id   uuid,
  is_featured         boolean not null default false,
  position            integer not null default 0,
  status              text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create unique index collections_tenant_slug_unique
  on collections (tenant_id, lower(slug))
  where deleted_at is null;

create index collections_tenant_status_idx on collections (tenant_id, status) where deleted_at is null;
create index collections_tenant_featured_idx on collections (tenant_id, is_featured, position)
  where deleted_at is null and status = 'active';

create table listing_collections (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  listing_id      uuid not null references listings(id) on delete cascade,
  collection_id   uuid not null references collections(id) on delete cascade,
  position        integer not null default 0,
  created_at      timestamptz not null default now()
);

create unique index listing_collections_unique
  on listing_collections (listing_id, collection_id);

create index listing_collections_collection_position_idx
  on listing_collections (collection_id, position);

create index listing_collections_listing_idx on listing_collections (listing_id);
```

### 12.2 Column-by-column

**collections** — one row per collection.

- **`slug`** — URL path, unique per tenant case-insensitive. Lives at `[shop].bohdiai.com/collections/[slug]`.
- **`name`** — display name.
- **`description`** — optional copy shown on the collection page.
- **`featured_image_id`** — uuid of a media row used as the collection's hero image. Soft FK (no DB constraint) so deleting media doesn't break the collection — application handles the missing-image case.
- **`is_featured`** — surfaces this collection on the storefront homepage (block-permitting).
- **`position`** — display order in nav and pickers.
- **`status`** — draft/active/archived. Archived collections aren't listed but still resolve at their URL for inbound links.
- **`deleted_at`** — soft delete.

**listing_collections** — many-to-many join with position.

- **`position`** — order within the collection. Different from listing's position elsewhere; each collection has its own order.

### 12.3 Why these choices

**Many-to-many join with position.** A listing in multiple collections (a holiday candle in both "Holiday 2026" and "Candles") needs different positions in each, so position lives on the join row, not on the listing.

**`tenant_id` denormalized on the join.** Every RLS check starts with tenant_id; storing it directly avoids joining through listing or collection. Same denormalization pattern as page_blocks.

**Soft delete on collections, hard delete cascade on join rows.** A deleted collection should leave listings intact (they may still be in other collections, or just standalone). The join rows for the deleted collection are gone via cascade, which is fine — they're a relationship, not data of their own.

**No "auto-collection" rules** ("everything tagged X belongs in this collection"). Considered for later. Manual membership is simpler and matches how Etsy/Shopify shops operate at this scale.

### 12.4 Row-level security

Tenant admins read/write their own collections. Anonymous storefront visitors read active collections and their join rows.

### 12.5 What's NOT in this table

- **Smart/dynamic collections** (auto-populated by tag rules). Future feature, separate table when needed.
- **Nested collections** (parent_collection_id for category hierarchies). Not at launch. If needed, add a self-referential FK additively.
- **Collection-specific design.** Collections render with the tenant's design tokens; no per-collection theming.

---

## 13. Customer profiles

Extra data for tenant_members with role='customer'. A row per (tenant, customer) pair — the same person shopping at three different BohdiAI stores has three customer_profile rows, one per store. This keeps each tenant's customer base cleanly isolated.

Three tables in this section: the profile itself, saved addresses, and wishlist items.

### 13.1 Table definitions

```sql
create table customer_profiles (
  id                   uuid primary key default gen_random_uuid(),
  tenant_member_id     uuid not null references tenant_members(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  display_name         text,
  phone                text,
  marketing_opt_in     boolean not null default false,
  notes_for_maker      text,
  total_orders         integer not null default 0,
  total_spent_cents    bigint not null default 0,
  first_order_at       timestamptz,
  last_order_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index customer_profiles_tenant_member_unique
  on customer_profiles (tenant_member_id);

create index customer_profiles_tenant_idx on customer_profiles (tenant_id);
create index customer_profiles_tenant_recent_idx on customer_profiles (tenant_id, last_order_at desc nulls last);

create table customer_addresses (
  id                    uuid primary key default gen_random_uuid(),
  customer_profile_id   uuid not null references customer_profiles(id) on delete cascade,
  tenant_id             uuid not null references tenants(id) on delete cascade,
  label                 text,
  recipient_name        text not null,
  line1                 text not null,
  line2                 text,
  city                  text not null,
  state                 text,
  postal_code           text not null,
  country               text not null default 'US',
  phone                 text,
  is_default_shipping   boolean not null default false,
  is_default_billing    boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create index customer_addresses_profile_idx on customer_addresses (customer_profile_id)
  where deleted_at is null;

create unique index customer_addresses_default_shipping_unique
  on customer_addresses (customer_profile_id)
  where is_default_shipping = true and deleted_at is null;

create unique index customer_addresses_default_billing_unique
  on customer_addresses (customer_profile_id)
  where is_default_billing = true and deleted_at is null;

create table wishlist_items (
  id                    uuid primary key default gen_random_uuid(),
  customer_profile_id   uuid not null references customer_profiles(id) on delete cascade,
  tenant_id             uuid not null references tenants(id) on delete cascade,
  listing_id            uuid not null references listings(id) on delete cascade,
  created_at            timestamptz not null default now()
);

create unique index wishlist_items_unique on wishlist_items (customer_profile_id, listing_id);
create index wishlist_items_listing_idx on wishlist_items (listing_id);
```

### 13.2 Column highlights

**customer_profiles** — one row per (tenant, customer).

- **`tenant_member_id`** unique — exactly one profile per membership. The membership in tenant_members is the source of truth for "is this person a customer of this tenant"; the profile is the extra data.
- **`user_id`** and **`tenant_id`** denormalized from tenant_members for RLS and query efficiency.
- **`notes_for_maker`** — the maker's own private notes about this customer. Not customer-visible.
- **`total_orders`**, **`total_spent_cents`**, **`first_order_at`**, **`last_order_at`** — cached aggregates updated by an order-completion trigger or job. Avoids aggregating orders on every profile view.

**customer_addresses** — saved shipping/billing addresses per customer.

- **`recipient_name`** separate from the customer's display name because gifts ship to other people.
- **`is_default_shipping`** / **`is_default_billing`** unique partial indexes enforce "at most one default of each type per customer."
- Soft delete because an address tied to a historical order should remain accessible from the order row.

**wishlist_items** — listings a customer has saved.

- One row per (customer, listing). Unique constraint prevents duplicates.

### 13.3 Why these choices

**Per-tenant customer profiles, not global.** A person who shops at three BohdiAI stores has three profiles, three sets of addresses, three sets of wishlists. The same login (auth.users row) accesses all three, but each tenant sees only the data the customer shared with them. This is the multi-tenant data isolation philosophy — no maker accidentally sees another maker's customer data.

**Cached aggregates on the profile.** A maker's customer list shows "ordered 3 times, $87 lifetime." Computing those on every view from joining orders is wasteful; cache them on the profile and update via trigger/job on order completion. Eventually-consistent is fine here — a 30-second delay between an order completing and the count updating doesn't matter.

**Addresses in their own table.** Customers have multiple saved addresses. Storing them on the profile (single shipping_address column) doesn't fit — they need their own rows with default flags and soft delete.

**Wishlist as a separate table, not an array on the profile.** Wishlists grow and shrink; array operations on a JSONB column are awkward. A join table with one row per item handles add/remove naturally and supports "show me which other customers wishlisted this product" queries cheaply.

**No payment methods stored.** Card details live at Stripe. We never store them. If a customer's dashboard shows "card ending in 4242," we fetch from Stripe on demand.

### 13.4 Row-level security

The customer themselves reads and writes their own profile, addresses, and wishlist for the tenant they're logged into. The tenant's admin reads (but doesn't typically write) all customer profiles for their tenant. No cross-tenant reads ever — even the customer's other-tenant profiles aren't visible from this tenant's context.

### 13.5 What's NOT here

- **Order history.** Lives in orders (§14). Joined by customer_profile_id when displayed.
- **Reviews left by this customer.** Lives in reviews (§15).
- **Stored payment methods.** At Stripe, never here.
- **Activity feed / browse history.** Not at launch. Future analytics table if needed.
- **Tags or segments** (the maker tagging customers "VIP" or "wholesale"). Future feature; add a customer_tags table additively.

---

## 14. Orders, order items, payments, shipments

Commerce. Four tables: orders (the top-level transaction), order_items (the line items), payments (the money movement), shipments and shipment_items (the physical fulfillment).

Orders fire on checkout. Order_items snapshot what was bought at the moment of purchase — name, description, price, post-purchase note — so changing or deleting the listing later doesn't corrupt order history. Payments track the actual money movement, possibly multiple per order (initial payment plus refund, deposit plus balance, etc.). Shipments track physical fulfillment — one shipment per box, supporting multi-shipment orders from day one per D12.

### 14.1 Table definitions

```sql
create table orders (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  order_number           text not null,
  customer_profile_id    uuid references customer_profiles(id) on delete set null,
  customer_email         text not null,
  customer_name          text not null,
  customer_phone         text,
  status                 text not null default 'pending' check (status in (
                           'pending', 'paid', 'fulfilled', 'shipped',
                           'delivered', 'canceled', 'refunded', 'partially_refunded'
                         )),
  subtotal_cents         integer not null check (subtotal_cents >= 0),
  tax_cents              integer not null default 0 check (tax_cents >= 0),
  shipping_cents         integer not null default 0 check (shipping_cents >= 0),
  discount_cents         integer not null default 0 check (discount_cents >= 0),
  total_cents            integer not null check (total_cents >= 0),
  currency               text not null default 'USD',
  shipping_address       jsonb,
  billing_address        jsonb,
  notes_to_customer      text,
  internal_notes         text,
  source                 text not null default 'storefront' check (source in (
                           'storefront', 'market_mode', 'admin_manual', 'imported'
                         )),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  paid_at                timestamptz,
  fulfilled_at           timestamptz,
  canceled_at            timestamptz
);

create unique index orders_tenant_number_unique on orders (tenant_id, order_number);
create index orders_tenant_status_idx on orders (tenant_id, status);
create index orders_tenant_created_idx on orders (tenant_id, created_at desc);
create index orders_customer_idx on orders (customer_profile_id) where customer_profile_id is not null;

create table order_items (
  id                              uuid primary key default gen_random_uuid(),
  order_id                        uuid not null references orders(id) on delete cascade,
  tenant_id                       uuid not null references tenants(id) on delete cascade,
  listing_id                      uuid references listings(id) on delete set null,
  listing_variant_id              uuid references listing_variants(id) on delete set null,
  name_snapshot                   text not null,
  variant_description_snapshot    text,
  unit_price_cents                integer not null check (unit_price_cents >= 0),
  quantity                        integer not null check (quantity > 0),
  subtotal_cents                  integer not null check (subtotal_cents >= 0),
  post_purchase_note_snapshot     text,
  metadata                        jsonb not null default '{}'::jsonb,
  created_at                      timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);
create index order_items_listing_idx on order_items (listing_id) where listing_id is not null;

create table payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references orders(id) on delete cascade,
  tenant_id                uuid not null references tenants(id) on delete cascade,
  processor                text not null check (processor in ('stripe', 'square', 'manual')),
  external_payment_id      text,
  payment_type             text not null check (payment_type in ('charge', 'refund', 'partial_refund')),
  status                   text not null check (status in ('pending', 'succeeded', 'failed')),
  amount_cents             integer not null,
  currency                 text not null default 'USD',
  payment_method_type      text,
  failure_reason           text,
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  processed_at             timestamptz
);

create index payments_order_idx on payments (order_id);
create unique index payments_external_id_unique
  on payments (processor, external_payment_id)
  where external_payment_id is not null;

create table shipments (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  order_id                 uuid not null references orders(id) on delete cascade,
  shipment_number          integer not null,
  carrier                  text,
  shipping_method          text,
  tracking_number          text,
  tracking_url             text,
  status                   text not null default 'pending' check (status in (
                             'pending', 'label_purchased', 'shipped',
                             'in_transit', 'delivered', 'returned', 'lost'
                           )),
  shipped_at               timestamptz,
  estimated_delivery_at    timestamptz,
  delivered_at             timestamptz,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index shipments_order_number_unique
  on shipments (order_id, shipment_number);

create index shipments_tenant_status_idx on shipments (tenant_id, status);
create index shipments_order_idx on shipments (order_id);
create index shipments_tracking_idx on shipments (lower(tracking_number))
  where tracking_number is not null;

create table shipment_items (
  id              uuid primary key default gen_random_uuid(),
  shipment_id     uuid not null references shipments(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  order_item_id   uuid not null references order_items(id) on delete cascade,
  quantity        integer not null check (quantity > 0),
  created_at      timestamptz not null default now()
);

create unique index shipment_items_unique
  on shipment_items (shipment_id, order_item_id);

create index shipment_items_order_item_idx on shipment_items (order_item_id);
```

### 14.2 Column highlights

**orders** — the top-level transaction.

- **`order_number`** — human-readable like `BS-1042`. Unique per tenant. Generated by a sequence or counter, surfaced everywhere customer-facing instead of the UUID.
- **`customer_profile_id`** nullable — supports guest checkout where the buyer didn't create an account. Email and name still captured directly on the order row.
- **`status`** — full lifecycle from pending to delivered or canceled. Refunds flip to `refunded` or `partially_refunded`. `shipped` and `delivered` are aggregate states derived from shipment rows (when the first shipment ships, order goes to shipped; when all shipments deliver, order goes to delivered) — the application or a trigger keeps this in sync.
- **Money columns in cents** — subtotal, tax, shipping, discount, total. Integer math avoids floating-point currency bugs.
- **`shipping_address` / `billing_address` as JSONB snapshots.** The customer's address book lives in customer_addresses, but the order captures the address as a snapshot at purchase time. A customer who edits or deletes their address later doesn't break old orders.
- **`source`** — where the order came from. `storefront` is the normal cart flow. `market_mode` is the in-person "log a sale" from Master Spec §9. `admin_manual` is the maker creating an order by hand. `imported` is from a migration tool (Phase 2 per Master Spec §14).
- **Timestamp lifecycle columns** — paid_at, fulfilled_at, canceled_at. Shipment timestamps live on the shipments table, not here.

**order_items** — line items, snapshotted.

- **`listing_id`** / **`listing_variant_id`** — both nullable with set-null on delete. Even if the original listing is hard-deleted years later, the order still has the snapshot fields.
- **`name_snapshot`**, **`variant_description_snapshot`**, **`unit_price_cents`**, **`post_purchase_note_snapshot`** — captured at purchase. Order history is honest even after the listing changes.
- **`metadata`** JSONB — type-specific extras like "appointment_time: 2026-07-12T14:00:00Z" or "digital_file_url: ...". Same pattern as listings.

**payments** — money movements per order.

- **`processor`** — stripe, square, or manual (the maker recording an offline payment).
- **`external_payment_id`** — Stripe payment intent ID, Square payment ID. Unique per processor so webhooks can look up by it.
- **`payment_type`** — `charge` is normal, `refund` is full, `partial_refund` is partial. Multiple payment rows per order = full payment history.
- **`amount_cents`** — positive for charges, negative for refunds. Sum of payment rows = net paid.

**shipments** — physical fulfillment per order. One row per box.

- **`shipment_number`** — 1 for the first shipment of an order, 2 for the second, etc. Unique per order. Lets us refer to "shipment 2 of order BS-1042" in customer-facing copy.
- **`carrier`** — USPS, UPS, FedEx, etc. Free text; we don't constrain carriers.
- **`shipping_method`** — service level: "Priority Mail," "Ground," "Express." Free text.
- **`tracking_number`** / **`tracking_url`** — the carrier-issued tracking info.
- **`status`** — pending (no label yet) → label_purchased (when we ship label generation) → shipped → in_transit → delivered. Returned and lost are exception states.
- **`shipped_at`**, **`estimated_delivery_at`**, **`delivered_at`** — timestamps along the lifecycle.
- **`notes`** — maker-side notes on this specific shipment ("included a thank-you card").

**shipment_items** — which order_items are in which shipment, with quantity split.

- **`order_item_id`** — the line item being shipped.
- **`quantity`** — how many of that line item are in this shipment. If an order has "10 candles" split into two boxes of 6 and 4, two shipment_items rows track that split.
- **Unique on `(shipment_id, order_item_id)`** — a single order_item appears at most once per shipment. Multiple boxes for the same item create multiple shipment rows with one shipment_items row each.

### 14.3 Why these choices

**Snapshots on order_items.** Listings change. Sellers rename, re-price, edit descriptions, delete. An order from six months ago must still display what was actually purchased at the time. The snapshot fields are the source of truth for the order; the listing_id is a reference for "if the listing still exists, link to it."

**Guest checkout supported via nullable customer_profile_id.** Lowering signup friction at checkout matters for conversion. The customer's email and name still land on the order row directly. If the same email later creates an account, we can backfill the customer_profile_id.

**Order_number separate from id.** UUIDs are unguessable but ugly. Customers want to reference "order BS-1042" not "9f8c2e7a-..." Order numbers are per-tenant sequences (BS-1042 for Bohdi Store, JS-1042 for June's Sourdough — no collision possible because of the tenant scope).

**Address snapshots as JSONB, not FK to customer_addresses.** Customers edit and delete addresses over time. The order needs the address as it was when the order shipped, frozen in place. JSONB snapshot solves this cleanly. Same pattern Shopify uses.

**Multiple payments per order.** A $200 order with a $50 refund is two payment rows: +200 charge, -50 refund. Sum of payment rows = net paid. Cleaner than mutating a single payment row, supports complex scenarios (deposit + balance, refund + new charge for an exchange).

**No `total_paid_cents` cached on orders.** Considered. Decided derivable from payments rows is fine — the materialized aggregate would just be one more thing to keep in sync.

**Hard cascade from orders to order_items, payments, and shipments.** If an order is fully deleted (rare; usually we cancel/refund rather than delete), all child rows go with it. Soft delete on orders would be added if a use case appears.

**Shipments as their own table, not columns on orders (per D12).** An order can ship in multiple boxes — three of the five items go out Monday, the other two on Friday. One tracking-number column on the order can't represent that. Splitting fulfillment into its own table means every order at launch has exactly one shipment row (simple case works fine), and multi-shipment is a no-migration upgrade when a maker needs it. The alternative would have been keeping tracking columns on orders and adding shipments later, which would have created a dual-source-of-truth period — some orders tracked via columns, some via shipments. Doing it now avoids that.

### 14.4 Row-level security

Tenant admins read/write all orders for their tenant. Customers read their own orders (matched via customer_profile_id or customer_email for guest-converted accounts). Anonymous visitors don't read orders. Writes are service-role triggered by the checkout API and webhooks.

### 14.5 What's NOT here

- **Cart state.** Carts live in a separate `carts` / `cart_items` table (or in browser storage for anonymous carts). Orders are created at checkout from cart content. Drafting carts in a later batch.
- **Shipping label generation.** Future feature per Master Spec §17 phasing. The shipments table has fields ready (`carrier`, `shipping_method`, `tracking_number`, `tracking_url`); at launch the maker pastes a tracking number into a shipment by hand. Label generation populates them automatically when we ship that.
- **Tax calculations.** Stripe Tax automation is Phase 2 per Master Spec §7. The `tax_cents` column accepts whatever the checkout calculated; at launch that's zero or a simple flat-rate calculation.
- **Refund reasons / dispute state.** Captured in `metadata` JSONB on the payment row for now. If we need structured refund/dispute tracking, separate tables.
- **Order notes from the customer at checkout** ("please leave at the back door"). Add a `customer_note_at_checkout` column when the feature ships, or stash in metadata.
- **Returns and RMAs.** Future feature; separate `return_authorizations` and `return_items` tables when shipped. Shipments table has a `returned` status for when a shipment comes back.

---

## 15. Carts

Pre-checkout state. A cart is a collection of items a visitor wants to buy before they pay. Two flavors — anonymous (no account, keyed by a browser session token) and authenticated (tied to a customer_profile). When an anonymous visitor logs in, their cart merges into their authenticated cart.

Server-side persistence rather than browser-only because cross-device continuity is a real expectation ("I added stuff on my phone, where is it on my laptop") and cart abandonment recovery (email "you left this behind") needs server state. Foundation-first applies — when we ship the abandonment email later, no schema change.

### 15.1 Table definitions

```sql
create table carts (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  customer_profile_id      uuid references customer_profiles(id) on delete cascade,
  session_token            text,
  status                   text not null default 'active' check (status in (
                             'active', 'converted', 'abandoned', 'expired'
                           )),
  currency                 text not null default 'USD',
  applied_promo_id         uuid,
  applied_gift_card_id     uuid,
  notes_from_customer      text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  expires_at               timestamptz,
  converted_at             timestamptz,
  converted_order_id       uuid references orders(id) on delete set null,
  constraint carts_customer_or_session_check
    check (customer_profile_id is not null or session_token is not null)
);

create unique index carts_active_customer_unique
  on carts (customer_profile_id)
  where status = 'active' and customer_profile_id is not null;

create unique index carts_active_session_unique
  on carts (session_token)
  where status = 'active' and session_token is not null;

create index carts_tenant_status_idx on carts (tenant_id, status);
create index carts_abandoned_idx on carts (tenant_id, updated_at)
  where status = 'abandoned';

create table cart_items (
  id                   uuid primary key default gen_random_uuid(),
  cart_id              uuid not null references carts(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  listing_id           uuid not null references listings(id) on delete cascade,
  listing_variant_id   uuid references listing_variants(id) on delete cascade,
  quantity             integer not null check (quantity > 0),
  added_at             timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index cart_items_unique
  on cart_items (cart_id, listing_id, listing_variant_id);

create index cart_items_cart_idx on cart_items (cart_id);
```

### 15.2 Column highlights

**carts**

- **`customer_profile_id`** OR **`session_token`** — exactly one identifies the cart owner. Constraint enforces at least one is set. Anonymous carts get a session token (cryptographically random, stored in a cookie). Authenticated carts get the customer_profile_id.
- **`status`** — `active` is the working cart, `converted` means it became an order, `abandoned` means the customer left without checking out and we're tracking for re-engagement, `expired` means we cleaned it up.
- **`applied_promo_id`** / **`applied_gift_card_id`** — soft references (no DB FK) to a promo or gift card the customer applied. Soft FK because applying a then-deleted promo doesn't break the cart; application handles missing.
- **`expires_at`** — anonymous carts expire after some window (30 days default). Authenticated carts may never expire.
- **`converted_order_id`** — set when the cart becomes an order. Lets us audit the conversion path and prevents double-checkout.
- **Unique partial indexes on `(customer_profile_id, status='active')` and `(session_token, status='active')`** — exactly one active cart per customer or per session.

**cart_items**

- **`quantity`** — must be > 0. Removing an item deletes the row rather than setting quantity to 0.
- **Unique on `(cart_id, listing_id, listing_variant_id)`** — adding the same product twice increments quantity on the existing row, doesn't create a duplicate.
- **Cascade delete from cart** — emptying a cart, deleting a cart, or converting a cart all cascade cleanly.

### 15.3 Why these choices

**Server-side persistence over browser-only.** Browser-only carts (localStorage) are simpler but break cross-device and prevent cart abandonment emails. Server-side carts cost one row per cart plus rows per item — trivial volume — and unlock both features. Foundation-first call.

**Merge on login.** When an anonymous visitor with a cart logs into an account that also has a cart, the items merge into a single authenticated cart. Handled in application code on login; nothing in the schema enforces the merge.

**No price snapshots on cart items.** Carts reflect live current prices — when the seller changes a price, every cart sees the new price immediately. Snapshotting would cause confusing "your cart price changed at checkout" experiences. Order_items snapshot at checkout time; carts don't.

**Cart applies promo and gift card by reference, not by computed totals.** The cart doesn't store "$15 discount applied." It stores "promo X applied" and the application recomputes on every read. Avoids stale totals.

**Soft expiration via status, not deletion.** Abandoned carts stay around as `abandoned` status for analytics and abandonment recovery. Old carts past abandonment window flip to `expired`. Hard cleanup happens on a long timeline (90+ days) via maintenance job.

### 15.4 Row-level security

A customer reads and writes their own active cart (matched by customer_profile_id when logged in, or by session_token when anonymous). Tenant admins read their tenant's carts for analytics. Storefront API endpoints handle all writes server-side after auth/session validation.

### 15.5 What's NOT here

- **Cart price calculations.** Computed at read time from cart_items joined to listings/variants, plus promo/gift-card application. No cached totals on the cart row.
- **Saved-for-later items.** Distinct from cart — those are wishlist items (§13).
- **Cart abandonment emails.** Schedule and content live in the future marketing-campaigns tables. This table just tracks the cart state that drives them.
- **Multi-currency cart totals.** A cart is one currency per tenant at launch.

---

## 16. Reviews

Customer-left reviews tied to a specific purchase. Per D9, distinct from seller-curated testimonials (which would be a separate testimonials table later if we add them). Every review is verified by an order — no random anonymous reviews.

### 16.1 Table definition

```sql
create table reviews (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  listing_id              uuid not null references listings(id) on delete cascade,
  order_id                uuid not null references orders(id) on delete cascade,
  order_item_id           uuid not null references order_items(id) on delete cascade,
  customer_profile_id     uuid references customer_profiles(id) on delete set null,
  reviewer_name_snapshot  text not null,
  rating                  integer not null check (rating between 1 and 5),
  title                   text,
  body                    text,
  media_ids               uuid[] not null default '{}',
  status                  text not null default 'published' check (status in (
                            'pending', 'published', 'hidden', 'flagged', 'removed'
                          )),
  maker_response          text,
  maker_responded_at      timestamptz,
  helpful_count           integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index reviews_one_per_order_item
  on reviews (order_item_id);

create index reviews_listing_status_idx on reviews (listing_id, status, created_at desc);
create index reviews_tenant_status_idx on reviews (tenant_id, status);
create index reviews_customer_idx on reviews (customer_profile_id) where customer_profile_id is not null;
```

### 16.2 Column highlights

- **`order_item_id`** unique — at most one review per purchased item. Buying the same listing twice in two separate orders means two reviewable items, two possible reviews. Buying a listing once means one possible review.
- **`customer_profile_id`** nullable with set-null on delete — preserves the review when the customer account is gone (set-null + name_snapshot keeps the review viewable as "by Sarah J." instead of disappearing).
- **`reviewer_name_snapshot`** — the customer's name at the time of the review. Captured here so account deletion or name change doesn't alter the review attribution.
- **`rating`** — 1 to 5 integer.
- **`media_ids`** — optional photos the customer attached.
- **`status`** — `pending` if the tenant requires moderation, `published` is live, `hidden` is removed by the maker, `flagged` is auto-flagged for review, `removed` is admin-removed.
- **`maker_response`** / **`maker_responded_at`** — the maker can respond once per review. Edit allowed.
- **`helpful_count`** — other customers marking the review helpful. Update via separate table or trigger when we ship that feature; column is here for foundation.

### 16.3 Why these choices

**Verified purchase required.** Every review must link to an order_item the customer actually bought. No fake reviews, no competitor sabotage, no anonymous opinions. This is the simplest defense and it works.

**One review per order_item.** A customer who buys the same product twice gets to review each purchase separately — they're potentially reviewing different experiences (different batch, different shipping). A customer who buys it once gets one review.

**Customer name snapshotted.** Same reasoning as order_items snapshotting listing data — accounts change, reviews shouldn't.

**`status` defaults to published.** Most tenants don't moderate. Tenants who do can configure their default to `pending` (when we ship a moderation setting) and approve via the dashboard.

**No reply chain.** Maker replies once, reviewer doesn't reply back. Keeps the review section from becoming a comment thread. If we ever want threaded replies, separate `review_comments` table.

### 16.4 Row-level security

Anonymous storefront visitors and customers read `status = 'published'` reviews. The customer who wrote a review reads it regardless of status. Tenant admins read all reviews for their tenant. Writes: customer writes their own review; tenant admin writes the maker_response on reviews of their listings; admin can also flip status. Writes go through server-side endpoints.

### 16.5 What's NOT here

- **Seller-curated testimonials.** A separate `testimonials` table if we add that feature — those don't require a verified purchase.
- **Helpful votes tracking.** The `helpful_count` is cached; a separate `review_helpful_votes` table tracks which customer voted helpful on which review to prevent double-voting. Add when we ship that interaction.
- **Reply threads.** Maker responds once; no further threading.
- **Aggregate ratings.** Average rating per listing is computed on demand or cached on the listing row via trigger. Not stored here.

---

## 17. Gift cards

Stored-value instruments. A customer buys a gift card (creates an issued gift_cards row), and someone redeems the code against future orders. Two tables — the issued gift card and its transaction history.

A gift card is purchased like any other listing. The listings table gains a `gift_card` type (additive change to the existing check constraint). When an order containing a gift_card listing is paid, an order-completion handler issues the gift card and emails the recipient.

### 17.1 Table definitions

```sql
create table gift_cards (
  id                            uuid primary key default gen_random_uuid(),
  tenant_id                     uuid not null references tenants(id) on delete cascade,
  code                          text not null,
  initial_value_cents           integer not null check (initial_value_cents > 0),
  current_balance_cents         integer not null check (current_balance_cents >= 0),
  currency                      text not null default 'USD',
  purchased_by_profile_id       uuid references customer_profiles(id) on delete set null,
  purchased_by_order_id         uuid references orders(id) on delete set null,
  recipient_email               text,
  recipient_name                text,
  sender_name                   text,
  message                       text,
  delivery_status               text not null default 'pending' check (delivery_status in (
                                  'pending', 'scheduled', 'delivered', 'failed'
                                )),
  scheduled_delivery_at         timestamptz,
  delivered_at                  timestamptz,
  status                        text not null default 'active' check (status in (
                                  'active', 'depleted', 'expired', 'canceled'
                                )),
  expires_at                    timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create unique index gift_cards_tenant_code_unique
  on gift_cards (tenant_id, code);

create index gift_cards_tenant_status_idx on gift_cards (tenant_id, status);
create index gift_cards_recipient_email_idx on gift_cards (lower(recipient_email))
  where recipient_email is not null;

create table gift_card_transactions (
  id                        uuid primary key default gen_random_uuid(),
  gift_card_id              uuid not null references gift_cards(id) on delete cascade,
  tenant_id                 uuid not null references tenants(id) on delete cascade,
  order_id                  uuid references orders(id) on delete set null,
  transaction_type          text not null check (transaction_type in (
                              'issue', 'redeem', 'refund', 'adjustment', 'expire'
                            )),
  amount_cents              integer not null,
  balance_after_cents       integer not null check (balance_after_cents >= 0),
  note                      text,
  created_at                timestamptz not null default now()
);

create index gift_card_transactions_card_idx
  on gift_card_transactions (gift_card_id, created_at desc);

create index gift_card_transactions_order_idx
  on gift_card_transactions (order_id) where order_id is not null;
```

### 17.2 Column highlights

**gift_cards**

- **`code`** — the redemption code (formatted like `GIFT-XXXX-YYYY-ZZZZ`). Unique per tenant. Generated with enough entropy that brute-force guessing is infeasible.
- **`initial_value_cents`** — face value at issuance. Never changes.
- **`current_balance_cents`** — what's left. Updated by transactions.
- **`purchased_by_profile_id`** / **`purchased_by_order_id`** — who bought it and via which order. Set null on deletion so gift card stays valid even if the buyer's account is gone.
- **`recipient_email`**, **`recipient_name`**, **`sender_name`**, **`message`** — the gift-giving metadata.
- **`delivery_status`** — pending/scheduled/delivered/failed. Scheduled delivery (give a gift card now, deliver next Tuesday) supported via `scheduled_delivery_at`.
- **`status`** — active/depleted (balance hit zero)/expired (past expires_at)/canceled (admin canceled).

**gift_card_transactions**

- **`transaction_type`** — `issue` is the initial load, `redeem` is using it at checkout, `refund` is returning value (when a redeemed order gets refunded), `adjustment` is admin-side, `expire` is auto-zeroing on expiration.
- **`amount_cents`** — positive for issue/refund/adjustment-up, negative for redeem/adjustment-down/expire.
- **`balance_after_cents`** — the card's balance after this transaction. Stored for audit (avoids reconstructing balance from sum-of-transactions).
- **`order_id`** — set for redeem and refund transactions, null otherwise.

### 17.3 Why these choices

**Two tables.** The gift_cards row is the "card as it exists now" (current balance, status, recipient). The transactions table is the audit trail. Mutating balance in place without an audit history would make disputes ("I had $50 left, where did it go") impossible to investigate. Same pattern as bank accounts.

**`balance_after_cents` stored on the transaction.** Could be derived from summing prior transactions but pre-computing is faster and matches how every financial system handles this.

**Code uniqueness scoped to tenant.** Two different stores can both have `GIFT-1234`; within one store codes are unique. Scoping keeps codes shorter while preventing collision.

**Gift card purchase via listings.** A tenant adds a "Gift Card" listing (listing_type=`gift_card`), prices it (or makes it variable-amount via variations), and customers buy it like any other product. Order completion triggers the issuance. Keeps the cart/checkout/orders flow uniform — no special "buy a gift card" path.

**Soft references from gift_card to purchaser.** A gift card outlives the purchaser's account by design (purchaser deletes account, recipient still has a valid card).

### 17.4 Row-level security

Tenant admins read/write all gift cards for their tenant. Recipients can look up a card by code (anonymous balance check endpoint). Customers see their own purchased and redeemed cards in their account dashboard. Writes are service-role triggered by checkout, redemption, and admin actions.

### 17.5 What's NOT here

- **Variable-amount gift cards.** Handled via listing variations — a gift_card listing with size options ($25, $50, $100, $250) is just a listing with a variation attribute.
- **Multi-tenant gift cards** (use at any BohdiAI store). Out of scope — each tenant's gift cards are theirs only.
- **Gift card balance transfers between cards.** Not at launch. If needed, a transaction type `transfer` and a paired entry on the destination card.

**Required change to listings:** the `listing_type` check constraint adds `'gift_card'` to its allowed values. This is an additive change that's applied via the same migration that introduces this table.

---

## 18. Uploads and media

Every file uploaded to or generated by the platform. Product photos, logos, brand assets, page imagery, AI-generated images, customer review photos, gift card designs. One row per file. Other tables reference media by id.

### 18.1 Table definition

```sql
create table uploads (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid references tenants(id) on delete cascade,
  uploaded_by_user_id      uuid references auth.users(id) on delete set null,
  storage_bucket           text not null,
  storage_path             text not null,
  public_url               text,
  file_name                text not null,
  mime_type                text not null,
  size_bytes               bigint not null check (size_bytes >= 0),
  width_px                 integer,
  height_px                integer,
  duration_seconds         numeric,
  alt_text                 text,
  caption                  text,
  source                   text not null check (source in (
                             'user_upload', 'ai_generated', 'imported',
                             'system', 'customer_review'
                           )),
  ai_generation_metadata   jsonb,
  hash_sha256              text,
  status                   text not null default 'active' check (status in (
                             'active', 'processing', 'archived', 'failed'
                           )),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  deleted_at               timestamptz
);

create unique index uploads_storage_path_unique
  on uploads (storage_bucket, storage_path);

create index uploads_tenant_idx on uploads (tenant_id) where deleted_at is null;
create index uploads_tenant_source_idx on uploads (tenant_id, source) where deleted_at is null;
create index uploads_hash_idx on uploads (tenant_id, hash_sha256) where hash_sha256 is not null;
```

### 18.2 Column highlights

- **`tenant_id`** nullable — most uploads are tenant-scoped, but system uploads (default block preview images, platform-wide assets) have no tenant. Cascade delete with tenant when set.
- **`uploaded_by_user_id`** — who triggered the upload. Set null on user deletion.
- **`storage_bucket`** / **`storage_path`** — Supabase Storage location. Unique together.
- **`public_url`** — convenience cache of the public URL. Recomputable from bucket + path; stored to avoid recomputing on every read.
- **`width_px`** / **`height_px`** / **`duration_seconds`** — populated for images and videos respectively. Null for non-media files (PDFs, etc).
- **`alt_text`** — for accessibility. AI-generated by default from the image, editable by the maker.
- **`caption`** — optional display text shown with the image.
- **`source`** — where the file came from. `user_upload` is the maker uploading. `ai_generated` is from the AI image studio. `imported` is from migration. `system` is platform-wide. `customer_review` is a customer attaching a photo to a review.
- **`ai_generation_metadata`** — JSONB capturing prompt, model, settings, cost for AI-generated images. Audit and re-generation use.
- **`hash_sha256`** — content hash, used to deduplicate re-uploads of the same file. Optional — set when the upload pipeline computes it.

### 18.3 Why these choices

**One uploads table, polymorphic references.** Other tables (listings, collections, content_pages, reviews, gift_cards) reference media by id without a back-reference here. Avoids needing a separate `listing_media`, `collection_media`, etc. for every owner type. The trade is that "show me all listings using this image" requires querying the consumers, not the upload itself — fine because that's a rare query.

**`tenant_id` nullable for system assets.** Default block preview images and platform-wide assets don't belong to a tenant. Setting tenant_id to null keeps the table generic.

**Storage path uniqueness.** Prevents two rows pointing at the same file. The upload pipeline uses tenant-id-prefixed paths to avoid collisions across tenants.

**Hash for deduplication.** When a maker uploads the same product photo three times, we want one file in storage, not three. Hash lookup at upload time decides whether to reuse an existing row.

**Soft delete.** Files referenced by historical orders, reviews, or archived listings must remain accessible. Hard deletion happens only after the audit window via maintenance job.

**AI generation metadata as JSONB.** Different generation models produce different metadata shapes. Open-ended schema avoids migration whenever we add a new model or capture additional metadata.

### 18.4 Row-level security

Tenant admins read and write their own uploads. Anonymous storefront visitors read uploads that are referenced by their tenant's public content (joined through the referencing table). Writes happen via signed upload endpoints — the application validates the caller's tenant before granting an upload URL.

### 18.5 What's NOT here

- **Image transformations** (thumbnails, resized variants). Handled by Supabase Storage's image transformation API at read time. Original is stored once.
- **Permanent file deletion.** A maintenance job handles permanent storage cleanup after the soft-delete audit window.
- **Per-tenant storage quotas.** Tier-based limits enforced at the upload endpoint, not at the row level. A separate `tenant_usage` table tracks current storage usage when we ship quotas.

---

## 19. Promos and discounts

Discount codes, automatic promotions, bundle pricing, and sales. Per D4 and D9, these are launch features. Promos are complex by nature — multiple types with different rules — so the schema uses a type discriminator plus JSONB rules to stay flexible.

Two tables — promos themselves and a redemptions table tracking each use.

### 19.1 Table definitions

```sql
create table promos (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  code                     text,
  internal_name            text not null,
  description              text,
  promo_type               text not null check (promo_type in (
                             'discount_code', 'automatic', 'bundle', 'sale'
                           )),
  discount_type            text not null check (discount_type in (
                             'percent_off', 'fixed_amount_off', 'free_shipping',
                             'buy_x_get_y', 'fixed_bundle_price'
                           )),
  discount_value_cents     integer,
  discount_percent         numeric(5,2),
  applies_to               jsonb not null default '{"scope": "all"}'::jsonb,
  conditions               jsonb not null default '{}'::jsonb,
  max_uses_total           integer,
  max_uses_per_customer    integer,
  uses_count               integer not null default 0,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text not null default 'active' check (status in (
                             'draft', 'scheduled', 'active', 'paused',
                             'expired', 'depleted'
                           )),
  stackable_with_others    boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index promos_tenant_code_unique
  on promos (tenant_id, lower(code))
  where code is not null;

create index promos_tenant_status_idx on promos (tenant_id, status);
create index promos_tenant_active_window_idx
  on promos (tenant_id, starts_at, ends_at)
  where status in ('active', 'scheduled');

create table promo_redemptions (
  id                         uuid primary key default gen_random_uuid(),
  promo_id                   uuid not null references promos(id) on delete cascade,
  tenant_id                  uuid not null references tenants(id) on delete cascade,
  order_id                   uuid not null references orders(id) on delete cascade,
  customer_profile_id        uuid references customer_profiles(id) on delete set null,
  amount_discounted_cents    integer not null check (amount_discounted_cents >= 0),
  created_at                 timestamptz not null default now()
);

create index promo_redemptions_promo_idx on promo_redemptions (promo_id);
create index promo_redemptions_order_idx on promo_redemptions (order_id);
create index promo_redemptions_customer_idx
  on promo_redemptions (customer_profile_id) where customer_profile_id is not null;
```

### 19.2 Column highlights

**promos**

- **`code`** — nullable. Required for `discount_code` type, null for `automatic`/`bundle`/`sale` types. Unique per tenant case-insensitive when set.
- **`internal_name`** — the maker's label ("Holiday 20% off"). Always present, not customer-visible.
- **`description`** — optional customer-visible description.
- **`promo_type`** — `discount_code` requires manual entry at checkout, `automatic` applies when conditions are met, `bundle` is buy-x-get-y, `sale` is a temporary price change applied directly to listings.
- **`discount_type`** — the math: percent off, fixed amount off, free shipping, BxGy, or fixed bundle price.
- **`discount_value_cents`** / **`discount_percent`** — exactly one set based on discount_type.
- **`applies_to`** — JSONB describing what the promo applies to: `{"scope": "all"}`, `{"scope": "listings", "listing_ids": [...]}`, `{"scope": "collections", "collection_ids": [...]}`. Flexibility without schema bloat.
- **`conditions`** — JSONB for eligibility rules: minimum order amount, first-order-only, specific customer segments. Open-ended.
- **`max_uses_total`** / **`max_uses_per_customer`** / **`uses_count`** — usage caps and the running count.
- **`starts_at`** / **`ends_at`** — active window. Both optional; a promo with no end runs until paused or depleted.
- **`stackable_with_others`** — whether this promo can combine with another on the same order. Most promos are non-stackable; explicit opt-in for combinable ones.

**promo_redemptions** — one row per use of a promo on an order.

- **`amount_discounted_cents`** — what this specific application reduced the order by. Aggregates to per-promo usage analytics.
- **Unique constraint not on (promo_id, order_id)** — a promo could theoretically apply twice if rules allow. Per-customer limits enforced at application layer using max_uses_per_customer.

### 19.3 Why these choices

**Type discriminator plus JSONB rules.** Promos are the classic case where a strict schema fights the domain. New promo types and new condition shapes appear constantly ("free shipping over $50", "20% off if you bought from us before", "buy 3 of any candle, get the cheapest free"). JSONB for `applies_to` and `conditions` lets us add rule types without migrations. The application validates the JSONB shape per promo_type with Zod.

**Sale type sets effective price via promo, not listing edit.** When a maker runs a "20% off all candles" sale, we don't modify the listings' base_price_cents — we add a promo with type=`sale`. The displayed price on the storefront is the result of applying active sales to the base price. Reversing the sale is one row update (status=paused), not bulk listing edits.

**Cached `uses_count`.** Avoids aggregating promo_redemptions on every checkout to enforce max_uses_total. Incremented by trigger on redemption insert.

**Two tables — promo defines, redemption logs.** Same pattern as gift_cards/transactions. The promo row evolves; the redemption rows are append-only history.

**Stackable opt-in, not opt-out.** Most promos don't combine ("20% off code + 30% off sale = ??"). Defaulting non-stackable prevents accidental discount stacking that the maker didn't intend.

### 19.4 Row-level security

Tenant admins read/write all their promos. Customers don't read the promos table directly — they enter codes at checkout, the server resolves and applies. Anonymous visitors read active sale-type promos that affect storefront pricing (so the displayed price reflects active sales).

### 19.5 What's NOT here

- **Customer segments.** Conditions can reference segments via JSONB, but the segments themselves (when we build them) live in a separate `customer_segments` table.
- **Email marketing tied to promos** ("email this code to these customers"). Marketing campaigns are post-launch per D9.
- **Loyalty point systems.** Not at launch; separate concern when needed.
- **Affiliate tracking.** Future feature; separate tables.

---

## 20. Future-supported tables (foundation audit)

Per D1, the launch database has to support every feature on the BohdiAI roadmap even if the UI ships years later. This section walks through each post-launch area and asks one question per table group: does this require any change to the launch tables?

Most of the answer is "no, fully additive." A few areas need a launch-table change that's worth making now while the schema isn't carrying production data. Those are called out explicitly.

### 20.1 Messaging (customer-to-tenant inbox)

**Future tables:** `message_threads` (per customer/tenant pair, with status and last_message_at), `messages` (sender_type customer or maker, body, attachments via uploads, read_at).

**Launch-table impact:** none. Customer attribution via customer_profile_id (already exists), tenant scoping via tenant_id (always), media attachments via the polymorphic uploads table (already exists, no shape change). The cached `last_message_at` for "show me my active conversations" lives on the thread row, not customer_profiles.

**Verdict:** fully additive. Drafted when feature ships.

### 20.2 Marketing campaigns

**Future tables:** `customer_segments` (saved filter definitions, with cached member count), `campaigns` (content, schedule, channel), `campaign_sends` (per-recipient send log with delivery status).

**Launch-table impact:** the `marketing_opt_in` flag on customer_profiles already exists. Email verification state is handled by Supabase Auth (`auth.users.email_confirmed_at`), accessible via join. If we ever want a per-tenant marketing opt-out (a customer opting out of one store's marketing but not another's), the existing `marketing_opt_in` boolean covers it because customer_profiles is per-tenant.

**Verdict:** fully additive. Drafted when feature ships.

### 20.3 Fulfillment (shipping labels, tracking, returns)

**Resolved per D12.** The shipments and shipment_items tables landed in §14 at launch. Tracking columns are not on the orders table — every order has one shipments row at launch, multi-shipment is supported the day a maker needs it without any migration.

**Still future:** `return_authorizations` (RMAs with reason and status) and `return_items`. Both are additive when shipped — they reference orders and order_items, no further launch-table changes. The shipments table has a `returned` status value for when a shipped package comes back.

### 20.4 Integrations (QuickBooks, Mailchimp, Square importer, POD providers, etc.)

**Future tables:** `tenant_integrations` (one row per integration per tenant, with encrypted credentials and settings), `integration_sync_logs` (per sync run, with status and errors), `integration_field_mappings` (for CSV import — how source columns map to BohdiAI listing fields).

**Launch-table impact:** none. Integrations attach to tenants and reference launch tables read-only or via standard inserts.

**Verdict:** fully additive. Drafted when first integration ships (likely Square importer per Master Spec §14).

### 20.5 Analytics (maker-facing)

**Future tables:** minimal — most analytics lives in PostHog rather than our database. If we surface specific maker-facing metrics that need our own data, a `tenant_metrics_daily` cache table (aggregated daily counts of visits, conversions, revenue) keeps the dashboards fast.

**Launch-table impact:** none. Aggregates derive from orders, listings, and PostHog data.

**Verdict:** fully additive. Probably never gets large.

### 20.6 Customer segments

**Future table:** `customer_segments` (per tenant, with a filter_definition JSONB defining the segment's criteria and a cached member count). No membership join table needed if we recompute on demand.

**Launch-table impact:** none. Segments are filter definitions over customer_profiles and orders.

**Verdict:** fully additive. Drafted when marketing campaigns ship.

### 20.7 System audit log

**Future table:** `system_audit_log` (action, actor type, resource table and id, before/after state, IP, user agent). Distinct from editor_history — editor_history captures maker-driven UI edits; the system audit log captures everything else (webhook handlers, background jobs, admin actions, automated billing changes).

**Launch-table impact:** none, but the typical implementation uses Postgres triggers on launch tables that write to the audit log. Triggers can be added later via `ALTER TABLE ... ADD TRIGGER` without data migration, so we don't need to add anything now. The decision to add comprehensive auditing is a security/compliance call that can be made when we have a reason.

**Verdict:** fully additive. Drafted when triggered (likely a compliance or debugging need).

### 20.8 Summary of launch-table changes proposed

Only one real change came out of this audit — shipments — and it's been applied (D12). The orders table no longer carries shipment-tracking columns; shipments and shipment_items are first-class tables in §14. Every order at launch has exactly one shipments row; multi-shipment is supported the day a maker needs it.

Everything else (messaging, marketing, integrations, analytics, customer segments, audit logs) is fully additive when the features ship.

---

## Spec status

All foundational tables for Phase 1 are now drafted, plus the foundation audit for post-launch features. The spec stands at roughly 25 tables across 20 sections. Each section follows the same shape: table definition, column-by-column rationale, why these choices, RLS policy, what's NOT in this table.

Open items that surfaced during drafting:

- The Master Spec amendments listed in the decisions log (§2, §6.2, §6.3, §8, §17) still need to be written.
- Doer-storefront and multi-type-tenant rendering questions are still open at the product-design level; the database supports them either way.
- The mood list for D6 still needs to be curated.
- RLS policy SQL is described in each section but not yet written as final SQL — that lands when we implement.

Each section follows the same shape: table definition, column-by-column rationale, why these choices, RLS policy, what's NOT in this table.

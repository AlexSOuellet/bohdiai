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

## Sections to come

- 3. Tenant invitations (pending invites to admin-membership)
- 4. Subscriptions (Stripe billing state per tenant)
- 5. Design tokens (per-tenant, version history)
- 6. Niche schemas (shared, defining AI starting inputs and component preferences)
- 7. Listings (the unified table for everything a tenant offers — products and services)
- 8. Variations (seller-defined attributes per listing)
- 9. Collections (how listings get grouped)
- 10. Customer profiles (extra data for tenant_members with role='customer' — addresses, wishlists)
- 11. Orders + order_items + payments (commerce)
- 12. Reviews
- 13. Gift cards
- 14. Content pages (about, FAQ, policies)
- 15. Uploads / files / media
- 16. Future-supported tables (messaging, marketing campaigns, fulfillment, integrations) — designed empty, populated as features ship

Each section follows the same shape: table definition, column-by-column rationale, why these choices, RLS policy, what's NOT in this table.

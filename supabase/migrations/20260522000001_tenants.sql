-- Tenants — the root entity. One row per business using BohdiAI.
-- Spec: project-docs/Tech-Arch-Spec.md §1

create table tenants (
  id                    uuid primary key default gen_random_uuid(),
  subdomain             text not null,
  custom_domain         text,
  business_name         text not null,
  tier                  text not null check (tier in ('freemium', 'basic', 'pro')),
  types                 text[] not null check (
    types <@ array['seller', 'doer']::text[]
    and array_length(types, 1) >= 1
  ),
  primary_niche         text,
  niche_from_list       boolean not null default true,
  secondary_niche       text,
  niche_description     text,
  specializations       text[] not null default '{}'::text[],
  specialization_notes  text,
  inspiration_urls      text[] not null default '{}'::text[] check (
    array_length(inspiration_urls, 1) is null
    or array_length(inspiration_urls, 1) <= 3
  ),
  status                text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  stripe_account_id     text,
  square_merchant_id    text,
  currency              text not null default 'USD',
  time_zone             text not null default 'America/New_York',
  contact_email         text,
  phone                 text,
  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  postal_code           text,
  country               text default 'US',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create unique index tenants_subdomain_unique
  on tenants (lower(subdomain))
  where deleted_at is null;

create unique index tenants_custom_domain_unique
  on tenants (lower(custom_domain))
  where custom_domain is not null and deleted_at is null;

create index tenants_status_idx on tenants (status) where deleted_at is null;

-- RLS enabled with no policies yet. Service role bypasses; everything else is denied
-- until tenant_members exists and the full policy lands (spec §1.4).
alter table tenants enable row level security;

comment on table tenants is
  'Root entity per BohdiAI business. Every other table FKs to tenants.id and uses RLS for isolation. Spec: Tech-Arch-Spec.md §1.';

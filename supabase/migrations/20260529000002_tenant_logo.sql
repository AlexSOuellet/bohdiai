-- Tenant logo support. Optional uploaded brand mark; when present, the storefront
-- nav renders the image instead of the typographic wordmark.
-- Phase 1 task #2: logo support.

alter table tenants
  add column logo_url text;

comment on column tenants.logo_url is
  'Public URL of the tenant''s uploaded logo (in tenant-logos storage bucket). When set, storefront nav renders this image instead of the typographic wordmark.';

-- Storage bucket for uploaded logos. Public read so storefronts can render them
-- without signed URLs. Writes restricted to service role (we sign uploads from
-- server actions during onboarding).
insert into storage.buckets (id, name, public)
values ('tenant-logos', 'tenant-logos', true)
on conflict (id) do nothing;

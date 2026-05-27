-- AI-generated sample listings (products + subscriptions) are written as
-- previews at onboarding so a customer never sees a "Buy" button on a product
-- the maker doesn't actually have. The storefront renders preview listings with
-- a "Coming Soon" (products) or "Get Notified" (subscriptions) treatment
-- instead of the normal purchase CTA. The maker flips is_preview=false from
-- the dashboard when they make the listing real (their photo, their price,
-- their description).

alter table listings
  add column if not exists is_preview boolean not null default false;

create index if not exists listings_is_preview_idx
  on listings (tenant_id, is_preview)
  where deleted_at is null;

comment on column listings.is_preview is
  'When true, the listing is an AI-generated sample, not yet activated by the maker. The storefront renders a "Coming Soon" or "Get Notified" treatment instead of the purchase CTA.';

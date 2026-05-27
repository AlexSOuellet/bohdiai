-- Add 'subscription' to the allowed listing_type values so AI-generated sample
-- subscription listings can be written through write_tenant_storefront. Same
-- pattern as the gift_cards migration (20260522000017) — drop + recreate the
-- check constraint with the expanded set.

alter table listings drop constraint listings_listing_type_check;
alter table listings add constraint listings_listing_type_check
  check (listing_type in (
    'product', 'digital_product', 'service',
    'class', 'event', 'appointment', 'gift_card', 'subscription'
  ));

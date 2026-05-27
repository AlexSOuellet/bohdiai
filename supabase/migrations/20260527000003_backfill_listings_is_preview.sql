-- Backfill existing AI-generated placeholder listings (created before is_preview
-- existed) so they get the "Coming Soon" treatment too. Every storefront in the
-- DB today was seeded with placeholder products via metadata.placeholder=true —
-- this flips them all to is_preview=true so a customer can never accidentally
-- "buy" one once the cart ships.

update listings
set is_preview = true
where (metadata->>'placeholder')::boolean is true
  and is_preview = false;

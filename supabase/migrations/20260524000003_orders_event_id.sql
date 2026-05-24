-- Add event_id to orders for Market Mode sale-to-event attribution
-- Soft reference (no FK constraint): a deleted event does not cascade to orders.
-- Null for all storefront orders; set when maker tags a Market Mode log-a-sale to an event.

alter table orders add column event_id uuid;

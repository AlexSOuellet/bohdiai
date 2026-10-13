-- What kind of date a market is (Modular Plan step 3; Alex 2026-10-13): a
-- market, a workshop or an event, or nothing. Family designs show it as a small
-- tag beside the date; the owner picks it on the market. Optional, so every
-- existing market stays as it is.
alter table events
  add column if not exists kind text check (kind is null or kind in ('market', 'workshop', 'event'));

comment on column events.kind is
  'Optional tag for the date: market, workshop or event. Shown beside the date by designs that tag dates.';

-- Taking a site offline (Alex, Session 119, 2026-11-03): a maker can take their
-- live site offline and put it back. Visitors see that it's temporarily offline
-- and to check back later; the maker can still look at it. "offline" is its own
-- status so an offline site is never mistaken for one that was never published
-- (draft, which visitors see as not found). Nothing on the site changes.

alter table tenants drop constraint tenants_status_check;
alter table tenants add constraint tenants_status_check
  check (status = any (array['draft', 'active', 'offline', 'suspended', 'closed']));

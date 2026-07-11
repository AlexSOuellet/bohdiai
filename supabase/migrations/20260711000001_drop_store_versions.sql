-- Drop the store_versions table.
--
-- Session 70 (2026-07-11): the Try-On feature is retired. Archetypes were
-- collapsed to a single one (Main Street) back in Session 31, so a tool built
-- to convert a store between archetypes has no job. The table only ever held
-- saved try-on drafts keyed by label; nothing else read from or wrote to it.

drop trigger if exists store_versions_set_updated_at on store_versions;
drop index if exists store_versions_tenant_idx;
drop table if exists store_versions;

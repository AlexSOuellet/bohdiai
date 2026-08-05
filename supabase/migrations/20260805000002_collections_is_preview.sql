-- Collections get the same preview flag products have. Onboarding seeds sample
-- collections (grouping the sample products); once the maker makes their store real
-- in the walk, those seeded collections must clear out like the placeholder products
-- do. is_preview marks the seeded ones so we can clear only those and never a
-- collection the maker actually created.

alter table collections
  add column if not exists is_preview boolean not null default false;

create index if not exists collections_is_preview_idx
  on collections (tenant_id, is_preview)
  where deleted_at is null;

comment on column collections.is_preview is
  'When true, the collection is an AI-generated sample from onboarding, not one the maker made. Cleared when the maker makes their store real in the walk.';

-- Backfill: every collection in the DB today was seeded at onboarding (real
-- collection management did not exist before this), so mark them all preview.
update collections
set is_preview = true
where is_preview = false;

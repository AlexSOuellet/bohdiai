-- One staged, not-yet-published copy of a tenant's home envelope. The editor
-- writes here; Publish promotes to content_pages; Reset deletes the row. Owner
-- only — never publicly readable, so an unpublished draft can't be scraped.
-- Spec: Project-Docs/Editor-Make-It-Yours-Design.md (Part 1).
create table store_drafts (
  tenant_id   uuid primary key references tenants(id) on delete cascade,
  layout_tree jsonb not null,
  updated_at  timestamptz not null default now()
);

create trigger store_drafts_set_updated_at
  before update on store_drafts
  for each row execute function set_updated_at();

alter table store_drafts enable row level security;

-- Tenant admins (the store's owner/staff) can do everything with their draft.
-- No anon/public policy at all: drafts are never publicly selectable.
create policy store_drafts_admin_all on store_drafts
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

comment on table store_drafts is
  'Staged home envelope per tenant (editor draft). Promoted to content_pages on Publish, deleted on Reset. Owner-only. Spec: Editor-Make-It-Yours-Design.md.';

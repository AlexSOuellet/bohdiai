-- Print it's saved pieces (Alex approved, 2026-11-15; Project-Docs/Print-Tool-Design.md).
-- The pieces a maker covers again and again (a tray, a box lid): a name, a shape,
-- the size and how much wraps over the edge, kept in inches. Starts empty: no
-- existing site changes.

create table print_pieces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  shape text not null default 'rect' check (shape in ('rect', 'round', 'oval')),
  width_in numeric(6, 2) not null check (width_in > 0 and width_in <= 200),
  height_in numeric(6, 2) not null check (height_in > 0 and height_in <= 200),
  wrap_in numeric(4, 2) not null default 0 check (wrap_in between 0 and 6),
  position integer not null default 0,
  updated_at timestamptz not null default now()
);
create index print_pieces_tenant on print_pieces (tenant_id, position);

-- Owners manage their own (the server reads with the service role too).
alter table print_pieces enable row level security;
create trigger print_pieces_set_updated_at before update on print_pieces for each row execute function set_updated_at();
create policy print_pieces_admin_select on print_pieces for select to authenticated using (is_tenant_admin(tenant_id));
create policy print_pieces_admin_insert on print_pieces for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy print_pieces_admin_update on print_pieces for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy print_pieces_admin_delete on print_pieces for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table print_pieces is 'Print it: the pieces a maker covers again and again (name, shape, size and wrap in inches). Spec: Project-Docs/Print-Tool-Design.md.';

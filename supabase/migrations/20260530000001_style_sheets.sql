-- Style sheets — per-tenant named palette, font roster, and texture set.
-- Replaces the role-tagged design_tokens schema for tenants on the layout engine.
-- Project-Docs/Layout-Language.md §2.

create table style_sheets (
  id                         uuid primary key default gen_random_uuid(),
  tenant_id                  uuid not null references tenants(id) on delete cascade,
  sheet                      jsonb not null,
  label                      text,
  source                     text not null check (source in (
                               'onboarding', 'bohdi_compose', 'admin_manual', 'rollback'
                             )),
  restored_from_snapshot_id  uuid references style_sheets(id),
  is_active                  boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint style_sheets_is_object check (jsonb_typeof(sheet) = 'object'),
  constraint style_sheets_has_palette check (jsonb_typeof(sheet->'palette') = 'array'),
  constraint style_sheets_has_fonts   check (jsonb_typeof(sheet->'fonts')   = 'array'),
  constraint style_sheets_has_textures check (jsonb_typeof(sheet->'textures') = 'array')
);

create unique index style_sheets_active_unique
  on style_sheets (tenant_id)
  where is_active = true;

create index style_sheets_tenant_history_idx
  on style_sheets (tenant_id, created_at desc);

create index style_sheets_tenant_labeled_idx
  on style_sheets (tenant_id, label)
  where label is not null;

create trigger style_sheets_set_updated_at
  before update on style_sheets
  for each row
  execute function set_updated_at();

alter table style_sheets enable row level security;

comment on table style_sheets is
  'Per-tenant style sheets — named palette, font roster, texture set. Replaces the role-tagged design_tokens schema for tenants on the layout engine. Project-Docs/Layout-Language.md §2.';

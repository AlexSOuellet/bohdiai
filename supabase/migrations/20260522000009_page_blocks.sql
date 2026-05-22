-- Page blocks — per-tenant compositions. One row per block placed on a page.
-- block_key references the build-time blocks manifest in code; no DB FK to a code constant.
-- Spec: project-docs/Tech-Arch-Spec.md §8

create table page_blocks (
  id                          uuid primary key default gen_random_uuid(),
  tenant_id                   uuid not null references tenants(id) on delete cascade,
  page_id                     uuid not null references content_pages(id) on delete cascade,
  block_key                   text not null,
  position                    integer not null,
  content                     jsonb not null default '{}'::jsonb,
  is_visible                  boolean not null default true,
  created_by_history_id       uuid references editor_history(id) on delete set null,
  last_updated_by_history_id  uuid references editor_history(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint page_blocks_content_is_object check (jsonb_typeof(content) = 'object')
);

create unique index page_blocks_page_position_unique
  on page_blocks (page_id, position);

create index page_blocks_tenant_page_idx
  on page_blocks (tenant_id, page_id, position);

create index page_blocks_block_key_idx
  on page_blocks (block_key);

create trigger page_blocks_set_updated_at
  before update on page_blocks
  for each row execute function set_updated_at();

alter table page_blocks enable row level security;

comment on table page_blocks is
  'Per-page block placements. block_key references code-side blocks manifest. Spec: Tech-Arch-Spec.md §8.';

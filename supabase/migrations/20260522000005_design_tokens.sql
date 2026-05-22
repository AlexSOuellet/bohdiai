-- Design tokens — per-tenant visual configuration. One row per snapshot.
-- Exactly one snapshot is active per tenant at any time.
-- Spec: project-docs/Tech-Arch-Spec.md §4

create table design_tokens (
  id                         uuid primary key default gen_random_uuid(),
  tenant_id                  uuid not null references tenants(id) on delete cascade,
  tokens                     jsonb not null,
  label                      text,
  source                     text not null check (source in (
                               'onboarding', 'ai_chat_edit', 'vibe_slider',
                               'admin_manual', 'rollback'
                             )),
  restored_from_snapshot_id  uuid references design_tokens(id),
  is_active                  boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint design_tokens_is_object check (jsonb_typeof(tokens) = 'object')
);

create unique index design_tokens_active_unique
  on design_tokens (tenant_id)
  where is_active = true;

create index design_tokens_tenant_history_idx
  on design_tokens (tenant_id, created_at desc);

create index design_tokens_tenant_labeled_idx
  on design_tokens (tenant_id, label)
  where label is not null;

create trigger design_tokens_set_updated_at
  before update on design_tokens
  for each row
  execute function set_updated_at();

alter table design_tokens enable row level security;

comment on table design_tokens is
  'Per-tenant visual token snapshots. Append-only history; one active row per tenant. Spec: Tech-Arch-Spec.md §4.';

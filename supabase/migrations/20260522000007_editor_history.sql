-- Editor history — append-only audit and rollback log for every change a maker
-- (or the AI on their behalf) makes. One stream per tenant covering design,
-- content, and structural edits.
-- Spec: project-docs/Tech-Arch-Spec.md §5

create table editor_history (
  id                         uuid primary key default gen_random_uuid(),
  tenant_id                  uuid not null references tenants(id) on delete cascade,
  user_id                    uuid references auth.users(id) on delete set null,
  prompt                     text,
  ai_interpretation          text,
  action_type                text not null,
  target_table               text not null,
  target_row_id              uuid,
  before_state               jsonb,
  after_state                jsonb,
  design_tokens_snapshot_id  uuid references design_tokens(id),
  status                     text not null default 'applied' check (status in ('applied', 'reverted', 'failed')),
  reverted_by_history_id     uuid references editor_history(id),
  source                     text not null check (source in (
                               'ai_chat', 'vibe_slider', 'direct_edit',
                               'onboarding', 'admin_manual', 'rollback'
                             )),
  created_at                 timestamptz not null default now()
);

create index editor_history_tenant_timeline_idx
  on editor_history (tenant_id, created_at desc);

create index editor_history_target_idx
  on editor_history (target_table, target_row_id);

create index editor_history_tenant_status_idx
  on editor_history (tenant_id, status);

alter table editor_history enable row level security;

comment on table editor_history is
  'Append-only audit log of every site edit. Captures prompt, AI interpretation, before/after state. Spec: Tech-Arch-Spec.md §5.';

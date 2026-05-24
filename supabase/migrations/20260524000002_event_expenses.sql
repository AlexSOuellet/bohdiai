-- Event expenses: booth fees, gas, supplies, etc. linked to a specific event
-- Tenant admins manage their own expense lines; no public read access.

create table event_expenses (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  tenant_id         uuid not null references tenants(id) on delete cascade,
  description       text not null,
  amount_cents      integer not null check (amount_cents >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index event_expenses_event_idx on event_expenses (event_id);

create trigger set_event_expenses_updated_at
  before update on event_expenses
  for each row execute function set_updated_at();

alter table event_expenses enable row level security;

-- Tenant admin: full CRUD on their own expense lines
create policy "tenant admin manages event expenses"
  on event_expenses
  for all
  to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

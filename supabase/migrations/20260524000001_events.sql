-- Events: craft shows, farmers markets, popup events
-- Tenant admins manage their own events; storefront visitors read upcoming events for the calendar widget.

create table events (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  name              text not null,
  event_date        date not null,
  end_date          date,
  location          text,
  url               text,
  notes             text,
  status            text not null default 'upcoming' check (status in (
                      'upcoming', 'completed', 'canceled'
                    )),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index events_tenant_date_idx on events (tenant_id, event_date);
create index events_tenant_status_idx on events (tenant_id, status);

create trigger set_events_updated_at
  before update on events
  for each row execute function set_updated_at();

alter table events enable row level security;

-- Tenant admin: full CRUD on their own events
create policy "tenant admin manages events"
  on events
  for all
  to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

-- Storefront visitors: read upcoming events only (for the public calendar widget)
create policy "anon reads upcoming events"
  on events
  for select
  to anon
  using (status = 'upcoming');

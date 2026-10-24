-- Free and the tools (Alex approved, 2026-10-24; Project-Docs/Plan-Backends.md).
-- Free is a backend with no site: products worked out with the tools, events with
-- their numbers. Products and events come out of the tools.
--
-- 1. Free is a plan (tenants.plan and plan_next). Not the same as plan_comp 'free',
--    which gives a paid plan away.
-- 2. product_costs: one per product, the Cost to make and Price it settings.
-- 3. product_cost_items: the product's supply list, one line each.
-- 4. event_takings: a market's own numbers, typed in after the day (Market day).
--    Booth, gas, food and other already live in event_expenses.
-- New homes start empty: no existing site changes.

-- 1. Free.
alter table tenants drop constraint tenants_plan_check;
alter table tenants add constraint tenants_plan_check check (plan is null or plan in ('free', 'showcase', 'lite', 'full'));
alter table tenants drop constraint tenants_plan_next_check;
alter table tenants add constraint tenants_plan_next_check check (plan_next is null or plan_next in ('free', 'showcase', 'lite', 'full'));

-- 2. A product's costs.
create table product_costs (
  listing_id uuid primary key references listings(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  pieces_per_batch numeric(10, 2) check (pieces_per_batch is null or pieces_per_batch > 0),
  batch_hours numeric(8, 2) check (batch_hours is null or batch_hours >= 0),
  hourly_pay_cents integer check (hourly_pay_cents is null or hourly_pay_cents between 0 and 100000),
  other_cents integer check (other_cents is null or other_cents between 0 and 10000000),
  markup numeric(3, 1) not null default 2.5 check (markup in (2, 2.5, 3)),
  updated_at timestamptz not null default now()
);
create index product_costs_tenant on product_costs (tenant_id);

-- 3. The supply list. A batch supply has what she paid and how many batches it
--    lasts; a piece item ("every piece gets one") has what one costs.
create table product_cost_items (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references product_costs(listing_id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind text not null check (kind in ('batch', 'piece')),
  name text not null default '' check (char_length(name) <= 80),
  paid_cents integer not null check (paid_cents between 0 and 10000000),
  batches_lasts numeric(8, 2) check (batches_lasts is null or batches_lasts > 0),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  check ((kind = 'batch') or (batches_lasts is null))
);
create index product_cost_items_listing on product_cost_items (listing_id, position);
create index product_cost_items_tenant on product_cost_items (tenant_id);

-- 4. A market's own numbers.
create table event_takings (
  event_id uuid primary key references events(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  sales_cents integer check (sales_cents is null or sales_cents between 0 and 100000000),
  card_cents integer check (card_cents is null or card_cents between 0 and 100000000),
  card_fee_pct numeric(5, 2) check (card_fee_pct is null or card_fee_pct between 0 and 100),
  materials_cents integer check (materials_cents is null or materials_cents between 0 and 100000000),
  hours_at_market numeric(6, 2) check (hours_at_market is null or hours_at_market >= 0),
  hours_other numeric(6, 2) check (hours_other is null or hours_other >= 0),
  hourly_pay_cents integer check (hourly_pay_cents is null or hourly_pay_cents between 0 and 100000),
  updated_at timestamptz not null default now()
);
create index event_takings_tenant on event_takings (tenant_id);

-- Owners manage their own (the server reads with the service role too).
do $$
declare t text;
begin
  foreach t in array array['product_costs', 'product_cost_items', 'event_takings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', t || '_set_updated_at', t);
    execute format('create policy %I on %I for select to authenticated using (is_tenant_admin(tenant_id))', t || '_admin_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (is_tenant_admin(tenant_id))', t || '_admin_insert', t);
    execute format('create policy %I on %I for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id))', t || '_admin_update', t);
    execute format('create policy %I on %I for delete to authenticated using (is_tenant_admin(tenant_id))', t || '_admin_delete', t);
  end loop;
end $$;

comment on table product_costs is 'A product''s Cost to make and Price it settings (one per product). Spec: Project-Docs/Plan-Backends.md.';
comment on table product_cost_items is 'A product''s supply list: batch supplies and what every piece gets. Spec: Project-Docs/Plan-Backends.md.';
comment on table event_takings is 'A market''s own numbers, typed in after the day (Market day). Spec: Project-Docs/Plan-Backends.md.';

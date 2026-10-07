-- Market shop (Market POS piece 2). Spec: docs/superpowers/specs/2026-10-07-market-pos-design.md
--
-- payment_settings: how a shop takes money at a market (Venmo, Cash App, Zelle,
--   cash), each with its own switch. Not secrets: they are what a maker prints on a
--   table sign. Owner-only through RLS; the storefront reads them with the service role.
-- market_listings: the pieces she brings to each market.
-- orders.payment_method / buyer_paid_at: how a market buyer paid, and when they
--   tapped "I paid".
--
-- A market sale is an order with source 'market_mode' and event_id set. A buyer's
-- hold is a pending market order that has ALREADY taken its stock (so the website
-- and the cart can't sell the piece while she checks the money); confirming makes
-- it paid, "not received" cancels it and puts the stock back. set_order_status is
-- replaced so a pending market order counts as holding stock.

create table payment_settings (
  tenant_id   uuid primary key references tenants(id) on delete cascade,
  venmo       text check (venmo ~ '^[A-Za-z0-9_-]{1,30}$'),
  venmo_on    boolean not null default false,
  cashapp     text check (cashapp ~ '^[A-Za-z][A-Za-z0-9_-]{0,19}$'),
  cashapp_on  boolean not null default false,
  zelle       text check (char_length(zelle) between 3 and 254),
  zelle_on    boolean not null default false,
  cash_on     boolean not null default true,
  updated_at  timestamptz not null default now(),
  check (not venmo_on or venmo is not null),
  check (not cashapp_on or cashapp is not null),
  check (not zelle_on or zelle is not null)
);

create trigger payment_settings_set_updated_at
  before update on payment_settings
  for each row execute function set_updated_at();

alter table payment_settings enable row level security;

create policy payment_settings_admin_all on payment_settings
  for all to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

create table market_listings (
  event_id   uuid not null references events(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  tenant_id  uuid not null references tenants(id) on delete cascade,
  position   int not null default 0,
  primary key (event_id, listing_id)
);

create index market_listings_tenant_idx on market_listings (tenant_id);

alter table market_listings enable row level security;

create policy market_listings_admin_all on market_listings
  for all to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

alter table orders
  add column if not exists payment_method text check (payment_method in ('venmo', 'cashapp', 'zelle', 'cash', 'card')),
  add column if not exists buyer_paid_at timestamptz;

create index if not exists orders_event_idx on orders (event_id) where event_id is not null;

-- The next order number for a shop. Callers hold the tenant row lock.
create or replace function public.next_order_number(p_tenant_id uuid)
returns int
language sql
stable
set search_path = public
as $$
  select coalesce(max(order_number::int), 1000) + 1
  from orders where tenant_id = p_tenant_id and order_number ~ '^[0-9]+$';
$$;

revoke all on function public.next_order_number(uuid) from public, anon, authenticated;

-- The pieces a market brings, replaced wholesale, in the order given. Owner only.
create or replace function public.set_market_listings(p_tenant_id uuid, p_event_id uuid, p_listing_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from events where id = p_event_id and tenant_id = p_tenant_id) then
    raise exception 'market not found' using errcode = 'P0002';
  end if;
  delete from market_listings where event_id = p_event_id;
  insert into market_listings (event_id, listing_id, tenant_id, position)
  select p_event_id, l.id, p_tenant_id, x.ord - 1
  from unnest(p_listing_ids) with ordinality as x(id, ord)
  join listings l on l.id = x.id and l.tenant_id = p_tenant_id and l.deleted_at is null;
end;
$$;

revoke all on function public.set_market_listings(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.set_market_listings(uuid, uuid, uuid[]) to authenticated;

-- Shared by the buyer's hold and the owner's recorded sale: checks the market and
-- the piece, takes the stock, writes the order. Not callable from outside.
create or replace function public.market_order_internal(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_status text, p_name text, p_email text,
  p_method text, p_price_cents int, p_discount_cents int, p_discount_label text, p_promotion_id uuid
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_event events%rowtype;
  v_listing listings%rowtype;
  v_promo promotions%rowtype;
  v_number int;
  v_id uuid;
begin
  select (now() at time zone coalesce(time_zone, 'America/New_York'))::date into v_today
  from tenants where id = p_tenant_id and status = 'active' and deleted_at is null for update;
  if not found then
    raise exception 'shop not found' using errcode = 'P0002';
  end if;

  select * into v_event from events where id = p_event_id and tenant_id = p_tenant_id;
  if not found or v_event.status = 'canceled'
     or v_today < v_event.event_date or v_today > coalesce(v_event.end_date, v_event.event_date) then
    raise exception 'market closed' using errcode = 'P0040';
  end if;

  if not exists (select 1 from market_listings where event_id = p_event_id and listing_id = p_listing_id) then
    raise exception 'not at this market' using errcode = 'P0021';
  end if;
  select * into v_listing from listings
  where id = p_listing_id and tenant_id = p_tenant_id and status = 'active' and deleted_at is null
  for update;
  if not found or (v_listing.inventory_count is not null and v_listing.inventory_count <= 0) then
    raise exception 'not available' using errcode = 'P0021';
  end if;

  if p_discount_cents < 0 or p_discount_cents > p_price_cents then
    raise exception 'bad discount' using errcode = '22023';
  end if;
  if p_promotion_id is not null then
    select * into v_promo from promotions where id = p_promotion_id and tenant_id = p_tenant_id for update;
    if not found or not v_promo.active
       or (v_promo.starts_on is not null and v_today < v_promo.starts_on)
       or (v_promo.ends_on is not null and v_today > v_promo.ends_on)
       or (v_promo.max_uses is not null and v_promo.uses >= v_promo.max_uses) then
      raise exception 'promotion ended' using errcode = 'P0022';
    end if;
    if v_promo.kind = 'code' then
      update promotions set uses = uses + 1 where id = v_promo.id;
    end if;
  end if;

  if v_listing.inventory_count is not null then
    update listings set inventory_count = inventory_count - 1 where id = p_listing_id;
  end if;

  v_number := public.next_order_number(p_tenant_id);
  insert into orders (tenant_id, order_number, customer_email, customer_name, status, subtotal_cents,
                      discount_cents, discount_label, total_cents, source, event_id, payment_method, paid_at)
  values (p_tenant_id, v_number::text, coalesce(nullif(p_email, ''), ''), p_name, p_status, p_price_cents,
          p_discount_cents, case when p_discount_cents > 0 then p_discount_label end,
          p_price_cents - p_discount_cents, 'market_mode', p_event_id, p_method,
          case when p_status = 'paid' then now() end)
  returning id into v_id;

  insert into order_items (order_id, tenant_id, listing_id, name_snapshot, unit_price_cents, quantity, subtotal_cents)
  values (v_id, p_tenant_id, p_listing_id, v_listing.name, p_price_cents, 1, p_price_cents);

  return query select v_id, v_number::text;
end;
$$;

revoke all on function public.market_order_internal(uuid, uuid, uuid, text, text, text, text, int, int, text, uuid) from public, anon, authenticated;

-- A buyer at the table puts a piece on hold (service role, from the market page's route).
create or replace function public.market_hold(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_name text, p_email text, p_method text,
  p_price_cents int, p_discount_cents int default 0, p_discount_label text default null, p_promotion_id uuid default null
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ps payment_settings%rowtype;
begin
  select * into v_ps from payment_settings where tenant_id = p_tenant_id;
  if not found
     or (p_method = 'venmo' and not v_ps.venmo_on)
     or (p_method = 'cashapp' and not v_ps.cashapp_on)
     or (p_method = 'zelle' and not v_ps.zelle_on)
     or (p_method = 'cash' and not v_ps.cash_on)
     or p_method not in ('venmo', 'cashapp', 'zelle', 'cash') then
    raise exception 'method off' using errcode = 'P0041';
  end if;
  return query select * from public.market_order_internal(
    p_tenant_id, p_event_id, p_listing_id, 'pending', p_name, p_email, p_method,
    p_price_cents, p_discount_cents, p_discount_label, p_promotion_id);
end;
$$;

revoke all on function public.market_hold(uuid, uuid, uuid, text, text, text, int, int, text, uuid) from public, anon, authenticated;
grant execute on function public.market_hold(uuid, uuid, uuid, text, text, text, int, int, text, uuid) to service_role;

-- The buyer says they paid (service role). Only a pending market order.
create or replace function public.market_mark_paid(p_tenant_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders set buyer_paid_at = coalesce(buyer_paid_at, now())
  where id = p_order_id and tenant_id = p_tenant_id and source = 'market_mode' and status = 'pending';
  if not found then
    raise exception 'order not open' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.market_mark_paid(uuid, uuid) from public, anon, authenticated;
grant execute on function public.market_mark_paid(uuid, uuid) to service_role;

-- The buyer steps back before saying they paid (service role): the hold goes, the stock comes back.
create or replace function public.market_release(p_tenant_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update orders set status = 'canceled', canceled_at = now()
  where id = p_order_id and tenant_id = p_tenant_id and source = 'market_mode'
    and status = 'pending' and buyer_paid_at is null
  returning id into v_id;
  if v_id is null then
    raise exception 'order not open' using errcode = 'P0002';
  end if;
  update listings l set inventory_count = l.inventory_count + i.quantity
  from order_items i
  where i.order_id = v_id and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
end;
$$;

revoke all on function public.market_release(uuid, uuid) from public, anon, authenticated;
grant execute on function public.market_release(uuid, uuid) to service_role;

-- The owner records a sale at her table (a buyer who just hands her cash). Owner only.
create or replace function public.market_record_sale(p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_method text, p_price_cents int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number text;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_method not in ('venmo', 'cashapp', 'zelle', 'cash', 'card') then
    raise exception 'bad method' using errcode = '22023';
  end if;
  select m.order_number into v_number from public.market_order_internal(
    p_tenant_id, p_event_id, p_listing_id, 'paid', 'At the table', '', p_method, p_price_cents, 0, null, null) m;
  return v_number;
end;
$$;

revoke all on function public.market_record_sale(uuid, uuid, uuid, text, int) from public, anon;
grant execute on function public.market_record_sale(uuid, uuid, uuid, text, int) to authenticated;

-- set_order_status, now knowing a pending market order already holds its stock.
create or replace function public.set_order_status(p_tenant_id uuid, p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_source text;
  v_was_holding boolean;
  v_now_holding boolean;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'paid', 'fulfilled', 'canceled') then
    raise exception 'bad status' using errcode = '22023';
  end if;

  select status, source into v_old, v_source from orders where id = p_order_id and tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if v_old = p_status then
    return;
  end if;

  v_was_holding := v_old in ('paid', 'fulfilled') or (v_source = 'market_mode' and v_old = 'pending');
  v_now_holding := p_status in ('paid', 'fulfilled') or (v_source = 'market_mode' and p_status = 'pending');

  if v_now_holding and not v_was_holding then
    update listings l set inventory_count = greatest(l.inventory_count - i.quantity, 0)
    from order_items i
    where i.order_id = p_order_id and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  elsif v_was_holding and not v_now_holding then
    update listings l set inventory_count = l.inventory_count + i.quantity
    from order_items i
    where i.order_id = p_order_id and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  end if;

  update orders set
    status = p_status,
    paid_at = case when p_status in ('paid', 'fulfilled') then coalesce(paid_at, now()) else null end,
    fulfilled_at = case when p_status = 'fulfilled' then coalesce(fulfilled_at, now()) else null end,
    canceled_at = case when p_status = 'canceled' then now() else null end
  where id = p_order_id;
end;
$$;

revoke all on function public.set_order_status(uuid, uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, uuid, text) to authenticated;

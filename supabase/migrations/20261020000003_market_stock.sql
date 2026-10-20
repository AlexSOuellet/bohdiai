-- Stock at a market (Alex, 2026-10-20). A maker doesn't bring everything to every
-- market, and what sold out at which market is worth knowing.
--
-- 1. market_stock: how many of a piece (or of one of its options, a colour or a size)
--    the maker brought to a market. A piece at a market with no row isn't counted
--    there; it sells from what's on hand, as before.
-- 2. A market sale can be for several of a piece and for one of its options. It takes
--    from what's on hand (the piece's, or the option's) and from what's left at that
--    market; "left at this market" is what was brought less what has sold there.
-- 3. Cancelling a sale (a buyer stepping back, "Not received", or the owner's order
--    screen) puts the stock back on the option it came from, not only on the piece.

create table market_stock (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  listing_variant_id uuid references listing_variants(id) on delete cascade,
  brought integer not null check (brought between 0 and 9999),
  updated_at timestamptz not null default now()
);
create unique index market_stock_one_row on market_stock (event_id, listing_id, coalesce(listing_variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index market_stock_tenant on market_stock (tenant_id);

alter table market_stock enable row level security;
create policy market_stock_admin_select on market_stock for select to authenticated using (is_tenant_admin(tenant_id));
create policy market_stock_admin_insert on market_stock for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy market_stock_admin_update on market_stock for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy market_stock_admin_delete on market_stock for delete to authenticated using (is_tenant_admin(tenant_id));

-- What's left of a piece (or one option of it) at a market: brought less sold there
-- (open holds count as sold). Null when the market doesn't count it.
create or replace function public.market_left(p_event_id uuid, p_listing_id uuid, p_variant_id uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.brought - coalesce((
    select sum(i.quantity)::int
    from order_items i
    join orders o on o.id = i.order_id
    where o.event_id = p_event_id and o.source = 'market_mode' and o.status in ('pending', 'paid', 'fulfilled')
      and i.listing_id = p_listing_id and i.listing_variant_id is not distinct from p_variant_id
  ), 0)
  from market_stock s
  where s.event_id = p_event_id and s.listing_id = p_listing_id and s.listing_variant_id is not distinct from p_variant_id;
$$;
revoke all on function public.market_left(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.market_left(uuid, uuid, uuid) to service_role;

-- The sale itself, now for a quantity and an option. p_price_cents is the price of one.
drop function if exists public.market_hold(uuid, uuid, uuid, text, text, text, integer, integer, text, uuid);
drop function if exists public.market_record_sale(uuid, uuid, uuid, text, integer);
drop function if exists public.market_order_internal(uuid, uuid, uuid, text, text, text, text, integer, integer, text, uuid);

create function public.market_order_internal(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_status text, p_name text, p_email text, p_method text,
  p_price_cents integer, p_discount_cents integer, p_discount_label text, p_promotion_id uuid,
  p_variant_id uuid default null, p_quantity integer default 1)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_today date;
  v_event events%rowtype;
  v_listing listings%rowtype;
  v_variant listing_variants%rowtype;
  v_has_options boolean;
  v_left integer;
  v_promo promotions%rowtype;
  v_number int;
  v_id uuid;
  v_subtotal int;
  v_choice text;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'bad quantity' using errcode = '22023';
  end if;

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
  if not found then
    raise exception 'not available' using errcode = 'P0021';
  end if;

  -- A piece with options sells one of them; a piece without options sells itself.
  v_has_options := exists (select 1 from listing_variants where listing_id = p_listing_id and status = 'active');
  if v_has_options then
    if p_variant_id is null then
      raise exception 'pick an option' using errcode = 'P0024';
    end if;
    select * into v_variant from listing_variants
    where id = p_variant_id and listing_id = p_listing_id and tenant_id = p_tenant_id and status = 'active'
    for update;
    if not found then
      raise exception 'not available' using errcode = 'P0021';
    end if;
    if v_variant.inventory_count is not null and v_variant.inventory_count < p_quantity then
      raise exception 'not enough' using errcode = 'P0023', hint = greatest(v_variant.inventory_count, 0)::text;
    end if;
    select string_agg(value, ' / ' order by key) into v_choice from jsonb_each_text(v_variant.option_combination);
  else
    if p_variant_id is not null then
      raise exception 'not available' using errcode = 'P0021';
    end if;
    if v_listing.inventory_count is not null and v_listing.inventory_count < p_quantity then
      raise exception 'not enough' using errcode = 'P0023', hint = greatest(v_listing.inventory_count, 0)::text;
    end if;
  end if;

  -- What the maker brought to this market, when she counted it.
  v_left := public.market_left(p_event_id, p_listing_id, p_variant_id);
  if v_left is not null and v_left < p_quantity then
    raise exception 'not enough here' using errcode = 'P0023', hint = greatest(v_left, 0)::text;
  end if;

  v_subtotal := p_price_cents * p_quantity;
  if p_discount_cents < 0 or p_discount_cents > v_subtotal then
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

  if v_has_options then
    if v_variant.inventory_count is not null then
      update listing_variants set inventory_count = inventory_count - p_quantity where id = p_variant_id;
    end if;
  elsif v_listing.inventory_count is not null then
    update listings set inventory_count = inventory_count - p_quantity where id = p_listing_id;
  end if;

  v_number := public.next_order_number(p_tenant_id);
  insert into orders (tenant_id, order_number, customer_email, customer_name, status, subtotal_cents,
                      discount_cents, discount_label, total_cents, source, event_id, payment_method, paid_at)
  values (p_tenant_id, v_number::text, coalesce(nullif(p_email, ''), ''), p_name, p_status, v_subtotal,
          p_discount_cents, case when p_discount_cents > 0 then p_discount_label end,
          v_subtotal - p_discount_cents, 'market_mode', p_event_id, p_method,
          case when p_status = 'paid' then now() end)
  returning id into v_id;

  insert into order_items (order_id, tenant_id, listing_id, listing_variant_id, name_snapshot, variant_description_snapshot,
                           unit_price_cents, quantity, subtotal_cents)
  values (v_id, p_tenant_id, p_listing_id, case when v_has_options then p_variant_id end, v_listing.name, v_choice,
          p_price_cents, p_quantity, v_subtotal);

  return query select v_id, v_number::text;
end;
$function$;
revoke all on function public.market_order_internal(uuid, uuid, uuid, text, text, text, text, integer, integer, text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.market_order_internal(uuid, uuid, uuid, text, text, text, text, integer, integer, text, uuid, uuid, integer) to service_role;

create function public.market_hold(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_name text, p_email text, p_method text, p_price_cents integer,
  p_discount_cents integer default 0, p_discount_label text default null, p_promotion_id uuid default null,
  p_variant_id uuid default null, p_quantity integer default 1)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    p_price_cents, p_discount_cents, p_discount_label, p_promotion_id, p_variant_id, p_quantity);
end;
$function$;
revoke all on function public.market_hold(uuid, uuid, uuid, text, text, text, integer, integer, text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.market_hold(uuid, uuid, uuid, text, text, text, integer, integer, text, uuid, uuid, integer) to service_role;

create function public.market_record_sale(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_method text, p_price_cents integer,
  p_variant_id uuid default null, p_quantity integer default 1)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    p_tenant_id, p_event_id, p_listing_id, 'paid', 'At the table', '', p_method, p_price_cents, 0, null, null,
    p_variant_id, p_quantity) m;
  return v_number;
end;
$function$;
revoke all on function public.market_record_sale(uuid, uuid, uuid, text, integer, uuid, integer) from public, anon;
grant execute on function public.market_record_sale(uuid, uuid, uuid, text, integer, uuid, integer) to authenticated, service_role;

-- Stock goes back to where it came from: the option when the line has one, else the piece.
create or replace function public.market_release(p_tenant_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  where i.order_id = v_id and i.listing_variant_id is null and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  update listing_variants v set inventory_count = v.inventory_count + i.quantity
  from order_items i
  where i.order_id = v_id and i.listing_variant_id = v.id and v.tenant_id = p_tenant_id and v.inventory_count is not null;
end;
$function$;

create or replace function public.set_order_status(p_tenant_id uuid, p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    where i.order_id = p_order_id and i.listing_variant_id is null and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
    update listing_variants v set inventory_count = greatest(v.inventory_count - i.quantity, 0)
    from order_items i
    where i.order_id = p_order_id and i.listing_variant_id = v.id and v.tenant_id = p_tenant_id and v.inventory_count is not null;
  elsif v_was_holding and not v_now_holding then
    update listings l set inventory_count = l.inventory_count + i.quantity
    from order_items i
    where i.order_id = p_order_id and i.listing_variant_id is null and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
    update listing_variants v set inventory_count = v.inventory_count + i.quantity
    from order_items i
    where i.order_id = p_order_id and i.listing_variant_id = v.id and v.tenant_id = p_tenant_id and v.inventory_count is not null;
  end if;

  update orders set
    status = p_status,
    paid_at = case when p_status in ('paid', 'fulfilled') then coalesce(paid_at, now()) else null end,
    fulfilled_at = case when p_status = 'fulfilled' then coalesce(fulfilled_at, now()) else null end,
    canceled_at = case when p_status = 'canceled' then now() else null end
  where id = p_order_id;
end;
$function$;

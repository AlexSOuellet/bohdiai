-- Promotions (Maker Backend, marketing): a site-wide sale (a percent off every
-- piece between two days, no code) or a discount code (a percent or an amount off
-- the order, optionally until a day and up to a number of uses). The owner manages
-- them in the backend; the storefront reads them with the service role.
--
-- An order records the discount it got (orders.discount_cents, existing) and what
-- gave it (discount_label: the code, or the sale's name). place_order_request is
-- replaced: it now takes the discount the route worked out and, for a code,
-- re-checks the code under a lock and counts the use, so a code with a limit can't
-- be used past it by two shoppers at once.

create table promotions (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  kind             text not null check (kind in ('sale', 'code')),
  name             text not null check (char_length(name) between 1 and 60),
  code             text check (code ~ '^[A-Z0-9-]{3,20}$'),
  percent_off      int check (percent_off between 1 and 90),
  amount_off_cents int check (amount_off_cents between 100 and 100000),
  starts_on        date,
  ends_on          date,
  max_uses         int check (max_uses between 1 and 100000),
  uses             int not null default 0 check (uses >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check ((percent_off is null) <> (amount_off_cents is null)),
  check (kind = 'code' or (percent_off is not null and code is null and max_uses is null)),
  check (kind = 'sale' or code is not null),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create unique index promotions_tenant_code_unique on promotions (tenant_id, code) where code is not null;
create index promotions_tenant_idx on promotions (tenant_id);

create trigger promotions_set_updated_at
  before update on promotions
  for each row execute function set_updated_at();

alter table promotions enable row level security;

create policy promotions_admin_all on promotions
  for all to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

alter table orders add column if not exists discount_label text;

drop function if exists public.place_order_request(uuid, text, text, text, text, jsonb);

create or replace function public.place_order_request(
  p_tenant_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_note text,
  p_items jsonb,
  p_discount_cents int default 0,
  p_discount_label text default null,
  p_promotion_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number int;
  v_order_id uuid;
  v_subtotal int := 0;
  v_item jsonb;
  v_listing listings%rowtype;
  v_promo promotions%rowtype;
  v_today date;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order' using errcode = 'P0020';
  end if;

  -- One order number at a time per shop.
  select (now() at time zone coalesce(time_zone, 'America/New_York'))::date into v_today
  from tenants where id = p_tenant_id and status = 'active' and deleted_at is null for update;
  if not found then
    raise exception 'shop not found' using errcode = 'P0002';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_listing from listings
    where id = (v_item->>'listing_id')::uuid and tenant_id = p_tenant_id
      and status = 'active' and deleted_at is null
      and listing_type in ('product', 'digital_product')
    for update;
    if not found or (v_listing.inventory_count is not null and v_listing.inventory_count <= 0) then
      raise exception 'not available' using errcode = 'P0021', hint = coalesce(v_item->>'listing_id', '');
    end if;
    v_subtotal := v_subtotal + (v_item->>'unit_price_cents')::int;
  end loop;

  if p_discount_cents < 0 or p_discount_cents > v_subtotal then
    raise exception 'bad discount' using errcode = '22023';
  end if;

  -- A code is checked again here and its use counted, under the row lock.
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

  select coalesce(max(order_number::int), 1000) + 1 into v_number
  from orders where tenant_id = p_tenant_id and order_number ~ '^[0-9]+$';

  insert into orders (tenant_id, order_number, customer_email, customer_name, customer_phone,
                      customer_note, status, subtotal_cents, discount_cents, discount_label, total_cents, source)
  values (p_tenant_id, v_number::text, p_customer_email, p_customer_name, nullif(p_customer_phone, ''),
          nullif(p_customer_note, ''), 'pending', v_subtotal, p_discount_cents,
          case when p_discount_cents > 0 then p_discount_label end,
          v_subtotal - p_discount_cents, 'storefront')
  returning id into v_order_id;

  insert into order_items (order_id, tenant_id, listing_id, name_snapshot, unit_price_cents, quantity, subtotal_cents)
  select v_order_id, p_tenant_id, (i->>'listing_id')::uuid, i->>'name', (i->>'unit_price_cents')::int, 1,
         (i->>'unit_price_cents')::int
  from jsonb_array_elements(p_items) i;

  return v_number::text;
end;
$$;

revoke all on function public.place_order_request(uuid, text, text, text, text, jsonb, int, text, uuid) from public, anon, authenticated;
grant execute on function public.place_order_request(uuid, text, text, text, text, jsonb, int, text, uuid) to service_role;

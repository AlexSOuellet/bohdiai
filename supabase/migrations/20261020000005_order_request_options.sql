-- An online order can be for one choice of a piece with options (Alex, 2026-10-20):
-- each item may name its combination (listing_variant_id) and that choice in words.
-- The choice must be live and in stock; it is saved on the order line, so a paid
-- order takes stock from that choice (set_order_status, 20261020000003). Items
-- without a combination work as before, so the live code keeps working.

create or replace function public.place_order_request(p_tenant_id uuid, p_customer_name text, p_customer_email text, p_customer_phone text, p_customer_note text, p_items jsonb, p_discount_cents integer default 0, p_discount_label text default null::text, p_promotion_id uuid default null::uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_number int;
  v_order_id uuid;
  v_subtotal int := 0;
  v_item jsonb;
  v_listing listings%rowtype;
  v_variant listing_variants%rowtype;
  v_has_options boolean;
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
    if not found then
      raise exception 'not available' using errcode = 'P0021', hint = coalesce(v_item->>'listing_id', '');
    end if;
    v_has_options := exists (select 1 from listing_variants where listing_id = v_listing.id and status = 'active');
    if v_has_options then
      -- A piece with options is ordered as one of its live, in-stock choices.
      select * into v_variant from listing_variants
      where id = nullif(v_item->>'listing_variant_id', '')::uuid and listing_id = v_listing.id and tenant_id = p_tenant_id and status = 'active'
      for update;
      if not found or (v_variant.inventory_count is not null and v_variant.inventory_count <= 0) then
        raise exception 'not available' using errcode = 'P0021', hint = coalesce(v_item->>'listing_id', '');
      end if;
    elsif nullif(v_item->>'listing_variant_id', '') is not null
       or (v_listing.inventory_count is not null and v_listing.inventory_count <= 0) then
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

  insert into order_items (order_id, tenant_id, listing_id, listing_variant_id, name_snapshot, variant_description_snapshot,
                           unit_price_cents, quantity, subtotal_cents)
  select v_order_id, p_tenant_id, (i->>'listing_id')::uuid, nullif(i->>'listing_variant_id', '')::uuid, i->>'name',
         nullif(i->>'option', ''), (i->>'unit_price_cents')::int, 1, (i->>'unit_price_cents')::int
  from jsonb_array_elements(p_items) i;

  return v_number::text;
end;
$function$;

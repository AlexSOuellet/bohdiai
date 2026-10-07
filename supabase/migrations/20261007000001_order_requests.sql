-- Shop orders from the cart (Maker Backend piece 2, first slice).
--
-- A shopper's cart becomes one `orders` row (status 'pending') with its
-- `order_items`, numbered per shop from 1001. Until a shop's payments are
-- connected, a pending order is a request the maker answers by hand (an invoice);
-- once payments are on, the same row is what the payment marks paid.
--
-- The storefront route prices every line from the catalog itself and calls this
-- with the service role; the function only checks the lines are still for sale
-- and writes the rows in one go. Shoppers never call it.

alter table orders add column if not exists customer_note text;

create or replace function public.place_order_request(
  p_tenant_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_note text,
  p_items jsonb
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
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order' using errcode = 'P0020';
  end if;

  -- One order number at a time per shop.
  perform 1 from tenants where id = p_tenant_id and status = 'active' and deleted_at is null for update;
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

  select coalesce(max(order_number::int), 1000) + 1 into v_number
  from orders where tenant_id = p_tenant_id and order_number ~ '^[0-9]+$';

  insert into orders (tenant_id, order_number, customer_email, customer_name, customer_phone,
                      customer_note, status, subtotal_cents, total_cents, source)
  values (p_tenant_id, v_number::text, p_customer_email, p_customer_name, nullif(p_customer_phone, ''),
          nullif(p_customer_note, ''), 'pending', v_subtotal, v_subtotal, 'storefront')
  returning id into v_order_id;

  insert into order_items (order_id, tenant_id, listing_id, name_snapshot, unit_price_cents, quantity, subtotal_cents)
  select v_order_id, p_tenant_id, (i->>'listing_id')::uuid, i->>'name', (i->>'unit_price_cents')::int, 1,
         (i->>'unit_price_cents')::int
  from jsonb_array_elements(p_items) i;

  return v_number::text;
end;
$$;

revoke all on function public.place_order_request(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order_request(uuid, text, text, text, text, jsonb) to service_role;

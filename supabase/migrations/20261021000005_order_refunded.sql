-- Refund a sale in BohdiAI (Alex, 2026-10-21: "just put the refund in bohdiai"). A
-- paid sale can be marked refunded: the piece goes back in stock (and back in the
-- market's count, which only counts paid sales), the takings and How it sold leave
-- it out, and a card sale gets a refund record beside its charge. The money itself
-- is given back where it was taken (cash in hand, Venmo, the Square app); BohdiAI
-- records it. Function change only: set_order_status learns 'refunded'. No table
-- or column changes (orders and payments already allow it).

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
  if p_status not in ('pending', 'paid', 'fulfilled', 'canceled', 'refunded') then
    raise exception 'bad status' using errcode = '22023';
  end if;

  select status, source into v_old, v_source from orders where id = p_order_id and tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if v_old = p_status then
    return;
  end if;
  -- Only a paid sale can be refunded, and a refund is final.
  if (p_status = 'refunded' and v_old not in ('paid', 'fulfilled')) or v_old = 'refunded' then
    raise exception 'not refundable' using errcode = 'P0025';
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

  -- A charge on record (a card sale) gets its refund beside it.
  if p_status = 'refunded' then
    insert into payments (order_id, tenant_id, processor, payment_type, status, amount_cents, currency, payment_method_type, metadata, processed_at)
    select p.order_id, p.tenant_id, p.processor, 'refund', 'succeeded', p.amount_cents, p.currency, p.payment_method_type,
           jsonb_build_object('refunds', p.id, 'recorded_in', 'bohdiai'), now()
    from payments p
    where p.order_id = p_order_id and p.tenant_id = p_tenant_id and p.payment_type = 'charge' and p.status = 'succeeded';
  end if;

  update orders set
    status = p_status,
    paid_at = case when p_status in ('paid', 'fulfilled', 'refunded') then coalesce(paid_at, now()) else null end,
    fulfilled_at = case when p_status = 'fulfilled' then coalesce(fulfilled_at, now()) else null end,
    canceled_at = case when p_status in ('canceled', 'refunded') then now() else null end
  where id = p_order_id;
end;
$function$;

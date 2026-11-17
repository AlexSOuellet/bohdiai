-- A piece can't be sold twice online (Alex, 2026-11-17, approved). Nothing holds a
-- piece while a shopper is on the payment page, so two shoppers can pay for the
-- same one-of-a-kind at once. When the second payment is recorded, the piece is
-- checked again under a lock: if any piece in the order has none left (and isn't
-- made to order), nothing is recorded and the server is told it sold (P0028). The
-- server then gives that shopper's money back through the processor and records it
-- with record_online_sold below.
--
-- Functions only: no table or column changes. Only BohdiAI's server can run them.

create or replace function public.record_online_payment(
  p_tenant_id uuid,
  p_order_id uuid,
  p_processor text,
  p_external_id text,
  p_amount_cents integer,
  p_currency text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order orders%rowtype;
  v_payment payments%rowtype;
begin
  if p_processor not in ('paypal', 'stripe', 'square') then
    raise exception 'bad processor' using errcode = '22023';
  end if;

  select * into v_order from orders where id = p_order_id and tenant_id = p_tenant_id for update;
  if not found or v_order.source <> 'storefront' then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  select * into v_payment from payments
  where processor = p_processor and external_payment_id = p_external_id and payment_type = 'charge'
  for update;
  if not found or v_payment.order_id <> p_order_id or v_payment.tenant_id <> p_tenant_id then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  -- Already recorded: nothing changes.
  if v_payment.status = 'succeeded' then
    return false;
  end if;

  if v_order.status <> 'pending' then
    raise exception 'order not pending' using errcode = 'P0026';
  end if;
  if p_amount_cents <> v_order.total_cents or p_amount_cents <> v_payment.amount_cents or upper(p_currency) <> upper(v_payment.currency) then
    raise exception 'amount mismatch' using errcode = 'P0027';
  end if;

  -- Each piece again, locked, so two payments for the last one can't both go through.
  perform 1 from listings l join order_items i on i.listing_id = l.id
  where i.order_id = p_order_id and l.tenant_id = p_tenant_id
  for update of l;
  perform 1 from listing_variants v join order_items i on i.listing_variant_id = v.id
  where i.order_id = p_order_id and v.tenant_id = p_tenant_id
  for update of v;
  if exists (
    select 1 from order_items i join listings l on l.id = i.listing_id
    where i.order_id = p_order_id and i.listing_variant_id is null
      and l.inventory_count is not null and l.inventory_count < i.quantity and l.stock_kind <> 'made_to_order'
  ) or exists (
    select 1 from order_items i join listing_variants v on v.id = i.listing_variant_id
    where i.order_id = p_order_id
      and v.inventory_count is not null and v.inventory_count < i.quantity and v.stock_kind <> 'made_to_order'
  ) then
    raise exception 'sold' using errcode = 'P0028';
  end if;

  update listings l set inventory_count = greatest(l.inventory_count - i.quantity, 0)
  from order_items i
  where i.order_id = p_order_id and i.listing_variant_id is null and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  update listing_variants v set inventory_count = greatest(v.inventory_count - i.quantity, 0)
  from order_items i
  where i.order_id = p_order_id and i.listing_variant_id = v.id and v.tenant_id = p_tenant_id and v.inventory_count is not null;

  update payments set status = 'succeeded', processed_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
  where id = v_payment.id;

  update orders set
    status = 'paid',
    paid_at = now(),
    buyer_paid_at = now(),
    currency = upper(p_currency),
    payment_method = case when p_processor = 'paypal' then 'paypal' else 'card' end
  where id = p_order_id;

  return true;
end;
$function$;

revoke all on function public.record_online_payment(uuid, uuid, text, text, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_online_payment(uuid, uuid, text, text, integer, text, jsonb) to service_role;

-- The piece had sold, and the processor has given this shopper's money back: the
-- charge is recorded as taken, the refund beside it, and the order as refunded.
-- Stock never came out for it, so nothing goes back. Recorded once.
create or replace function public.record_online_sold(
  p_tenant_id uuid,
  p_order_id uuid,
  p_processor text,
  p_external_id text,
  p_amount_cents integer,
  p_currency text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order orders%rowtype;
  v_payment payments%rowtype;
begin
  if p_processor not in ('paypal', 'stripe', 'square') then
    raise exception 'bad processor' using errcode = '22023';
  end if;

  select * into v_order from orders where id = p_order_id and tenant_id = p_tenant_id for update;
  if not found or v_order.source <> 'storefront' then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  select * into v_payment from payments
  where processor = p_processor and external_payment_id = p_external_id and payment_type = 'charge'
  for update;
  if not found or v_payment.order_id <> p_order_id or v_payment.tenant_id <> p_tenant_id then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if v_order.status = 'refunded' then
    return false;
  end if;
  if v_order.status <> 'pending' or v_payment.status <> 'pending' then
    raise exception 'order not pending' using errcode = 'P0026';
  end if;
  if p_amount_cents <> v_payment.amount_cents or upper(p_currency) <> upper(v_payment.currency) then
    raise exception 'amount mismatch' using errcode = 'P0027';
  end if;

  update payments set status = 'succeeded', processed_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
  where id = v_payment.id;

  insert into payments (order_id, tenant_id, processor, payment_type, status, amount_cents, currency, payment_method_type, metadata, processed_at)
  values (p_order_id, p_tenant_id, p_processor, 'refund', 'succeeded', p_amount_cents, upper(p_currency), v_payment.payment_method_type,
          jsonb_build_object('reason', 'sold'), now());

  update orders set
    status = 'refunded',
    paid_at = now(),
    buyer_paid_at = now(),
    canceled_at = now(),
    currency = upper(p_currency),
    payment_method = case when p_processor = 'paypal' then 'paypal' else 'card' end
  where id = p_order_id;

  return true;
end;
$function$;

revoke all on function public.record_online_sold(uuid, uuid, text, text, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_online_sold(uuid, uuid, text, text, integer, text, jsonb) to service_role;

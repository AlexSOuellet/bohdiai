-- An online order is paid (Alex, 2026-10-25): when PayPal confirms the buyer's
-- payment, BohdiAI's server records it in one step, so a paid order can never be
-- half-recorded. The order (still pending, from the cart) must be the shop's own,
-- and the amount PayPal took must be exactly its total. Then: its pieces come out of
-- stock, the payment's record turns succeeded, and the order is paid, by PayPal.
-- The same payment is recorded once: a second confirmation changes nothing.
--
-- Only BohdiAI's server can run it (not a maker's screen, not the public site).
-- Function only: no table or column changes.

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

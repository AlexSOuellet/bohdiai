-- Recording a card sale the Square app took (Alex, 2026-10-21). Square hands the
-- result back to the phone's browser, which on an iPhone isn't signed in when the
-- market app lives on the home screen. So the server records it, once it has proved
-- the sale: a note signed with a secret only the server holds, used once, and
-- Square's own word that the card payment completed for that total. Only the server
-- can call this; no table or column changes.

create function public.market_record_card_sale(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_price_cents integer,
  p_variant_id uuid default null, p_quantity integer default 1)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_number text;
begin
  select m.order_number into v_number from public.market_order_internal(
    p_tenant_id, p_event_id, p_listing_id, 'paid', 'At the table', '', 'card', p_price_cents, 0, null, null,
    p_variant_id, p_quantity) m;
  return v_number;
end;
$function$;
revoke all on function public.market_record_card_sale(uuid, uuid, uuid, integer, uuid, integer) from public, anon, authenticated;
grant execute on function public.market_record_card_sale(uuid, uuid, uuid, integer, uuid, integer) to service_role;

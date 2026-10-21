-- A price agreed at the table (Alex, 2026-10-21: "there should be a way to modify a
-- price on the fly (customers haggle)"). A sale can carry what was knocked off its
-- marked price: the order keeps the marked price on its line and the difference as
-- its discount, labelled, so "How it sold" can show what was given away. Function
-- change only: both table-sale functions get an optional discount (0 when not sent,
-- so the code already live keeps working). No table or column changes.

drop function if exists public.market_record_sale(uuid, uuid, uuid, text, integer, uuid, integer);
create function public.market_record_sale(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_method text, p_price_cents integer,
  p_variant_id uuid default null, p_quantity integer default 1, p_discount_cents integer default 0)
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
    p_tenant_id, p_event_id, p_listing_id, 'paid', 'At the table', '', p_method, p_price_cents,
    coalesce(p_discount_cents, 0), 'Price agreed at the table', null, p_variant_id, p_quantity) m;
  return v_number;
end;
$function$;
revoke all on function public.market_record_sale(uuid, uuid, uuid, text, integer, uuid, integer, integer) from public, anon;
grant execute on function public.market_record_sale(uuid, uuid, uuid, text, integer, uuid, integer, integer) to authenticated, service_role;

drop function if exists public.market_record_card_sale(uuid, uuid, uuid, integer, uuid, integer);
create function public.market_record_card_sale(
  p_tenant_id uuid, p_event_id uuid, p_listing_id uuid, p_price_cents integer,
  p_variant_id uuid default null, p_quantity integer default 1, p_discount_cents integer default 0)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_number text;
begin
  select m.order_number into v_number from public.market_order_internal(
    p_tenant_id, p_event_id, p_listing_id, 'paid', 'At the table', '', 'card', p_price_cents,
    coalesce(p_discount_cents, 0), 'Price agreed at the table', null, p_variant_id, p_quantity) m;
  return v_number;
end;
$function$;
revoke all on function public.market_record_card_sale(uuid, uuid, uuid, integer, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.market_record_card_sale(uuid, uuid, uuid, integer, uuid, integer, integer) to service_role;

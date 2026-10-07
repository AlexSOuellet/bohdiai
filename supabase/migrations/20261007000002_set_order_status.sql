-- The maker moves an order along from the backend's Orders screen:
--   pending (new) → paid → fulfilled (handed over), or → canceled.
-- Stock follows the money: when an order becomes paid, each stocked piece in it
-- goes down by the quantity (a one-of-a-kind piece shows as sold out / adopted);
-- when a paid or handed-over order is canceled, the stock goes back.
-- Orders have no update policy, so this is security definer with the same admin
-- check every backend function makes.

create or replace function public.set_order_status(p_tenant_id uuid, p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_was_paid boolean;
  v_now_paid boolean;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'paid', 'fulfilled', 'canceled') then
    raise exception 'bad status' using errcode = '22023';
  end if;

  select status into v_old from orders where id = p_order_id and tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if v_old = p_status then
    return;
  end if;

  v_was_paid := v_old in ('paid', 'fulfilled');
  v_now_paid := p_status in ('paid', 'fulfilled');

  if v_now_paid and not v_was_paid then
    update listings l set inventory_count = greatest(l.inventory_count - i.quantity, 0)
    from order_items i
    where i.order_id = p_order_id and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  elsif v_was_paid and not v_now_paid then
    update listings l set inventory_count = l.inventory_count + i.quantity
    from order_items i
    where i.order_id = p_order_id and i.listing_id = l.id and l.tenant_id = p_tenant_id and l.inventory_count is not null;
  end if;

  update orders set
    status = p_status,
    paid_at = case when v_now_paid then coalesce(paid_at, now()) else null end,
    fulfilled_at = case when p_status = 'fulfilled' then coalesce(fulfilled_at, now()) else null end,
    canceled_at = case when p_status = 'canceled' then now() else null end
  where id = p_order_id;
end;
$$;

revoke all on function public.set_order_status(uuid, uuid, text) from public, anon;
grant execute on function public.set_order_status(uuid, uuid, text) to authenticated;

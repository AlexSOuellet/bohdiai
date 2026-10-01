-- Tick or untick one product for the home page straight from the products list.
-- Writes only listings.on_home, then applies the same at-most-5 rule save_product
-- does (non-archived, non-deleted), raising P0010 'home limit' so the whole change
-- rolls back. Security invoker: RLS and the admin check both apply.

create or replace function public.set_listing_on_home(p_tenant_id uuid, p_listing_id uuid, p_on_home boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update listings set on_home = p_on_home
  where id = p_listing_id and tenant_id = p_tenant_id and deleted_at is null
    and listing_type in ('product', 'digital_product')
  returning id into v_id;
  if v_id is null then
    raise exception 'product not found' using errcode = 'P0002';
  end if;

  if (
    select count(*) from listings
    where tenant_id = p_tenant_id and on_home and status <> 'archived' and deleted_at is null
  ) > 5 then
    raise exception 'home limit' using errcode = 'P0010', hint = 'home_limit';
  end if;
end;
$$;

revoke all on function public.set_listing_on_home(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_listing_on_home(uuid, uuid, boolean) to authenticated;

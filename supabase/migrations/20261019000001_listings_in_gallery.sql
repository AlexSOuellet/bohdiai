-- Showcase's gallery is built from the catalog (Alex, 2026-10-19): the maker ticks
-- up to 12 products to show; with none ticked the site shows the newest 12.
-- listings.in_gallery marks them. Only the products list writes it, through
-- set_listing_in_gallery, which refuses a thirteenth (P0011 'gallery limit') so the
-- whole change rolls back. save_product never touches it. Security invoker: RLS
-- and the admin check both apply.

alter table listings add column in_gallery boolean not null default false;

create or replace function public.set_listing_in_gallery(p_tenant_id uuid, p_listing_id uuid, p_in_gallery boolean)
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

  update listings set in_gallery = p_in_gallery
  where id = p_listing_id and tenant_id = p_tenant_id and deleted_at is null
    and listing_type in ('product', 'digital_product')
  returning id into v_id;
  if v_id is null then
    raise exception 'product not found' using errcode = 'P0002';
  end if;

  if (
    select count(*) from listings
    where tenant_id = p_tenant_id and in_gallery and status <> 'archived' and deleted_at is null
  ) > 12 then
    raise exception 'gallery limit' using errcode = 'P0011', hint = 'gallery_limit';
  end if;
end;
$$;

revoke all on function public.set_listing_in_gallery(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_listing_in_gallery(uuid, uuid, boolean) to authenticated;

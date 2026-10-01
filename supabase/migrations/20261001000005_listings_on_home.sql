-- The owner chooses which products the home page shows, at most 5.
-- listings.on_home marks them; save_product writes it and refuses a sixth
-- (non-archived, non-deleted) one with the distinct SQLSTATE P0010 'home limit',
-- so the app can tell it apart from the 'unknown photo' / 'unknown file' P0001s.
-- save_product is identical to 20261001000004 except on_home is written on insert
-- and update, and the limit is checked after the write.

alter table listings add column on_home boolean not null default false;

create or replace function public.save_product(p_tenant_id uuid, p jsonb, p_listing_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_attr uuid;
  v_option jsonb;
  v_choice jsonb;
  v_variant jsonb;
  v_media uuid[] := coalesce(array(select jsonb_array_elements_text(p->'media_ids'))::uuid[], '{}');
  v_collections uuid[] := coalesce(array(select jsonb_array_elements_text(p->'collection_ids'))::uuid[], '{}');
  v_files uuid[];
  i int;
  j int;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  -- Every photo must be this shop's live upload in the public media bucket.
  if exists (
    select 1 from unnest(v_media) m
    where not exists (
      select 1 from uploads u
      where u.id = m and u.tenant_id = p_tenant_id and u.deleted_at is null and u.storage_bucket = 'tenant-media'
    )
  ) then
    raise exception 'unknown photo' using errcode = 'P0001';
  end if;

  -- Every download file must be this shop's upload in the private bucket.
  v_files := array(
    select (p->>'file_upload_id')::uuid where p->>'file_upload_id' is not null
    union all
    select (c->>'file_upload_id')::uuid
    from jsonb_array_elements(coalesce(p->'options', '[]'::jsonb)) o,
         jsonb_array_elements(o->'choices') c
    where c->>'file_upload_id' is not null
  );
  if exists (
    select 1 from unnest(v_files) f
    where not exists (
      select 1 from uploads u
      where u.id = f and u.tenant_id = p_tenant_id and u.deleted_at is null and u.storage_bucket = 'tenant-files'
    )
  ) then
    raise exception 'unknown file' using errcode = 'P0001';
  end if;

  if p_listing_id is null then
    insert into listings (
      tenant_id, listing_type, slug, name, short_description, description, base_price_cents,
      status, inventory_tracked, inventory_count, media_ids, file_upload_id, requires_shipping, published_at,
      on_home
    ) values (
      p_tenant_id, p->>'listing_type', p->>'slug', p->>'name', p->>'short_description', p->>'description',
      (p->>'base_price_cents')::int, p->>'status',
      p->>'inventory_count' is not null, (p->>'inventory_count')::int,
      v_media, (p->>'file_upload_id')::uuid, p->>'listing_type' = 'product',
      case when p->>'status' = 'active' then now() end,
      coalesce((p->>'on_home')::boolean, false)
    )
    returning id into v_id;
  else
    update listings set
      listing_type = p->>'listing_type',
      name = p->>'name',
      short_description = p->>'short_description',
      description = p->>'description',
      base_price_cents = (p->>'base_price_cents')::int,
      status = p->>'status',
      inventory_tracked = p->>'inventory_count' is not null,
      inventory_count = (p->>'inventory_count')::int,
      media_ids = v_media,
      file_upload_id = (p->>'file_upload_id')::uuid,
      requires_shipping = p->>'listing_type' = 'product',
      published_at = case when p->>'status' = 'active' then coalesce(published_at, now()) else published_at end,
      is_preview = false,
      on_home = coalesce((p->>'on_home')::boolean, false)
    where id = p_listing_id and tenant_id = p_tenant_id and deleted_at is null
      and listing_type in ('product', 'digital_product')
    returning id into v_id;
    if v_id is null then
      raise exception 'product not found' using errcode = 'P0002';
    end if;
  end if;

  -- The home page shows at most 5 owner-chosen products.
  if (
    select count(*) from listings
    where tenant_id = p_tenant_id and on_home and status <> 'archived' and deleted_at is null
  ) > 5 then
    raise exception 'home limit' using errcode = 'P0010', hint = 'home_limit';
  end if;

  -- Options and their choices: replaced wholesale (choices are identified by value,
  -- and combinations reference names/values, not ids).
  delete from variation_attributes where listing_id = v_id;
  for i in 0 .. coalesce(jsonb_array_length(p->'options'), 0) - 1 loop
    v_option := p->'options'->i;
    insert into variation_attributes (tenant_id, listing_id, name, position)
    values (p_tenant_id, v_id, v_option->>'name', i)
    returning id into v_attr;
    for j in 0 .. jsonb_array_length(v_option->'choices') - 1 loop
      v_choice := v_option->'choices'->j;
      insert into variation_options (tenant_id, attribute_id, value, position, kind, file_upload_id)
      values (p_tenant_id, v_attr, v_choice->>'value', j, v_choice->>'kind', (v_choice->>'file_upload_id')::uuid);
    end loop;
  end loop;

  -- Combinations: never deleted (decision 4). Absent ones are archived; present ones upserted.
  update listing_variants lv set status = 'archived'
  where lv.listing_id = v_id
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) x
      where x->'combination' = lv.option_combination
    );
  for v_variant in select value from jsonb_array_elements(coalesce(p->'variants', '[]'::jsonb)) loop
    insert into listing_variants (tenant_id, listing_id, option_combination, price_cents, inventory_count, status)
    values (
      p_tenant_id, v_id, v_variant->'combination',
      (v_variant->>'price_cents')::int, (v_variant->>'inventory_count')::int,
      case when (v_variant->>'available')::boolean then 'active' else 'archived' end
    )
    on conflict (listing_id, option_combination) do update set
      price_cents = excluded.price_cents,
      inventory_count = excluded.inventory_count,
      status = excluded.status;
  end loop;

  -- Collections: drop memberships no longer chosen; append new ones at the end.
  delete from listing_collections where listing_id = v_id and collection_id <> all(v_collections);
  insert into listing_collections (tenant_id, listing_id, collection_id, position)
  select p_tenant_id, v_id, cid,
         coalesce((select max(lc.position) + 1 from listing_collections lc where lc.collection_id = cid), 0)
  from unnest(v_collections) as cid
  where exists (select 1 from collections c where c.id = cid and c.tenant_id = p_tenant_id and c.deleted_at is null)
    and not exists (select 1 from listing_collections lc where lc.listing_id = v_id and lc.collection_id = cid);

  return v_id;
end;
$$;

revoke all on function public.save_product(uuid, jsonb, uuid) from public, anon;
grant execute on function public.save_product(uuid, jsonb, uuid) to authenticated;

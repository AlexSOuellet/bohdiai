-- Saving a market saves how many of each piece the maker is bringing (market_stock,
-- 20261020000003), when the caller sends them: one row per piece, or per option of a
-- piece. Only pieces the market brings are kept; a blank count sends no row.

create or replace function public.save_market(p_tenant_id uuid, p jsonb, p_event_id uuid default null::uuid)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_cost jsonb;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_array_length(coalesce(p->'costs', '[]'::jsonb)) > 20 then
    raise exception 'too many costs' using errcode = 'P0030';
  end if;

  if p_event_id is null then
    if (select count(*) from events where tenant_id = p_tenant_id) >= 40 then
      raise exception 'market limit' using errcode = 'P0031';
    end if;
    insert into events (tenant_id, name, event_date, end_date, hours, location, address, booth, url, status,
                        organizer_name, organizer_phone, organizer_email, notes, rating, go_back, review)
    values (p_tenant_id, p->>'name', (p->>'event_date')::date, (p->>'end_date')::date, p->>'hours', p->>'location',
            p->>'address', p->>'booth', p->>'url', p->>'status', p->>'organizer_name', p->>'organizer_phone',
            p->>'organizer_email', p->>'notes', (p->>'rating')::smallint, p->>'go_back', p->>'review')
    returning id into v_id;
  else
    update events set
      name = p->>'name',
      event_date = (p->>'event_date')::date,
      end_date = (p->>'end_date')::date,
      hours = p->>'hours',
      location = p->>'location',
      address = p->>'address',
      booth = p->>'booth',
      url = p->>'url',
      status = p->>'status',
      organizer_name = p->>'organizer_name',
      organizer_phone = p->>'organizer_phone',
      organizer_email = p->>'organizer_email',
      notes = p->>'notes',
      rating = (p->>'rating')::smallint,
      go_back = p->>'go_back',
      review = p->>'review'
    where id = p_event_id and tenant_id = p_tenant_id
    returning id into v_id;
    if v_id is null then
      raise exception 'market not found' using errcode = 'P0002';
    end if;
  end if;

  -- The pieces she brings (market shop), when the caller sends them.
  if p ? 'listing_ids' then
    delete from market_listings where event_id = v_id;
    insert into market_listings (event_id, listing_id, tenant_id, position)
    select v_id, l.id, p_tenant_id, x.ord - 1
    from jsonb_array_elements_text(p->'listing_ids') with ordinality as x(id, ord)
    join listings l on l.id = x.id::uuid and l.tenant_id = p_tenant_id and l.deleted_at is null;
  end if;

  -- How many of each she brings, when the caller sends them.
  if p ? 'stock' then
    delete from market_stock where event_id = v_id;
    insert into market_stock (tenant_id, event_id, listing_id, listing_variant_id, brought)
    select p_tenant_id, v_id, m.listing_id, v.id, (x->>'brought')::int
    from jsonb_array_elements(p->'stock') x
    join market_listings m on m.event_id = v_id and m.listing_id = (x->>'listing_id')::uuid
    left join listing_variants v on v.id = nullif(x->>'variant_id', '')::uuid and v.listing_id = m.listing_id and v.tenant_id = p_tenant_id
    where (x->>'variant_id' is null or x->>'variant_id' = '' or v.id is not null)
    on conflict do nothing;
  end if;

  delete from event_expenses where event_id = v_id;
  for v_cost in select value from jsonb_array_elements(coalesce(p->'costs', '[]'::jsonb)) loop
    insert into event_expenses (event_id, tenant_id, description, amount_cents)
    values (v_id, p_tenant_id, v_cost->>'description', (v_cost->>'amount_cents')::int);
  end loop;

  return v_id;
end;
$function$;

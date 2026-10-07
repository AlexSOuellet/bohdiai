-- Markets (Market POS piece 1): every market a maker does, with everything about it.
-- Spec: docs/superpowers/specs/2026-10-07-market-pos-design.md
--
-- Public on the site: name, days, hours, town (location), address, booth, link (url),
-- canceled (status = 'canceled'). Private to the owner: costs (event_expenses),
-- organizer contact, notes, and her review (stars, go back, note).
--
-- The anon select policy from the old public calendar widget is dropped: no code
-- uses it (storefronts read with the service role) and it would now expose the
-- private columns.
--
-- save_market writes a market and replaces its cost lines in one go. Security
-- invoker: RLS and the admin check both apply.

alter table events
  add column if not exists hours text check (char_length(hours) <= 40),
  add column if not exists address text check (char_length(address) <= 160),
  add column if not exists booth text check (char_length(booth) <= 30),
  add column if not exists organizer_name text check (char_length(organizer_name) <= 80),
  add column if not exists organizer_phone text check (char_length(organizer_phone) <= 40),
  add column if not exists organizer_email text check (char_length(organizer_email) <= 254),
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists go_back text check (go_back in ('yes', 'maybe', 'no')),
  add column if not exists review text check (char_length(review) <= 1000);

drop policy if exists "anon reads upcoming events" on events;

create or replace function public.save_market(p_tenant_id uuid, p jsonb, p_event_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
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

  delete from event_expenses where event_id = v_id;
  for v_cost in select value from jsonb_array_elements(coalesce(p->'costs', '[]'::jsonb)) loop
    insert into event_expenses (event_id, tenant_id, description, amount_cents)
    values (v_id, p_tenant_id, v_cost->>'description', (v_cost->>'amount_cents')::int);
  end loop;

  return v_id;
end;
$$;

revoke all on function public.save_market(uuid, jsonb, uuid) from public, anon;
grant execute on function public.save_market(uuid, jsonb, uuid) to authenticated;

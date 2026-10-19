-- The gallery is its own added section (Alex, 2026-10-19; Project-Docs/Plan-Backends.md).
--
-- 1. site_sections gains 'gallery': the gallery's own heading, separate from the
--    products heading, since a site can show both.
-- 2. set_listing_in_gallery caps the ticks at 12 only on Showcase. Market and Full
--    have no limit.
-- 3. site_added_sections: which added sections a site's owner has switched on, one
--    row per site per section. Settings only (on or off), no words or photos. The
--    gallery is the first; the other planned added sections join the list later.
--    On Showcase the gallery is always on through the plan, so it needs no row.

alter table site_sections drop constraint site_sections_section_check;
alter table site_sections add constraint site_sections_section_check check (section in (
  'work', 'collections', 'makes', 'about', 'reviews', 'markets', 'close', 'contact', 'gallery'
));

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

  -- Showcase shows up to 12; Market and Full have no limit.
  if exists (select 1 from tenants where id = p_tenant_id and plan = 'showcase') and (
    select count(*) from listings
    where tenant_id = p_tenant_id and in_gallery and status <> 'archived' and deleted_at is null
  ) > 12 then
    raise exception 'gallery limit' using errcode = 'P0011', hint = 'gallery_limit';
  end if;
end;
$$;

create table if not exists site_added_sections (
  tenant_id uuid not null references tenants(id) on delete cascade,
  section text not null check (section in ('gallery')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, section)
);

create trigger site_added_sections_set_updated_at
  before update on site_added_sections
  for each row execute function set_updated_at();

alter table site_added_sections enable row level security;

create policy site_added_sections_admin_select on site_added_sections
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_added_sections_admin_insert on site_added_sections
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_added_sections_admin_update on site_added_sections
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_added_sections_admin_delete on site_added_sections
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_added_sections is
  'Which added sections (the gallery first) a site''s owner has switched on. Settings only. Spec: Project-Docs/Plan-Backends.md, the gallery section.';

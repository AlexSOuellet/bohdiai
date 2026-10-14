-- One home per piece (Modular Plan rule 1; Alex 2026-10-14).
--
-- The moment held three words that already have a home:
--   site_moments.kicker    the short line above the name  -> site_profiles.kicker
--   site_moments.headline  the big name                   -> the business name (tenants.business_name)
--   site_moments.sub       the line under the name         -> site_profiles.headline
-- Every design now reads them from About you and the business name, so a change in
-- About you shows everywhere. The moment keeps only what is its own: story lines,
-- buttons, play setting, photo or video and extra photos.
--
-- Words already in About you stay; the moment's are only copied where About you is
-- empty. Then the three columns go.

update public.site_profiles p
set kicker = coalesce(p.kicker, m.kicker),
    headline = coalesce(p.headline, m.sub)
from public.site_moments m
where m.tenant_id = p.tenant_id
  and ((p.kicker is null and m.kicker is not null) or (p.headline is null and m.sub is not null));

insert into public.site_profiles (tenant_id, kicker, headline)
select m.tenant_id, m.kicker, m.sub
from public.site_moments m
where not exists (select 1 from public.site_profiles p where p.tenant_id = m.tenant_id)
  and (m.kicker is not null or m.sub is not null);

alter table public.site_moments
  drop column kicker,
  drop column headline,
  drop column sub;

comment on table public.site_moments is
  'A site''s moment (the hero): story lines, buttons, play setting, and its photo or video as an upload. The line above the name and the line under it live in site_profiles; the name is tenants.business_name. Spec: Project-Docs/Modular-Plan.md step 2.';

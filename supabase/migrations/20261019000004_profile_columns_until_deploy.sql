-- The live code (main) still reads these site_profiles columns, and the database is
-- shared, so dropping them in 20261019000003 took the live sites down. Put them back,
-- filled from their new homes, until the code that reads the new homes is live. A
-- later migration drops them again after that deploy (Session 109).

alter table site_profiles add column marquee_phrases text[] check (marquee_phrases is null or cardinality(marquee_phrases) between 1 and 12);
alter table site_profiles add constraint site_profiles_marquee_phrase_length check (site_marquee_phrases_ok(marquee_phrases));
alter table site_profiles add column phone text check (phone is null or char_length(phone) between 7 and 25);
alter table site_profiles add column facebook_url text check (facebook_url is null or facebook_url ~ '^https://([a-z0-9-]+\.)*facebook\.com/');
alter table site_profiles add column instagram_url text check (instagram_url is null or instagram_url ~ '^https://([a-z0-9-]+\.)*instagram\.com/');
alter table site_profiles add column about_title text check (about_title is null or char_length(about_title) between 1 and 80);

update site_profiles p set marquee_phrases = m.phrases from site_marquees m where m.tenant_id = p.tenant_id;
update site_profiles p set phone = c.phone from site_contacts c where c.tenant_id = p.tenant_id;
update site_profiles p set facebook_url = s.url from site_socials s where s.tenant_id = p.tenant_id and s.network = 'facebook';
update site_profiles p set instagram_url = s.url from site_socials s where s.tenant_id = p.tenant_id and s.network = 'instagram';
update site_profiles p set about_title = left(s.title, 80) from site_sections s where s.tenant_id = p.tenant_id and s.section = 'about' and s.title is not null;

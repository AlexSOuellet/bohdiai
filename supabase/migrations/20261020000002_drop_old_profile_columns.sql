-- The old About-you columns come off now that the code reading their new homes is
-- live (Session 109's split; put back by 20261019000004 until the deploy, merged
-- 2026-10-20). Checked before dropping: no code, view or function reads them, and
-- every value matches its new home (site_marquees, site_contacts, site_socials, the
-- 'about' section words); the one difference was a link added later in the new home.

alter table site_profiles drop constraint if exists site_profiles_marquee_phrase_length;
alter table site_profiles drop column marquee_phrases;
alter table site_profiles drop column phone;
alter table site_profiles drop column facebook_url;
alter table site_profiles drop column instagram_url;
alter table site_profiles drop column about_title;

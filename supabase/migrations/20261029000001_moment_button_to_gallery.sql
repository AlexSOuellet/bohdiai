-- The opening's buttons may jump down to the gallery (Alex, Session 118): Paper &
-- Patina's "See the work" goes back to the pieces on its one page, as its old
-- show reel opening did. Showcase has no shop, so the gallery is where its work is.
alter table public.site_moments drop constraint site_moments_cta_target_check;
alter table public.site_moments add constraint site_moments_cta_target_check
  check (cta_target is null or cta_target in ('home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials', 'gallery'));

alter table public.site_moments drop constraint site_moments_second_cta_target_check;
alter table public.site_moments add constraint site_moments_second_cta_target_check
  check (second_cta_target is null or second_cta_target in ('home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials', 'gallery'));

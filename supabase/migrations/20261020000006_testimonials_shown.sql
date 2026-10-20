-- Which testimonials show on the site (Alex, 2026-10-20). On Market the site shows
-- the ticked ones, up to three, or the first three in her order until any are
-- ticked; Full shows them all. Nothing is ticked to start with.

alter table site_testimonials add column shown boolean not null default false;

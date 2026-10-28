-- Home page section switches (Alex, 2026-10-27): a maker turns any section of her
-- home page on or off from My site.
--
-- site_added_sections already held the gallery's switch: one row per site per
-- section, on or off, settings only. It becomes the one home for every home page
-- section's switch, so the gallery isn't a special case and no second switch
-- exists anywhere. The keys are the site's section names (as in site_sections),
-- plus the scrolling line.
--
-- No row means the design decides: every section shows when it has something in
-- it, except the gallery, which a Market or Full site turns on itself (Showcase's
-- gallery is always on through its plan). So no live site changes until a maker
-- flips a switch.
--
-- The table's name still says "added sections"; the live site reads it by that
-- name, so it is renamed only after the code that reads it is live.

alter table site_added_sections drop constraint if exists site_added_sections_section_check;
alter table site_added_sections add constraint site_added_sections_section_check check (section in (
  'work', 'about', 'markets', 'collections', 'reviews', 'gallery', 'contact', 'close', 'marquee'
));

comment on table site_added_sections is
  'Whether each home page section shows, one row per site per section (Alex, 2026-10-27; the gallery first, 2026-10-19). No row: the design decides. Settings only.';

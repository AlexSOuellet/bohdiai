-- Free sites (Alex, 2026-10-16): some makers pay nothing. Two kinds:
--   free      nothing to pay on any plan (Cut-Pro, Mazzone, Rose n' Cat)
--   showcase  Showcase costs nothing; on Market or Full they pay that plan's
--             normal price (a free Showcase offered as good marketing)
-- Blank is everyone else, who pays normally. A trial month or a percent off can
-- join this setting later. The note says why, for Alex only.

alter table tenants add column plan_comp text check (plan_comp in ('free', 'showcase'));
alter table tenants add column plan_comp_note text check (char_length(plan_comp_note) <= 500);

comment on column tenants.plan_comp is
  'Free site: free (nothing to pay on any plan) or showcase (Showcase free, higher plans at their normal price); null pays normally.';
comment on column tenants.plan_comp_note is
  'Why the site is free, for Alex only.';

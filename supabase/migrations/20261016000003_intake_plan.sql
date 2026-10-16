-- The plan a maker signed up on (Alex, 2026-10-16): the pricing page's buttons open
-- the intake form with the plan and monthly-or-yearly filled in, and the form sends
-- both. Like the family, the plan is checked against the plan list in the code
-- (lib/site/plans.ts) when the form is sent, so the table holds no list of its own.
-- The form requires both; the columns allow null only so the form already live
-- (which doesn't send them yet) keeps saving until this change deploys.

alter table intakes add column plan text check (plan ~ '^[a-z][a-z0-9-]{0,39}$');
alter table intakes add column billing text check (billing in ('monthly', 'yearly'));

comment on column intakes.plan is
  'The maker plan they signed up on (its tier: showcase, lite or full), checked against lib/site/plans.ts when the form is sent.';
comment on column intakes.billing is
  'How they pay: monthly or yearly.';

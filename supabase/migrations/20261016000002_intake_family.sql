-- The intake form lists every family there is, now and later (Alex, 2026-10-16:
-- "It should all present and future"). The form reads the families from the code,
-- so the table stops holding its own list of six: it stores the family's internal
-- name (checked against the family list when the form is sent), and the column is
-- named for what it holds. Makers still see the word "mood".

alter table intakes drop constraint if exists intakes_mood_check;
alter table intakes rename column mood to family;
alter table intakes add constraint intakes_family_check check (family ~ '^[a-z][a-z0-9-]{0,39}$');

comment on column intakes.family is
  'The family the maker picked (its internal name, e.g. luxury); null is "you pick for me". Checked against the family list in the code when the form is sent.';

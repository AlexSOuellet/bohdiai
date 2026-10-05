-- What I make: up to three short phrases the owner writes in About you; the
-- card site's bulletin board design shows them in the strip under the name.
-- Spec: docs/superpowers/specs/2026-10-05-card-bulletin-design.md.
create or replace function site_profile_makes_ok(makes text[]) returns boolean
  language sql immutable
  as $$
    select cardinality(makes) between 1 and 3
       and array_position(makes, null) is null
       and coalesce((select bool_and(char_length(m) between 1 and 30) from unnest(makes) as m), false)
  $$;

alter table site_profiles
  add column if not exists makes text[]
  check (makes is null or site_profile_makes_ok(makes));

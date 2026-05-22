-- Shared updated_at trigger. Spec sections repeatedly say "updated_at maintained
-- by a database trigger (covered in a later section)" — this is that section.
-- Every table whose spec mentions an updated_at trigger attaches this function.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Back-attach to tenants (created in 20260522000001 before this trigger existed).
create trigger tenants_set_updated_at
  before update on tenants
  for each row
  execute function set_updated_at();

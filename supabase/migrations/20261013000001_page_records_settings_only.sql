-- Page records hold settings only (Modular Plan, step 1.2; Alex 2026-10-13).
-- A page's saved record says which design and which look, never words, photos
-- or dates. Every piece of content has its own home that any design can read.
--
-- This rule applies to new saves only. Records that already hold content stay
-- readable exactly as they are; they just can't be rewritten with content. A
-- save that leaves layout_tree untouched (a status or title change) passes.
-- Covers the published page (content_pages) and the editor's draft
-- (store_drafts), which holds the same tree.
--
-- The allowed shape:
--   { root: { kind, archetypeKey, lookKey, mood, accentOverride, brandPalette,
--             texture, catalogSize, previousLook,
--             content: { design: '<design key>' } },
--     meta: { title } }
-- meta.title is the business name repeated for the browser tab. It is allowed
-- for now and moves to read from the business record when the homes are built.

create or replace function page_tree_settings_problem(p_tree jsonb)
returns text
language plpgsql
immutable
as $$
declare
  root jsonb;
  content jsonb;
  bad text;
begin
  if p_tree is null then return null; end if;
  if jsonb_typeof(p_tree) <> 'object' then return 'the page record must be an object'; end if;

  select string_agg(k, ', ') into bad
  from jsonb_object_keys(p_tree) k where k not in ('root', 'meta');
  if bad is not null then return format('unknown part of the page record: %s', bad); end if;

  if p_tree ? 'meta' then
    if jsonb_typeof(p_tree->'meta') <> 'object' then return 'meta must be an object'; end if;
    select string_agg(k, ', ') into bad
    from jsonb_object_keys(p_tree->'meta') k where k <> 'title';
    if bad is not null then return format('meta can only hold the title, found: %s', bad); end if;
  end if;

  root := p_tree->'root';
  if root is null then return null; end if;
  if jsonb_typeof(root) <> 'object' then return 'root must be an object'; end if;

  select string_agg(k, ', ') into bad
  from jsonb_object_keys(root) k
  where k not in ('kind', 'archetypeKey', 'lookKey', 'mood', 'accentOverride',
                  'brandPalette', 'texture', 'catalogSize', 'previousLook', 'content');
  if bad is not null then return format('the page record can only hold settings, found: %s', bad); end if;

  content := root->'content';
  if content is null or content = 'null'::jsonb then return null; end if;
  if jsonb_typeof(content) <> 'object' then return 'content must be an object'; end if;

  select string_agg(k, ', ') into bad
  from jsonb_object_keys(content) k where k <> 'design';
  if bad is not null then
    return format('content belongs in its own home, not the page record (found: %s)', bad);
  end if;
  if content ? 'design' and jsonb_typeof(content->'design') <> 'string' then
    return 'content.design must be a design key';
  end if;
  return null;
end;
$$;

create or replace function enforce_page_tree_settings_only()
returns trigger
language plpgsql
as $$
declare
  problem text;
begin
  if tg_op = 'UPDATE' and new.layout_tree is not distinct from old.layout_tree then
    return new;
  end if;
  problem := page_tree_settings_problem(new.layout_tree);
  if problem is not null then
    raise exception 'Page records hold settings only: %', problem
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists content_pages_settings_only on content_pages;
create trigger content_pages_settings_only
  before insert or update of layout_tree on content_pages
  for each row execute function enforce_page_tree_settings_only();

drop trigger if exists store_drafts_settings_only on store_drafts;
create trigger store_drafts_settings_only
  before insert or update of layout_tree on store_drafts
  for each row execute function enforce_page_tree_settings_only();

-- Mood lineup v2 — the seven feelings replace the old seven.
--   Removed (color-as-mood / folded-into-a-feeling):
--     sunset    → cozy     (golden-hour warmth folds into warm + welcoming)
--     simple    → elegant  (restraint / minimal folds into refined)
--     botanical → rustic   (natural / plants folds into natural-materials)
--   Kept unchanged: dark, rustic, cozy, modern.
--   Added (no existing rows): elegant, playful, industrial.
--
-- Color is no longer a mood — it became a layer the crew picks inside the mood,
-- which is why the color-named moods (sunset/botanical) retire into feelings.
--
-- Updates every place a mood key is stored: the tenant, the design_choices log,
-- and the stored archetype envelope (content_pages.layout_tree -> root -> mood).

update tenants set mood_key = 'cozy'    where mood_key = 'sunset';
update tenants set mood_key = 'elegant' where mood_key = 'simple';
update tenants set mood_key = 'rustic'  where mood_key = 'botanical';

update design_choices set mood_key = 'cozy'    where mood_key = 'sunset';
update design_choices set mood_key = 'elegant' where mood_key = 'simple';
update design_choices set mood_key = 'rustic'  where mood_key = 'botanical';

-- The archetype envelope stores the mood at layout_tree.root.mood; remap it so a
-- re-render and the dashboard see a current feeling, not a retired one.
update content_pages
  set layout_tree = jsonb_set(layout_tree, '{root,mood}', '"cozy"')
  where layout_tree #>> '{root,mood}' = 'sunset';
update content_pages
  set layout_tree = jsonb_set(layout_tree, '{root,mood}', '"elegant"')
  where layout_tree #>> '{root,mood}' = 'simple';
update content_pages
  set layout_tree = jsonb_set(layout_tree, '{root,mood}', '"rustic"')
  where layout_tree #>> '{root,mood}' = 'botanical';

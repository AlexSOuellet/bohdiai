-- D58 — rename the Playful mood to Cheerful.
--
-- "Playful" promised kid-energy / toy-store wink that only one skin on the
-- shelf (Bubblegum) actually delivers; the other five (Confetti, Sprout,
-- Wildflower, Pantry, Pigment) are bright and cheerful but not playful. A
-- maker picking Cheerful sees what the word said. Shelf composition is
-- unchanged; this is a label rename across every place the key is stored.

update tenants set mood_key = 'cheerful' where mood_key = 'playful';

update design_choices set mood_key = 'cheerful' where mood_key = 'playful';

-- The archetype envelope stores the mood at layout_tree.root.mood; remap so
-- a re-render and the dashboard see the current feeling.
update content_pages
  set layout_tree = jsonb_set(layout_tree, '{root,mood}', '"cheerful"')
  where layout_tree #>> '{root,mood}' = 'playful';

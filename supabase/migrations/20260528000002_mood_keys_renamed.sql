-- Mood-key rename to plain category labels.
--   dark-and-stormy → dark
--   warm-and-cozy   → cozy
--   wild-meadow     → botanical
--   summer-afternoon → sunset (intent retargeted from "bright midday" to "golden hour")
--   sunday-morning  → simple
--   bright-bazaar   → removed (cut from lineup as off-fit for makers)
--   (new)           → modern
-- rustic is unchanged.
--
-- The change is purely cosmetic on existing rows — we update tenants and
-- design_choices that reference the old keys. bright-bazaar tenants are mapped
-- to modern as the closest replacement; if any real tenants exist on
-- bright-bazaar (none do at this point in Phase 1), they should be re-picked.

update tenants set mood_key = 'dark'      where mood_key = 'dark-and-stormy';
update tenants set mood_key = 'cozy'      where mood_key = 'warm-and-cozy';
update tenants set mood_key = 'botanical' where mood_key = 'wild-meadow';
update tenants set mood_key = 'sunset'    where mood_key = 'summer-afternoon';
update tenants set mood_key = 'simple'    where mood_key = 'sunday-morning';
update tenants set mood_key = 'modern'    where mood_key = 'bright-bazaar';

update design_choices set mood_key = 'dark'      where mood_key = 'dark-and-stormy';
update design_choices set mood_key = 'cozy'      where mood_key = 'warm-and-cozy';
update design_choices set mood_key = 'botanical' where mood_key = 'wild-meadow';
update design_choices set mood_key = 'sunset'    where mood_key = 'summer-afternoon';
update design_choices set mood_key = 'simple'    where mood_key = 'sunday-morning';
update design_choices set mood_key = 'modern'    where mood_key = 'bright-bazaar';

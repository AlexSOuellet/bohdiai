/**
 * The D41 wiring: gate skin choice to the maker's mood.
 *
 * Every skin is tagged with the maker-facing feelings it can wear
 * (MAIN_STREET_SKIN_TAGS), drawn from the same seven moods the maker picks — so
 * the gate is now a direct membership test, no translation layer. It is a
 * STRUCTURAL gate on the maker's chosen mood (like catalog size gating the
 * archetype menu), not creative steering: the Graphic Artist still picks freely
 * within the subset.
 */
import type { MoodKey } from '@/lib/moods';
import { MAIN_STREET_SKIN_TAGS } from './skins';

/** The skins that can wear the maker's chosen feeling — the subset the Graphic
 *  Artist may pick from. Falls back to the whole shelf only if a mood somehow
 *  matched nothing (it shouldn't — every mood has 6+ skins), so a build never stalls. */
export function moodAlignedSkins(moodKey: MoodKey): string[] {
  const matched = Object.entries(MAIN_STREET_SKIN_TAGS)
    .filter(([, tag]) => (tag.moods as readonly string[]).includes(moodKey))
    .map(([key]) => key);
  return matched.length > 0 ? matched : Object.keys(MAIN_STREET_SKIN_TAGS);
}

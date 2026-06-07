/**
 * The D41 wiring: gate skin choice to the maker's mood.
 *
 * Every skin is tagged with its world + a few mood words (MAIN_STREET_SKIN_TAGS),
 * but that metadata was read by nothing in selection — Bohdi free-picked off the
 * text descriptions with mood as a loose hint, which is how a "modern" shop landed
 * a cream-and-didone skin. This connects the two.
 *
 * The seven maker-facing moods and the skins' tag vocabulary are not the same
 * words (the skins carry no "botanical"/"sunset"/"simple" tag), so this map is the
 * bridge: each mood → the skin-tag words that express it. It is a STRUCTURAL gate
 * on the maker's chosen mood (like catalog size gating the archetype menu), not
 * creative steering — the Graphic Artist still picks freely within the subset.
 * Kept as data so it can be inspected and tuned.
 */
import type { MoodKey } from '@/lib/moods';
import { MAIN_STREET_SKIN_TAGS } from './skins';

export const MOOD_SKIN_TAGS: Record<MoodKey, string[]> = {
  dark: ['dark', 'candlelit', 'moody', 'occult', 'intense', 'ritual'],
  rustic: ['rustic', 'warm', 'handmade', 'earthy', 'natural', 'daylight', 'aged', 'nostalgic', 'rugged'],
  cozy: ['cozy', 'warm', 'homey', 'candlelit', 'golden', 'harvest', 'soft', 'gentle'],
  botanical: ['earthy', 'natural', 'seasonal', 'green', 'airy', 'classical', 'meadow'],
  sunset: ['golden', 'harvest', 'warm', 'retro', 'mid-century', 'vintage', 'aged', 'rich'],
  simple: ['quiet', 'fine', 'sharp', 'stark', 'airy', 'plain', 'soft', 'gentle', 'classical', 'modern'],
  modern: ['modern', 'sharp', 'stark', 'industrial', 'bold', 'vivid', 'graphic', 'street', 'loud', 'cool'],
};

/** The skins whose mood tags align with the maker's chosen mood — the subset the
 *  Graphic Artist may pick from. Falls back to the whole shelf only if a mood
 *  somehow matched nothing (it shouldn't), so a build never stalls. */
export function moodAlignedSkins(moodKey: MoodKey): string[] {
  const wanted = new Set(MOOD_SKIN_TAGS[moodKey]);
  const matched = Object.entries(MAIN_STREET_SKIN_TAGS)
    .filter(([, tag]) => tag.moods.some((m) => wanted.has(m)))
    .map(([key]) => key);
  return matched.length > 0 ? matched : Object.keys(MAIN_STREET_SKIN_TAGS);
}

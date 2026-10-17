/**
 * bohdiai.com/looks — one real sample site shown in every mood (Alex, Session
 * 107): the same bread, the same words, so the only thing that changes is the
 * look. Each mood opens in that family's own main skin.
 */
import { FAMILIES, FAMILY_KEYS, type FamilyKey } from '@/lib/archetypes/main-street/families';
import { MAIN_STREET_SKINS } from '@/lib/archetypes/main-street/skins';
import { REFERENCE_LABELS } from '@/lib/archetypes/main-street/defaults';
import type { MoodKey } from '@/lib/moods';

/** The sample every mood is shown on. */
export const LOOKS_SAMPLE = { subdomain: 'classic-loafs', name: 'Classic Loafs' } as const;

export const LOOKS_WORDS = {
  metaTitle: 'See every look — BohdiAI',
  metaDescription: 'One real sample shop, Classic Loafs, shown in every mood a BohdiAI site can wear.',
  kicker: 'The looks',
  title: 'One shop, every mood',
  lede: 'Same bread, same words. Pick a mood to see the whole site change.',
  moods: 'Moods',
  computer: 'Computer',
  phone: 'Phone',
  view: 'View',
  open: 'Open this look ↗',
  frameTitle: 'Classic Loafs in the {mood} mood',
} as const;

export type Look = { family: FamilyKey; mood: MoodKey; label: string; skin: string; swatch: readonly [string, string, string] };

/** The public mood word for a family (Elegant is the Luxury family). */
function moodOf(family: FamilyKey): MoodKey {
  return family === 'luxury' ? 'elegant' : family;
}

export const LOOKS: readonly Look[] = FAMILY_KEYS.map((family) => {
  const mood = moodOf(family);
  const skin = FAMILIES[family].defaultSkin;
  const p = MAIN_STREET_SKINS[skin]?.palette;
  return {
    family,
    mood,
    label: REFERENCE_LABELS.moods.labels[mood],
    skin,
    swatch: [p?.bg ?? '#000000', p?.fg ?? '#ffffff', p?.accent ?? '#888888'] as const,
  };
});

/** The sample's address in a mood, on the live site or on this computer. */
export function lookUrl(look: Pick<Look, 'mood' | 'skin'>, local: boolean): string {
  const origin = local ? `http://${LOOKS_SAMPLE.subdomain}.localhost:3000` : `https://${LOOKS_SAMPLE.subdomain}.bohdiai.com`;
  return `${origin}/?previewMood=${look.mood}&previewLook=${look.skin}`;
}

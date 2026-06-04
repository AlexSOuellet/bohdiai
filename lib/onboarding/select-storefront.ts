/**
 * Selection — turn a maker's facts into an archetype + skin. Deterministic: the
 * same niche + mood + catalog size always resolves to the same store dress. The
 * maker never picks a layout; the engine decides from what their business IS.
 *
 * Skin is SELECTED here, never authored (color/font is selection, not Bohdi's
 * job — composition is the thing he breaks). Skins are tagged by niche CHARACTER
 * (rugged/delicate/homey), so a niche inherits a whole character's skins and the
 * shelf never grows a per-niche list.
 */
import type { MoodKey } from '@/lib/moods';
import { MAIN_STREET_SKIN_TAGS } from '@/lib/archetypes/main-street/skins';

export type NicheCharacter = 'homey' | 'rugged' | 'delicate';

/** Niche → character. The ONE place niches are classified; skins never list
 *  niches. A new niche adds one line here and inherits its character's skins. */
const NICHE_CHARACTER: Record<string, NicheCharacter> = {
  baker: 'homey',
  candles: 'homey',
  soap_and_bath: 'homey',
  photo_magnet_maker: 'homey',
  leatherworker: 'rugged',
  woodworker: 'rugged',
  sewing_alterations: 'rugged',
  florist: 'delicate',
  herbalist: 'delicate',
  jewelry_maker: 'delicate',
  ceramicist: 'delicate',
  fine_artist: 'delicate',
  printmaker: 'delicate',
  photographer: 'delicate',
  tattoo_artist: 'rugged',
  vintage_reseller: 'delicate',
  crocheter: 'homey',
  knitter: 'homey',
  quilter: 'homey',
};

export function characterFor(nicheSlug: string): NicheCharacter {
  return NICHE_CHARACTER[nicheSlug] ?? 'homey';
}

/** Within a character, pick a skin deterministically, nudged by mood. Every
 *  branch resolves to a skin that exists on the shelf and matches the character. */
export function selectSkin(character: NicheCharacter, mood: MoodKey): string {
  if (character === 'rugged') {
    if (mood === 'dark' || mood === 'modern') return 'main-street-forge';
    if (mood === 'simple') return 'main-street-anvil';
    return 'main-street-tannery'; // rustic / cozy / sunset / botanical → warm leather
  }
  if (character === 'delicate') {
    if (mood === 'modern' || mood === 'simple') return 'main-street-atelier';
    if (mood === 'botanical' || mood === 'rustic') return 'main-street-botanical';
    return 'main-street-porcelain'; // cozy / sunset / dark → romantic
  }
  return 'main-street-ember'; // homey
}

export interface StorefrontSelection {
  archetypeKey: string;
  skinKey: string;
  character: NicheCharacter;
}

/**
 * Choose the archetype + skin. Main Street is the realized archetype today (a
 * niche-neutral sales page that fits most makers); more archetypes register
 * later and selection widens here — not in the engine. `productCount` is plumbed
 * for the catalog-size dimension (it already drives the goods treatment inside
 * Main Street) and will steer archetype choice as the shelf of shapes grows.
 */
export function selectStorefront(
  nicheSlug: string,
  mood: MoodKey,
  _productCount: number,
): StorefrontSelection {
  const character = characterFor(nicheSlug);
  const skinKey = selectSkin(character, mood);
  // Guard: the picked skin must match the niche's character.
  const tag = MAIN_STREET_SKIN_TAGS[skinKey];
  const resolved = tag && tag.character === character ? skinKey : fallbackSkin(character);
  return { archetypeKey: 'main-street', skinKey: resolved, character };
}

function fallbackSkin(character: NicheCharacter): string {
  if (character === 'rugged') return 'main-street-tannery';
  if (character === 'delicate') return 'main-street-porcelain';
  return 'main-street-ember';
}

/**
 * Rollout gate — which niches the NEW archetype engine builds today. A temporary
 * allow-list while the new path proves out, NOT per-archetype engine code: niches
 * outside it fall back to the existing generation paths. Expands as confidence
 * grows; eventually every niche routes through selection.
 */
const ARCHETYPE_NICHES = new Set<string>([
  'leatherworker',
  'woodworker',
  'baker',
  'florist',
  'jewelry_maker',
  'ceramicist',
  'herbalist',
  'soap_and_bath',
]);

export function usesArchetypeEngine(nicheSlug: string): boolean {
  return ARCHETYPE_NICHES.has(nicheSlug);
}

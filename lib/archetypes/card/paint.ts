/**
 * Business card — what it paints with, always from our families (card site spec):
 * the family (from the envelope's mood) gives the type package and wallpaper; one
 * of that family's skins gives the colors. A shop with its own brand palette
 * paints in that instead, still in the family's type and wallpaper.
 */
import { deriveBrandPalette, type BrandPalette, type DerivedPalette } from '@/lib/color/brand-palette';
import { getFamily, type Family } from '@/lib/archetypes/main-street/families';
import { MAIN_STREET_SKINS, MAIN_STREET_SKIN_TAGS } from '@/lib/archetypes/main-street/skins';

export type CardPaint = { family: Family; palette: DerivedPalette; skinKey: string };

/** Skin tags use public mood words; Luxury's public word is "elegant". */
const publicMood = (family: Family): string => (family.key === 'luxury' ? 'elegant' : family.key);

/** The skin to paint with: the stored one when it belongs to the family, else the family's own default. */
export function cardSkinKey(family: Family, lookKey: string | undefined): string {
  if (lookKey !== undefined && MAIN_STREET_SKINS[lookKey] !== undefined && MAIN_STREET_SKIN_TAGS[lookKey]?.moods.includes(publicMood(family)) === true) {
    return lookKey;
  }
  return family.defaultSkin;
}

export function cardPaint(args: { mood: string | undefined; lookKey: string | undefined; brandPalette: BrandPalette | undefined }): CardPaint {
  const family = getFamily(args.mood);
  const skinKey = cardSkinKey(family, args.lookKey);
  if (args.brandPalette !== undefined) return { family, skinKey, palette: deriveBrandPalette(args.brandPalette).palette };
  const skin = MAIN_STREET_SKINS[skinKey];
  if (skin === undefined) throw new Error(`Family ${family.key} names a missing skin: ${skinKey}`);
  const p = skin.palette;
  return {
    family,
    skinKey,
    palette: {
      bg: p.bg,
      fg: p.fg,
      fgMuted: p.fgMuted,
      accent: p.accent,
      rule: p.rule,
      onAccent: p.onAccent ?? p.bg,
      contrast: p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.bg },
    },
  };
}

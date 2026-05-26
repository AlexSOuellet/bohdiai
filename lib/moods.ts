export type MoodKey =
  | 'dark-and-stormy'
  | 'rustic'
  | 'warm-and-cozy'
  | 'summer-afternoon'
  | 'wild-meadow'
  | 'bright-bazaar'
  | 'sunday-morning';

export interface MoodTokenHints {
  palette: string;
  typography: string;
  shape: string;
  spacing: string;
}

export interface Mood {
  key: MoodKey;
  label: string;
  /** What this mood evokes — the AI reads this when generating design tokens and copy. */
  description: string;
  /** Guidance to the AI on home-page block order and emphasis for this mood. */
  blockAssemblyHint: string;
  /** Directional hints for token generation. Not exact values — the AI resolves these to specific colors/fonts. */
  tokenHints: MoodTokenHints;
}

export const MOODS: Record<MoodKey, Mood> = {
  'dark-and-stormy': {
    key: 'dark-and-stormy',
    label: 'Dark and Stormy',
    description:
      'Dramatic and moody. Deep darks, rich contrasts, an air of intention and edge. For makers whose work owns its darkness — occult candles, dark art, gothic jewelry, leather goods, anything that refuses to be cheerful.',
    blockAssemblyHint:
      'Lead with a hero that puts the maker\'s story front and center. The narrative comes before the sell. Follow with a curated products section showing depth, not breadth. Close with a restrained CTA.',
    tokenHints: {
      palette:
        'background (#1a1a1a to #2a2a2a range — deep charcoal or near-black). surface slightly lighter than background. text off-white or warm cream. accent warm amber, blood-red, or deep rust — one strong color only. border very dark gray. Never use a light or mid-tone background for this mood.',
      typography:
        'dramatic serif or high-contrast display heading, medium-weight readable body',
      shape: 'sharp edges, minimal rounding — nothing soft or approachable',
      spacing: 'spacious — let the darkness breathe',
    },
  },

  rustic: {
    key: 'rustic',
    label: 'Rustic',
    description:
      'Natural materials, honest craft. Worn wood, linen, earthy pigments. For makers whose work is rooted in tradition — woodworkers, soap makers, farm stands, weavers, canners, herbalists.',
    blockAssemblyHint:
      'Open with a warm hero that shows the craft process or raw materials, not a polished product shot. Follow with featured products, then a brief maker story grounded in place and practice.',
    tokenHints: {
      palette:
        'background warm cream, parchment, or off-white (#f5ede0 to #ede0cc range) — never dark, never green. surface slightly deeper warm cream or linen. text deep brown or near-black. accent rust, ochre, or burnt sienna. border warm tan. Forest or hunter green may appear as accent only, never as background or surface.',
      typography:
        'chunky slab serif or weathered display heading, generous readable body',
      shape: 'slight organic rounding — natural, not perfectly sharp or perfectly round',
      spacing: 'comfortable and unhurried',
    },
  },

  'warm-and-cozy': {
    key: 'warm-and-cozy',
    label: 'Warm and Cozy',
    description:
      'Hygge-adjacent. Soft warmth, layered comfort, the feeling of a well-lit room at the end of the day. For makers whose work belongs in a home — candle makers, textile artists, bakers, comfort-food creators.',
    blockAssemblyHint:
      'Open with a welcoming hero. Surface warmth signals early — a brief maker greeting or a testimonial before the product grid. Feature products mid-page. Close with a gentle, low-pressure CTA.',
    tokenHints: {
      palette:
        'background warm ivory or buttercream (#fdf6ec to #f7ead8 range). surface slightly deeper warm cream. text deep warm brown or dark charcoal. accent honey gold, terracotta, or dusty rose — warm toned only. border soft warm beige. Never use cool or bright colors for this mood.',
      typography: 'friendly rounded serif or soft script heading, cozy body text at a readable size',
      shape: 'generous rounding on cards and buttons — everything feels approachable',
      spacing: 'snug and layered — things feel close and comfortable, not airy',
    },
  },

  'summer-afternoon': {
    key: 'summer-afternoon',
    label: 'Summer Afternoon',
    description:
      'Bright, airy, and unhurried. Fresh whites and yellows, the energy of peak season. For makers whose work feels light and seasonal — pressed flower art, citrus-scented candles, beachy accessories, garden goods.',
    blockAssemblyHint:
      'Lead with products front and center in a bright, open hero. Follow with a generous product or collection grid. Keep the maker story brief and warm — energy goes to the inventory, not the biography.',
    tokenHints: {
      palette:
        'background bright white or pale lemon (#fffdf0 to #ffffff range) — always light and airy. surface pure white or very pale yellow. text near-black or deep navy. accent sunshine yellow, sky blue, coral, or fresh green — one saturated pop. border very light gray. Never use a dark background for this mood.',
      typography: 'clean geometric sans-serif or light serif heading, airy body',
      shape: 'soft rounding — cheerful and open',
      spacing: 'open and generous — lots of breathing room between elements',
    },
  },

  'wild-meadow': {
    key: 'wild-meadow',
    label: 'Wild Meadow',
    description:
      'Lush, untamed botanical energy. Not a refined garden — wild growth, foraged, alive and imperfect. For makers whose work is rooted in nature — botanical skincare, dried flowers, herbal products, foraged goods.',
    blockAssemblyHint:
      'Open with a lush, imagery-forward hero that fills the viewport. Let the visuals do the work first. Then botanical product cards. Then maker story as a brief grounding note at the end — not at the top.',
    tokenHints: {
      palette:
        'background MUST be light — soft sage white, pale celadon, or warm linen (#f4f7f2 to #eef4ec range). Never dark, never deep green as background. surface white or very pale sage. text deep botanical green or near-black. accent wildflower purple, thistle, dusty violet, or soft lavender. border pale sage. Sage or botanical green belongs on text or accents only, never on the background.',
      typography: 'elegant thin serif or hand-feel display heading, readable body',
      shape: 'slight organic rounding — natural but not perfectly sharp or perfectly round',
      spacing: 'generous — room for things to breathe the way plants need space',
    },
  },

  'bright-bazaar': {
    key: 'bright-bazaar',
    label: 'Bright Bazaar',
    description:
      'Bold, joyful, maximalist. Color as a statement. For makers whose work is vibrant and unapologetic — colorful ceramics, pattern textiles, loud jewelry, folk art, confetti candles.',
    blockAssemblyHint:
      'Lead with a bold, color-saturated hero. Follow immediately with a generous product grid that shows off the range and color variety. The catalog is the hero. Story comes last and stays brief.',
    tokenHints: {
      palette:
        'background a vivid saturated color (cobalt, saffron, fuchsia, tomato red) OR warm white with bold color elements. surface slightly lighter or darker version of background. text must have strong contrast — near-white on dark backgrounds, near-black on light ones. accent a complementary vivid color that clashes productively. border bold, visible. This mood should look loud — that is correct.',
      typography: 'playful bold display or chunky rounded heading, confident body',
      shape: 'strong rounding — bold and friendly',
      spacing: 'compact and full — packed with life',
    },
  },

  'sunday-morning': {
    key: 'sunday-morning',
    label: 'Sunday Morning',
    description:
      'Calm, minimal, considered. Lots of white space, quiet confidence. For makers whose work has a clean aesthetic — minimal jewelry, modern ceramics, architectural prints, refined candles, object-as-art.',
    blockAssemblyHint:
      'Open with a clean, stripped-back hero — significant white space, minimal text. Feature a small curated product selection rather than the full catalog. Keep the maker story brief. Nothing superfluous.',
    tokenHints: {
      palette:
        'background pure white or pale warm white (#ffffff to #faf9f7 range). surface off-white or very light warm gray. text charcoal or near-black. accent one subtle warm tone only — pale gold, warm sand, soft clay, dusty blush. border very light gray. No bold or saturated colors. Restraint is the point.',
      typography: 'refined thin sans-serif or minimal serif heading, small precise body text',
      shape: 'very minimal rounding or none — precision and restraint',
      spacing: 'very spacious — white space is the design element',
    },
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

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
      'Lead with the maker story in a full-bleed editorial hero. The narrative comes before the sell. Follow with a curated featured-products section showing depth, not breadth. Close with a restrained CTA.',
    tokenHints: {
      palette:
        'deep charcoal and near-black backgrounds, warm amber or blood-red accent, off-white or cream text',
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
        'warm cream or parchment background, deep brown or forest green primary, rust or ochre accent',
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
        'warm ivory or buttercream background, soft terracotta or dusty rose primary, honey gold accent',
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
        'bright white or pale lemon background, sunshine yellow or sky blue primary, fresh green accent',
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
        'LIGHT background — soft sage white, pale celadon, or warm linen (never dark — this mood is alive and sun-lit, not shadowy). Sage green or botanical green as the primary brand color. Wildflower purple, thistle, or soft lavender as the accent. Warm cream or off-white text on any dark surfaces.',
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
        'vivid primary or saturated background, high-contrast complementary accent, warm white on dark or dark on bright',
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
        'pure white or pale warm white background, charcoal or soft black primary, one subtle warm accent',
      typography: 'refined thin sans-serif or minimal serif heading, small precise body text',
      shape: 'very minimal rounding or none — precision and restraint',
      spacing: 'very spacious — white space is the design element',
    },
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

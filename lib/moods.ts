export type MoodKey =
  | 'dark'
  | 'rustic'
  | 'cozy'
  | 'botanical'
  | 'sunset'
  | 'simple'
  | 'modern';

export interface Mood {
  key: MoodKey;
  label: string;
  /** Audience-naming description — who this mood is for, not what it should look like. */
  description: string;
}

export const MOODS: Record<MoodKey, Mood> = {
  dark: {
    key: 'dark',
    label: 'Dark',
    description:
      "For makers whose work belongs in low-light contexts — occult candles, dark art, gothic jewelry, leather goods, anything that isn't for a cheerful audience.",
  },
  rustic: {
    key: 'rustic',
    label: 'Rustic',
    description:
      'For makers whose work is rooted in tradition and natural materials — woodworkers, soap makers, farm stands, weavers, canners, herbalists.',
  },
  cozy: {
    key: 'cozy',
    label: 'Cozy',
    description:
      'For makers whose work belongs in a home — candle makers, textile artists, bakers, comfort-food creators, anything that lives in a lit room at the end of the day.',
  },
  botanical: {
    key: 'botanical',
    label: 'Botanical',
    description:
      'For makers whose work is rooted in plants — botanical skincare, dried flowers, herbal products, foraged goods, anything that grows.',
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    description:
      'For makers whose work evokes golden-hour warmth — outdoor leather goods, summer perfumes, hand-thrown ceramics shot in window light, anything that lives in late-afternoon amber.',
  },
  simple: {
    key: 'simple',
    label: 'Simple',
    description:
      'For makers whose work speaks for itself with restraint — minimal jewelry, modern ceramics, architectural prints, refined candles, object-as-art.',
  },
  modern: {
    key: 'modern',
    label: 'Modern',
    description:
      'For makers whose work is a confident contemporary design statement — graphic prints, geometric ceramics, bold print textiles, designer-makers whose brand IS the design.',
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

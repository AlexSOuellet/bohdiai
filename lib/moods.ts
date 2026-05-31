export type MoodKey = 'dark' | 'rustic' | 'cozy' | 'botanical' | 'sunset' | 'simple' | 'modern';

export type PaletteTemperature = 'warm' | 'cool' | 'neutral';
export type BrightnessDirection = 'dark' | 'mid' | 'light';
export type TypeCharacter = 'serif-leaning' | 'sans-leaning' | 'either';
export type TextureAffinity = 'rich' | 'minimal' | 'either';

export interface MoodDesignDirection {
  /** Warm tones (browns, ambers, reds) vs cool (blues, greys, greens) vs neutral. */
  paletteTemperature: PaletteTemperature;
  /** Whether the overall scheme skews dark, mid-range, or light. */
  brightness: BrightnessDirection;
  /** Whether this mood suits serif type, sans-serif, or either. */
  typeCharacter: TypeCharacter;
  /** Whether surfaces should feel materially textured or clean and flat. */
  textureAffinity: TextureAffinity;
  /** Suggested M3 scheme. Mood wins if the niche defaults differ. */
  defaultScheme: 'light' | 'dark';
}

export interface Mood {
  key: MoodKey;
  label: string;
  /** Audience-naming description — who this mood is for, not what it should look like. */
  description: string;
  /** Design direction rails. Mood wins conflicts with niche defaults. */
  designDirection: MoodDesignDirection;
}

export const MOODS: Record<MoodKey, Mood> = {
  dark: {
    key: 'dark',
    label: 'Dark',
    description:
      "For makers whose work belongs in low-light contexts — occult candles, dark art, gothic jewelry, leather goods, anything that isn't for a cheerful audience.",
    designDirection: {
      paletteTemperature: 'neutral',
      brightness: 'dark',
      typeCharacter: 'either',
      textureAffinity: 'rich',
      defaultScheme: 'dark',
    },
  },
  rustic: {
    key: 'rustic',
    label: 'Rustic',
    description:
      'For makers whose work is rooted in tradition and natural materials — woodworkers, soap makers, farm stands, weavers, canners, herbalists.',
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'mid',
      typeCharacter: 'serif-leaning',
      textureAffinity: 'rich',
      defaultScheme: 'light',
    },
  },
  cozy: {
    key: 'cozy',
    label: 'Cozy',
    description:
      'For makers whose work belongs in a home — candle makers, textile artists, bakers, comfort-food creators, anything that lives in a lit room at the end of the day.',
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'light',
      typeCharacter: 'serif-leaning',
      textureAffinity: 'rich',
      defaultScheme: 'light',
    },
  },
  botanical: {
    key: 'botanical',
    label: 'Botanical',
    description:
      'For makers whose work is rooted in plants — botanical skincare, dried flowers, herbal products, foraged goods, anything that grows.',
    designDirection: {
      paletteTemperature: 'cool',
      brightness: 'light',
      typeCharacter: 'either',
      textureAffinity: 'either',
      defaultScheme: 'light',
    },
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    description:
      'For makers whose work evokes golden-hour warmth — outdoor leather goods, summer perfumes, hand-thrown ceramics shot in window light, anything that lives in late-afternoon amber.',
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'mid',
      typeCharacter: 'either',
      textureAffinity: 'either',
      defaultScheme: 'light',
    },
  },
  simple: {
    key: 'simple',
    label: 'Simple',
    description:
      'For makers whose work speaks for itself with restraint — minimal jewelry, modern ceramics, architectural prints, refined candles, object-as-art.',
    designDirection: {
      paletteTemperature: 'neutral',
      brightness: 'light',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'minimal',
      defaultScheme: 'light',
    },
  },
  modern: {
    key: 'modern',
    label: 'Modern',
    description:
      'For makers whose work is a confident contemporary design statement — graphic prints, geometric ceramics, bold print textiles, designer-makers whose brand IS the design.',
    designDirection: {
      paletteTemperature: 'neutral',
      brightness: 'light',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'minimal',
      defaultScheme: 'light',
    },
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

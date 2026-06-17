export type MoodKey = 'dark' | 'rustic' | 'cozy' | 'modern' | 'elegant' | 'cheerful' | 'industrial';

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
  /** Feel-based description — what the store feels and looks like, so a maker picks
   *  by what resonates. Never names a craft or a color (color is Bohdi's layer
   *  within the mood, not part of the mood). */
  description: string;
  /** Design direction rails. Mood wins conflicts with niche defaults. Color is
   *  a layer chosen within the mood, so paletteTemperature is a loose lean only. */
  designDirection: MoodDesignDirection;
}

export const MOODS: Record<MoodKey, Mood> = {
  dark: {
    key: 'dark',
    label: 'Dark',
    description: 'Low light and deep shadow. Moody and a little mysterious, with drama where most stores play it safe.',
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
    description: 'Warm, worn, and handmade. Natural materials and the feel of things made the old way, with some age in them.',
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
    description: 'Soft, warm, and welcoming. The calm of a lamp-lit room at the end of the day.',
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'light',
      typeCharacter: 'serif-leaning',
      textureAffinity: 'rich',
      defaultScheme: 'light',
    },
  },
  modern: {
    key: 'modern',
    label: 'Modern',
    description: 'Clean, confident, and geometric. Bold and contemporary — not quiet minimalism, design that speaks up.',
    designDirection: {
      paletteTemperature: 'neutral',
      brightness: 'light',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'minimal',
      defaultScheme: 'light',
    },
  },
  elegant: {
    key: 'elegant',
    label: 'Elegant',
    description: 'Refined and graceful. Quiet luxury, fine detail, the sense that every choice was considered.',
    designDirection: {
      paletteTemperature: 'neutral',
      brightness: 'light',
      typeCharacter: 'serif-leaning',
      textureAffinity: 'minimal',
      defaultScheme: 'light',
    },
  },
  cheerful: {
    key: 'cheerful',
    label: 'Cheerful',
    description: 'Bright and lifted, color-positive. Sun on the page — a store that smiles back.',
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'light',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'either',
      defaultScheme: 'light',
    },
  },
  industrial: {
    key: 'industrial',
    label: 'Industrial',
    description: 'Raw, tough, and machined. Concrete, metal, and hard edges — strength over softness.',
    designDirection: {
      paletteTemperature: 'cool',
      brightness: 'mid',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'rich',
      defaultScheme: 'dark',
    },
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

import { REFERENCE_LABELS } from './archetypes/main-street/defaults';

export type MoodKey = 'dark' | 'rustic' | 'cozy' | 'modern' | 'elegant' | 'cheerful';

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
    label: REFERENCE_LABELS.moods.labels.dark,
    description: REFERENCE_LABELS.moods.descriptions.dark,
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
    label: REFERENCE_LABELS.moods.labels.rustic,
    description: REFERENCE_LABELS.moods.descriptions.rustic,
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
    label: REFERENCE_LABELS.moods.labels.cozy,
    description: REFERENCE_LABELS.moods.descriptions.cozy,
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
    label: REFERENCE_LABELS.moods.labels.modern,
    description: REFERENCE_LABELS.moods.descriptions.modern,
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
    label: REFERENCE_LABELS.moods.labels.elegant,
    description: REFERENCE_LABELS.moods.descriptions.elegant,
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
    label: REFERENCE_LABELS.moods.labels.cheerful,
    description: REFERENCE_LABELS.moods.descriptions.cheerful,
    designDirection: {
      paletteTemperature: 'warm',
      brightness: 'light',
      typeCharacter: 'sans-leaning',
      textureAffinity: 'either',
      defaultScheme: 'light',
    },
  },
};

export const MOOD_LIST: readonly Mood[] = Object.values(MOODS);

/** True when `value` is one of the real mood keys. */
export function isMoodKey(value: unknown): value is MoodKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MOODS, value);
}

/**
 * Resolve which feeling a render should use. The editor preview passes the feeling
 * the maker is trying on as `previewMood`; when it's a real mood key it wins, so the
 * preview reflects the whole selected look (the family's section layout, wallpaper,
 * and nav — all mood-driven), not just the skin. Otherwise the store's saved mood
 * applies. Returns undefined only when neither is present (legacy stores).
 */
export function resolvePreviewMood(
  previewMood: string | undefined,
  storedMood: string | undefined,
): string | undefined {
  return isMoodKey(previewMood) ? previewMood : storedMood;
}

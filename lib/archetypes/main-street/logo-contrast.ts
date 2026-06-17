/**
 * Pure color math for the Main Street header. Decides — with no IO and no React —
 * whether the maker's logo reads on a given header backdrop, and what surface to
 * give the header when it doesn't. The renderer applies these; it never boxes the
 * logo. See docs/superpowers/specs/2026-06-11-logo-header-and-brand-colors-design.md.
 */
import type { ArchetypeTheme } from '../types';

export type Tone = 'light' | 'dark' | 'unknown';

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The most prominent usable brand color (first valid hex), or undefined.
 *  Skin-blind — used as a fallback when the skin's bg isn't available, and
 *  as the seed before `pickBrandColorForSkin` walks the list. */
export function dominantBrandColor(colors: string[]): string | undefined {
  return colors.find((c) => HEX6.test(c));
}

/**
 * Pick the most prominent brand color that ALSO clears contrast against the
 * skin's background. Walks the brand-color list in prominence order and
 * returns the first one that is a valid hex, NOT achromatic, and reaches
 * MIN_ACCENT_CONTRAST against `skinBg`.
 *
 * If no color in the list satisfies all three, returns undefined — the
 * skin's own accent stands. (Skipping is correct: forcing a non-contrasting
 * brand color would make the maker's accent invisible on the page.)
 *
 * This is the smarter selector that replaces the old `dominantBrandColor`
 * at the build-time accent-override call site. The previous behavior — pick
 * the first valid hex regardless of skin, then let the render-time guard
 * silently skip it — meant a maker with navy + gold logos against a dark
 * skin lost BOTH usable accent colors. Now navy is skipped and gold is
 * picked, so the maker's brand actually lands.
 */
export function pickBrandColorForSkin(
  colors: string[],
  skinBg: string,
): string | undefined {
  for (const c of colors) {
    if (!HEX6.test(c)) continue;
    if (isAchromatic(c)) continue;
    if (contrastRatio(c, skinBg) < MIN_ACCENT_CONTRAST) continue;
    return c;
  }
  return undefined;
}

/** Whether the logo, as a whole, reads light or dark — from its dominant ink. */
export function logoTone(colors: string[]): Tone {
  const c = dominantBrandColor(colors);
  if (c === undefined) return 'unknown';
  return relativeLuminance(c) > 0.5 ? 'light' : 'dark';
}

/** Readable text color (near-black or near-white) for content placed ON `hex`. */
export function readableOn(hex: string): '#1a1a1a' | '#ffffff' {
  return relativeLuminance(hex) > 0.5 ? '#1a1a1a' : '#ffffff';
}

/**
 * The header surface needed so the logo reads on a backdrop of `backdrop` tone.
 * Null means leave the header as-is (the logo already contrasts, or we can't tell).
 * Otherwise the header takes a full-width contrasting surface — intentional chrome,
 * never a box around the mark.
 */
export function navContrast(logo: Tone, backdrop: 'light' | 'dark'): { bg: string; fg: string } | null {
  if (logo === 'unknown' || logo !== backdrop) return null;
  return logo === 'dark'
    ? { bg: '#F7F5F2', fg: '#1a1a1a' }
    : { bg: '#1b1b1b', fg: '#F7F5F2' };
}

// Chroma below this threshold is treated as effectively gray (achromatic).
const ACHROMATIC_MAX_CHROMA = 0.05;

// Minimum WCAG contrast ratio required for the accent to read as text on the page bg.
const MIN_ACCENT_CONTRAST = 3;

/**
 * True when `hex` is black, white, or a shade of gray — color saturation so low
 * that using it as an accent would tint the store neutrally rather than brand it.
 * Chroma = (max(r,g,b) − min(r,g,b)) / 255, range 0 (gray) … 1 (fully saturated).
 */
export function isAchromatic(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  return chroma < ACHROMATIC_MAX_CHROMA;
}

/**
 * WCAG contrast ratio between two hex colors, range 1 (identical) … 21 (black/white).
 * Formula: (Llighter + 0.05) / (Ldarker + 0.05).
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The STRONG brand-tint (build-time): keep the mood's skin but swap its accent to
 * the maker's dominant logo color, recomputing the on-accent text for contrast.
 * Everything else of the skin — bg, fg, type, light — is the mood's, untouched.
 * No override → the skin is returned as-is (Bohdi's free accent stands).
 *
 * Guard: the accent is skipped (skin returned unchanged) when:
 *   (a) accent is undefined or not a valid 6-digit hex,
 *   (b) accent is achromatic (black/white/gray — low chroma), or
 *   (c) accent does not reach MIN_ACCENT_CONTRAST against the skin's bg.
 */
export function applyAccentOverride(skin: ArchetypeTheme, accent: string | undefined): ArchetypeTheme {
  if (accent === undefined || !HEX6.test(accent)) return skin;
  if (isAchromatic(accent)) return skin;
  if (contrastRatio(accent, skin.palette.bg) < MIN_ACCENT_CONTRAST) return skin;
  return { ...skin, palette: { ...skin.palette, accent, onAccent: readableOn(accent) } };
}

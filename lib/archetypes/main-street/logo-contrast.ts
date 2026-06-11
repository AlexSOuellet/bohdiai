/**
 * Pure color math for the Main Street header. Decides — with no IO and no React —
 * whether the maker's logo reads on a given header backdrop, and what surface to
 * give the header when it doesn't. The renderer applies these; it never boxes the
 * logo. See docs/superpowers/specs/2026-06-11-logo-header-and-brand-colors-design.md.
 */
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

/** The most prominent usable brand color (first valid hex), or undefined. */
export function dominantBrandColor(colors: string[]): string | undefined {
  return colors.find((c) => HEX6.test(c));
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

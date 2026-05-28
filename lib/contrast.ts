/**
 * WCAG contrast enforcement for generated design tokens.
 * Runs after AI token generation, before DB write.
 * Adjusts failing color pairs by nudging lightness in HSL space.
 */

import type { DesignTokens } from '@/lib/tokens';

// ─── Color math ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function linearizeChannel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── HSL conversion ───────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h /= 6;

  return [h, s, l];
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  const tt = ((t % 1) + 1) % 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): string {
  const lClamped = Math.max(0, Math.min(1, l));

  if (s === 0) {
    const v = Math.round(lClamped * 255).toString(16).padStart(2, '0');
    return `#${v}${v}${v}`;
  }

  const q = lClamped < 0.5 ? lClamped * (1 + s) : lClamped + s - lClamped * s;
  const p = 2 * lClamped - q;
  const r = Math.round(hueToRgbChannel(p, q, h + 1 / 3) * 255);
  const g = Math.round(hueToRgbChannel(p, q, h) * 255);
  const bVal = Math.round(hueToRgbChannel(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
}

// ─── Adjustment ───────────────────────────────────────────────────────────────

function adjustInDirection(
  h: number, s: number, l: number,
  background: string,
  minRatio: number,
  direction: 'lighter' | 'darker',
): string {
  let lo: number, hi: number;
  if (direction === 'lighter') { lo = l; hi = 1; }
  else { lo = 0; hi = l; }

  // Binary search for the minimal adjustment that achieves minRatio
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hslToHex(h, s, mid);
    if (contrastRatio(candidate, background) >= minRatio) {
      if (direction === 'lighter') hi = mid;
      else lo = mid;
    } else {
      if (direction === 'lighter') lo = mid;
      else hi = mid;
    }
  }
  return hslToHex(h, s, direction === 'lighter' ? hi : lo);
}

/**
 * Nudges the foreground color's lightness until it achieves minRatio against
 * the background. Tries both lighter and darker directions; picks whichever
 * achieves the target with the smallest change. Falls back to the direction
 * with the best achievable ratio if neither can hit the minimum.
 * Uses binary search — 20 iterations gives sub-0.001% precision.
 */
export function adjustForContrast(
  foreground: string,
  background: string,
  minRatio: number,
): string {
  if (contrastRatio(foreground, background) >= minRatio) return foreground;

  const [h, s, l] = hexToHsl(foreground);
  const lighter = adjustInDirection(h, s, l, background, minRatio, 'lighter');
  const darker = adjustInDirection(h, s, l, background, minRatio, 'darker');
  const lighterPasses = contrastRatio(lighter, background) >= minRatio;
  const darkerPasses = contrastRatio(darker, background) >= minRatio;

  if (lighterPasses && darkerPasses) {
    // Both work — pick the minimal change from the original lightness
    const lighterDelta = Math.abs(hexToHsl(lighter)[2] - l);
    const darkerDelta = Math.abs(hexToHsl(darker)[2] - l);
    return lighterDelta <= darkerDelta ? lighter : darker;
  }
  if (lighterPasses) return lighter;
  if (darkerPasses) return darker;
  // Neither achieves the minimum (e.g. mid-gray background) — return best available
  return contrastRatio(lighter, background) >= contrastRatio(darker, background)
    ? lighter
    : darker;
}

// ─── Token enforcement ────────────────────────────────────────────────────────

// WCAG AA thresholds
const BODY_TEXT_RATIO = 4.5;   // normal text
const LARGE_TEXT_RATIO = 4.5;  // raised from 3.0 — 3.0 passes technically but looks washed on light palettes

/**
 * Enforces WCAG AA contrast on all critical color pairs in a token set.
 * Called immediately after AI generation, before any DB write.
 * Returns a new tokens object — never mutates the input.
 */
export function enforceTokenContrast(
  tokens: DesignTokens,
  options: { skipAccent?: boolean } = {},
): DesignTokens {
  const colors = { ...tokens.colors };

  // Primary text must be readable on both page background and card surfaces
  colors.text = adjustForContrast(colors.text, colors.background, BODY_TEXT_RATIO);
  colors.text = adjustForContrast(colors.text, colors.surface, BODY_TEXT_RATIO);

  // Muted/secondary text: large-text threshold
  colors.textMuted = adjustForContrast(colors.textMuted, colors.background, LARGE_TEXT_RATIO);
  colors.textMuted = adjustForContrast(colors.textMuted, colors.surface, LARGE_TEXT_RATIO);

  // Accent is used for CTAs and highlights — UI component threshold
  if (!options.skipAccent) {
    colors.accent = adjustForContrast(colors.accent, colors.background, LARGE_TEXT_RATIO);
    colors.accent = adjustForContrast(colors.accent, colors.surface, LARGE_TEXT_RATIO);
  }

  return { ...tokens, colors };
}

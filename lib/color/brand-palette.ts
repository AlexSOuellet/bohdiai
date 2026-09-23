/**
 * Brand colors take over — turn a shop's 2–3 brand colors into a complete,
 * always-readable skin palette. Pure. The mood keeps type, layout, texture and
 * motion; only color changes hands.
 * Spec: docs/superpowers/specs/2026-09-23-brand-colors-takeover-design.md
 */
import { z } from 'zod';
import type { ArchetypeTheme } from '@/lib/archetypes/types';
import { contrastRatio, relativeLuminance } from '@/lib/archetypes/main-street/logo-contrast';
import { hexToOklch, oklchToHex, deltaE, hexToRgba } from './oklch';

const hex6 = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const BrandPaletteSchema = z
  .object({ base: hex6, accent: hex6, second: hex6.optional() })
  .strict();

export type BrandPalette = z.infer<typeof BrandPaletteSchema>;

export const THRESHOLDS = {
  /** Body text target. Reached wherever the surface allows. */
  fg: 7,
  /** Hard floor for any text. Pure black or white always clears ~4.58 on any surface. */
  floor: 4.5,
  fgMuted: 4.5,
  accent: 3,
  onAccent: 4.5,
  /** Minimum Oklab distance between the two surfaces so the bands read. */
  surfaceDelta: 0.05,
} as const;

export interface Adjustment {
  role: 'accent' | 'second' | 'fg';
  from: string;
  to: string;
  reason: string;
  /** True when the best available result still misses a secondary target. */
  warning?: boolean;
}

export interface DerivedPalette {
  bg: string;
  fg: string;
  fgMuted: string;
  accent: string;
  rule: string;
  onAccent: string;
  contrast: { bg: string; fg: string; fgMuted: string };
}

export interface Derivation {
  palette: DerivedPalette;
  adjustments: Adjustment[];
}

const WHITE = '#ffffff';
const BLACK = '#000000';
const RULE_ALPHA = 0.18;
const TEXT_TINT_CHROMA = 0.008;

function normalize(hex: string): string {
  return hex.toLowerCase();
}

function bestPure(surface: string): string {
  return contrastRatio(WHITE, surface) >= contrastRatio(BLACK, surface) ? WHITE : BLACK;
}

/** Body text for a surface: a faintly surface-tinted near-white/near-black that
 *  reaches 7:1, else pure white/black (recorded — mid-tone surfaces can't reach 7). */
function textFor(surface: string): { fg: string; fellBack: boolean } {
  const pure = bestPure(surface);
  const { c, h } = hexToOklch(surface);
  const chroma = Math.min(TEXT_TINT_CHROMA, c);
  const steps = pure === WHITE ? [0.965, 0.975, 0.985, 0.995] : [0.24, 0.18, 0.12, 0.06];
  for (const l of steps) {
    const candidate = oklchToHex({ l, c: chroma, h });
    if (contrastRatio(candidate, surface) >= THRESHOLDS.fg) return { fg: candidate, fellBack: false };
  }
  return { fg: pure, fellBack: true };
}

/** Softer text: walk fg toward the surface, keep the last step still ≥ 4.5:1. */
function mutedFor(fg: string, surface: string): string {
  const a = hexToOklch(fg);
  const b = hexToOklch(surface);
  let best = fg;
  for (let i = 1; i <= 35; i += 1) {
    const t = i * 0.02;
    const candidate = oklchToHex({ l: a.l + (b.l - a.l) * t, c: a.c + (b.c - a.c) * t, h: b.c > a.c ? b.h : a.h });
    if (contrastRatio(candidate, surface) < THRESHOLDS.fgMuted) break;
    best = candidate;
  }
  return best;
}

function shiftLightness(hex: string, delta: number): string {
  const o = hexToOklch(hex);
  return oklchToHex({ ...o, l: Math.min(1, Math.max(0, o.l + delta)) });
}

/** The second surface: given or derived, pushed until visibly apart from the base. */
function secondSurface(base: string, isDark: boolean, given: string | undefined): { second: string; pushed: boolean } {
  const direction = isDark ? 1 : -1;
  let second = given ?? shiftLightness(base, isDark ? 0.08 : -0.06);
  let pushed = false;
  for (let i = 0; i < 50 && deltaE(second, base) < THRESHOLDS.surfaceDelta; i += 1) {
    second = shiftLightness(second, 0.02 * direction);
    pushed = true;
  }
  return { second, pushed: pushed && given !== undefined };
}

/** Smallest lightness shift (either direction) whose result passes `ok`. */
function nearestPassing(hex: string, ok: (candidate: string) => boolean): string | undefined {
  if (ok(hex)) return hex;
  for (let i = 1; i <= 100; i += 1) {
    for (const delta of [i * 0.01, -i * 0.01]) {
      const candidate = shiftLightness(hex, delta);
      if (ok(candidate)) return candidate;
    }
  }
  return undefined;
}

export function deriveBrandPalette(input: BrandPalette): Derivation {
  const adjustments: Adjustment[] = [];
  const bg = normalize(input.base);
  const isDark = relativeLuminance(bg) < 0.18;

  const main = textFor(bg);
  if (main.fellBack) {
    adjustments.push({
      role: 'fg', from: 'tinted text', to: main.fg,
      reason: `the background is mid-tone, so text uses pure ${main.fg === WHITE ? 'white' : 'black'} for the strongest contrast it allows`,
    });
  }

  const { second, pushed } = secondSurface(bg, isDark, input.second === undefined ? undefined : normalize(input.second));
  if (pushed && input.second !== undefined) {
    adjustments.push({
      role: 'second', from: normalize(input.second), to: second,
      reason: 'the second background was too close to the main one to see the bands, so it was shifted',
    });
  }
  const secondText = textFor(second);

  const requested = normalize(input.accent);
  const onBoth = (c: string): boolean =>
    contrastRatio(c, bg) >= THRESHOLDS.accent && contrastRatio(c, second) >= THRESHOLDS.accent;
  const onMain = (c: string): boolean => contrastRatio(c, bg) >= THRESHOLDS.accent;
  let accent = nearestPassing(requested, onBoth);
  if (accent === undefined) {
    // Unreachable in practice: a lightness of 0 or 1 always clears 3:1 on the main surface.
    accent = nearestPassing(requested, onMain) ?? bestPure(bg);
    adjustments.push({
      role: 'accent', from: requested, to: accent, warning: true,
      reason: 'no shade of this accent reads on both backgrounds, so it was kept readable on the main one',
    });
  } else if (accent !== requested) {
    adjustments.push({
      role: 'accent', from: requested, to: accent,
      reason: 'the accent was shifted lighter or darker (same hue) so buttons and links stay readable',
    });
  }

  return {
    palette: {
      bg,
      fg: main.fg,
      fgMuted: mutedFor(main.fg, bg),
      accent,
      rule: hexToRgba(main.fg, RULE_ALPHA),
      onAccent: bestPure(accent),
      contrast: { bg: second, fg: secondText.fg, fgMuted: mutedFor(secondText.fg, second) },
    },
    adjustments,
  };
}

/** The skin with its whole palette replaced by the derived brand palette. */
export function applyBrandPalette(skin: ArchetypeTheme, brand: BrandPalette): ArchetypeTheme {
  return { ...skin, palette: deriveBrandPalette(brand).palette };
}

export type ParsedBrandPalette =
  | { kind: 'absent' }
  | { kind: 'invalid' }
  | { kind: 'valid'; value: BrandPalette };

/** Read a stored envelope value. Absent is normal; invalid is a data error the caller logs. */
export function parseBrandPalette(raw: unknown): ParsedBrandPalette {
  if (raw === undefined || raw === null) return { kind: 'absent' };
  const parsed = BrandPaletteSchema.safeParse(raw);
  return parsed.success ? { kind: 'valid', value: parsed.data } : { kind: 'invalid' };
}

/** Plain-text report for the set-brand-palette script. */
export function formatDerivation({ palette: p, adjustments }: Derivation): string {
  const lines = [
    `  bg            ${p.bg}`,
    `  fg            ${p.fg}   (${contrastRatio(p.fg, p.bg).toFixed(2)}:1)`,
    `  fgMuted       ${p.fgMuted}   (${contrastRatio(p.fgMuted, p.bg).toFixed(2)}:1)`,
    `  accent        ${p.accent}   (${contrastRatio(p.accent, p.bg).toFixed(2)}:1 on bg, ${contrastRatio(p.accent, p.contrast.bg).toFixed(2)}:1 on second)`,
    `  onAccent      ${p.onAccent}   (${contrastRatio(p.onAccent, p.accent).toFixed(2)}:1)`,
    `  rule          ${p.rule}`,
    `  second bg     ${p.contrast.bg}`,
    `  second fg     ${p.contrast.fg}   (${contrastRatio(p.contrast.fg, p.contrast.bg).toFixed(2)}:1)`,
    `  second muted  ${p.contrast.fgMuted}`,
  ];
  const adj = adjustments.length === 0
    ? ['  no adjustments — every color used as given']
    : adjustments.map((a) => `  ${a.warning === true ? 'WARNING ' : ''}${a.role}: ${a.from} → ${a.to} — ${a.reason}`);
  return [...lines, '', ...adj].join('\n');
}

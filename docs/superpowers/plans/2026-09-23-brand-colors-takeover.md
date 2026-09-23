# Brand Colors Take Over — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a shop's own brand colors (base, accent, optional second surface) replace the mood skin's whole palette. The derived palette must always be readable. Claude sets it with a script.

**Architecture:** A pure OKLCH color module (`lib/color/oklch.ts`) and a pure derivation (`lib/color/brand-palette.ts`) turn 2–3 hex colors into a full `ColorPair`. The palette is stored at `layout_tree.root.brandPalette` on the envelope. The storefront parses it (and logs if it's invalid), and the Main Street builder swaps the skin palette for the derived one on all four render paths. The derived colors reach the page through the existing `--ms-*` CSS variables. The family wallpaper is off under a brand palette.

**Tech Stack:** TypeScript (strictest), zod, vitest + @testing-library/react, tsx for the script, Supabase service client.

**Spec:** `docs/superpowers/specs/2026-09-23-brand-colors-takeover-design.md`

---

## File map

| File | Change | Responsibility |
|---|---|---|
| `lib/color/oklch.ts` | create | hex ↔ OKLCH, gamut clamp, ΔE, rgba |
| `lib/color/oklch.test.ts` | create | round-trip + known values |
| `lib/color/brand-palette.ts` | create | schema, `deriveBrandPalette`, `applyBrandPalette`, `parseBrandPalette`, `formatDerivation` |
| `lib/color/brand-palette.test.ts` | create | named cases, 5,000-case property test, schema, parse, apply, report |
| `lib/archetypes/builder.ts` | modify | add `brandPalette?` to the four render arg types |
| `lib/archetypes/main-street/builder.tsx` | modify | `themeFor` / `familyFor`, all four paths |
| `lib/archetypes/main-street/builder.test.tsx` | modify | brand palette render tests |
| `lib/storefront/brand-palette.ts` | create | `readBrandPalette(env, tenantId)` (parse + log) |
| `lib/storefront/brand-palette.test.ts` | create | valid / absent / invalid+logged |
| `app/storefront/_components/StorefrontPage.tsx` | modify | read and pass `brandPalette` on all render paths |
| `scripts/set-brand-palette.ts` | create | Claude's tool to set/clear a shop's palette |

---

### Task 1: OKLCH color module

**Files:** Create `lib/color/oklch.ts` and `lib/color/oklch.test.ts`.

- [ ] **Step 1: Write the failing test** (`lib/color/oklch.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { hexToOklch, oklchToHex, deltaE, hexToRgba } from './oklch';

describe('oklch', () => {
  it('maps white and black to the ends of lightness', () => {
    expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 3);
    expect(hexToOklch('#000000').l).toBeCloseTo(0, 3);
    expect(hexToOklch('#ffffff').c).toBeLessThan(0.001);
  });

  it('round-trips every sampled sRGB color to the same hex', () => {
    for (let r = 0; r < 256; r += 51) for (let g = 0; g < 256; g += 51) for (let b = 0; b < 256; b += 51) {
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it('clamps out-of-gamut chroma instead of producing garbage', () => {
    const hex = oklchToHex({ l: 0.9, c: 0.4, h: 140 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('measures zero distance for identical colors and more for different ones', () => {
    expect(deltaE('#3dae3f', '#3dae3f')).toBe(0);
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(1, 2);
  });

  it('formats rgba from hex', () => {
    expect(hexToRgba('#ffffff', 0.18)).toBe('rgba(255, 255, 255, 0.18)');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/color/oklch.test.ts`
Expected: FAIL (cannot resolve `./oklch`)

- [ ] **Step 3: Implement** (`lib/color/oklch.ts`)

```ts
/**
 * OKLCH ↔ sRGB hex, via Björn Ottosson's Oklab. Pure, no dependencies.
 * OKLCH is used for brand-palette derivation because its L tracks perceived
 * lightness: shifting L keeps a brand hue recognisably "the same green".
 */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Rgb = [number, number, number];

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function fromLinear(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function hexToLinear(hex: string): Rgb {
  return [
    toLinear(parseInt(hex.slice(1, 3), 16) / 255),
    toLinear(parseInt(hex.slice(3, 5), 16) / 255),
    toLinear(parseInt(hex.slice(5, 7), 16) / 255),
  ];
}

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function inGamut(rgb: Rgb): boolean {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

export function hexToOklch(hex: string): Oklch {
  const [l, a, b] = linearToOklab(hexToLinear(hex));
  const c = Math.sqrt(a * a + b * b);
  const deg = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c, h: deg < 0 ? deg + 360 : deg };
}

/** OKLCH → hex. Out-of-gamut chroma is reduced (hue and lightness kept). */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l, 0, 1);
  const h = color.h;
  let c = Math.max(0, color.c);
  if (!inGamut(oklchToLinear({ l, c, h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const rgb = oklchToLinear({ l, c, h });
  return `#${rgb
    .map((v) => Math.round(clamp(fromLinear(clamp(v, 0, 1)), 0, 1) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Perceptual distance (Euclidean in Oklab). 0 = identical, ~1 = black vs white. */
export function deltaE(hexA: string, hexB: string): number {
  const [l1, a1, b1] = linearToOklab(hexToLinear(hexA));
  const [l2, a2, b2] = linearToOklab(hexToLinear(hexB));
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/color/oklch.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit** — `feat(color): OKLCH conversion module`

---

### Task 2: Brand palette derivation, schema, parse, apply, report

**Files:** Create `lib/color/brand-palette.ts` and `lib/color/brand-palette.test.ts`.

- [ ] **Step 1: Write the failing test** (`lib/color/brand-palette.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import {
  BrandPaletteSchema, deriveBrandPalette, applyBrandPalette, parseBrandPalette, formatDerivation, THRESHOLDS,
  type BrandPalette,
} from './brand-palette';
import { contrastRatio } from '@/lib/archetypes/main-street/logo-contrast';
import { deltaE } from './oklch';
import { MAIN_STREET_SKINS } from '@/lib/archetypes/main-street/skins';

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomHex(rand: () => number): string {
  return `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function assertReadable(input: BrandPalette): void {
  const { palette: p, adjustments } = deriveBrandPalette(input);
  const fgFellBack = adjustments.some((a) => a.role === 'fg');
  expect(p.bg).toBe(input.base);
  expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(fgFellBack ? THRESHOLDS.floor : THRESHOLDS.fg);
  expect(contrastRatio(p.fgMuted, p.bg)).toBeGreaterThanOrEqual(THRESHOLDS.fgMuted);
  expect(contrastRatio(p.contrast.fg, p.contrast.bg)).toBeGreaterThanOrEqual(THRESHOLDS.floor);
  expect(contrastRatio(p.contrast.fgMuted, p.contrast.bg)).toBeGreaterThanOrEqual(THRESHOLDS.fgMuted);
  expect(contrastRatio(p.accent, p.bg)).toBeGreaterThanOrEqual(THRESHOLDS.accent);
  const warned = adjustments.some((a) => a.role === 'accent' && a.warning);
  if (!warned) expect(contrastRatio(p.accent, p.contrast.bg)).toBeGreaterThanOrEqual(THRESHOLDS.accent);
  expect(contrastRatio(p.onAccent, p.accent)).toBeGreaterThanOrEqual(THRESHOLDS.onAccent);
  expect(deltaE(p.bg, p.contrast.bg)).toBeGreaterThanOrEqual(THRESHOLDS.surfaceDelta);
}

describe('deriveBrandPalette — named cases', () => {
  it('Cut-Pro black + grass green: green stands untouched, text is light', () => {
    const { palette, adjustments } = deriveBrandPalette({ base: '#0b0b0b', accent: '#3dae3f' });
    expect(palette.accent).toBe('#3dae3f');
    expect(adjustments).toEqual([]);
    expect(contrastRatio(palette.fg, '#0b0b0b')).toBeGreaterThanOrEqual(7);
    assertReadable({ base: '#0b0b0b', accent: '#3dae3f' });
  });

  it('mid-gray base falls back to pure black or white text and records it', () => {
    const { palette, adjustments } = deriveBrandPalette({ base: '#777777', accent: '#e4572e' });
    expect(['#000000', '#ffffff']).toContain(palette.fg);
    expect(adjustments.some((a) => a.role === 'fg')).toBe(true);
    assertReadable({ base: '#777777', accent: '#e4572e' });
  });

  it('white base with a pale yellow accent darkens the yellow', () => {
    const { palette, adjustments } = deriveBrandPalette({ base: '#ffffff', accent: '#fff6a8' });
    expect(palette.accent).not.toBe('#fff6a8');
    expect(adjustments.find((a) => a.role === 'accent')?.from).toBe('#fff6a8');
    assertReadable({ base: '#ffffff', accent: '#fff6a8' });
  });

  it('navy base with a navy accent shifts the accent', () => {
    const { adjustments } = deriveBrandPalette({ base: '#1b2a4a', accent: '#1e2f55' });
    expect(adjustments.some((a) => a.role === 'accent')).toBe(true);
    assertReadable({ base: '#1b2a4a', accent: '#1e2f55' });
  });

  it('derives a visibly different second surface when none is given', () => {
    const { palette } = deriveBrandPalette({ base: '#f4efe6', accent: '#8a3b12' });
    expect(deltaE(palette.bg, palette.contrast.bg)).toBeGreaterThanOrEqual(THRESHOLDS.surfaceDelta);
  });

  it('uses a given second surface as-is when it is visibly different', () => {
    const { palette } = deriveBrandPalette({ base: '#0b0b0b', accent: '#3dae3f', second: '#1f3d22' });
    expect(palette.contrast.bg).toBe('#1f3d22');
  });

  it('pushes a given second surface that is too close to the base, and records it', () => {
    const { palette, adjustments } = deriveBrandPalette({ base: '#0b0b0b', accent: '#3dae3f', second: '#0c0c0c' });
    expect(palette.contrast.bg).not.toBe('#0c0c0c');
    expect(adjustments.some((a) => a.role === 'second')).toBe(true);
  });

  it('accent identical to the second surface still reads on the main surface', () => {
    assertReadable({ base: '#ffffff', accent: '#2e7d32', second: '#2e7d32' });
  });
});

describe('deriveBrandPalette — property: every input yields a readable palette', () => {
  it('holds across 5,000 seeded random palettes', () => {
    const rand = mulberry32(20260923);
    for (let i = 0; i < 5000; i += 1) {
      const input: BrandPalette = rand() < 0.5
        ? { base: randomHex(rand), accent: randomHex(rand) }
        : { base: randomHex(rand), accent: randomHex(rand), second: randomHex(rand) };
      assertReadable(input);
    }
  });
});

describe('BrandPaletteSchema', () => {
  it.each([
    [{ base: '#fff', accent: '#3dae3f' }],
    [{ base: '0b0b0b', accent: '#3dae3f' }],
    [{ base: 'black', accent: '#3dae3f' }],
    [{ base: '#0b0b0b' }],
    [{ base: '#0b0b0b', accent: '#3dae3f', extra: '#ffffff' }],
  ])('rejects %j', (value) => {
    expect(BrandPaletteSchema.safeParse(value).success).toBe(false);
  });

  it('accepts base + accent, with or without second', () => {
    expect(BrandPaletteSchema.safeParse({ base: '#0B0B0B', accent: '#3dae3f' }).success).toBe(true);
    expect(BrandPaletteSchema.safeParse({ base: '#0b0b0b', accent: '#3dae3f', second: '#1f3d22' }).success).toBe(true);
  });
});

describe('parseBrandPalette', () => {
  it('reports absent for undefined and null', () => {
    expect(parseBrandPalette(undefined)).toEqual({ kind: 'absent' });
    expect(parseBrandPalette(null)).toEqual({ kind: 'absent' });
  });
  it('reports invalid for a malformed value', () => {
    expect(parseBrandPalette({ base: 'green' })).toEqual({ kind: 'invalid' });
  });
  it('returns the value when valid', () => {
    expect(parseBrandPalette({ base: '#0b0b0b', accent: '#3dae3f' })).toEqual({
      kind: 'valid', value: { base: '#0b0b0b', accent: '#3dae3f' },
    });
  });
});

describe('applyBrandPalette', () => {
  it('replaces the whole palette and leaves type, spacing and atmosphere alone', () => {
    const skin = MAIN_STREET_SKINS[0];
    if (skin === undefined) throw new Error('no skins');
    const out = applyBrandPalette(skin, { base: '#0b0b0b', accent: '#3dae3f' });
    expect(out.palette.bg).toBe('#0b0b0b');
    expect(out.palette.accent).toBe('#3dae3f');
    expect(out.type).toBe(skin.type);
    expect(out.atmosphere).toBe(skin.atmosphere);
  });
});

describe('formatDerivation', () => {
  it('prints every role and each adjustment in plain words', () => {
    const text = formatDerivation(deriveBrandPalette({ base: '#ffffff', accent: '#fff6a8' }));
    expect(text).toContain('bg');
    expect(text).toContain('accent');
    expect(text).toContain('#fff6a8 →');
  });
  it('says so when nothing had to change', () => {
    expect(formatDerivation(deriveBrandPalette({ base: '#0b0b0b', accent: '#3dae3f' }))).toContain('no adjustments');
  });
});
```

> If `MAIN_STREET_SKINS` is a keyed record rather than an array, use `Object.values(MAIN_STREET_SKINS)[0]` instead. Check the export's shape at `lib/archetypes/main-street/skins.ts:135` first.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/color/brand-palette.test.ts`
Expected: FAIL (cannot resolve `./brand-palette`)

- [ ] **Step 3: Implement** (`lib/color/brand-palette.ts`)

```ts
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
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/color/brand-palette.test.ts`
Expected: PASS, including the 5,000-case property test. If a property case fails, print the failing input and fix the derivation. Don't loosen a threshold.

- [ ] **Step 5: Commit** — `feat(color): derive a readable brand palette from 2–3 brand colors`

---

### Task 3: Builder interface + Main Street wiring

**Files:** Modify `lib/archetypes/builder.ts` (the four arg types, ~lines 100–166), `lib/archetypes/main-street/builder.tsx` (lines ~242–362), and `lib/archetypes/main-street/builder.test.tsx`.

- [ ] **Step 1: Write the failing tests.** Append to `builder.test.tsx`:

```tsx
describe('MAIN_STREET_SPEC.render — brand palette takes over', () => {
  function content() {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    if (!parsed.ok) throw new Error('fixture failed to parse');
    return MAIN_STREET_SPEC.toPayload(parsed.authored).content;
  }

  it('paints the brand base and accent as --ms-bg / --ms-accent', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toContain('--ms-bg:#0b0b0b');
    expect(container.innerHTML).toContain('--ms-accent:#3dae3f');
  });

  it('ignores accentOverride when a brand palette is present', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' }, accentOverride: '#1d3a2e',
    }));
    expect(container.innerHTML).not.toContain('#1d3a2e');
  });

  it('switches the family wallpaper off under a brand palette', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about', mood: 'cozy',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toContain('--ms-texture-opacity:0');
  });

  it('applies the brand palette on the shell path too', () => {
    const { container } = render(MAIN_STREET_SPEC.renderShell!({
      content: content(), lookKey: 'main-street-ember', children: null,
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toContain('--ms-accent:#3dae3f');
  });
});
```

> Before running, check the exact emitted format in `skinVarsCss` (`chrome.tsx:135-137`). If it writes `--ms-bg: #...` with a space, or wraps the value differently, match the assertion strings to it. Also check the non-null assertion on `renderShell!` against the lint config. If `@typescript-eslint/no-non-null-assertion` is on, guard with `if (!MAIN_STREET_SPEC.renderShell) throw ...`.

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run lib/archetypes/main-street/builder.test.tsx`
Expected: FAIL. It won't typecheck (unknown prop `brandPalette`), or the assertions miss.

- [ ] **Step 3: Implement**

In `lib/archetypes/builder.ts`, add `import type { BrandPalette } from '@/lib/color/brand-palette';`. Add this to the `render` args, directly under `accentOverride`:

```ts
    /** The shop's own brand colors. When set, the derived palette REPLACES the
     *  skin's palette entirely (and `accentOverride` is ignored). Envelope-stored. */
    brandPalette?: BrandPalette | undefined;
```

Then add `brandPalette?: BrandPalette | undefined;` to the inline arg types of `renderProduct`, `renderContentPage` and `renderShell`.

In `lib/archetypes/main-street/builder.tsx`, add `import { applyBrandPalette, type BrandPalette } from '@/lib/color/brand-palette';` and these two helpers next to `hexIsDark`:

```tsx
/** The skin a page paints in: the shop's brand palette takes over the whole skin
 *  palette when set; otherwise the mood's skin with any baked accent tint. */
function themeFor(lookKey: string, brandPalette: BrandPalette | undefined, accentOverride: string | undefined): ArchetypeTheme {
  const base = mainStreetArchetype.resolveTheme({ skinKey: lookKey });
  return brandPalette !== undefined ? applyBrandPalette(base, brandPalette) : applyAccentOverride(base, accentOverride);
}

/** The family a page paints with. Under a brand palette the family wallpaper is
 *  switched off: it paints as a colored image over the page and would wash the
 *  brand's own surface toward the mood's color. Grain stays. */
function familyFor(mood: string | undefined, brandPalette: BrandPalette | undefined): Family {
  const family = getFamily(mood);
  return brandPalette !== undefined ? { ...family, textureOpacity: 0 } : family;
}
```

If `ArchetypeTheme` isn't imported in this file yet, add it to the `../types` import. Then:
- `render`: add `brandPalette` to the destructured args.
  - Replace line 272 with `const skin = themeFor(lookKey, brandPalette, accentOverride);`.
  - Replace `const familyBase = getFamily(mood);` with `const familyBase = familyFor(mood, brandPalette);`.
  - In the URL-texture branch, replace `hexIsDark(familyBase.palette.bg)` with `hexIsDark(brandPalette !== undefined ? skin.palette.bg : familyBase.palette.bg)`.
- `renderProduct`, `renderContentPage`, `renderShell`: add `brandPalette` to each destructure. Replace each `applyAccentOverride(...)` line with `const skin = themeFor(lookKey, brandPalette, accentOverride);` and each `const family = getFamily(mood);` with `const family = familyFor(mood, brandPalette);`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run lib/archetypes/main-street/builder.test.tsx`
Expected: PASS (existing and new)

- [ ] **Step 5: Commit** — `feat(storefront): brand palette replaces the skin palette on every Main Street page`

---

### Task 4: Storefront reads the envelope

**Files:** Create `lib/storefront/brand-palette.ts` and `lib/storefront/brand-palette.test.ts`. Modify `app/storefront/_components/StorefrontPage.tsx` (lines ~129–168 and ~296–334).

- [ ] **Step 1: Write the failing test** (`lib/storefront/brand-palette.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const error = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error, warn: vi.fn(), info: vi.fn() } }));

const { readBrandPalette } = await import('./brand-palette');

describe('readBrandPalette', () => {
  beforeEach(() => error.mockClear());

  it('returns undefined quietly when the envelope has none', () => {
    expect(readBrandPalette({}, 't1')).toBeUndefined();
    expect(error).not.toHaveBeenCalled();
  });

  it('returns the palette when valid', () => {
    expect(readBrandPalette({ brandPalette: { base: '#0b0b0b', accent: '#3dae3f' } }, 't1'))
      .toEqual({ base: '#0b0b0b', accent: '#3dae3f' });
  });

  it('falls back to the mood colors and logs when the stored value is broken', () => {
    expect(readBrandPalette({ brandPalette: { base: 'green' } }, 't1')).toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('brandPalette'), { tenantId: 't1' });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/storefront/brand-palette.test.ts`
Expected: FAIL (module missing)

- [ ] **Step 3: Implement** (`lib/storefront/brand-palette.ts`)

```ts
import { logger } from '@/lib/logger';
import { parseBrandPalette, type BrandPalette } from '@/lib/color/brand-palette';

/** The envelope's brand palette, or undefined. A broken stored value never breaks
 *  the page: the shopper gets the mood's colors, and the error is logged. */
export function readBrandPalette(env: Record<string, unknown>, tenantId: string): BrandPalette | undefined {
  const parsed = parseBrandPalette(env['brandPalette']);
  if (parsed.kind === 'invalid') {
    logger.error('storefront: invalid brandPalette — painting the mood colors instead', { tenantId });
  }
  return parsed.kind === 'valid' ? parsed.value : undefined;
}
```

In `StorefrontPage.tsx`:
- Add `import { readBrandPalette } from '@/lib/storefront/brand-palette';`.
- In `resolveEnvelope`, add `const brandPalette = readBrandPalette(env, tenantId);` and include `brandPalette` in the returned object.
- In the product, content-page and shell wrappers (lines ~149, ~160, ~168), add `brandPalette: a.brandPalette` next to `accentOverride: a.accentOverride`.
- In `renderStore`, after the `accentOverride` line (~305), add `const brandPalette = readBrandPalette(env, tenantId);` and pass `brandPalette` into `spec.render({...})` next to `accentOverride`.

- [ ] **Step 4: Run it and confirm it passes, plus the storefront suite**

Run: `npx vitest run lib/storefront app/storefront`
Expected: PASS

- [ ] **Step 5: Commit** — `feat(storefront): read the envelope brand palette, fall back safely when broken`

---

### Task 5: The set-brand-palette script

**Files:** Create `scripts/set-brand-palette.ts`.

- [ ] **Step 1: Implement**

```ts
#!/usr/bin/env -S npx tsx
/**
 * Set (or clear) a shop's brand palette — "their colors take over".
 * Claude's tool for hand-built clients; not a user surface.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/set-brand-palette.ts <subdomain> --base "#0B0B0B" --accent "#3DAE3F" [--second "#1F3D22"] [--dry]
 *   npx tsx --env-file=.env.local scripts/set-brand-palette.ts <subdomain> --clear
 *
 * Writes layout_tree.root.brandPalette on the published home envelope (content_pages
 * slug '/') and on the staged draft (store_drafts) if one exists. Prints the derived
 * palette and any adjustments first.
 */
import { createClient } from '@supabase/supabase-js';
import { BrandPaletteSchema, deriveBrandPalette, formatDerivation, type BrandPalette } from '../lib/color/brand-palette';

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const [subdomain, ...rest] = process.argv.slice(2);
if (subdomain === undefined || subdomain.startsWith('-')) {
  fail('usage: set-brand-palette.ts <subdomain> --base "#hex" --accent "#hex" [--second "#hex"] [--dry] | --clear');
}
const dry = rest.includes('--dry');
const clear = rest.includes('--clear');

let palette: BrandPalette | null = null;
if (!clear) {
  const parsed = BrandPaletteSchema.safeParse({
    base: flag(rest, '--base'),
    accent: flag(rest, '--accent'),
    ...(flag(rest, '--second') !== undefined ? { second: flag(rest, '--second') } : {}),
  });
  if (!parsed.success) fail(`invalid colors: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  palette = parsed.data;
  process.stdout.write(`derived palette:\n${formatDerivation(deriveBrandPalette(palette))}\n\n`);
}

const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
const db = createClient(url, key);

const { data: tenant, error: tErr } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).maybeSingle();
if (tErr !== null) fail(`tenant lookup failed: ${tErr.message}`);
if (tenant === null) fail(`no tenant with subdomain "${subdomain}"`);
process.stdout.write(`tenant: ${tenant.business_name} (${tenant.id})\n`);

function withPalette(tree: unknown): Record<string, unknown> {
  if (tree === null || typeof tree !== 'object' || Array.isArray(tree)) fail('layout_tree is not an object');
  const t = tree as Record<string, unknown>;
  const root = t['root'];
  if (root === null || typeof root !== 'object' || (root as Record<string, unknown>)['kind'] !== 'archetype') {
    fail('envelope root is not an archetype envelope');
  }
  const nextRoot: Record<string, unknown> = { ...(root as Record<string, unknown>) };
  if (palette === null) delete nextRoot['brandPalette'];
  else nextRoot['brandPalette'] = palette;
  return { ...t, root: nextRoot };
}

const { data: page, error: pErr } = await db.from('content_pages').select('id, layout_tree').eq('tenant_id', tenant.id).eq('slug', '/').maybeSingle();
if (pErr !== null) fail(`home page lookup failed: ${pErr.message}`);
if (page === null) fail('no published home page for this tenant');
const { data: draft, error: dErr } = await db.from('store_drafts').select('layout_tree').eq('tenant_id', tenant.id).maybeSingle();
if (dErr !== null) fail(`draft lookup failed: ${dErr.message}`);

const nextPage = withPalette(page.layout_tree);
const nextDraft = draft === null ? null : withPalette(draft.layout_tree);

if (dry) {
  process.stdout.write(`--dry: would ${clear ? 'clear' : 'set'} brandPalette on the home page${nextDraft !== null ? ' and the draft' : ''}.\n`);
  process.exit(0);
}

const { error: wErr } = await db.from('content_pages').update({ layout_tree: nextPage }).eq('id', page.id);
if (wErr !== null) fail(`home page write failed: ${wErr.message}`);
if (nextDraft !== null) {
  const { error: wdErr } = await db.from('store_drafts').update({ layout_tree: nextDraft }).eq('tenant_id', tenant.id);
  if (wdErr !== null) fail(`draft write failed: ${wdErr.message}`);
}
process.stdout.write(`done — brandPalette ${clear ? 'cleared' : 'set'}${nextDraft !== null ? ' (home + draft)' : ' (home)'}.\n`);
```

> Check which tsconfig covers `scripts/`. If `tsc --noEmit` includes it, the file must pass the strict config. Fix any `update({ layout_tree: ... })` typing by casting to the generated `Json` type (`import type { Json } from '../lib/database.types'`), not with `any`.

- [ ] **Step 2: Dry-run against a test store to verify output**

Run: `npx tsx --env-file=.env.local scripts/set-brand-palette.ts classic-loafs --base "#0B0B0B" --accent "#3DAE3F" --dry`
Expected: the derived palette prints, then `no adjustments — every color used as given`, then `--dry: would set brandPalette ...`

- [ ] **Step 3: Commit** — `feat(scripts): set-brand-palette — Claude's tool to set a shop's colors`

---

### Task 6: Full verification + visual gate

- [ ] **Step 1:** `npm run typecheck`. Expected: no errors.
- [ ] **Step 2:** `npm run lint`. Expected: clean.
- [ ] **Step 3:** `npm test`. Expected: the full suite passes, with a count above the previous 1230.
- [ ] **Step 4: Visual gate (Alex).** Apply black and green to a test store (`classic-loafs`) with the script, without `--dry`. Start the dev server and give Alex the URL. **Hold the "done" call until Alex has seen it.** Afterward, run `--clear` to restore the test store.
- [ ] **Step 5:** Tick the Full Plan / session brief only after Alex signs off.

---

## Out of this plan (next plans, in order)

1. Creating Cut-Pro's store by hand, with no onboarding.
2. Job listings with no price.
3. A front page led by video with the estimate button up top.
4. The estimate form.

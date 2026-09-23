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
  }, 60_000);
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
    const skin = Object.values(MAIN_STREET_SKINS)[0];
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

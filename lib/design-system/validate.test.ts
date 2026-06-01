import { describe, it, expect } from 'vitest';
import { validateDesignSystem } from './validate';
import type { StyleSheet } from '@/lib/style-sheet';

const baseTypeScale = {
  eyebrow: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4, uppercase: true },
  headline: { fontName: 'Playfair Display', sizePx: 64, sizeMobilePx: 36, weight: 700, lineHeight: 1.05 },
  sub: { fontName: 'Playfair Display', sizePx: 28, sizeMobilePx: 22, weight: 600, lineHeight: 1.2 },
  body: { fontName: 'Geist', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
  caption: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 400, lineHeight: 1.4 },
  wordmark: { fontName: 'Playfair Display', sizePx: 30, sizeMobilePx: 24, weight: 700, lineHeight: 1.1 },
};

const baseSheet: StyleSheet = {
  palette: [
    { name: 'Midnight', value: '#1A1A2E', character: 'deep navy, mystery' },
    { name: 'Cream', value: '#F5F0E8', character: 'warm off-white' },
    { name: 'Amber', value: '#D4A017', character: 'golden accent' },
  ],
  fonts: [
    {
      name: 'Playfair Display',
      family: 'Playfair Display',
      source: 'google',
      weights: [400, 700],
      fallback: 'serif',
      character: 'editorial serif',
    },
    {
      name: 'Geist',
      family: 'Geist',
      source: 'google',
      weights: [400, 500],
      fallback: 'sans-serif',
      character: 'clean geometric sans',
    },
  ],
  textures: [],
  semanticColors: { primarySeedColor: '#6B3F2A', scheme: 'light' },
  typeScale: baseTypeScale,
  spacing: { unit: 8 },
};

describe('validateDesignSystem', () => {
  it('passes a valid sheet', () => {
    const result = validateDesignSystem(baseSheet);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags a type scale role referencing an unknown font', () => {
    const sheet: StyleSheet = {
      ...baseSheet,
      typeScale: {
        ...baseTypeScale,
        headline: { ...baseTypeScale.headline, fontName: 'Unknown Font' },
      },
    };
    const result = validateDesignSystem(sheet);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.path).toBe('typeScale.headline.fontName');
    expect(result.issues[0]?.message).toContain('"Unknown Font"');
  });

  it('collects multiple font issues', () => {
    const sheet: StyleSheet = {
      ...baseSheet,
      typeScale: {
        ...baseTypeScale,
        headline: { ...baseTypeScale.headline, fontName: 'Missing A' },
        sub: { ...baseTypeScale.sub, fontName: 'Missing B' },
      },
    };
    const result = validateDesignSystem(sheet);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(2);
  });

  it('passes when multiple roles share the same valid font', () => {
    const sheet: StyleSheet = {
      ...baseSheet,
      typeScale: {
        ...baseTypeScale,
        headline: { ...baseTypeScale.headline, fontName: 'Geist' },
        sub: { ...baseTypeScale.sub, fontName: 'Geist' },
      },
    };
    expect(validateDesignSystem(sheet).ok).toBe(true);
  });
});

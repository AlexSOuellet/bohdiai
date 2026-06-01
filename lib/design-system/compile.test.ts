import { describe, it, expect } from 'vitest';
import { compileDesignSystemVars, buildDesignSystemCss } from './compile';
import type { StyleSheet } from '@/lib/style-sheet';
import type { SemanticColors } from './types';

const mockSemanticColors: SemanticColors = {
  surface: '#fffbff',
  onSurface: '#201a18',
  surfaceVariant: '#f4ded5',
  onSurfaceVariant: '#52443e',
  primary: '#99461a',
  onPrimary: '#ffffff',
  primaryContainer: '#ffdbcb',
  onPrimaryContainer: '#370d00',
  secondary: '#77574c',
  onSecondary: '#ffffff',
  secondaryContainer: '#ffdbd1',
  onSecondaryContainer: '#2c1510',
  outline: '#85736e',
  inverseSurface: '#362f2d',
  inverseOnSurface: '#fbeeea',
};

const mockSheet: StyleSheet = {
  palette: [
    { name: 'Midnight', value: '#1A1A2E', character: 'deep navy' },
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
  typeScale: {
    eyebrow: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4, uppercase: true },
    headline: { fontName: 'Playfair Display', sizePx: 64, sizeMobilePx: 36, weight: 700, lineHeight: 1.05 },
    sub: { fontName: 'Playfair Display', sizePx: 28, sizeMobilePx: 22, weight: 600, lineHeight: 1.2 },
    body: { fontName: 'Geist', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
    caption: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 400, lineHeight: 1.4 },
    wordmark: { fontName: 'Playfair Display', sizePx: 30, sizeMobilePx: 24, weight: 700, lineHeight: 1.1 },
  },
  spacing: { unit: 8 },
};

describe('compileDesignSystemVars', () => {
  it('emits semantic color CSS variables', () => {
    const { rootLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(rootLines.some((l) => l.includes('--color-surface: #fffbff'))).toBe(true);
    expect(rootLines.some((l) => l.includes('--color-on-surface: #201a18'))).toBe(true);
    expect(rootLines.some((l) => l.includes('--color-primary: #99461a'))).toBe(true);
  });

  it('emits type scale font variables with family and fallback', () => {
    const { rootLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(
      rootLines.some((l) => l.includes('--type-headline-font: "Playfair Display", serif')),
    ).toBe(true);
    expect(rootLines.some((l) => l.includes('--type-body-font: Geist, sans-serif'))).toBe(true);
  });

  it('emits wordmark type scale variables', () => {
    const { rootLines, mediaLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(
      rootLines.some((l) => l.includes('--type-wordmark-font: "Playfair Display", serif')),
    ).toBe(true);
    expect(rootLines.some((l) => l.includes('--type-wordmark-size: 24px'))).toBe(true);
    expect(rootLines.some((l) => l.includes('--type-wordmark-weight: 700'))).toBe(true);
    expect(mediaLines.some((l) => l.includes('--type-wordmark-size: 30px'))).toBe(true);
  });

  it('emits mobile size as the default (root) and desktop size in media overrides', () => {
    const { rootLines, mediaLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(rootLines.some((l) => l.includes('--type-headline-size: 36px'))).toBe(true);
    expect(mediaLines.some((l) => l.includes('--type-headline-size: 64px'))).toBe(true);
  });

  it('does not emit a media override when mobile and desktop sizes are equal', () => {
    const { mediaLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    // eyebrow and caption have equal sizePx and sizeMobilePx
    expect(mediaLines.some((l) => l.includes('--type-eyebrow-size'))).toBe(false);
    expect(mediaLines.some((l) => l.includes('--type-caption-size'))).toBe(false);
  });

  it('emits uppercase transform for roles with uppercase: true', () => {
    const { rootLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(rootLines.some((l) => l.includes('--type-eyebrow-transform: uppercase'))).toBe(true);
    // body does not have uppercase
    expect(rootLines.some((l) => l.includes('--type-body-transform'))).toBe(false);
  });

  it('emits spacing unit', () => {
    const { rootLines } = compileDesignSystemVars(mockSheet, mockSemanticColors);
    expect(rootLines.some((l) => l.includes('--spacing-unit: 8px'))).toBe(true);
  });

  it('does not emit font var if font name not found', () => {
    const sheetWithMissingFont: StyleSheet = {
      ...mockSheet,
      typeScale: {
        ...mockSheet.typeScale,
        headline: { ...mockSheet.typeScale.headline, fontName: 'Ghost Font' },
      },
    };
    const { rootLines } = compileDesignSystemVars(sheetWithMissingFont, mockSemanticColors);
    expect(rootLines.some((l) => l.includes('--type-headline-font'))).toBe(false);
  });
});

describe('buildDesignSystemCss', () => {
  it('wraps root vars in :root {} block', () => {
    const css = buildDesignSystemCss(mockSheet, mockSemanticColors);
    expect(css).toContain(':root {');
    expect(css).toContain('--color-surface');
  });

  it('includes @media block for desktop overrides', () => {
    const css = buildDesignSystemCss(mockSheet, mockSemanticColors);
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('--type-headline-size: 64px');
  });

  it('does not emit empty media block when all sizes are equal', () => {
    const uniformSheet: StyleSheet = {
      ...mockSheet,
      typeScale: Object.fromEntries(
        Object.entries(mockSheet.typeScale).map(([role, entry]) => [
          role,
          { ...entry, sizePx: entry.sizeMobilePx },
        ]),
      ) as StyleSheet['typeScale'],
    };
    const css = buildDesignSystemCss(uniformSheet, mockSemanticColors);
    expect(css).not.toContain('@media');
  });
});

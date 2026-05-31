import { describe, it, expect } from 'vitest';
import { compileStyleSheet, googleFontPreconnectLinks } from './style-sheet-loader';
import type { StyleSheet } from './style-sheet';

const baseTypeScale = {
  eyebrow: { fontName: 'Body', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4 },
  headline: { fontName: 'Header', sizePx: 48, sizeMobilePx: 28, weight: 700, lineHeight: 1.05 },
  sub: { fontName: 'Header', sizePx: 24, sizeMobilePx: 20, weight: 600, lineHeight: 1.2 },
  body: { fontName: 'Body', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
  caption: { fontName: 'Body', sizePx: 14, sizeMobilePx: 14, weight: 400, lineHeight: 1.4 },
} as const;

const baseSheet = (): StyleSheet => ({
  palette: [
    { name: 'Ink', value: '#111111', character: 'core text' },
    { name: 'Cream', value: '#fff8e7', character: 'page background' },
    { name: 'Honey Gold', value: '#d4a017', character: 'accent' },
  ],
  fonts: [
    {
      name: 'Header',
      family: 'Playfair Display',
      source: 'google',
      weights: [700, 400],
      fallback: 'serif',
      character: 'editorial serif',
    },
    {
      name: 'Body',
      family: 'Inter',
      source: 'system',
      weights: [400],
      fallback: 'sans-serif',
      character: 'plain body',
    },
  ],
  textures: [{ name: 'Paper Grain', value: 'url(/textures/paper.png)', character: 'subtle' }],
  semanticColors: { primarySeedColor: '#d4a017', scheme: 'light' as const },
  typeScale: baseTypeScale,
  spacing: { unit: 8 },
});

describe('compileStyleSheet', () => {
  it('emits :root with palette, font and texture variables', () => {
    const out = compileStyleSheet(baseSheet());
    expect(out.cssVariables).toContain(':root {');
    expect(out.cssVariables).toContain('--palette-ink: #111111;');
    expect(out.cssVariables).toContain('--palette-cream: #fff8e7;');
    expect(out.cssVariables).toContain('--palette-honey-gold: #d4a017;');
    expect(out.cssVariables).toContain('--font-header: "Playfair Display", serif;');
    expect(out.cssVariables).toContain('--font-body: Inter, sans-serif;');
    expect(out.cssVariables).toContain('--texture-paper-grain: url(/textures/paper.png);');
    expect(out.cssVariables.trimEnd().endsWith('}')).toBe(true);
    // Design system vars also emitted
    expect(out.cssVariables).toContain('--color-surface:');
    expect(out.cssVariables).toContain('--type-headline-font:');
    expect(out.cssVariables).toContain('--spacing-unit: 8px');
  });

  it('emits a google font link sorted by weight with display=swap', () => {
    const out = compileStyleSheet(baseSheet());
    expect(out.googleFontLinks).toHaveLength(1);
    const href = out.googleFontLinks[0] ?? '';
    expect(href).toContain('family=Playfair%20Display');
    expect(href).toContain(':wght@400;700');
    expect(href).toContain('display=swap');
  });

  it('emits an italic-axis link when styles include italic', () => {
    const sheet = baseSheet();
    sheet.fonts[0] = { ...sheet.fonts[0]!, styles: ['normal', 'italic'] };
    const out = compileStyleSheet(sheet);
    const href = out.googleFontLinks[0] ?? '';
    expect(href).toContain(':ital,wght@');
    expect(href).toContain('0,400;1,400;0,700;1,700');
  });

  it('defaults to normal-only when styles is omitted', () => {
    const sheet = baseSheet();
    const out = compileStyleSheet(sheet);
    expect(out.googleFontLinks[0]).toContain(':wght@');
    expect(out.googleFontLinks[0]).not.toContain('ital');
  });

  it('emits @font-face for custom fonts and skips google for them', () => {
    const sheet = baseSheet();
    sheet.fonts.push({
      name: 'Display',
      family: 'My Custom Face',
      source: 'custom',
      weights: [400],
      fallback: 'serif',
      character: 'custom',
      customUrl: 'https://cdn.example.com/myfont.woff2',
    });
    const out = compileStyleSheet(sheet);
    expect(out.customFontFaces).toContain('@font-face');
    expect(out.customFontFaces).toContain('font-family: "My Custom Face";');
    expect(out.customFontFaces).toContain(
      'src: url(https://cdn.example.com/myfont.woff2) format("woff2");',
    );
    expect(out.customFontFaces).toContain('font-display: swap;');
    // Still only one google font link.
    expect(out.googleFontLinks).toHaveLength(1);
  });

  it('emits empty customFontFaces when there are no custom fonts', () => {
    const out = compileStyleSheet(baseSheet());
    expect(out.customFontFaces).toBe('');
  });

  it('does not quote single-word family names', () => {
    const sheet = baseSheet();
    sheet.fonts[0] = { ...sheet.fonts[0]!, family: 'Inter' };
    const out = compileStyleSheet(sheet);
    expect(out.cssVariables).toContain('--font-header: Inter, serif;');
  });

  it('quotes multi-word custom font family in @font-face', () => {
    const sheet = baseSheet();
    sheet.fonts.push({
      name: 'Custom',
      family: 'Space Mono',
      source: 'custom',
      weights: [400],
      fallback: 'monospace',
      character: 'custom',
      customUrl: 'https://x.com/y.woff2',
    });
    const out = compileStyleSheet(sheet);
    expect(out.customFontFaces).toContain('font-family: "Space Mono";');
  });

  it('does not quote single-word custom family in @font-face', () => {
    const sheet = baseSheet();
    sheet.fonts.push({
      name: 'Custom',
      family: 'Mono',
      source: 'custom',
      weights: [400],
      fallback: 'monospace',
      character: 'custom',
      customUrl: 'https://x.com/y.woff2',
    });
    const out = compileStyleSheet(sheet);
    expect(out.customFontFaces).toContain('font-family: Mono;');
  });

  it('handles empty textures', () => {
    const sheet = baseSheet();
    sheet.textures = [];
    const out = compileStyleSheet(sheet);
    expect(out.cssVariables).not.toContain('--texture-');
  });
});

describe('googleFontPreconnectLinks', () => {
  it('returns both preconnect link descriptors', () => {
    const links = googleFontPreconnectLinks();
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    expect(links[1]).toEqual({
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    });
  });
});

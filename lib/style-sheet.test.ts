import { describe, it, expect } from 'vitest';
import {
  PaletteEntrySchema,
  FontEntrySchema,
  TextureEntrySchema,
  StyleSheetSchema,
  slugifyEntry,
} from './style-sheet';

const validPalette = (i: number) => ({
  name: `Color ${i}`,
  value: '#ffaa00',
  character: 'warm amber accent',
});

const validFont = (i: number) => ({
  name: `Font ${i}`,
  family: 'Inter',
  source: 'google' as const,
  weights: [400, 700],
  fallback: 'sans-serif' as const,
  character: 'modern utility sans',
});

const validTexture = (i: number) => ({
  name: `Texture ${i}`,
  value: 'url(/x.png)',
  character: 'subtle paper grain',
});

const validTypeScale = () => ({
  eyebrow: { fontName: 'Font 2', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4 },
  headline: { fontName: 'Font 1', sizePx: 48, sizeMobilePx: 28, weight: 700, lineHeight: 1.05 },
  sub: { fontName: 'Font 1', sizePx: 24, sizeMobilePx: 20, weight: 600, lineHeight: 1.2 },
  body: { fontName: 'Font 2', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
  caption: { fontName: 'Font 2', sizePx: 14, sizeMobilePx: 14, weight: 400, lineHeight: 1.4 },
});

const validSheet = () => ({
  palette: [validPalette(1), validPalette(2), validPalette(3)],
  fonts: [validFont(1), validFont(2)],
  textures: [validTexture(1)],
  semanticColors: { primarySeedColor: '#a0522d', scheme: 'light' as const },
  typeScale: validTypeScale(),
  spacing: { unit: 8 },
});

describe('slugifyEntry', () => {
  it('lowercases and dasherizes', () => {
    expect(slugifyEntry('Honey Gold')).toBe('honey-gold');
  });

  it('strips leading/trailing non-alnum', () => {
    expect(slugifyEntry('  !!Hello World!! ')).toBe('hello-world');
  });

  it('collapses runs of non-alnum into a single dash', () => {
    expect(slugifyEntry('foo & bar / baz')).toBe('foo-bar-baz');
  });

  it('returns empty string for all-symbol input', () => {
    expect(slugifyEntry('---')).toBe('');
  });
});

describe('PaletteEntrySchema', () => {
  it('accepts a valid entry', () => {
    expect(PaletteEntrySchema.safeParse(validPalette(1)).success).toBe(true);
  });

  it('accepts 3-digit hex', () => {
    expect(PaletteEntrySchema.safeParse({ ...validPalette(1), value: '#fa0' }).success).toBe(true);
  });

  it('accepts 8-digit hex (with alpha)', () => {
    expect(PaletteEntrySchema.safeParse({ ...validPalette(1), value: '#ffaa00cc' }).success).toBe(
      true,
    );
  });

  it('rejects non-hex color', () => {
    expect(PaletteEntrySchema.safeParse({ ...validPalette(1), value: 'red' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(PaletteEntrySchema.safeParse({ ...validPalette(1), name: '' }).success).toBe(false);
  });

  it('rejects extra fields (strict)', () => {
    expect(PaletteEntrySchema.safeParse({ ...validPalette(1), extra: 'nope' }).success).toBe(false);
  });
});

describe('FontEntrySchema', () => {
  it('accepts a valid google font', () => {
    expect(FontEntrySchema.safeParse(validFont(1)).success).toBe(true);
  });

  it('accepts optional italic style', () => {
    expect(
      FontEntrySchema.safeParse({ ...validFont(1), styles: ['normal', 'italic'] }).success,
    ).toBe(true);
  });

  it('accepts a system font', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), source: 'system' }).success).toBe(true);
  });

  it('accepts a custom font with customUrl', () => {
    expect(
      FontEntrySchema.safeParse({
        ...validFont(1),
        source: 'custom',
        customUrl: 'https://example.com/x.woff2',
      }).success,
    ).toBe(true);
  });

  it('rejects a custom font missing customUrl', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), source: 'custom' }).success).toBe(false);
  });

  it('rejects an invalid source enum', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), source: 'bogus' }).success).toBe(false);
  });

  it('rejects weight that is not a multiple of 100', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), weights: [450] }).success).toBe(false);
  });

  it('rejects weight below 100', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), weights: [50] }).success).toBe(false);
  });

  it('rejects weight above 900', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), weights: [1000] }).success).toBe(false);
  });

  it('rejects empty weights array', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), weights: [] }).success).toBe(false);
  });

  it('rejects bad fallback enum', () => {
    expect(FontEntrySchema.safeParse({ ...validFont(1), fallback: 'bogus' }).success).toBe(false);
  });

  it('rejects a bad customUrl', () => {
    expect(
      FontEntrySchema.safeParse({ ...validFont(1), source: 'custom', customUrl: 'not-a-url' })
        .success,
    ).toBe(false);
  });
});

describe('TextureEntrySchema', () => {
  it('accepts a valid entry', () => {
    expect(TextureEntrySchema.safeParse(validTexture(1)).success).toBe(true);
  });

  it('rejects empty value', () => {
    expect(TextureEntrySchema.safeParse({ ...validTexture(1), value: '' }).success).toBe(false);
  });
});

describe('StyleSheetSchema', () => {
  it('accepts a valid sheet', () => {
    expect(StyleSheetSchema.safeParse(validSheet()).success).toBe(true);
  });

  it('rejects fewer than 3 palette entries', () => {
    const sheet = validSheet();
    sheet.palette = [validPalette(1), validPalette(2)];
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it('rejects fewer than 2 fonts', () => {
    const sheet = validSheet();
    sheet.fonts = [validFont(1)];
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it('rejects more than 12 textures', () => {
    const sheet = validSheet();
    sheet.textures = Array.from({ length: 13 }, (_, i) => validTexture(i));
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it('detects palette slug collision', () => {
    const sheet = validSheet();
    sheet.palette = [
      { ...validPalette(1), name: 'Honey Gold' },
      { ...validPalette(2), name: 'honey-gold' },
      validPalette(3),
    ];
    const result = StyleSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('collides'))).toBe(true);
    }
  });

  it('detects font slug collision', () => {
    const sheet = validSheet();
    sheet.fonts = [
      { ...validFont(1), name: 'Header Sans' },
      { ...validFont(2), name: 'header-sans' },
    ];
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it('detects texture slug collision', () => {
    const sheet = validSheet();
    sheet.textures = [
      { ...validTexture(1), name: 'Paper' },
      { ...validTexture(2), name: 'paper' },
    ];
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it('accepts a sheet with zero textures', () => {
    const sheet = validSheet();
    sheet.textures = [];
    expect(StyleSheetSchema.safeParse(sheet).success).toBe(true);
  });
});

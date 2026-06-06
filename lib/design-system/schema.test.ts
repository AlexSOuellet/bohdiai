import { describe, it, expect } from 'vitest';
import {
  TypeScaleEntrySchema,
  TypeScaleSchema,
  SemanticColorsSeedSchema,
  SpacingSchema,
} from './schema';

const validEntry = {
  fontName: 'Playfair Display',
  sizePx: 48,
  sizeMobilePx: 32,
  weight: 700,
  lineHeight: 1.1,
};

describe('TypeScaleEntrySchema', () => {
  it('accepts a valid entry', () => {
    expect(TypeScaleEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it('accepts optional letterSpacing and uppercase', () => {
    const result = TypeScaleEntrySchema.safeParse({
      ...validEntry,
      letterSpacing: '0.05em',
      uppercase: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects sizePx below 14', () => {
    const result = TypeScaleEntrySchema.safeParse({ ...validEntry, sizePx: 13 });
    expect(result.success).toBe(false);
  });

  it('rejects sizeMobilePx below 14', () => {
    const result = TypeScaleEntrySchema.safeParse({ ...validEntry, sizeMobilePx: 13 });
    expect(result.success).toBe(false);
  });

  it('rejects sizeMobilePx greater than sizePx', () => {
    const result = TypeScaleEntrySchema.safeParse({ ...validEntry, sizeMobilePx: 60, sizePx: 48 });
    expect(result.success).toBe(false);
  });

  it('rejects non-multiple-of-100 weight', () => {
    const result = TypeScaleEntrySchema.safeParse({ ...validEntry, weight: 650 });
    expect(result.success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    const result = TypeScaleEntrySchema.safeParse({ ...validEntry, extra: true });
    expect(result.success).toBe(false);
  });
});

describe('TypeScaleSchema', () => {
  const validScale = {
    eyebrow: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 500, lineHeight: 1.4, uppercase: true },
    headline: { fontName: 'Playfair Display', sizePx: 64, sizeMobilePx: 36, weight: 700, lineHeight: 1.05 },
    sub: { fontName: 'Playfair Display', sizePx: 28, sizeMobilePx: 22, weight: 600, lineHeight: 1.2 },
    body: { fontName: 'Geist', sizePx: 18, sizeMobilePx: 16, weight: 400, lineHeight: 1.6 },
    caption: { fontName: 'Geist', sizePx: 14, sizeMobilePx: 14, weight: 400, lineHeight: 1.4 },
    wordmark: { fontName: 'Playfair Display', sizePx: 30, sizeMobilePx: 24, weight: 700, lineHeight: 1.1 },
  };

  it('accepts a valid scale', () => {
    expect(TypeScaleSchema.safeParse(validScale).success).toBe(true);
  });

  it('rejects a missing role', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure to omit `headline`
    const { headline: _h, ...withoutHeadline } = validScale;
    expect(TypeScaleSchema.safeParse(withoutHeadline).success).toBe(false);
  });
});

describe('SemanticColorsSeedSchema', () => {
  it('accepts valid seed', () => {
    expect(
      SemanticColorsSeedSchema.safeParse({ primarySeedColor: '#6B3F2A', scheme: 'light' }).success,
    ).toBe(true);
  });

  it('accepts dark scheme', () => {
    expect(
      SemanticColorsSeedSchema.safeParse({ primarySeedColor: '#1A1A2E', scheme: 'dark' }).success,
    ).toBe(true);
  });

  it('rejects invalid hex', () => {
    expect(
      SemanticColorsSeedSchema.safeParse({ primarySeedColor: 'brown', scheme: 'light' }).success,
    ).toBe(false);
  });

  it('rejects unknown scheme', () => {
    expect(
      SemanticColorsSeedSchema.safeParse({ primarySeedColor: '#6B3F2A', scheme: 'warm' }).success,
    ).toBe(false);
  });
});

describe('SpacingSchema', () => {
  it('accepts valid unit', () => {
    expect(SpacingSchema.safeParse({ unit: 8 }).success).toBe(true);
  });

  it('rejects unit below 4', () => {
    expect(SpacingSchema.safeParse({ unit: 3 }).success).toBe(false);
  });

  it('rejects unit above 32', () => {
    expect(SpacingSchema.safeParse({ unit: 33 }).success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { SpotlightSchema, SpotlightSideSchema, PRIMITIVE_NODE_TYPES } from './primitives';
import { validateLayoutNode } from './tree';

const heroImage = {
  type: 'image',
  brief: 'a hammered silver ring on black',
  alt: 'a hammered silver ring',
  fill: true,
} as const;

const validSpotlight = {
  type: 'spotlight',
  media: heroImage,
  line: 'Raised from raw silver and stone',
  eyebrow: 'Handmade, one at a time',
  brand: 'Ore and Ash',
  cta: { label: 'See the work', href: '/shop' },
  contentSide: 'right',
};

describe('spotlight — side enum', () => {
  it('accepts left and right, rejects others', () => {
    expect(SpotlightSideSchema.safeParse('left').success).toBe(true);
    expect(SpotlightSideSchema.safeParse('right').success).toBe(true);
    expect(SpotlightSideSchema.safeParse('center').success).toBe(false);
  });
});

describe('spotlight — schema', () => {
  it('is registered as a primitive node type', () => {
    expect(PRIMITIVE_NODE_TYPES).toContain('spotlight');
  });

  it('parses a complete spotlight', () => {
    expect(SpotlightSchema.safeParse(validSpotlight).success).toBe(true);
  });

  it('requires media, line, and brand', () => {
    expect(SpotlightSchema.safeParse({ type: 'spotlight', line: 'a', brand: 'X' }).success).toBe(
      false,
    );
    expect(
      SpotlightSchema.safeParse({ type: 'spotlight', media: heroImage, brand: 'X' }).success,
    ).toBe(false);
    expect(
      SpotlightSchema.safeParse({ type: 'spotlight', media: heroImage, line: 'a' }).success,
    ).toBe(false);
  });

  it('eyebrow, cta, and contentSide are optional — a minimal spotlight parses', () => {
    expect(
      SpotlightSchema.safeParse({ type: 'spotlight', media: heroImage, line: 'a', brand: 'X' })
        .success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    expect(SpotlightSchema.safeParse({ ...validSpotlight, glow: true }).success).toBe(false);
  });
});

describe('spotlight — validation rules', () => {
  it('a valid spotlight passes full validation', () => {
    expect(validateLayoutNode(validSpotlight).ok).toBe(true);
  });

  it('recurses into media (a bad media child fails the parse)', () => {
    const res = validateLayoutNode({
      type: 'spotlight',
      media: { type: 'image', brief: 'x', alt: 'x', aspect: 'weird' },
      line: 'a',
      brand: 'X',
    });
    expect(res.ok).toBe(false);
  });
});

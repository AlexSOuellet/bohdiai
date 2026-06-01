import { describe, it, expect } from 'vitest';
import {
  StageSchema,
  StageRevealMotionSchema,
  StageRevealStaggerSchema,
  PRIMITIVE_NODE_TYPES,
} from './primitives';
import { validateLayoutNode } from './tree';

const media = { type: 'image', brief: 'held', alt: 'held', fill: true } as const;
const headline = { type: 'text', role: 'headline', content: 'Hi' } as const;

const validStage = {
  type: 'stage',
  minHeight: 'screen',
  align: 'bottom-left',
  scrim: 'dark',
  reveal: { motion: 'rise-fade', stagger: 'loose' },
  media,
  content: [headline],
};

describe('stage — reveal enums', () => {
  it('accepts the three motion modes and rejects others', () => {
    for (const g of ['rise', 'fade', 'rise-fade']) {
      expect(StageRevealMotionSchema.safeParse(g).success).toBe(true);
    }
    expect(StageRevealMotionSchema.safeParse('spin').success).toBe(false);
    // No 'none' — a stage is never static.
    expect(StageRevealMotionSchema.safeParse('none').success).toBe(false);
  });

  it('accepts the three stagger steps and rejects others', () => {
    for (const g of ['tight', 'normal', 'loose']) {
      expect(StageRevealStaggerSchema.safeParse(g).success).toBe(true);
    }
    expect(StageRevealStaggerSchema.safeParse('instant').success).toBe(false);
  });
});

describe('stage — schema', () => {
  it('is registered as a primitive node type', () => {
    expect(PRIMITIVE_NODE_TYPES).toContain('stage');
  });

  it('parses a complete stage', () => {
    expect(StageSchema.safeParse(validStage).success).toBe(true);
  });

  it('requires media and content keys', () => {
    expect(StageSchema.safeParse({ type: 'stage', content: [headline] }).success).toBe(false);
    expect(StageSchema.safeParse({ type: 'stage', media }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(StageSchema.safeParse({ ...validStage, parallax: true }).success).toBe(false);
  });

  it('defaults are optional — a minimal stage parses', () => {
    expect(StageSchema.safeParse({ type: 'stage', media, content: [headline] }).success).toBe(true);
  });
});

describe('stage — validation rules', () => {
  it('a valid stage passes full validation', () => {
    const res = validateLayoutNode(validStage);
    expect(res.ok).toBe(true);
  });

  it('flags an empty content array', () => {
    const res = validateLayoutNode({ type: 'stage', media, content: [] });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues.some((i) => i.message.includes('at least one content node'))).toBe(true);
    }
  });

  it('recurses into media and content (a bad child fails the parse)', () => {
    const badContent = validateLayoutNode({
      type: 'stage',
      media,
      content: [{ type: 'text', role: 'bogus', content: 'x' }],
    });
    expect(badContent.ok).toBe(false);

    const badMedia = validateLayoutNode({
      type: 'stage',
      media: { type: 'image', brief: 'x', alt: 'x', aspect: 'weird' },
      content: [headline],
    });
    expect(badMedia.ok).toBe(false);
  });
});

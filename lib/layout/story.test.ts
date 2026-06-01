import { describe, it, expect } from 'vitest';
import { StorySchema, StoryToneSchema, PRIMITIVE_NODE_TYPES } from './primitives';
import { validateLayoutNode } from './tree';

const videoMedia = {
  type: 'video',
  assetUrl: 'https://cdn.example.com/clip.mp4',
  fill: true,
  autoplay: true,
  loop: true,
  muted: true,
} as const;

const stillMedia = { type: 'image', brief: 'a held still', alt: 'a held still', fill: true } as const;

const validStory = {
  type: 'story',
  media: videoMedia,
  story: ['It starts with the wax', 'Poured by hand, one at a time'],
  eyebrow: 'Hand-poured in Providence',
  brand: 'Ember and Oak',
  cta: { label: 'Step inside', href: '/shop' },
  tone: 'dark',
};

describe('story — tone enum', () => {
  it('accepts dark and light, rejects others', () => {
    expect(StoryToneSchema.safeParse('dark').success).toBe(true);
    expect(StoryToneSchema.safeParse('light').success).toBe(true);
    expect(StoryToneSchema.safeParse('auto').success).toBe(false);
  });
});

describe('story — schema', () => {
  it('is registered as a primitive node type', () => {
    expect(PRIMITIVE_NODE_TYPES).toContain('story');
  });

  it('parses a complete story over video', () => {
    expect(StorySchema.safeParse(validStory).success).toBe(true);
  });

  it('parses a story over a still image (same brick, different media)', () => {
    expect(StorySchema.safeParse({ ...validStory, media: stillMedia }).success).toBe(true);
  });

  it('requires media, story, and brand', () => {
    expect(StorySchema.safeParse({ type: 'story', story: ['a'], brand: 'X' }).success).toBe(false);
    expect(StorySchema.safeParse({ type: 'story', media: videoMedia, brand: 'X' }).success).toBe(
      false,
    );
    expect(
      StorySchema.safeParse({ type: 'story', media: videoMedia, story: ['a'] }).success,
    ).toBe(false);
  });

  it('requires at least one story line', () => {
    expect(
      StorySchema.safeParse({ type: 'story', media: videoMedia, story: [], brand: 'X' }).success,
    ).toBe(false);
  });

  it('eyebrow, cta, and tone are optional — a minimal story parses', () => {
    expect(
      StorySchema.safeParse({ type: 'story', media: videoMedia, story: ['a'], brand: 'X' }).success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    expect(StorySchema.safeParse({ ...validStory, parallax: true }).success).toBe(false);
  });
});

describe('story — validation rules', () => {
  it('a valid story passes full validation', () => {
    expect(validateLayoutNode(validStory).ok).toBe(true);
  });

  it('recurses into media (a bad media child fails the parse)', () => {
    const res = validateLayoutNode({
      type: 'story',
      media: { type: 'image', brief: 'x', alt: 'x', aspect: 'weird' },
      story: ['a'],
      brand: 'X',
    });
    expect(res.ok).toBe(false);
  });
});

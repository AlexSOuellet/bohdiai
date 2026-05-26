import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-declare the schemas here so we can test validation independently of the
// AI call. The real schemas live in generate-page.ts but are not exported —
// testing them through a live AI call would be slow and non-deterministic.
// If the schemas change in generate-page.ts, update these to match.

const GeneratedSlotSchema = z.object({
  widgetKey: z.string(),
  content: z.record(z.string(), z.string()),
});

const GeneratedBlockSchema = z.object({
  blockKey: z.string(),
  position: z.number().int().nonnegative(),
  content: z.record(z.string(), z.string()),
  slots: z.record(z.string(), GeneratedSlotSchema).default({}),
});

const GeneratedPageSchema = z.object({
  blocks: z.array(GeneratedBlockSchema).min(1),
});

describe('GeneratedPageSchema', () => {
  it('parses a minimal valid page', () => {
    const input = {
      blocks: [
        { blockKey: 'hero-cinematic', position: 0, content: { headline: 'Hello' }, slots: {} },
      ],
    };
    expect(() => GeneratedPageSchema.parse(input)).not.toThrow();
  });

  it('parses a block with slots', () => {
    const input = {
      blocks: [
        {
          blockKey: 'hero-cinematic',
          position: 0,
          content: { headline: 'Hello' },
          slots: {
            'primary-cta': { widgetKey: 'cta-button', content: { label: 'Shop Now', href: '#' } },
          },
        },
      ],
    };
    const result = GeneratedPageSchema.parse(input);
    expect(result.blocks[0]?.slots['primary-cta']?.widgetKey).toBe('cta-button');
  });

  it('defaults slots to empty object when omitted', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 0, content: { headline: 'Hello' } }],
    };
    const result = GeneratedPageSchema.parse(input);
    expect(result.blocks[0]?.slots).toEqual({});
  });

  it('rejects an empty blocks array', () => {
    expect(() => GeneratedPageSchema.parse({ blocks: [] })).toThrow();
  });

  it('rejects a block with a negative position', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: -1, content: {} }],
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a block with a non-integer position', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 1.5, content: {} }],
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a block missing blockKey', () => {
    const input = {
      blocks: [{ position: 0, content: {} }],
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a page missing blocks entirely', () => {
    expect(() => GeneratedPageSchema.parse({})).toThrow();
  });

  it('rejects a slot missing widgetKey', () => {
    const input = {
      blocks: [
        {
          blockKey: 'hero-cinematic',
          position: 0,
          content: {},
          slots: { 'primary-cta': { content: { label: 'Go' } } },
        },
      ],
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });
});

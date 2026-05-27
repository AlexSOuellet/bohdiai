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

const SecondaryPageCopySchema = z.object({
  eyebrow: z.string().min(1).max(40),
  heading: z.string().min(1).max(80),
  subheading: z.string().min(1).max(240),
});

const ContactCopySchema = z.object({
  heading: z.string().min(1).max(80),
  subheading: z.string().min(1).max(280),
  buttonLabel: z.string().min(1).max(40),
});

const GeneratedPageSchema = z.object({
  blocks: z.array(GeneratedBlockSchema).min(1),
  secondaryPages: z.object({
    shop: SecondaryPageCopySchema,
    contact: ContactCopySchema,
  }),
});

const VALID_SECONDARY = {
  shop: { eyebrow: 'The Shop', heading: 'Everything in the studio', subheading: 'Browse the full collection.' },
  contact: { heading: 'Say Hello', subheading: 'Drop us a note.', buttonLabel: 'Send Message' },
};

describe('GeneratedPageSchema', () => {
  it('parses a minimal valid page', () => {
    const input = {
      blocks: [
        { blockKey: 'hero-cinematic', position: 0, content: { headline: 'Hello' }, slots: {} },
      ],
      secondaryPages: VALID_SECONDARY,
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
      secondaryPages: VALID_SECONDARY,
    };
    const result = GeneratedPageSchema.parse(input);
    expect(result.blocks[0]?.slots['primary-cta']?.widgetKey).toBe('cta-button');
  });

  it('defaults slots to empty object when omitted', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 0, content: { headline: 'Hello' } }],
      secondaryPages: VALID_SECONDARY,
    };
    const result = GeneratedPageSchema.parse(input);
    expect(result.blocks[0]?.slots).toEqual({});
  });

  it('rejects an empty blocks array', () => {
    expect(() => GeneratedPageSchema.parse({ blocks: [], secondaryPages: VALID_SECONDARY })).toThrow();
  });

  it('rejects a block with a negative position', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: -1, content: {} }],
      secondaryPages: VALID_SECONDARY,
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a block with a non-integer position', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 1.5, content: {} }],
      secondaryPages: VALID_SECONDARY,
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a block missing blockKey', () => {
    const input = {
      blocks: [{ position: 0, content: {} }],
      secondaryPages: VALID_SECONDARY,
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a page missing blocks entirely', () => {
    expect(() => GeneratedPageSchema.parse({ secondaryPages: VALID_SECONDARY })).toThrow();
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
      secondaryPages: VALID_SECONDARY,
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a page missing secondaryPages', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 0, content: {} }],
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a shop intro with empty heading', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 0, content: {} }],
      secondaryPages: {
        shop: { eyebrow: 'X', heading: '', subheading: 'Browse' },
        contact: VALID_SECONDARY.contact,
      },
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });

  it('rejects a contact subheading over 280 chars', () => {
    const input = {
      blocks: [{ blockKey: 'hero-cinematic', position: 0, content: {} }],
      secondaryPages: {
        shop: VALID_SECONDARY.shop,
        contact: { heading: 'Hi', subheading: 'x'.repeat(281), buttonLabel: 'Send' },
      },
    };
    expect(() => GeneratedPageSchema.parse(input)).toThrow();
  });
});

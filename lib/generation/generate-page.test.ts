import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeneratedPageSchema,
  GeneratedBlockSchema,
  GeneratedSlotSchema,
  SecondaryPageCopySchema,
  ContactCopySchema,
  AboutPageCopySchema,
  generatePage,
} from './generate-page';
import type { Mood } from '@/lib/moods';

const messagesCreateMock = vi.fn();

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({
    messages: { create: messagesCreateMock },
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const VALID_SECONDARY = {
  shop: {
    eyebrow: 'The Shop',
    heading: 'Everything in the studio',
    subheading: 'Browse the full collection.',
  },
  contact: { heading: 'Say Hello', subheading: 'Drop us a note.', buttonLabel: 'Send Message' },
  about: {
    eyebrow: 'Our Story',
    headline: 'About',
    intro: 'Lead paragraph.',
    body: 'Long body. '.repeat(40),
    signatureName: 'Alex',
    signatureRole: 'Maker',
  },
};

const MOOD: Mood = {
  key: 'rustic',
  label: 'Rustic',
  description: 'Rustic mood',
};

const DARK_MOOD: Mood = {
  key: 'dark',
  label: 'Dark',
  description: 'Dark mood',
};

function buildValidPageJson(): string {
  return JSON.stringify({
    blocks: [
      {
        blockKey: 'hero-cinematic',
        position: 0,
        content: { headline: 'Hi' },
        slots: { 'primary-cta': { widgetKey: 'cta-button', content: { label: 'Go', href: '#' } } },
      },
    ],
    secondaryPages: VALID_SECONDARY,
  });
}

function mockResponse(text: string) {
  return {
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

describe('Schemas (real exports)', () => {
  it('GeneratedSlotSchema parses a valid slot', () => {
    expect(() =>
      GeneratedSlotSchema.parse({ widgetKey: 'cta-button', content: { label: 'Go' } }),
    ).not.toThrow();
  });

  it('GeneratedBlockSchema defaults slots to {}', () => {
    const res = GeneratedBlockSchema.parse({ blockKey: 'k', position: 0, content: {} });
    expect(res.slots).toEqual({});
  });

  it('GeneratedBlockSchema rejects negative position', () => {
    expect(() =>
      GeneratedBlockSchema.parse({ blockKey: 'k', position: -1, content: {} }),
    ).toThrow();
  });

  it('GeneratedBlockSchema rejects non-integer position', () => {
    expect(() =>
      GeneratedBlockSchema.parse({ blockKey: 'k', position: 1.5, content: {} }),
    ).toThrow();
  });

  it('SecondaryPageCopySchema enforces max heading length', () => {
    expect(() =>
      SecondaryPageCopySchema.parse({ eyebrow: 'X', heading: 'a'.repeat(81), subheading: 'b' }),
    ).toThrow();
  });

  it('ContactCopySchema rejects oversized subheading', () => {
    expect(() =>
      ContactCopySchema.parse({ heading: 'Hi', subheading: 'x'.repeat(281), buttonLabel: 'Go' }),
    ).toThrow();
  });

  it('AboutPageCopySchema rejects body shorter than 200', () => {
    expect(() =>
      AboutPageCopySchema.parse({
        eyebrow: 'e',
        headline: 'h',
        intro: 'i',
        body: 'short',
        signatureName: 'Alex',
      }),
    ).toThrow();
  });

  it('AboutPageCopySchema defaults signatureRole to empty string', () => {
    const body = 'b'.repeat(200);
    const res = AboutPageCopySchema.parse({
      eyebrow: 'e',
      headline: 'h',
      intro: 'i',
      body,
      signatureName: 'Alex',
    });
    expect(res.signatureRole).toBe('');
  });

  it('GeneratedPageSchema parses a minimal valid page', () => {
    const input = {
      blocks: [{ blockKey: 'k', position: 0, content: {}, slots: {} }],
      secondaryPages: VALID_SECONDARY,
    };
    expect(() => GeneratedPageSchema.parse(input)).not.toThrow();
  });

  it('GeneratedPageSchema rejects an empty blocks array', () => {
    expect(() =>
      GeneratedPageSchema.parse({ blocks: [], secondaryPages: VALID_SECONDARY }),
    ).toThrow();
  });

  it('GeneratedPageSchema requires secondaryPages', () => {
    expect(() =>
      GeneratedPageSchema.parse({ blocks: [{ blockKey: 'k', position: 0, content: {} }] }),
    ).toThrow();
  });
});

describe('generatePage', () => {
  beforeEach(() => {
    messagesCreateMock.mockReset();
  });

  it('returns a parsed page on the happy path', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidPageJson()));
    const result = await generatePage('Shop', 'Candles', 'niche body', MOOD, 'tenant-1', 'candles');
    expect(result.blocks[0]?.blockKey).toBe('hero-cinematic');
    expect(result.secondaryPages.shop.heading).toBe('Everything in the studio');
    expect(messagesCreateMock).toHaveBeenCalledOnce();
  });

  it('takes the low-control branch for leatherworker × dark', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidPageJson()));
    await generatePage('Shop', 'Leather', 'niche', DARK_MOOD, undefined, 'leatherworker');
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    // low-control strips the MANDATORY RULES section
    expect(prompt).not.toContain('MANDATORY RULES');
  });

  it('includes the mandatory rules section when not low-control', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidPageJson()));
    await generatePage('Shop', 'Candles', 'niche', MOOD);
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('MANDATORY RULES');
  });

  it('throws when no JSON object is in the response', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse('no json here'));
    await expect(generatePage('Shop', 'Candles', 'n', MOOD)).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('throws when the response content is not a text block', async () => {
    messagesCreateMock.mockResolvedValue({
      model: 'm',
      content: [{ type: 'tool_use' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(generatePage('Shop', 'Candles', 'n', MOOD)).rejects.toThrow();
  });

  it('throws when JSON fails schema validation', async () => {
    messagesCreateMock.mockResolvedValue(
      mockResponse(JSON.stringify({ blocks: [], secondaryPages: VALID_SECONDARY })),
    );
    await expect(generatePage('Shop', 'Candles', 'n', MOOD)).rejects.toThrow();
  });

  it('throws when JSON cannot be parsed', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse('{ not valid json }'));
    await expect(generatePage('Shop', 'Candles', 'n', MOOD)).rejects.toThrow();
  });
});

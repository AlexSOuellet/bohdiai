import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeneratedListingSchema,
  GeneratedListingsSchema,
  generateListings,
} from './generate-listings';

const messagesCreateMock = vi.fn();
const generateProductImageMock = vi.fn();

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: messagesCreateMock } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/fal', () => ({
  generateProductImage: (...args: unknown[]) => generateProductImageMock(...args),
}));

function buildValidListingsJson(count: number): string {
  return JSON.stringify({
    listings: Array.from({ length: count }, (_, i) => ({
      name: `Product ${i}`,
      slug: `product-${i}`,
      short_description: 'short',
      description: 'long',
      base_price_cents: 1000 + i,
      image_prompt: 'a product',
      collection_slug: null,
    })),
  });
}

function mockResponse(text: string) {
  return {
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

describe('GeneratedListingSchema (real exports)', () => {
  it('parses a valid listing', () => {
    expect(() =>
      GeneratedListingSchema.parse({
        name: 'X',
        slug: 'x',
        short_description: 's',
        description: 'd',
        base_price_cents: 1000,
        image_prompt: 'p',
      }),
    ).not.toThrow();
  });

  it('defaults collection_slug to null', () => {
    const r = GeneratedListingSchema.parse({
      name: 'X',
      slug: 'x',
      short_description: 's',
      description: 'd',
      base_price_cents: 1000,
      image_prompt: 'p',
    });
    expect(r.collection_slug).toBeNull();
  });

  it('rejects slug with spaces', () => {
    expect(() =>
      GeneratedListingSchema.parse({
        name: 'X',
        slug: 'has space',
        short_description: 's',
        description: 'd',
        base_price_cents: 1000,
        image_prompt: 'p',
      }),
    ).toThrow();
  });

  it('rejects fractional price', () => {
    expect(() =>
      GeneratedListingSchema.parse({
        name: 'X',
        slug: 'x',
        short_description: 's',
        description: 'd',
        base_price_cents: 1.5,
        image_prompt: 'p',
      }),
    ).toThrow();
  });

  it('rejects zero price', () => {
    expect(() =>
      GeneratedListingSchema.parse({
        name: 'X',
        slug: 'x',
        short_description: 's',
        description: 'd',
        base_price_cents: 0,
        image_prompt: 'p',
      }),
    ).toThrow();
  });

  it('GeneratedListingsSchema rejects empty array', () => {
    expect(() => GeneratedListingsSchema.parse({ listings: [] })).toThrow();
  });
});

describe('generateListings', () => {
  beforeEach(() => {
    messagesCreateMock.mockReset();
    generateProductImageMock.mockReset();
    generateProductImageMock.mockResolvedValue('https://img/x.jpg');
  });

  it('caps image count at MAX_PRODUCT_IMAGES (4)', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(4)));
    const r = await generateListings('Shop', 'sub', 'Niche', 'body', 10, []);
    expect(r).toHaveLength(4);
    expect(generateProductImageMock).toHaveBeenCalledTimes(4);
  });

  it('returns listings with image URLs', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(2)));
    const r = await generateListings('Shop', 'sub', 'Niche', 'body', 2, ['c1']);
    expect(r[0]?.image_url).toBe('https://img/x.jpg');
  });

  it('takes collection guidance when slugs provided', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(1)));
    await generateListings('Shop', 'sub', 'Niche', 'body', 1, ['summer', 'winter']);
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('"summer"');
    expect(prompt).toContain('"winter"');
  });

  it('takes no-collections branch when slug array empty', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(1)));
    await generateListings('Shop', 'sub', 'Niche', 'body', 1, []);
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('no collections');
  });

  it('takes low-control branch for leatherworker × dark', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(1)));
    await generateListings('Shop', 'sub', 'Leather', 'body', 1, [], 'tenant-id', {
      nicheSlug: 'leatherworker',
      moodKey: 'dark',
      moodLabel: 'Dark',
      moodDescription: 'dark desc',
    });
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('MOOD: Dark');
  });

  it('low-control with missing moodDescription falls back to empty string', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(buildValidListingsJson(1)));
    await generateListings('Shop', 'sub', 'Leather', 'body', 1, [], undefined, {
      nicheSlug: 'leatherworker',
      moodKey: 'dark',
      moodLabel: 'Dark',
    });
    expect(messagesCreateMock).toHaveBeenCalled();
  });

  it('throws on missing JSON', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse('no json'));
    await expect(generateListings('S', 's', 'N', 'b', 1, [])).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('throws on schema validation failure', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ listings: [] })));
    await expect(generateListings('S', 's', 'N', 'b', 1, [])).rejects.toThrow();
  });

  it('throws when response content is not text', async () => {
    messagesCreateMock.mockResolvedValue({
      model: 'm',
      content: [{ type: 'tool_use' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(generateListings('S', 's', 'N', 'b', 1, [])).rejects.toThrow();
  });
});

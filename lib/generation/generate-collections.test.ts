import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeneratedCollectionSchema,
  GeneratedCollectionsSchema,
  generateCollections,
} from './generate-collections';

const messagesCreateMock = vi.fn();

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: messagesCreateMock } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function mockResponse(text: string) {
  return {
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

describe('GeneratedCollection schemas', () => {
  it('parses a valid collection', () => {
    expect(() =>
      GeneratedCollectionSchema.parse({
        name: 'Seasonal',
        slug: 'seasonal',
        description: 'Seasonal stuff',
      }),
    ).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() =>
      GeneratedCollectionSchema.parse({ name: '', slug: 's', description: 'd' }),
    ).toThrow();
  });

  it('rejects slug with uppercase', () => {
    expect(() =>
      GeneratedCollectionSchema.parse({ name: 'X', slug: 'Bad', description: 'd' }),
    ).toThrow();
  });

  it('rejects description over 280 chars', () => {
    expect(() =>
      GeneratedCollectionSchema.parse({ name: 'X', slug: 'x', description: 'd'.repeat(281) }),
    ).toThrow();
  });

  it('GeneratedCollectionsSchema allows empty array', () => {
    expect(() => GeneratedCollectionsSchema.parse({ collections: [] })).not.toThrow();
  });

  it('GeneratedCollectionsSchema rejects more than 4', () => {
    const cols = Array.from({ length: 5 }, (_, i) => ({
      name: `n${i}`,
      slug: `s${i}`,
      description: 'd',
    }));
    expect(() => GeneratedCollectionsSchema.parse({ collections: cols })).toThrow();
  });
});

describe('generateCollections', () => {
  beforeEach(() => {
    messagesCreateMock.mockReset();
  });

  it('returns the parsed collections on happy path', async () => {
    messagesCreateMock.mockResolvedValue(
      mockResponse(
        JSON.stringify({
          collections: [{ name: 'Seasonal', slug: 'seasonal', description: 'Winter stuff' }],
        }),
      ),
    );
    const r = await generateCollections('Shop', 'Candles', 'niche body', 'tenant-1');
    expect(r).toHaveLength(1);
    expect(r[0]?.slug).toBe('seasonal');
  });

  it('takes the low-control branch for leatherworker × dark', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ collections: [] })));
    await generateCollections('Shop', 'Leather', 'body', 't', 'leatherworker', 'dark');
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).not.toContain('Same voice as the rest of the storefront copy');
  });

  it('keeps prescriptive copy guidance otherwise', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ collections: [] })));
    await generateCollections('Shop', 'Candles', 'body');
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('Same voice as the rest of the storefront copy');
  });

  it('throws on missing JSON', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse('nope'));
    await expect(generateCollections('S', 'N', 'b')).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('throws on schema failure', async () => {
    messagesCreateMock.mockResolvedValue(
      mockResponse(JSON.stringify({ collections: [{ name: '', slug: 's', description: 'd' }] })),
    );
    await expect(generateCollections('S', 'N', 'b')).rejects.toThrow();
  });

  it('throws when content is not text', async () => {
    messagesCreateMock.mockResolvedValue({
      model: 'm',
      content: [{ type: 'tool_use' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(generateCollections('S', 'N', 'b')).rejects.toThrow();
  });
});

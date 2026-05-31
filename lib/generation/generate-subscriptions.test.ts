import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeneratedSubscriptionSchema,
  GeneratedSubscriptionsSchema,
  generateSubscriptions,
} from './generate-subscriptions';

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

const VALID = {
  name: 'Candle of the Month',
  slug: 'candle-of-the-month',
  short_description: 'A new candle each month.',
  description: 'A new candle every month, hand-poured fresh.',
  base_price_cents: 3200,
  subscription_interval: 'month' as const,
  image_prompt: 'a candle subscription',
};

describe('GeneratedSubscription schemas', () => {
  it('parses a valid subscription', () => {
    expect(() => GeneratedSubscriptionSchema.parse(VALID)).not.toThrow();
  });

  it('rejects invalid interval', () => {
    expect(() =>
      GeneratedSubscriptionSchema.parse({ ...VALID, subscription_interval: 'yearly' }),
    ).toThrow();
  });

  it('rejects negative price', () => {
    expect(() => GeneratedSubscriptionSchema.parse({ ...VALID, base_price_cents: -100 })).toThrow();
  });

  it('rejects slug with uppercase', () => {
    expect(() => GeneratedSubscriptionSchema.parse({ ...VALID, slug: 'Bad' })).toThrow();
  });

  it('allows empty subscriptions array', () => {
    expect(() => GeneratedSubscriptionsSchema.parse({ subscriptions: [] })).not.toThrow();
  });

  it('rejects more than 2 subscriptions', () => {
    expect(() =>
      GeneratedSubscriptionsSchema.parse({ subscriptions: [VALID, VALID, VALID] }),
    ).toThrow();
  });
});

describe('generateSubscriptions', () => {
  beforeEach(() => {
    messagesCreateMock.mockReset();
  });

  it('returns parsed subscriptions on happy path', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ subscriptions: [VALID] })));
    const r = await generateSubscriptions('Shop', 'Candles', 'body', 't-1');
    expect(r).toHaveLength(1);
    expect(r[0]?.subscription_interval).toBe('month');
  });

  it('low-control branch for leatherworker × dark', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ subscriptions: [] })));
    await generateSubscriptions('Shop', 'Leather', 'body', 't', 'leatherworker', 'dark');
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).not.toContain('Same voice as the rest of the storefront copy');
  });

  it('keeps prescriptive copy guidance otherwise', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ subscriptions: [] })));
    await generateSubscriptions('Shop', 'Candles', 'body');
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('Same voice as the rest of the storefront copy');
  });

  it('throws on missing JSON', async () => {
    messagesCreateMock.mockResolvedValue(mockResponse('nope'));
    await expect(generateSubscriptions('S', 'N', 'b')).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('throws on schema failure', async () => {
    messagesCreateMock.mockResolvedValue(
      mockResponse(JSON.stringify({ subscriptions: [{ ...VALID, slug: 'BAD SLUG' }] })),
    );
    await expect(generateSubscriptions('S', 'N', 'b')).rejects.toThrow();
  });

  it('throws when content is not text', async () => {
    messagesCreateMock.mockResolvedValue({
      model: 'm',
      content: [{ type: 'tool_use' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(generateSubscriptions('S', 'N', 'b')).rejects.toThrow();
  });
});

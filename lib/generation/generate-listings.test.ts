import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const GeneratedListingSchema = z.object({
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  short_description: z.string(),
  description: z.string(),
  base_price_cents: z.number().int().positive(),
  image_prompt: z.string(),
});

const GeneratedListingsSchema = z.object({
  listings: z.array(GeneratedListingSchema).min(1),
});

describe('GeneratedListingsSchema', () => {
  it('parses a valid listing', () => {
    const input = {
      listings: [
        {
          name: 'Black Fig & Vetiver Soy Candle',
          slug: 'black-fig-vetiver-soy-candle',
          short_description: 'A deep, earthy candle for evenings in.',
          description: 'Hand-poured in small batches. 45-hour burn time.',
          base_price_cents: 2400,
          image_prompt: 'Close-up of a black jar candle on a slate surface',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).not.toThrow();
  });

  it('rejects an empty listings array', () => {
    expect(() => GeneratedListingsSchema.parse({ listings: [] })).toThrow();
  });

  it('rejects a slug with spaces', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'my candle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: 1000,
          image_prompt: 'img',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });

  it('rejects a slug with uppercase letters', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'MyCandle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: 1000,
          image_prompt: 'img',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });

  it('rejects a zero price', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'candle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: 0,
          image_prompt: 'img',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });

  it('rejects a negative price', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'candle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: -500,
          image_prompt: 'img',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });

  it('rejects a fractional price', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'candle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: 24.99,
          image_prompt: 'img',
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });

  it('rejects a listing missing image_prompt', () => {
    const input = {
      listings: [
        {
          name: 'Candle',
          slug: 'candle',
          short_description: 'desc',
          description: 'desc',
          base_price_cents: 1000,
        },
      ],
    };
    expect(() => GeneratedListingsSchema.parse(input)).toThrow();
  });
});

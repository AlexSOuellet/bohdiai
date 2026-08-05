import { describe, it, expect, vi } from 'vitest';
import { draftProductCopy, buildProductCopyInstruction } from './product-copy';
import type { NicheVoice } from '@/lib/editor/content-agent';

const niche: NicheVoice = { displayName: 'candle maker', body: 'candles…' };

describe('buildProductCopyInstruction', () => {
  it('includes the name and the maker hint', () => {
    const s = buildProductCopyInstruction('Amber Candle', 'lavender soy, 8oz, 40hr burn');
    expect(s).toContain('Amber Candle');
    expect(s).toContain('lavender soy, 8oz, 40hr burn');
    expect(s.toLowerCase()).toContain("don't invent");
  });
  it('omits the hint clause when the hint is empty', () => {
    const s = buildProductCopyInstruction('Amber Candle', '   ');
    expect(s).not.toContain("maker's words");
  });
});

describe('draftProductCopy', () => {
  it('returns the drafted short + description from the runner', async () => {
    const run = vi.fn().mockResolvedValue({
      values: {
        'product.shortDescription': 'Hand-poured lavender soy',
        'product.description': 'A calming 8oz candle that burns for 40 hours.',
      },
    });
    const out = await draftProductCopy({ name: 'Amber Candle', hint: 'lavender', niche }, run);
    expect(out).toEqual({
      shortDescription: 'Hand-poured lavender soy',
      description: 'A calming 8oz candle that burns for 40 hours.',
    });
    // It asks the agent to write exactly the two product fields.
    const call = run.mock.calls[0]![0] as { fields: { id: string }[] };
    expect(call.fields.map((f) => f.id)).toEqual(['product.shortDescription', 'product.description']);
  });

  it('returns only the fields Bohdi actually wrote', async () => {
    const run = vi.fn().mockResolvedValue({ values: { 'product.shortDescription': 'Just the line' } });
    const out = await draftProductCopy({ name: 'X', hint: '', niche }, run);
    expect(out).toEqual({ shortDescription: 'Just the line' });
  });

  it('propagates a runner error for the caller to translate', async () => {
    const run = vi.fn().mockRejectedValue(new Error('model down'));
    await expect(draftProductCopy({ name: 'X', hint: '', niche }, run)).rejects.toThrow('model down');
  });
});

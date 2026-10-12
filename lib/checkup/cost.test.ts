import { describe, it, expect } from 'vitest';
import { costOf } from './cost';

describe('costOf', () => {
  it('prices each kind of token at the model’s rates', () => {
    expect(
      costOf('claude-opus-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })
        .dollars,
    ).toBe(29.2);
  });
  it('treats missing cache counts as zero', () => {
    expect(costOf('claude-opus-5-5', { input_tokens: 500, output_tokens: 1000, cache_read_input_tokens: null })).toEqual({
      inputTokens: 500,
      outputTokens: 1000,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      dollars: 0.022,
    });
  });

  it('prices Haiku far lower, and unknown models as Opus', () => {
    expect(costOf('claude-haiku-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 }).dollars).toBe(0.6);
    expect(costOf('mystery', { input_tokens: 1_000_000, output_tokens: 0 }).dollars).toBe(4);
  });
});

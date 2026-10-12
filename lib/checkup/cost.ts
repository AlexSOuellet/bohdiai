/**
 * What one checkup call cost, from the usage the API reports. Rates are US
 * dollars per million tokens; thinking bills as output, cache writes at 1.25×
 * input. (Haiku's cache read rate assumed at a tenth of input.)
 */

interface Rates {
  readonly input: number;
  readonly output: number;
  readonly cacheWrite: number;
  readonly cacheRead: number;
}

const RATES: Readonly<Record<string, Rates>> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
};

/** Unknown models are priced as Opus, so a cost is never under-reported. */
const FALLBACK: Rates = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 };

export interface UsageLike {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cache_creation_input_tokens?: number | null;
  readonly cache_read_input_tokens?: number | null;
}

export interface CallCost {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
  /** In US dollars. */
  readonly dollars: number;
}

export function costOf(model: string, usage: UsageLike): CallCost {
  const rates = RATES[model] ?? FALLBACK;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const dollars =
    (usage.input_tokens * rates.input +
      usage.output_tokens * rates.output +
      cacheWriteTokens * rates.cacheWrite +
      cacheReadTokens * rates.cacheRead) /
    1_000_000;
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheWriteTokens,
    cacheReadTokens,
    dollars: Math.round(dollars * 1_000_000) / 1_000_000,
  };
}

import { describe, it, expect } from 'vitest';
import { LAYOUT_ENGINE_NICHES, isLayoutEngineNiche } from './layout-engine-niches';

describe('LAYOUT_ENGINE_NICHES', () => {
  it('contains candles', () => {
    expect(LAYOUT_ENGINE_NICHES.has('candles')).toBe(true);
  });
});

describe('isLayoutEngineNiche', () => {
  it('returns true for a member niche', () => {
    expect(isLayoutEngineNiche('candles')).toBe(true);
  });
  it('returns false for a non-member niche', () => {
    expect(isLayoutEngineNiche('leatherworker')).toBe(false);
    expect(isLayoutEngineNiche('')).toBe(false);
    expect(isLayoutEngineNiche('unknown-niche')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { loadNicheTextures } from './load-niche-textures';

describe('loadNicheTextures', () => {
  it('reads the candles niche style sheet and returns its texture shelf', async () => {
    const textures = await loadNicheTextures('candles');
    expect(textures.length).toBeGreaterThanOrEqual(3);
    // Every entry has the object shape the Editor picker relies on.
    for (const t of textures) {
      expect(typeof t.key).toBe('string');
      expect(t.key.length).toBeGreaterThan(0);
      expect(typeof t.name).toBe('string');
      expect(typeof t.sourceUrl).toBe('string');
      expect(t.sourceUrl.length).toBeGreaterThan(0);
    }
    // The three structurally-distinct picks are present.
    const keys = textures.map((t) => t.key);
    expect(keys).toContain('woven-linen');
    expect(keys).toContain('aged-glaze-cracks');
    expect(keys).toContain('marble-swirl');
  });

  it('returns an empty shelf for a niche with no style sheet', async () => {
    expect(await loadNicheTextures('there-is-no-such-niche')).toEqual([]);
  });

  it('returns an empty shelf for a null / empty niche', async () => {
    expect(await loadNicheTextures(null)).toEqual([]);
    expect(await loadNicheTextures('')).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { loadNicheTextures } from './load-niche-textures';

describe('loadNicheTextures', () => {
  it('reads a real niche style sheet and returns its (now empty) texture shelf', async () => {
    // The candle prototype textures were removed (D63) — the niche-writer curation
    // path is abandoned. The style sheet still exists and parses; its texture list is
    // empty. The loader stays in the tree for a future curated cross-family library.
    const textures = await loadNicheTextures('candles');
    expect(textures).toEqual([]);
  });

  it('returns an empty shelf for a niche with no style sheet', async () => {
    expect(await loadNicheTextures('there-is-no-such-niche')).toEqual([]);
  });

  it('returns an empty shelf for a null / empty niche', async () => {
    expect(await loadNicheTextures(null)).toEqual([]);
    expect(await loadNicheTextures('')).toEqual([]);
  });
});

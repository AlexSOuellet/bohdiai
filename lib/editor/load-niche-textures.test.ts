import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadNicheTextures } from './load-niche-textures';

// Hand-written style sheets live in a throwaway project root; the loader resolves
// `content/style-sheets/niche-<slug>.json` against process.cwd(), so pointing cwd
// there feeds it any sheet body without touching the repo's real content.
let fakeRoot = '';
let seq = 0;

beforeAll(() => {
  fakeRoot = mkdtempSync(path.join(tmpdir(), 'niche-textures-'));
  mkdirSync(path.join(fakeRoot, 'content', 'style-sheets'), { recursive: true });
});

afterAll(() => {
  rmSync(fakeRoot, { recursive: true, force: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Write a style sheet body under a fresh slug and point the loader at it. */
function sheet(body: string): string {
  seq += 1;
  const slug = `fixture-${seq}`;
  writeFileSync(path.join(fakeRoot, 'content', 'style-sheets', `niche-${slug}.json`), body, 'utf-8');
  vi.spyOn(process, 'cwd').mockReturnValue(fakeRoot);
  return slug;
}

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

  it('reads the style sheet from content/style-sheets/niche-<slug>.json under the project root', async () => {
    const slug = sheet(JSON.stringify({ textures: [{ key: 'linen', name: 'Linen', sourceUrl: 'https://img/linen.jpg' }] }));
    expect(await loadNicheTextures(slug)).toEqual([{ key: 'linen', name: 'Linen', sourceUrl: 'https://img/linen.jpg' }]);
  });

  it('returns an empty shelf when the file is not valid JSON', async () => {
    expect(await loadNicheTextures(sheet('{ not json'))).toEqual([]);
  });

  it('returns an empty shelf when the sheet is not a JSON object (null, array, scalar)', async () => {
    expect(await loadNicheTextures(sheet('null'))).toEqual([]);
    expect(await loadNicheTextures(sheet('[1,2]'))).toEqual([]);
    expect(await loadNicheTextures(sheet('"a string"'))).toEqual([]);
  });

  it('returns an empty shelf when textures is missing or not an array', async () => {
    expect(await loadNicheTextures(sheet('{"palette":{}}'))).toEqual([]);
    expect(await loadNicheTextures(sheet('{"textures":{"key":"x"}}'))).toEqual([]);
  });

  it('skips the legacy flat-string shape instead of crashing', async () => {
    expect(await loadNicheTextures(sheet(JSON.stringify({ textures: ['a moody linen prompt', 'another prompt'] })))).toEqual([]);
  });

  it('keeps only complete texture objects and carries the note only when present', async () => {
    const slug = sheet(
      JSON.stringify({
        textures: [
          { key: 'linen', name: 'Linen', sourceUrl: 'https://img/linen.jpg', note: 'warm weave' },
          { key: 'slate', name: 'Slate', sourceUrl: 'https://img/slate.jpg' },
          { key: 'blank-note', name: 'Blank note', sourceUrl: 'https://img/b.jpg', note: '' },
          null,
          ['not', 'an', 'object'],
          { name: 'No key', sourceUrl: 'https://img/x.jpg' },
          { key: 'no-name', sourceUrl: 'https://img/x.jpg' },
          { key: 'no-url', name: 'No url' },
          { key: '', name: 'Empty key', sourceUrl: 'https://img/x.jpg' },
          { key: 7, name: 'Numeric key', sourceUrl: 'https://img/x.jpg' },
        ],
      }),
    );
    const out = await loadNicheTextures(slug);
    expect(out).toEqual([
      { key: 'linen', name: 'Linen', sourceUrl: 'https://img/linen.jpg', note: 'warm weave' },
      { key: 'slate', name: 'Slate', sourceUrl: 'https://img/slate.jpg' },
      { key: 'blank-note', name: 'Blank note', sourceUrl: 'https://img/b.jpg' },
    ]);
    // An absent/empty note is omitted outright, not set to undefined.
    expect('note' in out[1]!).toBe(false);
    expect('note' in out[2]!).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { fill, keyWords, wordKeys, wordsFrom } from './words';

const warn = vi.hoisted(() => vi.fn());
vi.mock('@/lib/logger', () => ({ logger: { warn } }));

import { getSiteWords } from './queries';

const SHAPE = { send: '', cart: { add: '', nav: '' } } as const;

describe('wordKeys', () => {
  it('names every spot with its full key', () => {
    expect(wordKeys(SHAPE, 'card')).toEqual(['card.send', 'card.cart.add', 'card.cart.nav']);
  });
});

describe('wordsFrom', () => {
  it('lays the site’s words into the shape, leaving a spot with no word blank and listing it', () => {
    const missing: string[] = [];
    const w = wordsFrom(SHAPE, 'card', new Map([['card.send', 'Send it'], ['card.cart.add', 'Add to basket'], ['card.other', 'x']]), missing);
    expect(w).toEqual({ send: 'Send it', cart: { add: 'Add to basket', nav: '' } });
    expect(missing).toEqual(['card.cart.nav']);
  });
});

describe('fill', () => {
  it('puts values into named blanks and leaves an unknown blank showing', () => {
    expect(fill('Order {n} for {name}', { n: 12, name: 'Ann' })).toBe('Order 12 for Ann');
    expect(fill('Hi {who}', {})).toBe('Hi {who}');
    expect(fill('No blanks', { n: 1 })).toBe('No blanks');
  });
});

describe('keyWords', () => {
  it('makes every spot say its own key, for tests', () => {
    expect(keyWords(SHAPE, 'card')).toEqual({ send: 'card.send', cart: { add: 'card.cart.add', nav: 'card.cart.nav' } });
  });
});

type Result = { data: unknown; error: { message: string } | null };
function fakeDb(result: Result, seen: { like?: string; eq?: string } = {}) {
  return {
    from: () => ({
      select: () => ({
        eq: (_c: string, v: string) => {
          seen.eq = v;
          return {
            like: async (_k: string, pattern: string) => {
              seen.like = pattern;
              return result;
            },
          };
        },
      }),
    }),
  } as unknown as Parameters<typeof getSiteWords>[0];
}

describe('getSiteWords', () => {
  it('reads one design’s words for the site and says which spots are empty', async () => {
    const seen: { like?: string; eq?: string } = {};
    const w = await getSiteWords(fakeDb({ data: [{ key: 'card.send', text: 'Send' }], error: null }, seen), 't1', SHAPE, 'card');
    expect(seen).toEqual({ eq: 't1', like: 'card.%' });
    expect(w).toEqual({ send: 'Send', cart: { add: '', nav: '' } });
    expect(warn).toHaveBeenCalledWith('site words: spots with no word', { tenantId: 't1', prefix: 'card', missing: ['card.cart.add', 'card.cart.nav'] });
  });
  it('stays quiet when every spot has a word, and treats no rows as none', async () => {
    warn.mockClear();
    const all = [{ key: 'card.send', text: 'a' }, { key: 'card.cart.add', text: 'b' }, { key: 'card.cart.nav', text: 'c' }];
    expect(await getSiteWords(fakeDb({ data: all, error: null }), 't1', SHAPE, 'card')).toEqual({ send: 'a', cart: { add: 'b', nav: 'c' } });
    expect(warn).not.toHaveBeenCalled();
    expect(await getSiteWords(fakeDb({ data: null, error: null }), 't1', { send: '' }, 'card')).toEqual({ send: '' });
  });
  it('throws when the words can’t be read', async () => {
    await expect(getSiteWords(fakeDb({ data: null, error: { message: 'boom' } }), 't1', SHAPE, 'card')).rejects.toThrow('Could not load the site’s words: boom');
  });
});

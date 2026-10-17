import { describe, it, expect } from 'vitest';
import { addScenes, scenesTagged, searchScenes } from './library';

type Result = { data: unknown; error: { message: string } | null };

/** A stand-in client that records each call on the scenes table. */
function fakeDb(result: Result) {
  const calls: { op: string; args: unknown[] }[] = [];
  const chain: Record<string, unknown> = {};
  for (const op of ['select', 'textSearch', 'contains', 'order']) {
    chain[op] = (...args: unknown[]) => {
      calls.push({ op, args });
      return chain;
    };
  }
  chain['limit'] = async (...args: unknown[]) => {
    calls.push({ op: 'limit', args });
    return result;
  };
  chain['then'] = (resolve: (r: Result) => unknown) => resolve(result);
  chain['insert'] = async (rows: unknown) => {
    calls.push({ op: 'insert', args: [rows] });
    return { error: result.error };
  };
  const db = { from: () => chain } as unknown as Parameters<typeof searchScenes>[0];
  return { db, calls };
}

const row = { key: 'classic-loafs-1', url: 'https://cdn/s.webp', focus: 'center', tone: 'dark', tags: ['bakery', 'kitchen'], description: 'A quiet kitchen.' };

describe('searchScenes', () => {
  it('searches tags and descriptions by any words, newest first', async () => {
    const { db, calls } = fakeDb({ data: [row], error: null });
    expect(await searchScenes(db, ' kitchen pottery ')).toEqual([{ ...row, tone: 'dark' }]);
    expect(calls.find((c) => c.op === 'textSearch')?.args).toEqual(['search', 'kitchen pottery', { type: 'websearch', config: 'english' }]);
    expect(calls.find((c) => c.op === 'order')?.args).toEqual(['created_at', { ascending: false }]);
  });
  it('no words lists every scene', async () => {
    const { db, calls } = fakeDb({ data: [{ ...row, tone: 'odd' }], error: null });
    expect((await searchScenes(db, ''))[0]?.tone).toBe('light');
    expect(calls.some((c) => c.op === 'textSearch')).toBe(false);
  });
  it('says so when the search fails', async () => {
    const { db } = fakeDb({ data: null, error: { message: 'down' } });
    await expect(searchScenes(db, 'x')).rejects.toThrow('Could not search the scene library: down');
  });
});

describe('scenesTagged', () => {
  it('finds every scene with a tag', async () => {
    const { db, calls } = fakeDb({ data: [row], error: null });
    expect(await scenesTagged(db, 'bakery')).toHaveLength(1);
    expect(calls.find((c) => c.op === 'contains')?.args).toEqual(['tags', ['bakery']]);
  });
  it('says so when the read fails', async () => {
    const { db } = fakeDb({ data: null, error: { message: 'down' } });
    await expect(scenesTagged(db, 'bakery')).rejects.toThrow('Could not read the scene library: down');
  });
});

describe('addScenes', () => {
  it('adds each scene with where it came from', async () => {
    const { db, calls } = fakeDb({ data: null, error: null });
    await addScenes(db, [{ ...row, tone: 'dark', source: 'generated', madeFor: 't1' }]);
    expect(calls.find((c) => c.op === 'insert')?.args[0]).toEqual([{ ...row, source: 'generated', made_for: 't1' }]);
    await addScenes(db, []);
    expect(calls.filter((c) => c.op === 'insert')).toHaveLength(1);
  });
  it('says so when the add fails', async () => {
    const { db } = fakeDb({ data: null, error: { message: 'taken' } });
    await expect(addScenes(db, [{ ...row, tone: 'dark', source: 'generated', madeFor: null }])).rejects.toThrow('Could not add to the scene library: taken');
  });
});

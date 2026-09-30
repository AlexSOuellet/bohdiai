import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { FEATURES, FEATURE_KEYS, resolveFeatures, loadSiteFeatures, hasFeature, type FeatureKey } from './features';

function fakeDb(result: { data: unknown; error: { message: string } | null }): SupabaseClient<Database> {
  const b = {
    select: () => b,
    eq: () => b,
    then: (res: (v: unknown) => unknown) => Promise.resolve(result).then(res),
  };
  return { from: () => b } as unknown as SupabaseClient<Database>;
}

describe('resolveFeatures', () => {
  it('uses each key default when the site has no rows', () => {
    const on = resolveFeatures([]);
    for (const key of FEATURE_KEYS) expect(on.has(key)).toBe(FEATURES[key].default);
  });

  it('a row overrides the default either way', () => {
    const on = resolveFeatures([
      { feature_key: 'catalog', enabled: false },
      { feature_key: 'digital_products', enabled: true },
    ]);
    expect(on.has('catalog')).toBe(false);
    expect(on.has('digital_products')).toBe(true);
  });

  it('ignores rows for keys the code does not know', () => {
    const on = resolveFeatures([{ feature_key: 'retired_thing', enabled: true }]);
    expect([...on].every((k) => (FEATURE_KEYS as readonly string[]).includes(k))).toBe(true);
  });
});

describe('loadSiteFeatures', () => {
  it('reads the site rows and resolves them', async () => {
    const db = fakeDb({ data: [{ feature_key: 'video', enabled: true }], error: null });
    const on = await loadSiteFeatures(db, 't1');
    expect(on.has('video')).toBe(true);
  });

  it('throws with a clear message when the read fails', async () => {
    const db = fakeDb({ data: null, error: { message: 'boom' } });
    await expect(loadSiteFeatures(db, 't1')).rejects.toThrow('Could not load site features: boom');
  });
});

describe('hasFeature', () => {
  it('answers from the resolved set', () => {
    const on = new Set<FeatureKey>(['catalog']);
    expect(hasFeature(on, 'catalog')).toBe(true);
    expect(hasFeature(on, 'video')).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';

const { cache, loadSiteFeatures } = vi.hoisted(() => ({
  cache: vi.fn(<F extends (...a: never[]) => unknown>(fn: F) => fn),
  loadSiteFeatures: vi.fn(),
}));
vi.mock('react', () => ({ cache }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => 'db' }));
vi.mock('./features', () => ({ loadSiteFeatures }));

import { getSiteFeatures } from './site-features';

describe('getSiteFeatures', () => {
  it('is wrapped in React cache and loads through the admin client', async () => {
    expect(cache).toHaveBeenCalledTimes(1);
    loadSiteFeatures.mockResolvedValue(new Set(['catalog']));
    await expect(getSiteFeatures('t1')).resolves.toEqual(new Set(['catalog']));
    expect(loadSiteFeatures).toHaveBeenCalledWith('db', 't1');
  });
});

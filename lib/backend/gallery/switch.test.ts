import { describe, it, expect, vi, beforeEach } from 'vitest';

const features = vi.hoisted(() => ({ on: new Set<string>(['gallery', 'catalog']) }));
const counts = vi.hoisted(() => ({ photos: 0, ticked: 0 }));
const family = vi.hoisted(() => ({ is: true }));
const upsert = vi.hoisted(() => vi.fn());

/** Counts for gallery_items and the ticked listings; upsert for the switch. */
function table(name: string) {
  const counted = { count: name === 'gallery_items' ? counts.photos : counts.ticked, error: null };
  const chain = { eq: () => chain, is: async () => counted, then: (r: (v: typeof counted) => unknown) => r(counted) };
  return { select: () => chain, upsert: async (row: unknown) => upsert(row) };
}

vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/backend/site-kind', () => ({ isFamilySite: async () => family.is }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ from: (name: string) => table(name) }) }));
vi.mock('@/lib/backend/site-photo', () => ({ storeSitePhoto: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { setGalleryShown } from './actions';

beforeEach(() => {
  features.on = new Set(['gallery', 'catalog']);
  counts.photos = 0;
  counts.ticked = 0;
  family.is = true;
  upsert.mockReset().mockResolvedValue({ error: null });
});

describe('setGalleryShown (a standard site on Market or Full)', () => {
  it('can’t be switched on while the gallery is empty', async () => {
    expect(await setGalleryShown(true)).toEqual({
      ok: false,
      error: 'Add a photo here, or tick a product for your gallery on your products list, before you show it.',
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('switches on with a ticked product or a photo, and off any time', async () => {
    counts.ticked = 1;
    expect(await setGalleryShown(true)).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', section: 'gallery', enabled: true });
    counts.ticked = 0;
    expect(await setGalleryShown(false)).toEqual({ ok: true });
    expect(upsert).toHaveBeenLastCalledWith({ tenant_id: 't1', section: 'gallery', enabled: false });
  });

  it('isn’t offered on a custom site or one without a shop', async () => {
    family.is = false;
    expect((await setGalleryShown(true)).ok).toBe(false);
    family.is = true;
    features.on = new Set(['gallery']);
    expect((await setGalleryShown(true)).ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});

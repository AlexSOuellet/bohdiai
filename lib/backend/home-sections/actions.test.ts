import { describe, it, expect, vi, beforeEach } from 'vitest';

const features = vi.hoisted(() => ({ on: new Set<string>(['catalog', 'testimonials', 'gallery', 'profile', 'market_dates']) }));
const mood = vi.hoisted(() => ({ value: 'rustic' as string | null }));
const upsert = vi.hoisted(() => vi.fn());
const gallery = vi.hoisted(() => vi.fn());

vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ from: () => ({ upsert: async (row: unknown) => upsert(row) }) }) }));
vi.mock('@/lib/storefront/home-sections', async (orig) => ({ ...(await orig<object>()), familyMood: async () => mood.value }));
vi.mock('../gallery/actions', () => ({ setGalleryShown: (on: boolean) => gallery(on) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { setHomeSection } from './actions';

beforeEach(() => {
  mood.value = 'rustic';
  upsert.mockReset().mockResolvedValue({ error: null });
  gallery.mockReset().mockResolvedValue({ ok: true });
});

describe('setHomeSection (Alex, 2026-10-27)', () => {
  it('saves a section of her home page off', async () => {
    expect(await setHomeSection('reviews', false)).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', section: 'reviews', enabled: false });
  });

  it('turns the gallery through its own rule (never on while empty)', async () => {
    gallery.mockResolvedValue({ ok: false, error: 'empty' });
    expect(await setHomeSection('gallery', true)).toEqual({ ok: false, error: 'empty' });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses a section her design or plan doesn’t show, and any on a custom design', async () => {
    expect((await setHomeSection('collections', false)).ok).toBe(false);
    expect((await setHomeSection('hero', false)).ok).toBe(false);
    mood.value = null;
    expect((await setHomeSection('reviews', false)).ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('says so when the save fails', async () => {
    upsert.mockResolvedValue({ error: { message: 'x' } });
    expect(await setHomeSection('reviews', false)).toEqual({ ok: false, error: 'That change couldn’t be saved. Try again in a moment.' });
  });
});

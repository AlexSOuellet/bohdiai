import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_PROFILE } from './profile-form';

const features = vi.hoisted(() => ({ on: new Set<string>(['profile']) }));
const upsert = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ from: () => ({ upsert }) }),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveProfile } from './actions';
import { profileHomeData } from './home';

beforeEach(() => {
  features.on = new Set(['profile']);
  upsert.mockReset().mockResolvedValue({ error: null });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('saveProfile', () => {
  it('saves the checked row for the acting site', async () => {
    expect(await saveProfile({ ...EMPTY_PROFILE, headline: ' Burned wood ' })).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ tenant_id: 't1', headline: 'Burned wood', bio: null }));
    expect(revalidatePath).toHaveBeenCalledWith('/manage/profile');
  });

  it('refuses when About you is switched off', async () => {
    features.on = new Set();
    expect(await saveProfile(EMPTY_PROFILE)).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('returns the validation message without saving', async () => {
    const r = await saveProfile({ ...EMPTY_PROFILE, phone: 'nope' });
    expect(r.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('names a permission failure and logs any other failure', async () => {
    upsert.mockResolvedValueOnce({ error: { code: '42501', message: 'rls' } });
    expect(await saveProfile(EMPTY_PROFILE)).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    upsert.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await saveProfile(EMPTY_PROFILE)).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('profile: save failed', expect.objectContaining({ error: 'boom' }));
  });
});

describe('profileHomeData', () => {
  it('asks for a headline and a story until both are there', () => {
    expect(profileHomeData(EMPTY_PROFILE).attention).toHaveLength(2);
    expect(profileHomeData({ ...EMPTY_PROFILE, headline: 'x', bio: 'y' })).toEqual({ tiles: [], attention: [] });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_PROFILE } from './profile-form';

const features = vi.hoisted(() => ({ on: new Set<string>(['profile']) }));
const upsert = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const storeSitePhoto = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({ upsert, update: (patch: unknown) => ({ eq: async (_c: string, id: string) => update(patch, id) }) }),
  }),
}));
vi.mock('@/lib/backend/site-photo', () => ({ storeSitePhoto }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveProfile, uploadPortrait, removePortrait } from './actions';
import { profileHomeData } from './home';

beforeEach(() => {
  features.on = new Set(['profile']);
  upsert.mockReset().mockResolvedValue({ error: null });
  update.mockReset().mockResolvedValue({ error: null });
  storeSitePhoto.mockReset().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://cdn/me.webp' });
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

const photo = (): FormData => {
  const f = new FormData();
  f.set('file', new File(['x'], 'me.jpg', { type: 'image/jpeg' }));
  return f;
};

describe('uploadPortrait', () => {
  it('stores the photo and links it from About you', async () => {
    expect(await uploadPortrait(photo())).toEqual({ ok: true, url: 'https://cdn/me.webp' });
    expect(storeSitePhoto).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', userId: 'u1', folder: 'portrait' }));
    expect(upsert).toHaveBeenCalledWith({ tenant_id: 't1', portrait_upload_id: 'up1' });
  });
  it('refuses when About you is switched off, before storing anything', async () => {
    features.on = new Set();
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(storeSitePhoto).not.toHaveBeenCalled();
  });
  it('passes on a photo the store refused', async () => {
    storeSitePhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(upsert).not.toHaveBeenCalled();
  });
  it('says so when the photo stored but the link failed', async () => {
    upsert.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await uploadPortrait(photo())).toEqual({ ok: false, error: 'The photo was uploaded but couldn’t be set as your portrait. Try again.' });
    expect(logger.error).toHaveBeenCalledWith('profile: portrait link failed', expect.objectContaining({ error: 'boom' }));
  });
});

describe('removePortrait', () => {
  it('clears the link for the acting site', async () => {
    expect(await removePortrait()).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ portrait_upload_id: null }, 't1');
  });
  it('refuses when About you is switched off', async () => {
    features.on = new Set();
    expect(await removePortrait()).toEqual({ ok: false, error: 'About you isn’t switched on for this site.' });
    expect(update).not.toHaveBeenCalled();
  });
  it('says so when the remove failed', async () => {
    update.mockResolvedValueOnce({ error: { code: 'XX000', message: 'boom' } });
    expect(await removePortrait()).toEqual({ ok: false, error: 'The portrait couldn’t be removed. Try again in a moment.' });
  });
});

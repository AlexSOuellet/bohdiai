import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_MOMENT } from './moment-form';

const features = vi.hoisted(() => ({ on: new Set<string>(['moment']) }));
const db = vi.hoisted(() => ({
  existing: [] as { id: string; position: number }[],
  readError: null as { message: string } | null,
  upsert: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
const storeSitePhoto = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

/** A tiny chainable stand-in for the moment tables. `update` ends after one or two
 *  .eq() calls (by tenant, or by tenant and id). */
function table() {
  return {
    upsert: (row: unknown) => db.upsert(row),
    select: () => ({ eq: async () => ({ data: db.readError === null ? db.existing : null, error: db.readError }) }),
    insert: (row: unknown) => ({ select: () => ({ single: async () => db.insert(row) }) }),
    update: (patch: unknown) => ({
      eq: (_c: string, tenant: string) => {
        const byTenant = Promise.resolve().then(() => db.update(patch, tenant));
        return Object.assign(byTenant, { eq: async (_c2: string, id: string) => db.update(patch, tenant, id) });
      },
    }),
    delete: () => ({ eq: () => ({ eq: async (_c: string, id: string) => db.del(id) }) }),
  };
}

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ from: () => table() }) }));
vi.mock('@/lib/backend/site-photo', () => ({ storeSitePhoto }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveMoment, setMomentPhoto, clearMomentPhoto, addMomentPhoto, orderMomentPhotos, removeMomentPhoto } from './actions';

const fd = (): FormData => {
  const f = new FormData();
  f.set('file', new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
  return f;
};
const OFF = { ok: false, error: 'The moment isn’t switched on for this site.' };
const boom = { error: { code: 'XX000', message: 'boom' } };

beforeEach(() => {
  features.on = new Set(['moment']);
  db.existing = [];
  db.readError = null;
  db.upsert.mockReset().mockResolvedValue({ error: null });
  db.insert.mockReset().mockResolvedValue({ data: { id: 'm9' }, error: null });
  db.update.mockReset().mockResolvedValue({ error: null });
  db.del.mockReset().mockResolvedValue({ error: null });
  storeSitePhoto.mockReset().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://cdn/p.webp' });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('every moment action', () => {
  it('refuses when the moment is switched off, touching nothing', async () => {
    features.on = new Set();
    expect(await saveMoment(EMPTY_MOMENT)).toEqual(OFF);
    // The opening photo answers to the headline switch too (every plan).
    expect(await setMomentPhoto(fd())).toEqual({ ok: false, error: 'Changing the headline isn’t switched on for this site.' });
    expect(await clearMomentPhoto()).toEqual(OFF);
    expect(await addMomentPhoto(fd())).toEqual(OFF);
    expect(await orderMomentPhotos([])).toEqual(OFF);
    expect(await removeMomentPhoto('m1')).toEqual(OFF);
    expect(db.upsert).not.toHaveBeenCalled();
    expect(storeSitePhoto).not.toHaveBeenCalled();
  });
});

describe('saveMoment', () => {
  it('saves the checked row for the acting site', async () => {
    expect(await saveMoment({ ...EMPTY_MOMENT, headline: ' Poured by hand ' })).toEqual({ ok: true });
    expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ tenant_id: 't1', headline: 'Poured by hand', play_mode: 'once' }));
    expect(revalidatePath).toHaveBeenCalledWith('/manage/moment');
  });
  it('returns the validation message without saving', async () => {
    expect(await saveMoment({ ...EMPTY_MOMENT, ctaLabel: 'Shop' })).toEqual({ ok: false, error: 'Pick a page for the main button to go to.' });
    expect(db.upsert).not.toHaveBeenCalled();
  });
  it('names a permission failure and logs any other failure', async () => {
    db.upsert.mockResolvedValueOnce({ error: { code: '42501', message: 'rls' } });
    expect(await saveMoment(EMPTY_MOMENT)).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    db.upsert.mockResolvedValueOnce(boom);
    expect(await saveMoment(EMPTY_MOMENT)).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('moment: save failed', expect.objectContaining({ error: 'boom' }));
  });
});

describe('setMomentPhoto and clearMomentPhoto', () => {
  it('stores the photo and links it as the moment’s photo', async () => {
    expect(await setMomentPhoto(fd())).toEqual({ ok: true, url: 'https://cdn/p.webp' });
    expect(storeSitePhoto).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', userId: 'u1', folder: 'moment' }));
    expect(db.upsert).toHaveBeenCalledWith({ tenant_id: 't1', media_upload_id: 'up1', poster_upload_id: null });
  });
  it('passes on a photo the store refused, and says so when the link failed', async () => {
    storeSitePhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await setMomentPhoto(fd())).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    db.upsert.mockResolvedValueOnce(boom);
    expect(await setMomentPhoto(fd())).toEqual({ ok: false, error: 'The photo was uploaded but couldn’t be set as your opening photo. Try again.' });
  });
  it('lets every plan change the opening photo from the Headline screen', async () => {
    features.on = new Set(['headline']);
    expect((await setMomentPhoto(fd())).ok).toBe(true);
  });
  it('clears the photo for the acting site', async () => {
    expect(await clearMomentPhoto()).toEqual({ ok: true });
    expect(db.update).toHaveBeenCalledWith({ media_upload_id: null, poster_upload_id: null }, 't1');
    db.update.mockResolvedValueOnce(boom);
    expect(await clearMomentPhoto()).toEqual({ ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' });
  });
});

describe('addMomentPhoto', () => {
  it('stores the photo and adds it at the end', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 4 }];
    expect(await addMomentPhoto(fd())).toEqual({ ok: true, id: 'm9', url: 'https://cdn/p.webp' });
    expect(db.insert).toHaveBeenCalledWith({ tenant_id: 't1', upload_id: 'up1', position: 5 });
  });
  it('refuses a fourth photo before storing it', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }, { id: 'c', position: 2 }];
    expect(await addMomentPhoto(fd())).toEqual({ ok: false, error: 'The moment holds up to 3 extra photos. Remove one to add another.' });
    expect(storeSitePhoto).not.toHaveBeenCalled();
  });
  it('says so when the count, the store or the add failed', async () => {
    db.readError = { message: 'down' };
    expect(await addMomentPhoto(fd())).toEqual({ ok: false, error: 'The moment’s photos couldn’t be checked. Try again in a moment.' });
    db.readError = null;
    storeSitePhoto.mockResolvedValueOnce({ ok: false, error: 'That photo is over 20MB. Pick a smaller one.' });
    expect(await addMomentPhoto(fd())).toEqual({ ok: false, error: 'That photo is over 20MB. Pick a smaller one.' });
    db.insert.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await addMomentPhoto(fd())).toEqual({ ok: false, error: 'The photo was uploaded but couldn’t be added to the moment. Try again.' });
  });
});

describe('orderMomentPhotos', () => {
  it('saves each photo’s place', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }];
    expect(await orderMomentPhotos(['b', 'a'])).toEqual({ ok: true });
    expect(db.update).toHaveBeenCalledWith({ position: 0 }, 't1', 'b');
    expect(db.update).toHaveBeenCalledWith({ position: 1 }, 't1', 'a');
  });
  it('refuses an order that doesn’t list every current photo exactly once', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }];
    const changed = { ok: false, error: 'The photos changed while you were ordering them. Reload and try again.' };
    expect(await orderMomentPhotos(['a'])).toEqual(changed);
    expect(await orderMomentPhotos(['a', 'a'])).toEqual(changed);
    expect(await orderMomentPhotos(['a', 'z'])).toEqual(changed);
    expect(db.update).not.toHaveBeenCalled();
  });
  it('says so when the read or a write failed', async () => {
    db.readError = { message: 'down' };
    expect(await orderMomentPhotos([])).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
    db.readError = null;
    db.existing = [{ id: 'a', position: 0 }];
    db.update.mockResolvedValueOnce(boom);
    expect(await orderMomentPhotos(['a'])).toEqual({ ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' });
  });
});

describe('removeMomentPhoto', () => {
  it('removes the photo from the moment', async () => {
    expect(await removeMomentPhoto('m1')).toEqual({ ok: true });
    expect(db.del).toHaveBeenCalledWith('m1');
    db.del.mockResolvedValueOnce(boom);
    expect(await removeMomentPhoto('m1')).toEqual({ ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' });
  });
});

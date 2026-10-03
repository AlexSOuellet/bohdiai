import { describe, it, expect, vi, beforeEach } from 'vitest';

const features = vi.hoisted(() => ({ on: new Set<string>(['gallery']) }));
const db = vi.hoisted(() => ({
  existing: [] as { id: string; position: number }[],
  readError: null as { message: string } | null,
  insert: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
const storeSitePhoto = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

/** A tiny chainable stand-in for the gallery_items table. */
function table() {
  return {
    select: () => ({ eq: async () => ({ data: db.readError === null ? db.existing : null, error: db.readError }) }),
    insert: (row: unknown) => ({ select: () => ({ single: async () => db.insert(row) }) }),
    update: (patch: unknown) => ({ eq: () => ({ eq: async (_c: string, id: string) => db.update(id, patch) }) }),
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

import { uploadGalleryPhoto, saveGallery, removeGalleryPhoto } from './actions';

const fd = (): FormData => {
  const f = new FormData();
  f.set('file', new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
  return f;
};

beforeEach(() => {
  features.on = new Set(['gallery']);
  db.existing = [];
  db.readError = null;
  db.insert.mockReset().mockResolvedValue({ data: { id: 'g9' }, error: null });
  db.update.mockReset().mockResolvedValue({ error: null });
  db.del.mockReset().mockResolvedValue({ error: null });
  storeSitePhoto.mockReset().mockResolvedValue({ ok: true, uploadId: 'up1', url: 'https://cdn/p.webp' });
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('uploadGalleryPhoto', () => {
  it('stores the photo and adds it at the end of the gallery', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 4 }];
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: true, item: { id: 'g9', url: 'https://cdn/p.webp', caption: '' } });
    expect(storeSitePhoto).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', userId: 'u1', folder: 'gallery' }));
    expect(db.insert).toHaveBeenCalledWith({ tenant_id: 't1', upload_id: 'up1', position: 5 });
  });

  it('refuses a thirteenth photo before uploading anything', async () => {
    db.existing = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, position: i }));
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: false, error: 'Your gallery holds up to 12 photos. Remove one to add another.' });
    expect(storeSitePhoto).not.toHaveBeenCalled();
  });

  it('passes on a photo problem in the photo helper’s words', async () => {
    storeSitePhoto.mockResolvedValueOnce({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('says so when the photo uploaded but the gallery entry failed', async () => {
    db.insert.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: false, error: 'The photo was uploaded but couldn’t be added to your gallery. Try again.' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('refuses when the gallery is switched off or can’t be counted', async () => {
    features.on = new Set();
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: false, error: 'The gallery isn’t switched on for this site.' });
    features.on = new Set(['gallery']);
    db.readError = { message: 'down' };
    expect(await uploadGalleryPhoto(fd())).toEqual({ ok: false, error: 'Your gallery couldn’t be checked. Try again in a moment.' });
  });
});

describe('saveGallery', () => {
  it('writes each photo’s new position and caption', async () => {
    db.existing = [{ id: 'a', position: 0 }, { id: 'b', position: 1 }];
    expect(await saveGallery([{ id: 'b', caption: 'Flag' }, { id: 'a', caption: '' }])).toEqual({ ok: true });
    expect(db.update).toHaveBeenCalledWith('b', { caption: 'Flag', position: 0 });
    expect(db.update).toHaveBeenCalledWith('a', { caption: null, position: 1 });
  });

  it('reports a failed write', async () => {
    db.existing = [{ id: 'a', position: 0 }];
    db.update.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await saveGallery([{ id: 'a', caption: '' }])).toEqual({ ok: false, error: 'Your gallery couldn’t be saved. Try again in a moment.' });
  });

  it('refuses a list that no longer matches the gallery', async () => {
    db.existing = [{ id: 'a', position: 0 }];
    expect((await saveGallery([{ id: 'gone', caption: '' }])).ok).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('removeGalleryPhoto', () => {
  it('removes the entry and reports failure in plain words', async () => {
    expect(await removeGalleryPhoto('a')).toEqual({ ok: true });
    expect(db.del).toHaveBeenCalledWith('a');
    db.del.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await removeGalleryPhoto('a')).toEqual({ ok: false, error: 'The photo couldn’t be removed. Try again in a moment.' });
  });
});

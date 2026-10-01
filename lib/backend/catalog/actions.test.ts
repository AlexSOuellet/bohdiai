import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emptyProductForm, type ProductForm } from './product-form';

const { rpc, slugRows, upload, removeStored, insertUpload, shrinkImage, features, revalidatePath, logger } = vi.hoisted(() => ({
  rpc: vi.fn(),
  removeStored: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  slugRows: vi.fn(),
  upload: vi.fn(),
  insertUpload: vi.fn(),
  shrinkImage: vi.fn(),
  features: { on: new Set<string>(['catalog']) },
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1', subdomain: 'shop', businessName: 'Shop' }, sites: [] }),
}));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => features.on }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ is: () => ({ ilike: slugRows }) }) }) }),
  }),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: (bucket: string) => ({ upload, remove: (paths: string[]) => removeStored(bucket, paths), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn/x.webp' } }) }) },
    from: () => ({ insert: () => ({ select: () => ({ single: insertUpload }) }) }),
  }),
}));
vi.mock('@/lib/images/shrink', () => ({ shrinkImage }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));

import { saveProduct, duplicateProduct, uploadProductPhoto, uploadProductFile, saveCollection, createCollection, orderCollections } from './actions';

const form = (over: Partial<ProductForm> = {}): ProductForm => ({ ...emptyProductForm(), name: 'Fig Candle', price: '24', ...over });
const file = (type: string, size = 10, name = 'a') => new File([new Uint8Array(size)], name, { type });
const fd = (f: File) => {
  const d = new FormData();
  d.set('file', f);
  return d;
};

beforeEach(() => {
  vi.clearAllMocks();
  features.on = new Set(['catalog']);
  slugRows.mockResolvedValue({ data: [], error: null });
  rpc.mockResolvedValue({ data: 'new-id', error: null });
  upload.mockResolvedValue({ error: null });
  removeStored.mockResolvedValue({ data: [], error: null });
  insertUpload.mockResolvedValue({ data: { id: 'up1' }, error: null });
  shrinkImage.mockResolvedValue(new Uint8Array([1, 2, 3]));
});

describe('saveProduct', () => {
  it('refuses when the site has no catalog', async () => {
    features.on = new Set();
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'Products aren’t switched on for this site.' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('returns the validation message without writing', async () => {
    expect(await saveProduct(form({ name: '' }))).toEqual({ ok: false, error: 'Give the product a name.' });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('creates a product with a unique web address', async () => {
    slugRows.mockResolvedValue({ data: [{ slug: 'fig-candle' }], error: null });
    expect(await saveProduct(form())).toEqual({ ok: true, id: 'new-id' });
    expect(rpc).toHaveBeenCalledWith('save_product', expect.objectContaining({ p_tenant_id: 't1', p: expect.objectContaining({ slug: 'fig-candle-2', name: 'Fig Candle' }) }));
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_listing_id');
    expect(revalidatePath).toHaveBeenCalledWith('/manage/products');
  });
  it('updates an existing product without touching its web address', async () => {
    rpc.mockResolvedValue({ data: 'l1', error: null });
    expect(await saveProduct(form({ id: 'l1', slug: 'fig' }))).toEqual({ ok: true, id: 'l1' });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_listing_id: 'l1' });
    expect(rpc.mock.calls[0]![1].p).not.toHaveProperty('slug');
    expect(slugRows).not.toHaveBeenCalled();
  });
  it('looks up taken addresses by a prefix short enough to catch numbered long ones', async () => {
    await saveProduct(form({ name: 'a'.repeat(70) }));
    expect(slugRows).toHaveBeenCalledWith('slug', `${'a'.repeat(52)}%`);
  });
  it('says so when the web address can’t be checked', async () => {
    slugRows.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'The web address couldn’t be checked. Try again in a moment.' });
  });
  it('turns database errors into plain messages', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'Another product already uses that web address. Change the name slightly and save again.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'gone' } });
    expect(await saveProduct(form({ id: 'l1' }))).toEqual({ ok: false, error: 'That product no longer exists. Go back to Products.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'unknown photo' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'A photo or file on this product couldn’t be found. Remove it, add it again and save.' });
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'not allowed' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'You don’t have access to change this site.' });
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'The product couldn’t be saved. Try again in a moment.' });
  });
  it('retries a new product once with a fresh web address when another save took it first', async () => {
    slugRows.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [{ slug: 'fig-candle' }], error: null });
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } }).mockResolvedValueOnce({ data: 'new-id', error: null });
    expect(await saveProduct(form())).toEqual({ ok: true, id: 'new-id' });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0]![1].p).toMatchObject({ slug: 'fig-candle' });
    expect(rpc.mock.calls[1]![1].p).toMatchObject({ slug: 'fig-candle-2' });
  });
  it('gives up after one retry, and never retries an update', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } });
    expect(await saveProduct(form())).toEqual({ ok: false, error: 'Another product already uses that web address. Change the name slightly and save again.' });
    expect(rpc).toHaveBeenCalledTimes(2);
    rpc.mockClear();
    expect((await saveProduct(form({ id: 'l1' }))).ok).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('refuses crafted input with a message instead of throwing', async () => {
    const crafted = { ...form(), status: 'published' } as unknown as ProductForm;
    expect(await saveProduct(crafted)).toEqual({ ok: false, error: 'Something about this product didn’t look right. Reload the page and try again.' });
    expect(await duplicateProduct({ ...form(), name: 5 } as unknown as ProductForm)).toEqual({
      ok: false,
      error: 'Something about this product didn’t look right. Reload the page and try again.',
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('duplicateProduct', () => {
  it('saves a draft copy under a new web address', async () => {
    await duplicateProduct(form({ id: 'l1', slug: 'fig', status: 'active' }));
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('p_listing_id');
    expect(rpc.mock.calls[0]![1].p).toMatchObject({ name: 'Fig Candle (copy)', status: 'draft', slug: 'fig-candle-copy' });
  });
});

describe('uploadProductPhoto', () => {
  it('shrinks, stores and records the photo', async () => {
    expect(await uploadProductPhoto(fd(file('image/jpeg')))).toEqual({ ok: true, uploadId: 'up1', url: 'https://cdn/x.webp' });
    expect(shrinkImage).toHaveBeenCalled();
    expect(upload.mock.calls[0]![0]).toMatch(/^tenant\/t1\/products\/.+\.webp$/);
  });
  it('explains a wrong type, an empty pick and an oversized photo', async () => {
    expect(await uploadProductPhoto(fd(file('image/gif')))).toEqual({ ok: false, error: 'Use a JPG, PNG or WebP photo.' });
    expect(await uploadProductPhoto(new FormData())).toEqual({ ok: false, error: 'Pick a photo to upload.' });
    expect(await uploadProductPhoto(fd(file('image/jpeg', 20 * 1024 * 1024 + 1)))).toEqual({ ok: false, error: 'That photo is over 20MB. Pick a smaller one.' });
  });
  it('says so when the photo can’t be read, stored or recorded', async () => {
    shrinkImage.mockRejectedValueOnce(new Error('bad'));
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'That photo couldn’t be read. Try a different one.' });
    upload.mockResolvedValueOnce({ error: { message: 'down' } });
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'The photo couldn’t be uploaded. Try again.' });
    insertUpload.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'The photo couldn’t be saved. Try again.' });
  });
  it('removes the stored photo when its record can’t be saved', async () => {
    insertUpload.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    await uploadProductPhoto(fd(file('image/png')));
    expect(removeStored).toHaveBeenCalledWith('tenant-media', [upload.mock.calls[0]![0]]);
  });
  it('logs when that clean-up fails too, and still gives the same message', async () => {
    insertUpload.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    removeStored.mockResolvedValueOnce({ data: null, error: { message: 'gone' } });
    expect(await uploadProductPhoto(fd(file('image/png')))).toEqual({ ok: false, error: 'The photo couldn’t be saved. Try again.' });
    expect(logger.error).toHaveBeenCalledWith('catalog: orphaned stored object', expect.objectContaining({ bucket: 'tenant-media', error: 'gone' }));
  });
});

describe('uploadProductFile', () => {
  it('needs downloads switched on', async () => {
    expect(await uploadProductFile(fd(file('application/pdf')))).toEqual({ ok: false, error: 'Downloads aren’t switched on for this site.' });
  });
  it('stores the file privately, keeping its name', async () => {
    features.on = new Set(['catalog', 'digital_products']);
    expect(await uploadProductFile(fd(file('application/pdf', 10, 'Sheet 1.pdf')))).toEqual({ ok: true, uploadId: 'up1', fileName: 'Sheet 1.pdf' });
    expect(upload.mock.calls[0]![0]).toMatch(/^tenant\/t1\/files\/.+\.pdf$/);
    expect(shrinkImage).not.toHaveBeenCalled();
  });
  it('refuses other types and files over 50MB', async () => {
    features.on = new Set(['catalog', 'digital_products']);
    expect(await uploadProductFile(fd(file('text/html')))).toEqual({ ok: false, error: 'Use a PDF, PNG, JPG, WebP, SVG or ZIP file.' });
    expect(await uploadProductFile(fd(file('application/zip', 50 * 1024 * 1024 + 1)))).toEqual({ ok: false, error: 'That file is over 50MB. Pick a smaller one.' });
  });
  it('removes the stored file when its record can’t be saved', async () => {
    features.on = new Set(['catalog', 'digital_products']);
    insertUpload.mockResolvedValueOnce({ data: null, error: { message: 'down' } });
    expect(await uploadProductFile(fd(file('application/pdf')))).toEqual({ ok: false, error: 'The file couldn’t be saved. Try again.' });
    expect(removeStored).toHaveBeenCalledWith('tenant-files', [upload.mock.calls[0]![0]]);
  });
});

describe('collections', () => {
  it('creates a draft collection from a name', async () => {
    rpc.mockResolvedValue({ data: 'c1', error: null });
    expect(await createCollection('Autumn')).toEqual({ ok: true, id: 'c1' });
    expect(rpc).toHaveBeenCalledWith('save_collection', expect.objectContaining({ p: expect.objectContaining({ name: 'Autumn', status: 'draft', slug: 'autumn', listing_ids: [] }) }));
  });
  it('saves an existing collection', async () => {
    rpc.mockResolvedValue({ data: 'c1', error: null });
    expect(await saveCollection({ id: 'c1', name: 'Autumn', description: '', status: 'active', featuredImageId: null, productIds: ['l1'] })).toEqual({ ok: true, id: 'c1' });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_collection_id: 'c1', p: { listing_ids: ['l1'] } });
  });
  it('retries a new collection once with a fresh web address when another save took it first', async () => {
    slugRows.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [{ slug: 'autumn' }], error: null });
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'dup' } }).mockResolvedValueOnce({ data: 'c1', error: null });
    expect(await createCollection('Autumn')).toEqual({ ok: true, id: 'c1' });
    expect(rpc.mock.calls[1]![1].p).toMatchObject({ slug: 'autumn-2' });
  });
  it('orders collections', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await orderCollections(['c2', 'c1'])).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('order_collections', { p_tenant_id: 't1', p_ids: ['c2', 'c1'] });
  });
  it('says so when the order can’t be saved', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect(await orderCollections(['c1'])).toEqual({ ok: false, error: 'The new order couldn’t be saved. Try again.' });
  });
  it('refuses when the site has no catalog', async () => {
    features.on = new Set();
    expect(await createCollection('Autumn')).toEqual({ ok: false, error: 'Products aren’t switched on for this site.' });
  });
});

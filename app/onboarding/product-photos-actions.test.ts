import { describe, it, expect, vi, beforeEach } from 'vitest';

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://example.com/uploaded.jpg' } }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }) },
  }),
}));

vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create: vi.fn() } }) }));

import { uploadProductPhotos } from './product-photos-actions';

function makeFile(name: string, size = 1024, type = 'image/jpeg'): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('uploadProductPhotos — upload only', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
  });

  it('rejects when no files were provided', async () => {
    const formData = new FormData();
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/no photo/i);
  });

  it('rejects when more than 5 photos are uploaded', async () => {
    const formData = new FormData();
    for (let i = 0; i < 6; i++) formData.append('photos', makeFile(`p${i}.jpg`));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/at most 5/i);
  });

  it('rejects oversized files', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('big.jpg', 11 * 1024 * 1024));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/10MB/i);
  });

  it('rejects disallowed MIME types', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('p.gif', 1024, 'image/gif'));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/PNG, JPEG, WebP/i);
  });

  it('uploads 1–5 photos and returns their public URLs', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    formData.append('photos', makeFile('b.png', 1024, 'image/png'));
    const result = await uploadProductPhotos('test-shop', formData);
    expect(result.productPhotoUrls).toHaveLength(2);
    expect(uploadMock).toHaveBeenCalledTimes(2);
  });
});

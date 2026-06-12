import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://example.com/uploaded.jpg' } }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }) },
  }),
}));

const createMessageMock = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create: createMessageMock } }) }));

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

describe('uploadProductPhotos — Vision read', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    createMessageMock.mockReset();
  });

  it('parses a valid Vision response into visionPerPhoto + makerWork', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            perPhoto: [
              { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'a small bowl', suggestedDescription: 'A small turned walnut bowl from local stock.', suggestedPriceCents: 4800 },
              { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'a small carved sign', suggestedDescription: 'A small carved walnut sign for entryways.', suggestedPriceCents: 3200 },
            ],
            makerWork: 'This maker turns small bowls and carves small signs from local hardwood.',
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 100 },
    } as unknown as Anthropic.Message);

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    formData.append('photos', makeFile('b.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.visionPerPhoto).toHaveLength(2);
    expect(result.visionPerPhoto[0]!.productType).toBe('turned walnut bowl');
    expect(result.makerWork).toMatch(/small bowls/i);
  });

  it('degrades to empty Vision result when the Vision call throws', async () => {
    createMessageMock.mockRejectedValue(new Error('vision failed'));

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.productPhotoUrls).toHaveLength(1);
    expect(result.visionPerPhoto).toEqual([]);
    expect(result.makerWork).toBe('');
  });

  it('degrades to empty Vision result when the response is malformed JSON', async () => {
    createMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
      usage: { input_tokens: 0, output_tokens: 0 },
    } as unknown as Anthropic.Message);

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.visionPerPhoto).toEqual([]);
    expect(result.makerWork).toBe('');
  });

  it('degrades to empty when the per-photo count does not match the upload count', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            perPhoto: [
              { productType: 'bowl', suggestedName: 'a', suggestedShortDescription: 'b', suggestedDescription: 'c d', suggestedPriceCents: 100 },
            ],
            makerWork: 'mismatch',
          }),
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    } as unknown as Anthropic.Message);

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    formData.append('photos', makeFile('b.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.visionPerPhoto).toEqual([]);
    expect(result.makerWork).toBe('');
  });
});

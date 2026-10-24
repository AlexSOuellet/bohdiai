import { describe, it, expect } from 'vitest';
import { LITE_PHOTOS, limitNote, photoLimit, photosAllowed } from './photo-limit';
import { MAX_PHOTOS, buildProductPayload, emptyProductForm } from './product-form';
import type { FeatureKey } from '../features';

describe('how many photos a product may have', () => {
  it('is 12 on Full and one on Lite', () => {
    expect(photoLimit(new Set<FeatureKey>(['product_photos']))).toBe(MAX_PHOTOS);
    expect(photoLimit(new Set<FeatureKey>())).toBe(LITE_PHOTOS);
  });

  it('lets a product keep photos it already has after a downgrade, but not gain one', () => {
    expect(photosAllowed(1, 1, 0)).toBe(true);
    expect(photosAllowed(2, 1, 0)).toBe(false);
    expect(photosAllowed(3, 1, 3)).toBe(true);
    expect(photosAllowed(4, 1, 3)).toBe(false);
  });

  it('only explains the Lite limit', () => {
    expect(limitNote(1)).toContain('one photo per product');
    expect(limitNote(MAX_PHOTOS)).toBeNull();
  });

  it('is checked when saving', () => {
    const form = { ...emptyProductForm(), name: 'Carol star', price: '18', stockKind: 'made_to_order' as const, photos: [{ uploadId: 'a', url: 'x' }, { uploadId: 'b', url: 'y' }] };
    expect(buildProductPayload(form, { digital: false, photos: { limit: 1, kept: 0 } })).toEqual({ ok: false, error: 'Your plan shows one photo per product. Remove the extra photo to save.' });
    expect(buildProductPayload(form, { digital: false, photos: { limit: 1, kept: 2 } }).ok).toBe(true);
    expect(buildProductPayload(form, { digital: false, photos: { limit: 12, kept: 0 } }).ok).toBe(true);
    expect(buildProductPayload(form, { digital: false }).ok).toBe(true);
  });
});

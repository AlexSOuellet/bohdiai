/**
 * How many photos a product may have (Saltmarsh & Lace demo spec, stage two): Full
 * (the product_photos switch) up to MAX_PHOTOS; Lite one. A product that already
 * has more (after a downgrade from Full) keeps them all — they're hidden on the
 * site, never deleted — but can't gain another until it's back under the limit.
 */
import type { FeatureKey } from '../features';
import { MAX_PHOTOS } from './product-form';

export const LITE_PHOTOS = 1;

export function photoLimit(on: ReadonlySet<FeatureKey>): number {
  return on.has('product_photos') ? MAX_PHOTOS : LITE_PHOTOS;
}

/** Whether `count` photos may be saved on a product that has `kept` already. */
export function photosAllowed(count: number, limit: number, kept: number): boolean {
  return count <= Math.max(limit, Math.min(kept, MAX_PHOTOS));
}

export function limitNote(limit: number): string | null {
  return limit === LITE_PHOTOS
    ? 'Your plan shows one photo per product. Maker Full shows up to 12.'
    : null;
}

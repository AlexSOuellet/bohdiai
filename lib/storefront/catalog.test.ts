import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  imageUrlFromMetadata,
  resolveMediaMap,
  mediaForListing,
  listingToProductView,
  type ListingRow,
  type UploadRow,
} from './catalog';

function row(over: Partial<ListingRow> = {}): ListingRow {
  return {
    slug: 'amber-candle',
    name: 'Amber Candle',
    base_price_cents: 2400,
    short_description: 'A short line',
    description: 'The long body',
    metadata: null,
    primary_collection_id: null,
    media_ids: null,
    ...over,
  };
}

describe('formatPrice', () => {
  it('drops .00 for whole dollars and keeps cents otherwise', () => {
    expect(formatPrice(2400)).toBe('$24');
    expect(formatPrice(2450)).toBe('$24.50');
  });
});

describe('imageUrlFromMetadata', () => {
  it('reads image_url from a metadata object', () => {
    expect(imageUrlFromMetadata({ image_url: 'https://x/y.jpg' })).toBe('https://x/y.jpg');
  });
  it('returns undefined for null, arrays, or a missing/blank url', () => {
    expect(imageUrlFromMetadata(null)).toBeUndefined();
    expect(imageUrlFromMetadata([1, 2] as never)).toBeUndefined();
    expect(imageUrlFromMetadata({ image_url: '' })).toBeUndefined();
    expect(imageUrlFromMetadata({})).toBeUndefined();
  });
});

describe('resolveMediaMap', () => {
  it('maps id → url + alt, skipping uploads with no url', () => {
    const uploads: UploadRow[] = [
      { id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'my candle' },
      { id: 'u2', public_url: null, alt_text: null },
    ];
    const map = resolveMediaMap(uploads);
    expect(map.get('u1')).toEqual({ url: 'https://x/1.jpg', alt: 'my candle' });
    expect(map.has('u2')).toBe(false);
  });
});

describe('mediaForListing', () => {
  it('resolves the first media_id present in the map', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'alt' }]);
    const media = mediaForListing(row({ media_ids: ['u1'] }), map);
    expect(media).toEqual([{ kind: 'image', url: 'https://x/1.jpg', alt: 'alt' }]);
  });

  it('falls back to the product name when the upload has no alt', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: null }]);
    const media = mediaForListing(row({ media_ids: ['u1'], name: 'Amber Candle' }), map);
    expect(media[0]?.alt).toBe('Amber Candle');
  });

  it('falls back to metadata.image_url when no media_id resolves', () => {
    const media = mediaForListing(
      row({ media_ids: ['missing'], metadata: { image_url: 'https://x/legacy.jpg' } }),
      new Map(),
    );
    expect(media).toEqual([{ kind: 'image', url: 'https://x/legacy.jpg', alt: 'Amber Candle' }]);
  });

  it('is empty when there is neither an upload nor a metadata url', () => {
    expect(mediaForListing(row({ media_ids: null, metadata: null }), new Map())).toEqual([]);
  });
});

describe('listingToProductView', () => {
  it('projects a full product, resolving the uploaded photo', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'alt' }]);
    const pv = listingToProductView(row({ media_ids: ['u1'] }), map);
    expect(pv).toEqual({
      slug: 'amber-candle',
      name: 'Amber Candle',
      price: '$24',
      shortDescription: 'A short line',
      description: 'The long body',
      status: 'active',
      media: [{ kind: 'image', url: 'https://x/1.jpg', alt: 'alt' }],
      variations: [],
    });
  });

  it('omits shortDescription when null and empties description when null', () => {
    const pv = listingToProductView(row({ short_description: null, description: null }), new Map());
    expect('shortDescription' in pv).toBe(false);
    expect(pv.description).toBe('');
  });
});

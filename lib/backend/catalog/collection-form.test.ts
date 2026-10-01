import { describe, it, expect } from 'vitest';
import { buildCollectionPayload, moveItem, type CollectionForm } from './collection-form';

const form = (over: Partial<CollectionForm> = {}): CollectionForm => ({
  id: null,
  name: 'Autumn',
  description: '',
  status: 'draft',
  featuredImageId: null,
  productIds: ['a', 'b'],
  ...over,
});

describe('buildCollectionPayload', () => {
  it('builds the payload in the maker’s product order', () => {
    expect(buildCollectionPayload(form({ description: ' Warm things ' }))).toEqual({
      ok: true,
      payload: { name: 'Autumn', description: 'Warm things', status: 'draft', featured_image_id: null, listing_ids: ['a', 'b'] },
    });
  });
  it('needs a name', () => {
    expect(buildCollectionPayload(form({ name: '  ' }))).toEqual({ ok: false, error: 'Give the collection a name.' });
  });
  it('refuses a product listed twice', () => {
    expect(buildCollectionPayload(form({ productIds: ['a', 'a'] }))).toEqual({ ok: false, error: 'A product is in this collection twice. Remove one.' });
  });
});

describe('moveItem', () => {
  it('moves an item up or down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
  it('leaves the list alone at the ends', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});

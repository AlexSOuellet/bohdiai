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
  it('states the length limits as a most, not a less-than', () => {
    expect(buildCollectionPayload(form({ name: 'n'.repeat(81) }))).toEqual({ ok: false, error: 'Keep the name to 80 characters or fewer.' });
    expect(buildCollectionPayload(form({ name: 'n'.repeat(80) })).ok).toBe(true);
    expect(buildCollectionPayload(form({ description: 'd'.repeat(501) }))).toEqual({ ok: false, error: 'Keep the description to 500 characters or fewer.' });
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
  it('returns an unchanged copy when the index is out of range', () => {
    const list = ['a', 'b'];
    const before = moveItem(list, -1, 1);
    const after = moveItem(list, 2, -1);
    expect(before).toEqual(['a', 'b']);
    expect(after).toEqual(['a', 'b']);
    expect(before).not.toBe(list);
    expect(after).not.toBe(list);
  });
});

describe('buildCollectionPayload — crafted input', () => {
  const odd = { ok: false, error: 'Something about this collection didn’t look right. Reload the page and try again.' };
  const crafted = (over: Record<string, unknown>): CollectionForm => ({ ...form(), ...over }) as unknown as CollectionForm;
  it('refuses a status the editor never sends', () => {
    expect(buildCollectionPayload(crafted({ status: 'published' }))).toEqual(odd);
  });
  it('refuses wrong-typed fields instead of throwing', () => {
    for (const over of [{ id: 4 }, { name: 5 }, { description: null }, { featuredImageId: 3 }, { productIds: 'a' }, { productIds: [1] }]) {
      expect(buildCollectionPayload(crafted(over))).toEqual(odd);
    }
  });
});

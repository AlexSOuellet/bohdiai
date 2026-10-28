import { describe, it, expect } from 'vitest';
import { homeWall } from './home-wall';
import type { ProductRowView } from './catalog/queries';

const piece = (id: string, over: Partial<ProductRowView> = {}): ProductRowView => ({
  id,
  name: `Piece ${id}`,
  status: 'active',
  priceLabel: '',
  stockLabel: '',
  soldOut: false,
  photoUrl: `https://img/${id}.jpg`,
  photoUploadId: id,
  collectionIds: [],
  onHome: false,
  inGallery: false,
  ...over,
});

describe('the wall on Home', () => {
  it('on Showcase, shows her gallery picks and how many of 12', () => {
    const w = homeWall([piece('a'), piece('b', { inGallery: true }), piece('c', { inGallery: true })], true, 7);
    expect(w.title).toBe('Your gallery');
    expect(w.sub).toBe('2 of 12 picked');
    expect(w.items.map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('on Showcase with nothing picked, shows her newest, as the site does', () => {
    const w = homeWall([piece('a'), piece('b'), piece('d', { status: 'draft' })], true, 7);
    expect(w.sub).toBe('Showing your newest 12 until you pick');
    expect(w.items.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('on Market and Full, shows her work with counts, drafts included, archived left out', () => {
    const w = homeWall([piece('a'), piece('b', { status: 'draft' }), piece('c', { status: 'archived' })], false, 7);
    expect(w.title).toBe('Your work');
    expect(w.sub).toBe('1 product on your site, 1 draft');
    expect(w.items.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

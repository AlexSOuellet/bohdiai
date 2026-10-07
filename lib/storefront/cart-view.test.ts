import { describe, it, expect } from 'vitest';
import type { ProductView } from '@/lib/archetypes/content';
import { toCartView } from './cart-view';

const view = (id: string, over: Partial<ProductView> = {}): ProductView => ({
  id,
  slug: `baby-${id}`,
  name: `Baby ${id}`,
  price: '$120',
  description: '',
  status: 'active',
  media: [{ kind: 'image', url: `https://cdn/${id}.webp`, alt: `Baby ${id}` }],
  variations: [],
  ...over,
});

describe('toCartView', () => {
  it('totals only what can still be had', () => {
    const cart = toCartView([
      { view: view('a'), priceCents: 12000, isPreview: false },
      { view: view('b', { status: 'sold_out' }), priceCents: 9000, isPreview: false },
    ]);
    expect(cart.total).toBe('$120');
    expect(cart.lines.map((l) => [l.id, l.available])).toEqual([
      ['a', true],
      ['b', false],
    ]);
    expect(cart.lines[0]?.photo?.url).toBe('https://cdn/a.webp');
  });
});

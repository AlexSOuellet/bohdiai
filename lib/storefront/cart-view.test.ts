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

describe('toCartView with promotions', () => {
  const pieces = [{ view: view('a'), priceCents: 12000, isPreview: false }];
  const base = { id: 'p', name: 'X', startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true };
  const code = { ...base, id: 'c', kind: 'code' as const, name: 'MARKET10', code: 'MARKET10', percentOff: 10, amountOffCents: null };
  const sale = { ...base, id: 's', kind: 'sale' as const, name: 'Fall Sale', code: null, percentOff: 25, amountOffCents: null };

  it('takes a valid code off the total', () => {
    const cart = toCartView(pieces, { promos: [code], today: '2026-10-07', codesOn: true, code: 'market10' });
    expect(cart).toMatchObject({ subtotal: '$120', discount: { label: 'MARKET10', amount: '$12' }, total: '$108', code: { value: 'MARKET10', applied: true } });
  });
  it('says why a code does not apply', () => {
    expect(toCartView(pieces, { promos: [code], today: '2026-10-07', codesOn: true, code: 'NOPE' }).code).toEqual({ value: 'NOPE', applied: false, message: 'That code isn’t valid.' });
    const both = toCartView(pieces, { promos: [code, sale], today: '2026-10-07', codesOn: true, code: 'MARKET10' });
    expect(both.code?.applied).toBe(false);
    expect(both.discount).toEqual({ label: 'Fall Sale', amount: '$30' });
    expect(both.lines[0]?.salePrice).toBe('$90');
    expect(both.total).toBe('$90');
  });
});

describe('toCartView with a piece’s choice', () => {
  it('shows each chosen option as its own line, at its own price', () => {
    const scarf = view('s', {
      name: 'Scarf',
      variations: [{ name: 'Colour', options: ['Blue', 'Red'] }],
      offers: [
        { id: 'v1', choices: { Colour: 'Blue' }, price: '$28', priceCents: 2800, soldOut: false },
        { id: 'v2', choices: { Colour: 'Red' }, price: '$30', priceCents: 3000, soldOut: true },
      ],
    });
    const cart = toCartView([{ view: scarf, priceCents: 2800, isPreview: false }], undefined, ['s~v1', 's~v2', 'gone']);
    expect(cart.lines.map((l) => [l.id, l.name, l.price, l.available])).toEqual([
      ['s~v1', 'Scarf, Blue', '$28', true],
      ['s~v2', 'Scarf', '$28', false],
    ]);
    expect(cart.total).toBe('$28');
  });
});

import { describe, it, expect } from 'vitest';
import type { ProductView } from '@/lib/archetypes/content';
import { cartLine, isCartable, orderLines, orderRequestEmail, orderRequestSchema, type LoadedPiece } from './order-request';

const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';

const piece = (id: string, over: Partial<ProductView> = {}, extra: Partial<LoadedPiece> = {}): LoadedPiece => ({
  view: { id, slug: id, name: `Baby ${id.slice(-1)}`, price: '$120', description: '', status: 'active', media: [], variations: [], ...over },
  priceCents: 12000,
  isPreview: false,
  ...extra,
});

const V = '00000000-0000-4000-8000-0000000000b1';
const W2 = '00000000-0000-4000-8000-0000000000b2';
const scarf = piece(A, {
  name: 'Scarf',
  variations: [
    { name: 'Colour', options: ['Blue', 'Red'] },
    { name: 'Size', options: ['L'] },
  ],
  offers: [
    { id: V, choices: { Size: 'L', Colour: 'Blue' }, price: '$28', priceCents: 2800, soldOut: false },
    { id: W2, choices: { Colour: 'Red', Size: 'L' }, price: '$30', priceCents: 3000, soldOut: true },
  ],
});

describe('a piece with options in the cart', () => {
  it('is one of its choices, named and priced from the catalog', () => {
    expect(cartLine(`${A}~${V}`, [scarf])).toEqual({ listingId: A, variantId: V, name: 'Scarf, Blue / L', option: 'Blue / L', priceCents: 2800 });
  });
  it('can’t be had without a choice, with a sold-out or unknown one, or with a choice on a piece without options', () => {
    expect(cartLine(A, [scarf])).toBeNull();
    expect(cartLine(`${A}~${W2}`, [scarf])).toBeNull();
    expect(cartLine(`${A}~${B}`, [scarf])).toBeNull();
    expect(cartLine(`${B}~${V}`, [piece(B)])).toBeNull();
    expect(cartLine(`${A}~${V}`, [{ ...scarf, isPreview: true }])).toBeNull();
    expect(cartLine(`${A}~${V}`, [piece(A, { variations: scarf.view.variations, offers: [{ id: V, choices: { Colour: 'Blue' }, price: '', soldOut: false }] })])).toBeNull();
  });
  it('orders the choice, and names the piece when its choice is gone', () => {
    expect(orderLines([`${A}~${V}`, B], [scarf, piece(B)])).toMatchObject({ ok: true, subtotalCents: 14800 });
    expect(orderLines([`${A}~${W2}`], [scarf])).toEqual({ ok: false, unavailable: ['Scarf'] });
  });
  it('takes a choice in the order request', () => {
    expect(orderRequestSchema.safeParse({ name: 'P', email: 'p@example.com', listingIds: [`${A}~${V}`] }).success).toBe(true);
    expect(orderRequestSchema.safeParse({ name: 'P', email: 'p@example.com', listingIds: [`${A}~nope`] }).success).toBe(false);
  });
});

describe('orderLines', () => {
  it('prices each piece from the catalog, in cart order', () => {
    const r = orderLines([B, A], [piece(A), piece(B, {}, { priceCents: 9500 })]);
    expect(r).toEqual({
      ok: true,
      lines: [
        { listingId: B, variantId: null, name: 'Baby 2', option: null, priceCents: 9500 },
        { listingId: A, variantId: null, name: 'Baby 1', option: null, priceCents: 12000 },
      ],
      subtotalCents: 21500,
    });
  });
  it('names what can no longer be had', () => {
    const r = orderLines([A, B], [piece(A, { status: 'sold_out' })]);
    expect(r).toEqual({ ok: false, unavailable: ['Baby 1', 'A piece that is no longer listed'] });
  });
});

describe('isCartable', () => {
  it('refuses pieces with options, placeholders and free pieces', () => {
    expect(isCartable(piece(A))).toBe(true);
    expect(isCartable(piece(A, { variations: [{ name: 'Size', options: ['S'] }] }))).toBe(false);
    expect(isCartable(piece(A, {}, { isPreview: true }))).toBe(false);
    expect(isCartable(piece(A, {}, { priceCents: 0 }))).toBe(false);
  });
});

describe('orderRequestSchema', () => {
  it('needs a name, an email and something in the cart', () => {
    expect(orderRequestSchema.safeParse({ name: 'Pat', email: 'pat@example.com', listingIds: [A] }).success).toBe(true);
    expect(orderRequestSchema.safeParse({ name: '', email: 'pat@example.com', listingIds: [A] }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ name: 'Pat', email: 'nope', listingIds: [A] }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ name: 'Pat', email: 'pat@example.com', listingIds: [] }).success).toBe(false);
  });
});

describe('orderRequestEmail', () => {
  it('lists the pieces, the total and how to reach the buyer, escaping their words', () => {
    const mail = orderRequestEmail({
      shopName: 'Rose n’ Cat',
      orderNumber: '1001',
      input: { name: 'Pat <b>', email: 'pat@example.com', phone: '401 555 0100', note: 'Pick up\nat the fair', code: '', listingIds: [A] },
      lines: [{ listingId: A, variantId: null, name: 'Theo', option: null, priceCents: 12000 }],
      subtotalCents: 12000,
    });
    expect(mail.subject).toBe('New order request #1001 from Pat <b> via Rose n’ Cat');
    expect(mail.text).toContain('- Theo: $120');
    expect(mail.text).toContain('Total: $120');
    expect(mail.text).toContain('401 555 0100');
    expect(mail.text).toContain('Nothing has been charged');
    expect(mail.html).toContain('Pat &lt;b&gt;');
    expect(mail.html).toContain('Pick up<br />at the fair');
  });
});

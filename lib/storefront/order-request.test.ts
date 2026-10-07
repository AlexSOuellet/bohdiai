import { describe, it, expect } from 'vitest';
import type { ProductView } from '@/lib/archetypes/content';
import { isCartable, orderLines, orderRequestEmail, orderRequestSchema, type LoadedPiece } from './order-request';

const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';

const piece = (id: string, over: Partial<ProductView> = {}, extra: Partial<LoadedPiece> = {}): LoadedPiece => ({
  view: { id, slug: id, name: `Baby ${id.slice(-1)}`, price: '$120', description: '', status: 'active', media: [], variations: [], ...over },
  priceCents: 12000,
  isPreview: false,
  ...extra,
});

describe('orderLines', () => {
  it('prices each piece from the catalog, in cart order', () => {
    const r = orderLines([B, A], [piece(A), piece(B, {}, { priceCents: 9500 })]);
    expect(r).toEqual({
      ok: true,
      lines: [
        { listingId: B, name: 'Baby 2', priceCents: 9500 },
        { listingId: A, name: 'Baby 1', priceCents: 12000 },
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
      lines: [{ listingId: A, name: 'Theo', priceCents: 12000 }],
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

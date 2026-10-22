import { describe, it, expect } from 'vitest';
import {
  emptyProductForm,
  parseDollars,
  parseStock,
  formatCents,
  syncVariants,
  renameOptionInVariants,
  buildProductPayload,
  MAX_PHOTOS,
  type ProductForm,
  type OptionForm,
} from './product-form';

const base = (over: Partial<ProductForm> = {}): ProductForm => ({
  ...emptyProductForm(),
  name: 'Fig Candle',
  price: '24',
  ...over,
});
const size: OptionForm = {
  name: 'Size',
  choices: [
    { value: 'Small', kind: 'physical', fileUploadId: null, fileName: null },
    { value: 'Large', kind: 'physical', fileUploadId: null, fileName: null },
  ],
};

describe('parseDollars', () => {
  it('reads whole dollars, cents and a leading $', () => {
    expect(parseDollars('24')).toEqual({ ok: true, cents: 2400 });
    expect(parseDollars('$24.5')).toEqual({ ok: true, cents: 2450 });
    expect(parseDollars(' 0.99 ')).toEqual({ ok: true, cents: 99 });
  });
  it('treats blank as not set', () => {
    expect(parseDollars('  ')).toEqual({ ok: true, cents: null });
  });
  it('refuses anything else', () => {
    for (const bad of ['-1', '1.234', 'abc', '1,000', '12345678'])
      expect(parseDollars(bad)).toEqual({ ok: false });
  });
});

describe('parseStock', () => {
  it('reads whole numbers and blank', () => {
    expect(parseStock('0')).toEqual({ ok: true, count: 0 });
    expect(parseStock('12')).toEqual({ ok: true, count: 12 });
    expect(parseStock('')).toEqual({ ok: true, count: null });
  });
  it('refuses fractions and negatives', () => {
    expect(parseStock('1.5')).toEqual({ ok: false });
    expect(parseStock('-2')).toEqual({ ok: false });
  });
});

describe('formatCents', () => {
  it('shows dollars the way the maker would type them', () => {
    expect(formatCents(2400)).toBe('24');
    expect(formatCents(2450)).toBe('24.50');
    expect(formatCents(null)).toBe('');
  });
});

describe('syncVariants', () => {
  it('lists one row per combination and keeps what was typed', () => {
    const first = syncVariants([size], []);
    expect(first.map((v) => v.choices)).toEqual([{ Size: 'Small' }, { Size: 'Large' }]);
    const typed = first.map((v, i) => (i === 1 ? { ...v, price: '30', stock: '2' } : v));
    const again = syncVariants([size], typed);
    expect(again[1]).toEqual({
      choices: { Size: 'Large' },
      price: '30',
      stock: '2',
      stockKind: 'made_to_order',
      available: true,
    });
  });
  it('ignores options or choices that are still blank', () => {
    expect(syncVariants([{ name: ' ', choices: size.choices }], [])).toEqual([]);
    expect(
      syncVariants([{ name: 'Size', choices: [{ ...size.choices[0]!, value: ' ' }] }], []),
    ).toEqual([]);
  });
});

describe('renameOptionInVariants', () => {
  it('keeps typed values when an option is renamed', () => {
    const typed = syncVariants([size], []).map((v, i) => (i === 1 ? { ...v, price: '30' } : v));
    const renamed: OptionForm[] = [{ ...size, name: 'Sizes' }];
    const rows = syncVariants(renamed, renameOptionInVariants(typed, 'Size', 'Sizes'));
    expect(rows[1]).toEqual({
      choices: { Sizes: 'Large' },
      price: '30',
      stock: '',
      stockKind: 'made_to_order',
      available: true,
    });
  });
  it('compares and re-keys trimmed names, leaving other keys alone', () => {
    const v = [
      { choices: { Size: 'Large', Scent: 'Fig' }, price: '5', stock: '1', stockKind: 'count' as const, available: false },
    ];
    expect(renameOptionInVariants(v, ' Size ', ' Sizes ')).toEqual([
      { choices: { Sizes: 'Large', Scent: 'Fig' }, price: '5', stock: '1', stockKind: 'count' as const, available: false },
    ]);
  });
  it('returns an unchanged copy for a blank or identical name', () => {
    const v = [{ choices: { Size: 'Large' }, price: '5', stock: '', stockKind: 'made_to_order' as const, available: true }];
    for (const [from, to] of [
      ['', 'X'],
      ['Size', ' '],
      ['Size', 'Size'],
    ] as const) {
      const out = renameOptionInVariants(v, from, to);
      expect(out).toEqual(v);
      expect(out).not.toBe(v);
    }
  });
});

describe('buildProductPayload', () => {
  it('drops repeated collections, keeping the first-seen order', () => {
    const r = buildProductPayload(base({ collectionIds: ['c', 'c', 'd'] }), { digital: false });
    expect(r.ok && r.payload.collection_ids).toEqual(['c', 'd']);
  });
  it('states the length limits as a most, not a less-than', () => {
    expect(buildProductPayload(base({ name: 'n'.repeat(121) }), { digital: false })).toEqual({
      ok: false,
      error: 'Keep the name to 120 characters or fewer.',
    });
    expect(buildProductPayload(base({ name: 'n'.repeat(120) }), { digital: false }).ok).toBe(true);
    expect(
      buildProductPayload(base({ shortDescription: 's'.repeat(301) }), { digital: false }),
    ).toEqual({ ok: false, error: 'Keep the short description to 300 characters or fewer.' });
    expect(
      buildProductPayload(base({ description: 'd'.repeat(5001) }), { digital: false }),
    ).toEqual({ ok: false, error: 'Keep the description to 5000 characters or fewer.' });
  });
  it('builds a simple product', () => {
    const r = buildProductPayload(
      base({ shortDescription: ' Smells of figs ', stock: '3', collectionIds: ['c1'] }),
      { digital: false },
    );
    expect(r).toEqual({
      ok: true,
      payload: {
        listing_type: 'product',
        name: 'Fig Candle',
        short_description: 'Smells of figs',
        description: null,
        base_price_cents: 2400,
        status: 'draft',
        inventory_count: 3,
        stock_kind: 'made_to_order',
        media_ids: [],
        file_upload_id: null,
        collection_ids: ['c1'],
        options: [],
        variants: [],
        on_home: false,
        is_new: false,
      },
    });
  });
  it('starts off the home page and sends the home choice', () => {
    expect(emptyProductForm().onHome).toBe(false);
    expect(buildProductPayload(base({ onHome: true }), { digital: false })).toMatchObject({
      ok: true,
      payload: { on_home: true },
    });
    expect(buildProductPayload(base({ isNew: true }), { digital: false })).toMatchObject({
      ok: true,
      payload: { is_new: true },
    });
  });
  it('needs a name, and a price that reads as money', () => {
    expect(buildProductPayload(base({ name: ' ' }), { digital: false })).toEqual({
      ok: false,
      error: 'Give the product a name.',
    });
    expect(buildProductPayload(base({ price: 'ten' }), { digital: false })).toEqual({
      ok: false,
      error: 'Enter a price, like 24 or 24.50, or leave it empty to show “Ask for price”.',
    });
  });
  it('saves an empty price as no price yet (“Ask for price”)', () => {
    const r = buildProductPayload(base({ price: '' }), { digital: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.base_price_cents).toBe(0);
  });
  it('checks stock', () => {
    expect(buildProductPayload(base({ stock: '2.5' }), { digital: false })).toEqual({
      ok: false,
      error: 'Check the number for this product: a whole number, 0 or more.',
    });
  });
  it('asks plainly how a piece is stocked (Alex, 2026-10-22)', () => {
    const built = (over: Parameters<typeof base>[0]) => buildProductPayload(base(over), { digital: false });
    // One of a kind is its one piece until it sells; never more than one.
    expect(built({ stockKind: 'one_of_a_kind', stock: '' })).toMatchObject({ ok: true, payload: { stock_kind: 'one_of_a_kind', inventory_count: 1 } });
    expect(built({ stockKind: 'one_of_a_kind', stock: '0' })).toMatchObject({ ok: true, payload: { inventory_count: 0 } });
    expect(built({ stockKind: 'one_of_a_kind', stock: '3' })).toEqual({ ok: false, error: 'One of a kind is just one. Choose “I have some” for this product if you have more.' });
    // A count must say how many.
    expect(built({ stockKind: 'count', stock: '4' })).toMatchObject({ ok: true, payload: { stock_kind: 'count', inventory_count: 4 } });
    expect(built({ stockKind: 'count', stock: '' })).toEqual({ ok: false, error: 'Type how many you have of this product, or choose Made to order.' });
    // Made to order may say how many are ready.
    expect(built({ stockKind: 'made_to_order', stock: '' })).toMatchObject({ ok: true, payload: { stock_kind: 'made_to_order', inventory_count: null } });
    expect(built({ stockKind: 'made_to_order', stock: '1' })).toMatchObject({ ok: true, payload: { inventory_count: 1 } });
    // A crafted kind is refused.
    expect(built({ stockKind: 'lots' as never }).ok).toBe(false);
    // A download has no stock: made to order, no number.
    expect(buildProductPayload(base({ kind: 'digital', fileUploadId: 'f1', fileName: 'a.pdf', stockKind: 'count', stock: '' }), { digital: true })).toMatchObject({ ok: true, payload: { stock_kind: 'made_to_order', inventory_count: null } });
  });
  it('starts with no sample photo and never sends it in the payload', () => {
    expect(emptyProductForm().samplePhotoUrl).toBeNull();
    const built = buildProductPayload(base({ samplePhotoUrl: 'https://stock/fig.jpg' }), {
      digital: false,
    });
    expect(built.ok).toBe(true);
    expect(JSON.stringify(built)).not.toContain('stock/fig.jpg');
  });
  it('caps photos', () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => ({
      uploadId: `p${i}`,
      url: `u${i}`,
    }));
    expect(buildProductPayload(base({ photos }), { digital: false })).toEqual({
      ok: false,
      error: `A product can have up to ${MAX_PHOTOS} photos.`,
    });
  });
  it('builds options and combinations; product stock is ignored once there are options', () => {
    const variants = syncVariants([size], []).map((v, i) =>
      i === 0 ? { ...v, price: '', stock: '0' } : { ...v, price: '30', stock: '' },
    );
    const r = buildProductPayload(base({ stock: '9', options: [size], variants }), {
      digital: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload.inventory_count).toBeNull();
    expect(r.payload.options).toEqual([
      {
        name: 'Size',
        choices: [
          { value: 'Small', kind: 'physical', file_upload_id: null },
          { value: 'Large', kind: 'physical', file_upload_id: null },
        ],
      },
    ]);
    expect(r.payload.variants).toEqual([
      { combination: { Size: 'Small' }, price_cents: null, inventory_count: 0, stock_kind: 'made_to_order', available: true },
      { combination: { Size: 'Large' }, price_cents: 3000, inventory_count: null, stock_kind: 'made_to_order', available: true },
    ]);
  });
  it('explains option mistakes', () => {
    const blankName = { ...size, name: '' };
    expect(buildProductPayload(base({ options: [blankName] }), { digital: false })).toEqual({
      ok: false,
      error: 'Name every option (like Size or Scent).',
    });
    expect(buildProductPayload(base({ options: [size, { ...size }] }), { digital: false })).toEqual(
      { ok: false, error: 'Two options can’t share a name.' },
    );
    expect(
      buildProductPayload(base({ options: [{ ...size, choices: [] }] }), { digital: false }),
    ).toEqual({ ok: false, error: 'Give Size at least one choice.' });
    const twice = { ...size, choices: [size.choices[0]!, { ...size.choices[0]!, value: 'small' }] };
    expect(buildProductPayload(base({ options: [twice] }), { digital: false })).toEqual({
      ok: false,
      error: 'Size lists small twice.',
    });
    const four = [1, 2, 3, 4].map((n) => ({ ...size, name: `O${n}` }));
    expect(buildProductPayload(base({ options: four }), { digital: false })).toEqual({
      ok: false,
      error: 'A product can have up to 3 options.',
    });
  });
  it('refuses too many combinations', () => {
    const many = (name: string) => ({
      name,
      choices: Array.from({ length: 11 }, (_, i) => ({
        value: `${name}${i}`,
        kind: 'physical' as const,
        fileUploadId: null,
        fileName: null,
      })),
    });
    expect(
      buildProductPayload(base({ options: [many('A'), many('B')] }), { digital: false }),
    ).toEqual({
      ok: false,
      error: 'That makes 121 combinations — the most is 100. Remove some choices.',
    });
  });
  it('checks combination prices and stock, naming the combination', () => {
    const variants = syncVariants([size], []).map((v) => ({ ...v, price: 'x' }));
    expect(buildProductPayload(base({ options: [size], variants }), { digital: false })).toEqual({
      ok: false,
      error: 'Check the price for Small.',
    });
    const stock = syncVariants([size], []).map((v) => ({ ...v, stock: '-1' }));
    expect(
      buildProductPayload(base({ options: [size], variants: stock }), { digital: false }),
    ).toEqual({ ok: false, error: 'Check the number for Small: a whole number, 0 or more.' });
    // Each combination asks the same way; one switched off keeps its number unchecked by kind.
    const counted = syncVariants([size], []).map((v) => ({ ...v, stockKind: 'count' as const, stock: '' }));
    expect(buildProductPayload(base({ options: [size], variants: counted }), { digital: false })).toEqual({ ok: false, error: 'Type how many you have of Small, or choose Made to order.' });
    const off = syncVariants([size], []).map((v, i) => ({ ...v, stockKind: 'count' as const, stock: i === 0 ? '' : '2', available: i !== 0 }));
    expect(buildProductPayload(base({ options: [size], variants: off }), { digital: false }).ok).toBe(true);
    const offBad = syncVariants([size], []).map((v, i) => ({ ...v, stock: i === 0 ? 'x' : '', available: i !== 0 }));
    expect(buildProductPayload(base({ options: [size], variants: offBad }), { digital: false })).toEqual({ ok: false, error: 'Check the number for Small.' });
  });
  it('needs one available combination to go live', () => {
    const variants = syncVariants([size], []).map((v) => ({ ...v, available: false }));
    expect(
      buildProductPayload(base({ status: 'active', options: [size], variants }), {
        digital: false,
      }),
    ).toEqual({
      ok: false,
      error: 'Turn on at least one combination before making this live.',
    });
  });
  it('refuses downloads when the site doesn’t have them', () => {
    expect(buildProductPayload(base({ kind: 'digital' }), { digital: false })).toEqual({
      ok: false,
      error: 'Downloads aren’t switched on for this site.',
    });
    const dl = { ...size, choices: [{ ...size.choices[0]!, kind: 'digital' as const }] };
    expect(buildProductPayload(base({ options: [dl] }), { digital: false })).toEqual({
      ok: false,
      error: 'Downloads aren’t switched on for this site.',
    });
  });
  it('builds a download product and needs its file to go live', () => {
    expect(
      buildProductPayload(base({ kind: 'digital', status: 'active' }), { digital: true }),
    ).toEqual({ ok: false, error: 'Add the download file before making this live.' });
    const r = buildProductPayload(
      base({ kind: 'digital', fileUploadId: 'f1', fileName: 'sheet.pdf', stock: '4' }),
      { digital: true },
    );
    expect(r.ok && r.payload.listing_type).toBe('digital_product');
    expect(r.ok && r.payload.file_upload_id).toBe('f1');
    expect(r.ok && r.payload.inventory_count).toBeNull();
  });
  it('needs each download choice’s file to go live', () => {
    const mixed: OptionForm = {
      name: 'Format',
      choices: [
        { value: 'Print', kind: 'physical', fileUploadId: null, fileName: null },
        { value: 'Download', kind: 'digital', fileUploadId: null, fileName: null },
      ],
    };
    const variants = syncVariants([mixed], []);
    expect(
      buildProductPayload(base({ status: 'active', options: [mixed], variants }), {
        digital: true,
      }),
    ).toEqual({
      ok: false,
      error: 'Add the download file for Download before making this live.',
    });
    const withFile = {
      ...mixed,
      choices: [mixed.choices[0]!, { ...mixed.choices[1]!, fileUploadId: 'f9', fileName: 'x.pdf' }],
    };
    const r = buildProductPayload(base({ status: 'active', options: [withFile], variants }), {
      digital: true,
    });
    expect(r.ok && r.payload.listing_type).toBe('product');
    expect(r.ok && r.payload.options[0]!.choices[1]).toEqual({
      value: 'Download',
      kind: 'digital',
      file_upload_id: 'f9',
    });
  });
  it('drops a choice’s file when the choice is physical', () => {
    const stray = {
      ...size,
      choices: [{ ...size.choices[0]!, fileUploadId: 'f1', fileName: 'x.pdf' }],
    };
    const r = buildProductPayload(base({ options: [stray], variants: syncVariants([stray], []) }), {
      digital: true,
    });
    expect(r.ok && r.payload.options[0]!.choices[0]!.file_upload_id).toBeNull();
  });
});

describe('buildProductPayload — crafted input', () => {
  const odd = {
    ok: false,
    error: 'Something about this product didn’t look right. Reload the page and try again.',
  };
  const crafted = (over: Record<string, unknown>): ProductForm =>
    ({ ...base(), ...over }) as unknown as ProductForm;
  it('refuses a status or kind the editor never sends', () => {
    expect(buildProductPayload(crafted({ status: 'published' }), { digital: true })).toEqual(odd);
    expect(buildProductPayload(crafted({ kind: 'service' }), { digital: true })).toEqual(odd);
  });
  it('refuses wrong-typed fields instead of throwing', () => {
    for (const over of [
      { id: undefined },
      { name: 5 },
      { shortDescription: null },
      { description: {} },
      { price: 24 },
      { stock: [] },
      { fileUploadId: 7 },
      { photos: 'u1' },
      { photos: [{ uploadId: 3 }] },
      { samplePhotoUrl: 5 },
      { samplePhotoUrl: undefined },
      { onHome: 'yes' },
      { onHome: undefined },
      { collectionIds: 'c1' },
      { collectionIds: [1] },
      { options: {} },
      { options: [{ name: 'Size', choices: 'Small' }] },
      {
        options: [{ name: 'Size', choices: [{ value: 1, kind: 'physical', fileUploadId: null }] }],
      },
      { options: [{ name: 'Size', choices: [{ value: 'S', kind: 'other', fileUploadId: null }] }] },
      { variants: null },
      { variants: [{ choices: { Size: 1 }, price: '', stock: '', available: true }] },
      { variants: [{ choices: {}, price: '', stock: '', available: 'yes' }] },
    ]) {
      expect(buildProductPayload(crafted(over), { digital: true })).toEqual(odd);
    }
  });
});

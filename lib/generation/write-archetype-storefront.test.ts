import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture what each table is asked to do, so we can assert the tenant row's
// niche columns and the draft→active publish flip without a real database.
const tenantInsert = vi.fn();
const tenantUpdateEq = vi.fn();
const pageInsert = vi.fn();
const listingInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'tenants') {
        return {
          insert: tenantInsert,
          update: (patch: unknown) => ({
            eq: (col: string, id: unknown) => tenantUpdateEq(patch, col, id),
          }),
        };
      }
      if (table === 'content_pages') return { insert: pageInsert };
      if (table === 'listings') return { insert: listingInsert };
      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));

import { writeArchetypeStorefront, publishArchetypeStorefront } from './write-archetype-storefront';

const base = {
  subdomain: 'x',
  shopName: 'X Shop',
  moodKey: 'modern',
  tenantTypes: ['seller'],
  archetypeKey: 'main-street',
  lookKey: 'main-street-ember',
  mood: 'modern',
  catalogSize: 3,
  content: {},
  products: [],
};

beforeEach(() => {
  tenantInsert
    .mockReset()
    .mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: 'tn_1' }, error: null }) }) });
  tenantUpdateEq.mockReset().mockResolvedValue({ error: null });
  pageInsert.mockReset().mockResolvedValue({ error: null });
  listingInsert.mockReset().mockResolvedValue({ error: null });
});

describe('writeArchetypeStorefront — niche columns', () => {
  it('writes a list-picked niche as from-list, with the slug and no description', async () => {
    await writeArchetypeStorefront({
      ...base,
      primaryNiche: 'candles',
      nicheFromList: true,
      nicheDescription: null,
    });

    const row = tenantInsert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row['primary_niche']).toBe('candles');
    expect(row['niche_from_list']).toBe(true);
    expect(row['niche_description']).toBeNull();
  });

  it('writes an Other store as not-from-list, with the description and a null niche', async () => {
    await writeArchetypeStorefront({
      ...base,
      primaryNiche: null,
      nicheFromList: false,
      nicheDescription: 'hand-poured concrete planters with pressed botanicals',
    });

    const row = tenantInsert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row['primary_niche']).toBeNull();
    expect(row['niche_from_list']).toBe(false);
    expect(row['niche_description']).toBe('hand-poured concrete planters with pressed botanicals');
  });
});

describe('writeArchetypeStorefront — transactional A2', () => {
  it('inserts the tenant as draft, NOT active', async () => {
    await writeArchetypeStorefront({
      ...base,
      primaryNiche: 'candles',
      nicheFromList: true,
      nicheDescription: null,
    });

    const row = tenantInsert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row['status']).toBe('draft');
  });

  it('does NOT publish on its own — publishing is now a separate step (§1.9)', async () => {
    await writeArchetypeStorefront({
      ...base,
      primaryNiche: 'candles',
      nicheFromList: true,
      nicheDescription: null,
      products: [
        { name: 'Candle', slug: 'candle', shortDescription: 'a candle', description: 'a hand-poured candle', price: '$28', media: [{ url: 'https://x/y.jpg', kind: 'image', alt: 'a candle' }], status: 'active', variations: [] },
      ],
    });

    // Draft-only write — the caller runs publishArchetypeStorefront after any
    // additional draft-state writes (collections, etc.) land.
    expect(tenantUpdateEq).not.toHaveBeenCalled();
  });

  it('leaves the tenant in draft (no publish) when the home page insert fails', async () => {
    pageInsert.mockResolvedValue({ error: { message: 'simulated home page failure' } });

    await expect(
      writeArchetypeStorefront({
        ...base,
        primaryNiche: 'candles',
        nicheFromList: true,
        nicheDescription: null,
      }),
    ).rejects.toThrow(/home page insert failed/);

    // Tenant was written as draft.
    expect((tenantInsert.mock.calls[0]![0] as Record<string, unknown>)['status']).toBe('draft');
    // Publish flip was NEVER called — the orphan stays invisible to the resolver.
    expect(tenantUpdateEq).not.toHaveBeenCalled();
  });

  it('leaves the tenant in draft (no publish) when the listings insert fails', async () => {
    listingInsert.mockResolvedValue({ error: { message: 'simulated listings failure' } });

    await expect(
      writeArchetypeStorefront({
        ...base,
        primaryNiche: 'candles',
        nicheFromList: true,
        nicheDescription: null,
        products: [
          { name: 'Candle', slug: 'candle', shortDescription: 'a candle', description: 'a hand-poured candle', price: '$28', media: [{ url: 'https://x/y.jpg', kind: 'image', alt: 'a candle' }], status: 'active', variations: [] },
        ],
      }),
    ).rejects.toThrow(/listings insert failed/);

    expect((tenantInsert.mock.calls[0]![0] as Record<string, unknown>)['status']).toBe('draft');
    expect(tenantUpdateEq).not.toHaveBeenCalled();
  });

});

describe('publishArchetypeStorefront — the flip', () => {
  it('flips the given tenant to active', async () => {
    await publishArchetypeStorefront('tn_1');
    expect(tenantUpdateEq).toHaveBeenCalledTimes(1);
    const [patch, col, id] = tenantUpdateEq.mock.calls[0]!;
    expect(patch).toEqual({ status: 'active' });
    expect(col).toBe('id');
    expect(id).toBe('tn_1');
  });

  it('throws if the flip fails (so the caller can surface it)', async () => {
    tenantUpdateEq.mockResolvedValue({ error: { message: 'simulated publish failure' } });
    await expect(publishArchetypeStorefront('tn_1')).rejects.toThrow(/tenant publish.*failed/);
  });
});

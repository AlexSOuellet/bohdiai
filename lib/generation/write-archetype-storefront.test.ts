import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture what each table is asked to insert, so we can assert the tenant row's
// niche columns without a real database.
const tenantInsert = vi.fn();
const pageInsert = vi.fn();
const listingInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'tenants') return { insert: tenantInsert };
      if (table === 'content_pages') return { insert: pageInsert };
      if (table === 'listings') return { insert: listingInsert };
      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));

import { writeArchetypeStorefront } from './write-archetype-storefront';

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

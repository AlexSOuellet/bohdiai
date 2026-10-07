import { describe, it, expect } from 'vitest';
import type { ProductView } from '@/lib/archetypes/content';
import {
  homeBabies,
  lowestPrice,
  cardTint,
  bioParagraphs,
  visitDay,
  clotheslines,
  loadBoutiqueData,
} from './data';

const baby = (name: string, price: string, extra: Partial<ProductView> = {}): ProductView => ({
  slug: name.toLowerCase(),
  name,
  price,
  description: '',
  status: 'active',
  media: [],
  variations: [],
  ...extra,
});

describe('nursery helpers', () => {
  it('shows the owner’s home picks, or the first five when none are picked', () => {
    const all = Array.from({ length: 8 }, (_, i) => baby(`B${i}`, '$120'));
    expect(homeBabies(all).map((b) => b.name)).toEqual(['B0', 'B1', 'B2', 'B3', 'B4']);
    const picked = all.map((b, i) => (i === 2 || i === 6 ? { ...b, onHome: true } : b));
    expect(homeBabies(picked).map((b) => b.name)).toEqual(['B2', 'B6']);
  });

  it('finds the lowest price as the shop shows it, ignoring unpriced pieces', () => {
    expect(lowestPrice([baby('A', '$240'), baby('B', 'from $120'), baby('C', '$1,300')])).toBe(
      '$120',
    );
    expect(lowestPrice([baby('A', 'Sold out')])).toBeNull();
    expect(lowestPrice([])).toBeNull();
  });

  it('cycles the card colours so neighbours never match', () => {
    expect([0, 1, 2, 3, 4, -1].map(cardTint)).toEqual([
      'blush',
      'sage',
      'lilac',
      'sky',
      'blush',
      'sky',
    ]);
  });

  it('hangs the gallery in runs of four', () => {
    expect(clotheslines([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9]]);
    expect(clotheslines([])).toEqual([]);
  });

  it('splits a story into paragraphs', () => {
    expect(bioParagraphs('One.\n\n\nTwo.\n')).toEqual(['One.', 'Two.']);
    expect(bioParagraphs('')).toEqual([]);
  });

  it('says a market’s day for the visiting-hours sign', () => {
    expect(visitDay({ id: 'a', date: '2026-10-17', endDate: '', name: 'Fair', town: '' })).toEqual({
      weekday: 'Saturday',
      day: 'Oct 17',
    });
  });
});

/** A read-only stand-in for the tables the boutique reads. */
function fakeDb(opts: {
  tenant?: unknown;
  tenantError?: unknown;
  profile?: unknown;
  profileError?: unknown;
  features?: unknown[];
  events?: unknown[];
  gallery?: unknown[];
}) {
  const result = (table: string) => {
    if (table === 'tenants') return { data: opts.tenant ?? null, error: opts.tenantError ?? null };
    if (table === 'site_profiles')
      return { data: opts.profile ?? null, error: opts.profileError ?? null };
    if (table === 'tenant_features') return { data: opts.features ?? [], error: null };
    if (table === 'gallery_items') return { data: opts.gallery ?? [], error: null };
    return { data: opts.events ?? [], error: null };
  };
  return {
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        maybeSingle: async () => result(table),
        then: (resolve: (v: unknown) => void) => resolve(result(table)),
      };
      return chain;
    },
  } as never;
}

describe('loadBoutiqueData', () => {
  it('reads the name and About you, and the dates only when switched on', async () => {
    const events = [
      { id: 'd1', event_date: '2026-10-17', name: 'Art Festival', location: 'Scituate' },
    ];
    const profile = {
      kicker: 'Reborn artist',
      headline: null,
      about_title: null,
      bio: null,
      signature: 'Renee',
      phone: null,
      facebook_url: null,
      instagram_url: null,
    };
    const off = await loadBoutiqueData(
      fakeDb({ tenant: { business_name: 'Rose' }, profile, events }),
      't1',
    );
    expect(off).toMatchObject({ name: 'Rose', dates: [] });
    expect(off.profile.signature).toBe('Renee');
    const on = await loadBoutiqueData(
      fakeDb({
        tenant: { business_name: 'Rose' },
        events,
        features: [{ feature_key: 'market_dates', enabled: true }],
      }),
      't1',
    );
    expect(on.dates).toEqual([
      { id: 'd1', date: '2026-10-17', endDate: '', name: 'Art Festival', town: 'Scituate' },
    ]);
  });

  it('reads past babies only when the gallery is switched on', async () => {
    const gallery = [
      { id: 'g1', caption: 'Twins', position: 0, uploads: { public_url: 'https://cdn/g1.webp' } },
      { id: 'g2', caption: null, position: 1, uploads: null },
    ];
    const off = await loadBoutiqueData(fakeDb({ tenant: { business_name: 'R' }, gallery }), 't1');
    expect(off.gone).toEqual([]);
    const on = await loadBoutiqueData(
      fakeDb({
        tenant: { business_name: 'R' },
        gallery,
        features: [{ feature_key: 'gallery', enabled: true }],
      }),
      't1',
    );
    expect(on.gone).toEqual([{ id: 'g1', url: 'https://cdn/g1.webp', caption: 'Twins' }]);
  });

  it('fails loudly when the site can’t be read', async () => {
    await expect(
      loadBoutiqueData(fakeDb({ tenantError: { message: 'down' } }), 't1'),
    ).rejects.toThrow('Could not load the site: down');
    await expect(loadBoutiqueData(fakeDb({}), 't1')).rejects.toThrow('no such tenant');
    await expect(
      loadBoutiqueData(
        fakeDb({ tenant: { business_name: 'R' }, profileError: { message: 'nope' } }),
        't1',
      ),
    ).rejects.toThrow('Could not load About you: nope');
  });
});

describe('visitDay over several days', () => {
  it('reads a weekend as a range', () => {
    const v = visitDay({ id: 'x', date: '2026-10-10', endDate: '2026-10-12', name: 'Scituate Art Festival', town: 'Scituate' });
    expect(v.weekday).toBe('Saturday – Monday');
    expect(v.day.replace(/\s/g, ' ')).toBe('Oct 10 – 12');
  });
});

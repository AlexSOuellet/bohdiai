import { describe, it, expect } from 'vitest';
import { initials, ringText, bioParagraphs, marqueeWords, marqueeDateLine, marqueeFill, loadCardData } from './data';

describe('card name helpers', () => {
  it('takes up to three initials from the name’s words', () => {
    expect(initials('Rustic Rhody')).toBe('RR');
    expect(initials('Frank’s Fine Woodworking & Co')).toBe('FFW');
    expect(initials('frank')).toBe('F');
  });

  it('keeps the stamp’s ring short enough to go round once', () => {
    expect(ringText('Rustic Rhody', 'Handmade')).toBe('Rustic Rhody · Handmade · ');
    expect(ringText('Rustic Rhody', 'Handmade in Rhode Island since 2018').length).toBeLessThanOrEqual(34);
    expect(ringText('Frank', '')).toBe('Frank · Frank · ');
  });

  it('builds the marquee from the tag line and captions, each once', () => {
    expect(marqueeWords('Handmade', ['Flags', '', 'flags', 'Signs'])).toEqual(['Handmade', 'Flags', 'Signs']);
    expect(marqueeWords('', [])).toEqual([]);
  });

  it('says a market date the way the marquee does, leaving out a missing town', () => {
    expect(marqueeDateLine({ id: 'a', date: '2026-10-11', name: 'Wickford Art Festival', town: 'Wickford' })).toBe('Sun Oct 11 · Wickford Art Festival · Wickford');
    expect(marqueeDateLine({ id: 'b', date: '2026-11-01', name: 'Holiday Fair', town: '' })).toBe('Sun Nov 1 · Holiday Fair');
  });

  it('fills the quiet row with an even number of whole sets', () => {
    expect(marqueeFill(['A'])).toHaveLength(12);
    expect(marqueeFill(['A', 'B', 'C', 'D', 'E'])).toEqual(['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E']);
    expect(marqueeFill(Array.from({ length: 20 }, (_, i) => String(i)))).toHaveLength(40);
    expect(marqueeFill([])).toEqual([]);
  });

  it('splits the bio into paragraphs', () => {
    expect(bioParagraphs('One.\n\n\nTwo.\n')).toEqual(['One.', 'Two.']);
    expect(bioParagraphs('')).toEqual([]);
  });
});

/** A read-only stand-in for the tables the card reads. */
function fakeDb(opts: { tenant?: unknown; tenantError?: unknown; profile?: unknown; gallery?: unknown[]; features?: unknown[]; events?: unknown[] }) {
  const result = (table: string) => {
    if (table === 'tenants') return { data: opts.tenant ?? null, error: opts.tenantError ?? null };
    if (table === 'site_profiles') return { data: opts.profile ?? null, error: null };
    if (table === 'tenant_features') return { data: opts.features ?? [], error: null };
    if (table === 'events') return { data: opts.events ?? [], error: null };
    return { data: opts.gallery ?? [], error: null };
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

describe('loadCardData', () => {
  it('reads the name, About you and the gallery in order, skipping photos with no file', async () => {
    const data = await loadCardData(
      fakeDb({
        tenant: { business_name: 'Rustic Rhody' },
        profile: { kicker: 'Handmade', headline: null, about_title: null, bio: null, signature: null, phone: null, facebook_url: null, instagram_url: null },
        gallery: [
          { id: 'a', caption: 'Flag', position: 0, uploads: { public_url: 'https://cdn/a.webp' } },
          { id: 'b', caption: null, position: 1, uploads: null },
        ],
      }),
      't1',
    );
    expect(data.name).toBe('Rustic Rhody');
    expect(data.profile.kicker).toBe('Handmade');
    expect(data.photos).toEqual([{ id: 'a', url: 'https://cdn/a.webp', caption: 'Flag' }]);
  });

  it('reads the market dates only when the site has them switched on', async () => {
    const events = [{ id: 'd1', event_date: '2026-10-11', name: 'Wickford Art Festival', location: 'Wickford' }];
    const off = await loadCardData(fakeDb({ tenant: { business_name: 'R' }, events }), 't1');
    expect(off.dates).toEqual([]);
    const on = await loadCardData(fakeDb({ tenant: { business_name: 'R' }, events, features: [{ feature_key: 'market_dates', enabled: true }] }), 't1');
    expect(on.dates).toEqual([{ id: 'd1', date: '2026-10-11', name: 'Wickford Art Festival', town: 'Wickford' }]);
  });

  it('fails loudly when the site can’t be read', async () => {
    await expect(loadCardData(fakeDb({ tenantError: { message: 'down' } }), 't1')).rejects.toThrow('Could not load the site: down');
    await expect(loadCardData(fakeDb({}), 't1')).rejects.toThrow('no such tenant');
  });
});

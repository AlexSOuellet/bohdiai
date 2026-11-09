import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { FeatureKey } from '@/lib/backend/features';

const loadCatalog = vi.fn();
const listGallery = vi.fn();
vi.mock('./catalog', () => ({ loadCatalog: (...a: unknown[]) => loadCatalog(...a) }));
vi.mock('@/lib/backend/gallery/queries', () => ({ listGallery: (...a: unknown[]) => listGallery(...a) }));

import { buildSiteGallery, galleryEnabled, loadSiteGallery } from './site-gallery';

/** A catalog piece as it loads (oldest first), with one photo. */
const piece = (n: number, inGallery = false) => ({
  slug: `p${n}`,
  name: `Piece ${n}`,
  media: [{ kind: 'image' as const, url: `https://x/${n}.webp`, alt: '' }],
  ...(inGallery ? { inGallery: true } : {}),
});
const catalog = (n: number, ticked: number[] = []) => Array.from({ length: n }, (_, i) => piece(i + 1, ticked.includes(i + 1)));
const photo = (id: string) => ({ id, url: `https://x/${id}.webp`, caption: `Photo ${id}` });

describe('buildSiteGallery', () => {
  it('Showcase: the newest 12 when nothing is ticked, as photo and name', () => {
    const g = buildSiteGallery({ showcase: true, enabled: true, catalog: catalog(14), photos: [photo('a')] });
    expect(g).toHaveLength(12);
    expect(g[0]).toEqual({ key: 'p-p14', url: 'https://x/14.webp', alt: 'Piece 14', name: 'Piece 14' });
  });

  it('Showcase: only the ticked pieces, and never the loose photos', () => {
    const g = buildSiteGallery({ showcase: true, enabled: true, catalog: catalog(5, [2, 4]), photos: [photo('a')] });
    expect(g.map((x) => x.name)).toEqual(['Piece 4', 'Piece 2']);
  });

  it('Market and Full: nothing until switched on', () => {
    expect(buildSiteGallery({ showcase: false, enabled: false, catalog: catalog(3, [1]), photos: [photo('a')] })).toEqual([]);
  });

  it('Market and Full: every ticked piece (no limit), then their own photos', () => {
    const ticked = Array.from({ length: 15 }, (_, i) => i + 1);
    const g = buildSiteGallery({ showcase: false, enabled: true, catalog: catalog(15, ticked), photos: [photo('a'), photo('b')] });
    expect(g).toHaveLength(17);
    expect(g.slice(-2).map((x) => x.name)).toEqual(['Photo a', 'Photo b']);
  });

  it('leaves out a piece with no photo', () => {
    const bare = { slug: 'bare', name: 'Bare', media: [], inGallery: true };
    expect(buildSiteGallery({ showcase: false, enabled: true, catalog: [bare], photos: [] })).toEqual([]);
  });

  it('uses the first real photo, skipping a video or a photo with no address, and keeps its own description', () => {
    const mixed = {
      slug: 'mixed',
      name: 'Mixed',
      inGallery: true,
      media: [
        { kind: 'video' as const, url: 'https://x/clip.mp4', alt: 'clip' },
        { kind: 'image' as const, url: '', alt: 'empty' },
        { kind: 'image' as const, alt: 'no address' },
        { kind: 'image' as const, url: 'https://x/real.webp', alt: 'A dish on a shelf' },
      ],
    };
    expect(buildSiteGallery({ showcase: false, enabled: true, catalog: [mixed], photos: [] })).toEqual([
      { key: 'p-mixed', url: 'https://x/real.webp', alt: 'A dish on a shelf', name: 'Mixed' },
    ]);
  });

  it('Market and Full: a loose photo is named and described by its caption', () => {
    expect(buildSiteGallery({ showcase: false, enabled: true, catalog: [], photos: [photo('z')] })).toEqual([{ key: 'g-z', url: 'https://x/z.webp', alt: 'Photo z', name: 'Photo z' }]);
  });
});

/** The gallery switch row, as the database would answer; keeps what was asked. */
function switchDb(answer: { data: unknown; error: { message: string } | null }) {
  const eqs: unknown[][] = [];
  const from = vi.fn(() => {
    const chain = {
      select: () => chain,
      eq: (...a: unknown[]) => {
        eqs.push(a);
        return chain;
      },
      maybeSingle: () => Promise.resolve(answer),
    };
    return chain;
  });
  return { db: { from } as unknown as SupabaseClient<Database>, from, eqs };
}

describe('galleryEnabled', () => {
  it('reads this site’s gallery switch', async () => {
    const { db, from, eqs } = switchDb({ data: { enabled: true }, error: null });
    expect(await galleryEnabled(db, 't1')).toBe(true);
    expect(from).toHaveBeenCalledWith('site_added_sections');
    expect(eqs).toEqual([
      ['tenant_id', 't1'],
      ['section', 'gallery'],
    ]);
  });

  it('is off when switched off or never set', async () => {
    expect(await galleryEnabled(switchDb({ data: { enabled: false }, error: null }).db, 't1')).toBe(false);
    expect(await galleryEnabled(switchDb({ data: null, error: null }).db, 't1')).toBe(false);
  });

  it('says when the switch cannot be read', async () => {
    await expect(galleryEnabled(switchDb({ data: null, error: { message: 'offline' } }).db, 't1')).rejects.toThrow('Could not read the gallery switch: offline');
  });
});

describe('loadSiteGallery', () => {
  beforeEach(() => {
    loadCatalog.mockReset().mockResolvedValue({ products: catalog(3, [1]) });
    listGallery.mockReset().mockResolvedValue([photo('a')]);
  });

  it('Showcase: always on, from the catalog only, without reading the switch or the loose photos', async () => {
    const { db, from } = switchDb({ data: null, error: null });
    const g = await loadSiteGallery(db, 't1', new Set<FeatureKey>(['gallery_pieces']));
    expect(g.map((x) => x.name)).toEqual(['Piece 1']);
    expect(from).not.toHaveBeenCalled();
    expect(listGallery).not.toHaveBeenCalled();
    expect(loadCatalog).toHaveBeenCalledWith(db, 't1');
  });

  it('Market and Full: nothing, and nothing read, while switched off', async () => {
    const { db } = switchDb({ data: { enabled: false }, error: null });
    expect(await loadSiteGallery(db, 't1', new Set<FeatureKey>())).toEqual([]);
    expect(loadCatalog).not.toHaveBeenCalled();
    expect(listGallery).not.toHaveBeenCalled();
  });

  it('Market and Full: the ticked pieces then the loose photos once switched on', async () => {
    const { db } = switchDb({ data: { enabled: true }, error: null });
    const g = await loadSiteGallery(db, 't1', new Set<FeatureKey>());
    expect(g.map((x) => x.key)).toEqual(['p-p1', 'g-a']);
    expect(listGallery).toHaveBeenCalledWith(db, 't1');
  });
});

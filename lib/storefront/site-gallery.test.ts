import { describe, expect, it } from 'vitest';
import { buildSiteGallery } from './site-gallery';

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
});

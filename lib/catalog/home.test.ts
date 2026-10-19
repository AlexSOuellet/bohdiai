import { describe, expect, it } from 'vitest';
import { GALLERY_MAX, showcaseGallery } from './home';

/** A catalog as it loads: oldest first. */
const catalog = (n: number, picked: number[] = []) =>
  Array.from({ length: n }, (_, i) => ({ slug: `p${i + 1}`, ...(picked.includes(i + 1) ? { inGallery: true } : {}) }));

describe('showcaseGallery', () => {
  it('with nothing picked, shows the newest pieces, newest first, at most 12', () => {
    const shown = showcaseGallery(catalog(15));
    expect(shown).toHaveLength(GALLERY_MAX);
    expect(shown[0]?.slug).toBe('p15');
    expect(shown.at(-1)?.slug).toBe('p4');
  });

  it('with pieces picked, shows only those, newest first', () => {
    expect(showcaseGallery(catalog(15, [2, 9, 4])).map((p) => p.slug)).toEqual(['p9', 'p4', 'p2']);
  });

  it('shows a small catalog whole, and nothing when there is nothing', () => {
    expect(showcaseGallery(catalog(5))).toHaveLength(5);
    expect(showcaseGallery([])).toEqual([]);
  });
});

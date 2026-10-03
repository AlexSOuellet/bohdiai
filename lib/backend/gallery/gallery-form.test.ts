import { describe, it, expect } from 'vitest';
import { buildGalleryOrder, moveGalleryItem, GALLERY_LIMIT } from './gallery-form';
import { galleryHomeData } from './home';

const ids = new Set(['a', 'b', 'c']);

describe('buildGalleryOrder', () => {
  it('numbers photos in the order given and tidies captions', () => {
    expect(buildGalleryOrder([{ id: 'c', caption: '  Walnut   table ' }, { id: 'a', caption: '' }], ids)).toEqual({
      ok: true,
      rows: [
        { id: 'c', caption: 'Walnut table', position: 0 },
        { id: 'a', caption: null, position: 1 },
      ],
    });
  });

  it('refuses a photo that is no longer in the gallery, or one listed twice', () => {
    const changed = { ok: false, error: 'Your gallery changed somewhere else. Refresh the page and try again.' };
    expect(buildGalleryOrder([{ id: 'zzz', caption: '' }], ids)).toEqual(changed);
    expect(buildGalleryOrder([{ id: 'a', caption: '' }, { id: 'a', caption: '' }], ids)).toEqual(changed);
  });

  it('names the photo whose caption is too long', () => {
    expect(buildGalleryOrder([{ id: 'a', caption: '' }, { id: 'b', caption: 'x'.repeat(81) }], ids)).toEqual({
      ok: false,
      error: 'Photo 2’s caption is 81 characters. Keep it to 80.',
    });
  });
});

describe('moveGalleryItem', () => {
  it('moves an item and leaves out-of-range moves alone', () => {
    expect(moveGalleryItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveGalleryItem(['a', 'b', 'c'], 0, 3)).toEqual(['a', 'b', 'c']);
  });
});

describe('galleryHomeData', () => {
  it('shows how full the gallery is and flags an empty one', () => {
    expect(galleryHomeData([])).toEqual({
      tiles: [{ label: 'Gallery', value: '0', note: `of ${GALLERY_LIMIT} photos` }],
      attention: ['Your gallery is empty. Add photos of your work.'],
    });
    expect(galleryHomeData([{ id: 'a', url: 'u', caption: '' }]).attention).toEqual([]);
  });
});

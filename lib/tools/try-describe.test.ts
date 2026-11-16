import { describe, it, expect } from 'vitest';
import { PHOTO_MAX, parseTryDescribe } from './try-describe';

describe('parseTryDescribe (the try-the-tools page, Alex 2026-11-15)', () => {
  it('takes the piece, what it’s made of, the facts, a price and a photo', () => {
    expect(parseTryDescribe({ name: ' Mug ', madeOf: 'stoneware\n\nglaze', facts: 'holds 12 oz', price: '24', photo: 'data:image/jpeg;base64,QUJD' })).toEqual({
      kind: 'ok',
      input: { name: 'Mug', materials: ['stoneware', 'glaze'], facts: 'holds 12 oz', priceCents: 2400, photoUrl: null, photoData: { mediaType: 'image/jpeg', data: 'QUJD' } },
    });
  });
  it('works with no photo and no price', () => {
    expect(parseTryDescribe({ name: 'Mug' })).toMatchObject({ kind: 'ok', input: { photoData: null, priceCents: null, materials: [] } });
  });
  it.each([
    [{}, 'Give the piece a name first.'],
    [{ name: 'x'.repeat(121) }, 'Keep the name shorter.'],
    [{ name: 'Mug', facts: 'x'.repeat(501) }, 'Keep what you add to 500 characters or fewer.'],
    [{ name: 'Mug', photo: 'https://example.com/a.jpg' }, 'That photo couldn’t be read. Try a JPG or PNG.'],
    [{ name: 'Mug', photo: 'data:image/gif;base64,QUJD' }, 'That photo couldn’t be read. Try a JPG or PNG.'],
    [{ name: 'Mug', photo: `data:image/jpeg;base64,${'A'.repeat(PHOTO_MAX)}` }, 'That photo is too big. Try a smaller one.'],
    ['nope', 'That didn’t come through. Please try again.'],
  ])('refuses %o', (body, error) => {
    expect(parseTryDescribe(body)).toEqual({ kind: 'invalid', error });
  });
});

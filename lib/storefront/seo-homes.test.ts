import { describe, it, expect } from 'vitest';
import { seoFromHomes, withHomesSeo } from './seo-homes';

const photo = (url: string) => ({ url, mime: 'image/webp' });

describe('seoFromHomes', () => {
  it('takes the short line, the line under the name, what they make, and the opening photo', () => {
    expect(
      seoFromHomes({ momentKicker: ' Hand-poured ', momentSub: 'Candles for dark rooms', makes: ['Candles', 'Wax melts'], pictures: [photo('open.webp'), photo('extra.webp'), photo('piece.webp')] }),
    ).toEqual({ tagline: 'Hand-poured', seoDescription: 'Candles for dark rooms', nicheLabel: 'Candles', imageUrl: 'open.webp' });
  });

  it('a video opening has no still: the next photo is used', () => {
    expect(seoFromHomes({ momentKicker: null, momentSub: null, makes: null, pictures: [{ url: 'clip.mp4', mime: 'video/mp4' }, null, photo('piece.webp')] }).imageUrl).toBe('piece.webp');
  });

  it('nothing in the homes gives nothing', () => {
    expect(seoFromHomes({ momentKicker: ' ', momentSub: '', makes: [], pictures: [null, null, null] })).toEqual({ tagline: undefined, seoDescription: undefined, nicheLabel: undefined, imageUrl: undefined });
  });
});

describe('withHomesSeo', () => {
  it('the page record’s own details win; the homes fill the rest', () => {
    const facts = { shopName: 'Aurora', subdomain: 'aurora', seoDescription: 'Written for search', nicheLabel: undefined, tagline: undefined, imageUrl: undefined };
    expect(withHomesSeo(facts, { tagline: 'Hand-poured', seoDescription: 'From About you', nicheLabel: 'Candles', imageUrl: 'open.webp' })).toEqual({
      shopName: 'Aurora',
      subdomain: 'aurora',
      seoDescription: 'Written for search',
      tagline: 'Hand-poured',
      nicheLabel: 'Candles',
      imageUrl: 'open.webp',
    });
  });
});

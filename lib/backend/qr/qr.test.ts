import { describe, it, expect } from 'vitest';
import { qrFileName, qrTargets } from './qr';

const O = 'https://rose-n-cat.bohdiai.com';

describe('qrTargets', () => {
  it('offers home, shop and each live product', () => {
    expect(qrTargets(O, { shop: true, products: [{ slug: 'theo', name: 'Theo' }] })).toEqual([
      { key: 'home', label: 'Your home page', url: `${O}/` },
      { key: 'shop', label: 'Your shop page', url: `${O}/shop` },
      { key: 'p:theo', label: 'Theo', url: `${O}/listings/theo` },
    ]);
  });
  it('offers only home for a site that does not sell', () => {
    expect(qrTargets(O, { shop: false, products: [] }).map((t) => t.key)).toEqual(['home']);
  });
});

describe('qrFileName', () => {
  it('says what the code opens', () => {
    const [home, , theo] = qrTargets(O, { shop: true, products: [{ slug: 'theo', name: 'Theo' }] });
    expect(qrFileName('rose-n-cat', home!, 'png')).toBe('rose-n-cat-qr.png');
    expect(qrFileName('rose-n-cat', theo!, 'svg')).toBe('rose-n-cat-qr-theo.svg');
  });
});

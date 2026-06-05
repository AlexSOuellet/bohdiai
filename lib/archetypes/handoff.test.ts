import { describe, it, expect } from 'vitest';
import { GALLERY_SPEC } from './gallery/builder';
import { MAIN_STREET_SPEC } from './main-street/builder';

const galleryContent = {
  shopName: "Abigail's Custom Creations",
  identity: { wordmark: "Abigail's Custom Creations", tagline: 'Yarn worked by hand', nav: ['Shop', 'About'] },
  wall: {
    products: [
      { name: 'Ripple Throw Blanket', price: '$148', photo: { prompt: 'a blanket', alt: 'blanket', url: 'http://x/1.jpg' } },
      { name: 'Classic Beanie', price: 'from $34', photo: { prompt: 'a beanie', alt: 'beanie' } },
    ],
  },
  maker: {
    label: 'The Maker',
    headline: 'One hook one skein',
    body: 'I crochet from a small home studio.',
    photo: { prompt: 'maker', alt: 'maker', url: 'http://x/maker.jpg' },
    ctaLabel: 'Shop',
  },
  footer: { blurb: 'Made to order', columns: [{ title: 'Shop', items: ['All'] }, { title: 'More', items: ['About'] }] },
};

describe('Gallery.handOff', () => {
  it('lifts wordmark, tagline, maker, and products with photos out of the wall', () => {
    const p = GALLERY_SPEC.handOff!(galleryContent as never);
    expect(p.wordmark).toBe("Abigail's Custom Creations");
    expect(p.tagline).toBe('Yarn worked by hand');
    expect(p.maker.photoUrl).toBe('http://x/maker.jpg');
    expect(p.products).toHaveLength(2);
    expect(p.products[0]).toMatchObject({ name: 'Ripple Throw Blanket', price: '$148', photoUrl: 'http://x/1.jpg' });
    expect(p.products[1]!.photoUrl ?? null).toBeNull();
  });
});

describe('Main Street.handOff', () => {
  it('exposes handOff', () => {
    expect(typeof MAIN_STREET_SPEC.handOff).toBe('function');
  });
});

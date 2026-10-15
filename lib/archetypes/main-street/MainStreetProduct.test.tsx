import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';

import { MainStreetProduct } from './MainStreetProduct';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import { CART_COOKIE } from '@/lib/storefront/cart';

/** Test words: every spot says its own key. */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const content: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row' },
  moment: {
    media: { kind: 'still', prompt: { composition: 'b', subject: 's', environment: 'e', atmosphere: 'a', camera: 'c', lighting: 'l', style: 'p' }, alt: 'x' },
    story: ['cut by hand', 'stitched to last'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench', label: 'The work' },
  founder: { quote: 'I make one good belt rather than ten that do not last at all here.', attribution: 'Sam', photo: { prompt: 'maker', alt: 'maker' } },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
};

/** A shop that sells online (Full: the cart switch on). */
const full: MainStreetContent = { ...content, identity: { ...content.identity, sellsOnline: true } };

afterEach(cleanup);

describe('MainStreetProduct media gallery', () => {
  it('renders multiple photos — a primary image plus the rest', () => {
    const product: ProductView = {
      slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active',
      media: [
        { kind: 'image', url: 'https://cdn/1.jpg', alt: 'front' },
        { kind: 'image', url: 'https://cdn/2.jpg', alt: 'side' },
        { kind: 'image', url: 'https://cdn/3.jpg', alt: 'detail' },
      ],
      variations: [],
    };
    const { container } = render(<MainStreetProduct words={W} content={full} skin={skin} product={product} />);
    expect(container.querySelectorAll('img').length).toBe(3);
  });

  it('renders a product video as a playable <video> with controls, not a static poster', () => {
    const product: ProductView = {
      slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active',
      media: [{ kind: 'video', url: 'https://cdn/clip.mp4', poster: 'https://cdn/poster.jpg', alt: 'demo' }],
      variations: [],
    };
    const { container } = render(<MainStreetProduct words={W} content={content} skin={skin} product={product} />);
    const video = container.querySelector('video') as HTMLVideoElement | null;
    expect(video?.getAttribute('src')).toBe('https://cdn/clip.mp4');
    expect(video?.getAttribute('poster')).toBe('https://cdn/poster.jpg');
    expect(video?.hasAttribute('controls')).toBe(true);
    expect(container.querySelector('img')).toBeNull(); // the clip is a real player, not an <img> poster
  });
});

describe('MainStreetProduct options and stock', () => {
  const base: ProductView = {
    slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active', media: [], variations: [],
  };
  it('shows the option picker for a product with options', () => {
    render(
      <MainStreetProduct words={W}
        content={content}
        skin={skin}
        product={{ ...base, variations: [{ name: 'Size', options: ['Small'] }], offers: [{ choices: { Size: 'Small' }, price: '$24', soldOut: false }] }}
      />,
    );
    expect(screen.getByLabelText('Size')).toBeInTheDocument();
  });
  it('disables buying a sold-out product without options', () => {
    render(<MainStreetProduct words={W} content={full} skin={skin} product={{ ...base, status: 'sold_out' }} />);
    expect(screen.getByRole('button', { name: W.productSoldOut })).toBeDisabled();
  });
  it('asks about a piece with options on Full too (the cart cannot pick options yet)', () => {
    render(
      <MainStreetProduct words={W}
        content={full}
        skin={skin}
        product={{ ...base, id: 'l1', variations: [{ name: 'Size', options: ['Small'] }], offers: [{ choices: { Size: 'Small' }, price: '$24', soldOut: false }] }}
      />,
    );
    expect(screen.queryByRole('button', { name: W.productAddToCart })).toBeNull();
  });
});

describe('a shop that sells online (Full)', () => {
  const product: ProductView = { slug: 'belt', id: 'l1', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active', media: [], variations: [] };

  it('adds the piece to the cart, and the menu has the cart', () => {
    const { container } = render(<MainStreetProduct words={W} content={full} skin={skin} product={product} />);
    const add = screen.getByRole('button', { name: W.productAddToCart });
    expect(add.getAttribute('data-type')).toBe('navLabel');
    expect(container.querySelector('a[href="/cart"]')?.textContent).toBe(W.navCart);
  });

  it('the menu’s cart shows how many pieces it holds', () => {
    document.cookie = `${CART_COOKIE}=4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69.5c9f1f6e-9f4b-4b68-8a9f-2f3d4c5b6a70; Path=/`;
    const { container } = render(<MainStreetProduct words={{ ...W, cart: { ...W.cart, navCount: 'Cart ({n})' } }} content={full} skin={skin} product={product} />);
    expect(container.querySelector('a[href="/cart"]')?.textContent).toBe('Cart (2)');
    document.cookie = `${CART_COOKIE}=; Path=/; Max-Age=0`;
  });

  it('shows a running sale beside the struck full price', () => {
    const { container } = render(<MainStreetProduct words={W} content={full} skin={skin} product={{ ...product, salePrice: '$78' }} />);
    expect(container.querySelector('.ms-product-price')?.textContent).toBe(`${W.cart.was} $98 $78`);
  });

  it('asks about a piece with no price yet', () => {
    render(<MainStreetProduct words={W} content={full} skin={skin} product={{ ...product, price: '', askForPrice: true }} />);
    expect(screen.getByRole('link', { name: W.productAskAbout }).getAttribute('href')).toBe('/contact');
  });
});

describe('a shop that does not sell online (Maker Market)', () => {
  const lite: MainStreetContent = { ...content, identity: { ...content.identity, sellsOnline: false } };
  const product: ProductView = {
    slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active',
    media: [
      { kind: 'image', url: 'https://cdn/1.jpg', alt: 'front' },
      { kind: 'image', url: 'https://cdn/2.jpg', alt: 'side' },
    ],
    variations: [],
  };

  it('asks instead of selling, shows one photo, and has no cart in the menu', () => {
    const { container } = render(<MainStreetProduct words={W} content={lite} skin={skin} product={product} />);
    expect(screen.getByRole('link', { name: W.productAskAbout }).getAttribute('href')).toBe('/contact');
    expect(screen.queryByRole('button', { name: W.productAddToCart })).toBeNull();
    expect(container.querySelectorAll('img').length).toBe(1);
    expect(container.querySelector('a[href="/cart"]')).toBeNull();
  });

  it('asks too when the switch is absent: only Full sells online', () => {
    const { container } = render(<MainStreetProduct words={W} content={content} skin={skin} product={product} />);
    expect(screen.getByRole('link', { name: W.productAskAbout })).toBeTruthy();
    expect(screen.queryByRole('button', { name: W.productAddToCart })).toBeNull();
    expect(container.querySelector('a[href="/cart"]')).toBeNull();
  });
});

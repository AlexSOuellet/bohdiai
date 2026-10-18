import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsMarquee, Close } from './beats';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** Test words: every spot says its own key. */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const products: ProductView[] = [
  {
    slug: 'country',
    name: 'Country sourdough',
    price: '$9',
    description: '',
    shortDescription: '48-hour cold ferment',
    status: 'active',
    media: [{ kind: 'image', url: '/x.webp', alt: 'loaf' }],
    variations: [],
  },
];
afterEach(cleanup);

describe('GoodsMarquee', () => {
  it('renders the heading and at least one card per product (duplicated for the loop)', () => {
    const { container, getByText } = render(
      <GoodsMarquee words={W} goods={{ title: 'Pulled from the oven' }} products={products} skin={skin} />,
    );
    expect(getByText('Pulled from the oven')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThanOrEqual(products.length);
  });
});

describe('Close', () => {
  it('renders the close headline and CTA', () => {
    const { getByText } = render(
      <Close close={{ label: 'Come say hello', headline: 'Warm bread by seven', ctaLabel: 'Order for pickup', ctaTarget: 'contact' }} skin={skin} />,
    );
    expect(getByText('Warm bread by seven')).toBeTruthy();
    expect(getByText('Order for pickup')).toBeTruthy();
  });

  it('sends the close CTA where its label says it goes (D46)', () => {
    const { getByText } = render(
      <Close close={{ label: 'Browse', headline: 'See the whole shelf', ctaLabel: 'Shop now', ctaTarget: 'shop' }} skin={skin} />,
    );
    expect(getByText('Shop now').closest('a')?.getAttribute('href')).toBe('/shop');
  });

  it('shows no close button when it has no target (never a guessed page)', () => {
    const { queryByText, getByText } = render(
      <Close close={{ label: 'Come say hello', headline: 'Warm bread by seven', ctaLabel: 'Order for pickup' }} skin={skin} />,
    );
    expect(getByText('Warm bread by seven')).toBeTruthy();
    expect(queryByText('Order for pickup')).toBeNull();
  });
});

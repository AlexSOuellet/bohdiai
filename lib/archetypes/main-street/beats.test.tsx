import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsMarquee, Close } from './beats';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

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
      <GoodsMarquee goods={{ title: 'Pulled from the oven' }} products={products} skin={skin} />,
    );
    expect(getByText('Pulled from the oven')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThanOrEqual(products.length);
  });
});

describe('Close', () => {
  it('renders the close headline and CTA', () => {
    const { getByText } = render(
      <Close close={{ label: 'Come say hello', headline: 'Warm bread by seven', ctaLabel: 'Order for pickup' }} skin={skin} />,
    );
    expect(getByText('Warm bread by seven')).toBeTruthy();
    expect(getByText('Order for pickup')).toBeTruthy();
  });
});

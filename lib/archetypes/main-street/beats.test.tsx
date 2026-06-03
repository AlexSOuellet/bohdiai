import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsMarquee, FounderCalendar, Close } from './beats';
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

describe('FounderCalendar', () => {
  it('renders the quote, attribution, and find-us rows on the contrast surface', () => {
    const founder = {
      quote: 'I started with one cast-iron oven and a starter named Frank',
      attribution: 'June Carter, founder and baker',
      photo: { prompt: 'baker in a kitchen', alt: 'June' },
      findUs: { label: 'Find us this week', rows: [{ day: 'Sat', where: 'Downtown Market', time: '9-2' }] },
    };
    const { getByText, container } = render(<FounderCalendar founder={founder} skin={skin} />);
    expect(getByText(/cast-iron oven/)).toBeTruthy();
    expect(getByText('Downtown Market')).toBeTruthy();
    const band = container.querySelector('[data-ms-founder]') as HTMLElement;
    expect(band.style.background).toContain('--ms-contrast-bg');
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

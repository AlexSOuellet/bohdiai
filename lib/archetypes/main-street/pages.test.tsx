import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ShopPage, EventsPage } from './pages';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const content: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    media: { kind: 'image', prompt: { composition: 'b', subject: 's', environment: 'e', atmosphere: 'a', camera: 'c', lighting: 'l', style: 'p' }, alt: 'x' },
    story: ['cut by hand', 'stitched to last'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench', label: 'The work' },
  founder: { quote: 'I make one good belt rather than ten that do not last at all here.', attribution: 'Sam', photo: { prompt: 'maker', alt: 'maker' } },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
};

const products: ProductView[] = [
  { slug: 'belt', name: 'The Belt', price: '$98', shortDescription: 'Full-grain', description: 'A belt.', status: 'active', media: [], variations: [] },
  { slug: 'wallet', name: 'The Wallet', price: '$68', description: 'A wallet.', status: 'active', media: [], variations: [] },
];

afterEach(cleanup);

describe('ShopPage', () => {
  it('lists every product with a link to its detail page', () => {
    const { getByText, container } = render(<ShopPage content={content} skin={skin} products={products} />);
    expect(getByText('The Belt')).toBeTruthy();
    expect(getByText('The Wallet')).toBeTruthy();
    expect(container.querySelector('a[href="/belt"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-shop]')).toBeTruthy();
  });

  it('shows an empty state when there are no products', () => {
    const { container } = render(<ShopPage content={content} skin={skin} products={[]} />);
    expect(container.querySelector('[data-ms-shop]')?.textContent).toMatch(/check back/i);
  });

  it('renders the shared sub-page nav with real routes', () => {
    const { container } = render(<ShopPage content={content} skin={skin} products={products} />);
    expect(container.querySelector('a[href="/events"]')).toBeTruthy();
    expect(container.querySelector('a[href="/cart"]')).toBeTruthy();
  });
});

describe('EventsPage', () => {
  it('renders the dates when the maker has them', () => {
    const withDates: MainStreetContent = { ...content, founder: { ...content.founder, findUs: { label: 'Find us', rows: [{ day: 'Sat', where: 'Hope St Market', time: '9am' }] } } };
    const { getByText } = render(<EventsPage content={withDates} skin={skin} />);
    expect(getByText('Hope St Market')).toBeTruthy();
  });

  it('shows a check-back empty state with no dates', () => {
    const { container } = render(<EventsPage content={content} skin={skin} />);
    expect(container.querySelector('[data-ms-events]')?.textContent).toMatch(/check back/i);
  });
});

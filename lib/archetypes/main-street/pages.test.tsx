import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ShopPage, EventsPage, AboutPage, ContactPage } from './pages';
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
    expect(container.querySelector('a[href="/listings/belt"]')).toBeTruthy();
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

describe('AboutPage', () => {
  it('renders the authored story paragraphs and heading', () => {
    const withAbout: MainStreetContent = { ...content, about: { heading: 'How Tannery Row began', story: ['I learned to stitch leather from my grandfather in his garage workshop over many summers.', 'Today every belt is cut from a single full-grain hide and saddle-stitched by hand.'] } };
    const { getByText, container } = render(<AboutPage content={withAbout} skin={skin} />);
    expect(getByText('How Tannery Row began')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-story]').length).toBe(2);
  });

  it('falls back to the founder quote when no about story was authored', () => {
    const { container } = render(<AboutPage content={content} skin={skin} />);
    expect(container.querySelector('[data-ms-about]')?.textContent).toMatch(/one good belt/);
  });
});

describe('ContactPage', () => {
  it('renders the authored intro', () => {
    const withContact: MainStreetContent = { ...content, contact: { heading: 'Say hello', intro: 'Reach out about a custom belt or a repair and we will write back within a day.' } };
    const { getByText } = render(<ContactPage content={withContact} skin={skin} />);
    expect(getByText('Say hello')).toBeTruthy();
    expect(getByText(/custom belt/)).toBeTruthy();
  });

  it('shows a neutral invitation when none was authored', () => {
    const { container } = render(<ContactPage content={content} skin={skin} />);
    expect(container.querySelector('[data-ms-contact]')?.textContent).toMatch(/hear from you|get in touch/i);
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

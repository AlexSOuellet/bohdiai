import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import type { ProductView } from '@/lib/archetypes/content';
import { ShorelineCart, ShorelineProduct, ShorelineSite, type ShorelinePage } from './ShorelinePages';
import { featuredProducts, type ShorelineData } from './shoreline-data';
import { CARD_STRINGS as S } from './strings';

// The cart's remove button and code box refresh the page through the router.
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), notFound: vi.fn() }));

const TENANT = '1b54cb24-c467-4327-ae66-f9857a71a854';
const W = S.shoreline;

function product(slug: string, over: Pick<ProductView, never> & { askForPrice?: true; price?: string; onHome?: boolean } = {}): ProductView {
  return { slug, name: slug.replace(/-/g, ' '), price: '$28', status: 'active', description: 'First part.\n\nSecond part.', media: [{ kind: 'image', url: `https://cdn/${slug}.jpg`, alt: '' }], variations: [], ...over };
}

const site: ShorelineData = {
  card: {
    name: 'Saltmarsh & Lace',
    profile: { ...EMPTY_PROFILE, kicker: 'Decoupage from Bristol', headline: 'Sealed to last', aboutTitle: 'From the paint counter', bio: 'I run the paint counter.\n\nEvery sealer gets tested.', signature: 'Lena', facebookUrl: 'https://www.facebook.com/bohdiai', makes: ['Art bottles'] },
    photos: [],
    dates: [
      { id: 'd1', date: '2026-10-24', endDate: '', hours: '10am – 4pm', address: '2 Main St, Bristol', booth: '12', url: 'https://fair.example', canceled: false, name: 'Harvest Fair', town: 'Bristol' },
      { id: 'd2', date: '2026-11-14', endDate: '', hours: '', address: '', booth: '', url: '', canceled: true, name: 'Makers Market', town: 'Warren' },
    ],
  },
  pages: true,
  products: [product('cabbage-rose-oyster-dish', { askForPrice: true, price: '' }), product('old-saint-nick', { onHome: true, price: '$22' })],
  marketDetails: true,
  allPhotos: true,
  cart: false,
};

afterEach(cleanup);

function page(which: ShorelinePage, data: ShorelineData = site) {
  return render(<ShorelineSite site={data} page={which} tenantId={TENANT} />);
}

describe('shoreline pages (Lite and Full)', () => {
  it('keeps the bay behind every page and puts the menu at the top, marking where you are', () => {
    const { container } = page('shop');
    expect(container.querySelector('.sl-sea')).not.toBeNull();
    const nav = screen.getByRole('navigation', { name: W.nav.label });
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/', '/shop', '/about', '/events', '/contact']);
    expect(within(nav).getByRole('link', { name: W.nav.shop }).getAttribute('aria-current')).toBe('page');
  });

  it('opens the home on the sky, with featured pieces, a story teaser, the next markets and a way to write', () => {
    page('home');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Saltmarsh & Lace');
    expect(screen.getByRole('heading', { name: W.featured })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /old saint nick/i })[0]?.getAttribute('href')).toBe('/listings/old-saint-nick');
    expect(screen.queryByText('Every sealer gets tested.')).toBeNull();
    expect(screen.getByRole('link', { name: W.readStory }).getAttribute('href')).toBe('/about');
    expect(screen.getByRole('link', { name: W.allMarkets }).getAttribute('href')).toBe('/events');
    expect(screen.getByRole('link', { name: W.writeCta('Lena') }).getAttribute('href')).toBe('/contact');
  });

  it('shows every product in the shop with its price, or “Ask for price” when it has none', () => {
    const { container } = page('shop');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(W.featured);
    expect(container.querySelectorAll('.sl-prints li')).toHaveLength(2);
    expect(screen.getByText(W.askForPrice)).toBeTruthy();
    expect(screen.getByText('$22')).toBeTruthy();
    cleanup();
    page('shop', { ...site, products: [] });
    expect(screen.getByText(W.emptyShop)).toBeTruthy();
  });

  it('tells the whole story on About', () => {
    page('about');
    expect(screen.getByText('Every sealer gets tested.')).toBeTruthy();
    expect(screen.getByText('— Lena')).toBeTruthy();
    expect(within(screen.getByRole('main')).getByRole('link', { name: S.touch.facebook })).toBeTruthy();
  });

  it('lists every market with its details, directions and website, and marks a canceled one', () => {
    const { container } = page('events');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(W.pageTitles.markets);
    expect(screen.getByText('10am – 4pm')).toBeTruthy();
    expect(screen.getByText(`${W.marketCols.booth} 12`)).toBeTruthy();
    expect(screen.getByRole('link', { name: W.directions }).getAttribute('href')).toContain(encodeURIComponent('2 Main St, Bristol'));
    expect(screen.getByRole('link', { name: W.marketLink }).getAttribute('href')).toBe('https://fair.example');
    expect(container.querySelector('.sl-market--gone h2')?.textContent).toBe('Makers Market (Canceled)');
  });

  it('leaves the market details out below Lite, and says so when there are no markets', () => {
    page('events', { ...site, marketDetails: false });
    expect(screen.queryByText('10am – 4pm')).toBeNull();
    expect(screen.queryByRole('link', { name: W.directions })).toBeNull();
    cleanup();
    page('events', { ...site, card: { ...site.card, dates: [] } });
    expect(screen.getByText(W.emptyMarkets)).toBeTruthy();
  });

  it('puts the letter on Contact', () => {
    const { container } = page('contact');
    expect(screen.getByRole('heading', { name: W.touch('Lena') })).toBeTruthy();
    expect(container.querySelector('#write form')).not.toBeNull();
  });
});

describe('a product page', () => {
  it('shows the photo, “Ask for price”, the story, and starts the letter with the product’s name', () => {
    render(<ShorelineProduct site={site} product={site.products[0]!} tenantId={TENANT} />);
    expect(screen.getByRole('heading', { level: 2, name: 'cabbage rose oyster dish' })).toBeTruthy();
    expect(screen.getByText(W.askForPrice)).toBeTruthy();
    expect(screen.getByText('Second part.')).toBeTruthy();
    expect(screen.getByRole('link', { name: new RegExp(W.backToShop) }).getAttribute('href')).toBe('/shop');
    expect((screen.getByRole('textbox', { name: S.form.message }) as HTMLTextAreaElement).value).toBe(W.askMessage('cabbage rose oyster dish'));
    fireEvent.click(screen.getByRole('button', { name: S.work.open('cabbage rose oyster dish', 1) }));
    expect(screen.getByRole('dialog', { name: S.lightbox.label })).toBeTruthy();
  });

  it('shows the price when it has one', () => {
    render(<ShorelineProduct site={site} product={site.products[1]!} tenantId={TENANT} />);
    expect(screen.getByText('$22')).toBeTruthy();
    expect(screen.queryByText(W.askForPrice)).toBeNull();
  });
});

describe('featured pieces', () => {
  it('uses the ones marked for the home page, else the first five', () => {
    expect(featuredProducts(site.products).map((p) => p.slug)).toEqual(['old-saint-nick']);
    const many = Array.from({ length: 9 }, (_, i) => product(`p${i}`));
    expect(featuredProducts(many)).toHaveLength(5);
  });
});

describe('the footer', () => {
  it('shows her social links as icons, only the ones she set', () => {
    page('home');
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('link', { name: S.touch.facebook }).getAttribute('href')).toBe('https://www.facebook.com/bohdiai');
    expect(within(foot).queryByRole('link', { name: S.touch.instagram })).toBeNull();
    cleanup();
    page('home', { ...site, card: { ...site.card, profile: { ...site.card.profile, facebookUrl: '', instagramUrl: 'https://www.instagram.com/x' } } });
    const foot2 = screen.getByRole('contentinfo');
    expect(within(foot2).queryByRole('link', { name: S.touch.facebook })).toBeNull();
    expect(within(foot2).getByRole('link', { name: S.touch.instagram })).toBeTruthy();
  });

  it('leaves the icons out when she has none', () => {
    const { container } = page('home', { ...site, card: { ...site.card, profile: { ...site.card.profile, facebookUrl: '', instagramUrl: '' } } });
    expect(container.querySelector('.sl-social')).toBeNull();
  });

  it('has a quiet Owner login that goes to sign-in', () => {
    page('home');
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: S.footer.ownerLogin }).getAttribute('href')).toBe('/admin');
  });
});

describe('photos on a product page', () => {
  const twoPhotos = { ...site.products[1]!, media: [{ kind: 'image' as const, url: 'https://cdn/a.jpg', alt: '' }, { kind: 'image' as const, url: 'https://cdn/b.jpg', alt: '' }] };

  it('shows every photo on Full', () => {
    const { container } = render(<ShorelineProduct site={site} product={twoPhotos} tenantId={TENANT} />);
    expect(container.querySelectorAll('.sl-product-photos img')).toHaveLength(2);
  });

  it('shows the main photo only on Lite', () => {
    const { container } = render(<ShorelineProduct site={{ ...site, allPhotos: false }} product={twoPhotos} tenantId={TENANT} />);
    expect([...container.querySelectorAll('.sl-product-photos img')].map((i) => i.getAttribute('src'))).toEqual(['https://cdn/a.jpg']);
  });
});

describe('the cart (Full)', () => {
  const full = { ...site, cart: true };
  const priced = { ...site.products[1]!, id: 'l2' };

  it('offers Add to cart on a priced piece, never on “Ask for price”, and only on Full', () => {
    render(<ShorelineProduct site={full} product={priced} tenantId={TENANT} />);
    expect(screen.getByRole('button', { name: W.cart.add })).toBeTruthy();
    expect(screen.getByRole('link', { name: W.cart.nav(0) }).getAttribute('href')).toBe('/cart');
    cleanup();
    render(<ShorelineProduct site={full} product={{ ...site.products[0]!, id: 'l1' }} tenantId={TENANT} />);
    expect(screen.queryByRole('button', { name: W.cart.add })).toBeNull();
    cleanup();
    render(<ShorelineProduct site={site} product={priced} tenantId={TENANT} />);
    expect(screen.queryByRole('button', { name: W.cart.add })).toBeNull();
    expect(screen.queryByRole('link', { name: /^Cart/ })).toBeNull();
  });

  it('lists the pieces with the sums and the order letter', () => {
    const cart = {
      lines: [
        { id: 'l2', slug: 'old-saint-nick', name: 'Old Saint Nick', price: '$22', available: true },
        { id: 'l3', slug: 'gone', name: 'Gone piece', price: '$10', available: false },
      ],
      subtotal: '$22',
      discount: { label: 'Fall sale', amount: '$2' },
      total: '$20',
      codes: true,
    };
    render(<ShorelineCart site={full} cart={cart} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(W.cart.title);
    expect(screen.getByText('Old Saint Nick')).toBeTruthy();
    expect(screen.getByText(W.cart.gone)).toBeTruthy();
    expect(screen.getByText('$20')).toBeTruthy();
    expect(screen.getByText('−$2')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(W.cart.fix);
    expect(screen.getByRole('button', { name: W.cart.removeLabel('Old Saint Nick') })).toBeTruthy();
  });

  it('shows the order form when everything is available, and an empty cart says so', () => {
    render(<ShorelineCart site={full} cart={{ lines: [{ id: 'l2', slug: 'a', name: 'A', price: '$22', available: true }], subtotal: '$22', total: '$22', codes: false }} />);
    expect(screen.getByRole('button', { name: W.cart.send })).toBeTruthy();
    cleanup();
    render(<ShorelineCart site={full} cart={{ lines: [], subtotal: '$0', total: '$0', codes: false }} />);
    expect(screen.getByText(W.cart.empty)).toBeTruthy();
  });
});

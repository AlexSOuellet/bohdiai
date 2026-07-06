import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ShopPage, EventsPage, AboutPage, ContactPage, ContentPage, MainStreetSubPage } from './pages';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';
import type { MainStreetTreatments } from './builder';

/** Default treatments for sub-page tests — one plausible family (Cozy). Every
 *  sub-page needs these; individual tests can spread + override to test other
 *  families / previews. */
const testTreatments: MainStreetTreatments = {
  hero: 'story',
  goods: 'procession',
  collections: 'cupboard',
  reviews: 'guestbook',
  founder: 'letter',
  findUs: 'poster',
  nav: 'standard',
};

// light-bg skin: ember bg is #F4EAD7 — luminance > 0.5
const skin = MAIN_STREET_SKINS['main-street-ember']!;
// dark-bg skin: hearthstone bg is #1B1410 — luminance < 0.5
const darkSkin = MAIN_STREET_SKINS['main-street-hearthstone']!;

const content: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
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

const products: ProductView[] = [
  { slug: 'belt', name: 'The Belt', price: '$98', shortDescription: 'Full-grain', description: 'A belt.', status: 'active', media: [], variations: [] },
  { slug: 'wallet', name: 'The Wallet', price: '$68', description: 'A wallet.', status: 'active', media: [], variations: [] },
];

afterEach(cleanup);

describe('ShopPage', () => {
  it('lists every product with a link to its detail page', () => {
    const { getByText, container } = render(<ShopPage content={content} skin={skin} products={products} treatments={testTreatments} />);
    expect(getByText('The Belt')).toBeTruthy();
    expect(getByText('The Wallet')).toBeTruthy();
    expect(container.querySelector('a[href="/listings/belt"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-shop]')).toBeTruthy();
  });

  it('shows an empty state when there are no products', () => {
    const { container } = render(<ShopPage content={content} skin={skin} products={[]} treatments={testTreatments} />);
    expect(container.querySelector('[data-ms-shop]')?.textContent).toMatch(/check back/i);
  });

  it('renders the shared sub-page nav with real routes', () => {
    const { container } = render(<ShopPage content={content} skin={skin} products={products} treatments={testTreatments} />);
    expect(container.querySelector('a[href="/events"]')).toBeTruthy();
    expect(container.querySelector('a[href="/cart"]')).toBeTruthy();
  });

  it('shows the maker logo beside the wordmark in the sub-page header when uploaded', () => {
    const withLogo: MainStreetContent = { ...content, identity: { ...content.identity, logoUrl: 'https://cdn/logo.png' } };
    const { container } = render(<ShopPage content={withLogo} skin={skin} products={products} treatments={testTreatments} />);
    expect((container.querySelector('img[data-ms-logo]') as HTMLImageElement | null)?.getAttribute('src')).toBe('https://cdn/logo.png');
  });
});

describe('AboutPage — logo plate removal + header contrast (4b)', () => {
  it('renders the logo bare — no white plate element', () => {
    const c: MainStreetContent = { ...content, identity: { ...content.identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' } };
    const { container } = render(<AboutPage content={c} skin={skin} treatments={testTreatments} />);
    expect(container.querySelector('.ms-logo-plate')).toBeNull();
    expect(container.querySelector('[data-ms-logo]')).not.toBeNull();
  });

  it('gives the sub-header a contrasting surface when the logo tone matches the skin tone', () => {
    // dark logo on a dark skin → header takes the LIGHT contrast surface, expressed as
    // a data attribute (class-only; the CSS for it lives in skinVarsCss), no inline style.
    const c: MainStreetContent = { ...content, identity: { ...content.identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' } };
    const { container } = render(<AboutPage content={c} skin={darkSkin} treatments={testTreatments} />);
    const header = container.querySelector('header')!;
    expect(header.getAttribute('data-ms-subhead')).toBe('light');
    expect(header.getAttribute('style')).toBeNull(); // no inline styling
  });
});

describe('AboutPage', () => {
  it('renders the authored story paragraphs, each as its own paragraph', () => {
    // The page opens with the founder treatment as its hero (representative of the
    // home teaser) and then renders the full story below in class-only prose. The
    // paragraphs get `data-ms-story` for the reader to hook into.
    const withAbout: MainStreetContent = { ...content, about: { heading: 'How Tannery Row began', story: ['I learned to stitch leather from my grandfather in his garage workshop over many summers.', 'Today every belt is cut from a single full-grain hide and saddle-stitched by hand.'] } };
    const { container } = render(<AboutPage content={withAbout} skin={skin} treatments={testTreatments} />);
    expect(container.querySelectorAll('[data-ms-story]').length).toBe(2);
  });

  it('falls back to the founder quote when no about story was authored', () => {
    const { container } = render(<AboutPage content={content} skin={skin} treatments={testTreatments} />);
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

  it('renders no intro when the copywriter did not author one — no hardcoded English fallback', () => {
    // Missing content.contact means the ContactPage renders no heading and no
    // intro; the renderer never papers over a missing authored value with hardcoded
    // English. This is the rule: if the crew missed it, that's a copywriter bug.
    const { container } = render(<ContactPage content={content} skin={skin} />);
    expect(container.querySelector('.ms-contactpage-intro')).toBeNull();
    // The section is still there (may hold the form when tenantId is passed).
    expect(container.querySelector('[data-ms-contact]')).toBeTruthy();
  });
});

describe('MainStreetSubPage (the shared shell)', () => {
  it('wraps arbitrary children with the nav and footer', () => {
    const { getByText, container } = render(
      <MainStreetSubPage content={content} skin={skin}><div data-testid="body">cart goes here</div></MainStreetSubPage>,
    );
    expect(getByText('cart goes here')).toBeTruthy();
    expect(container.querySelector('a[href="/shop"]')).toBeTruthy(); // nav
    expect(container.querySelector('a[href="/privacy"]')).toBeTruthy(); // footer
  });

  it('pins the nav to the top so it anchors as the page scrolls (parity with the home hero nav)', () => {
    const { container } = render(
      <MainStreetSubPage content={content} skin={skin}><div /></MainStreetSubPage>,
    );
    const nav = container.querySelector('[data-ms-nav]') as HTMLElement | null;
    expect(nav).toBeTruthy();
    // Fixed (not sticky) because Lenis smooth-scroll breaks sticky in this layout;
    // fixed matches the home hero nav. The pinning lives in the .ms-subheader class
    // (skinVarsCss), not an inline style.
    expect(nav!.classList.contains('ms-subheader')).toBe(true);
    expect(nav!.getAttribute('style')).toBeNull();
  });

  it('pads <main> down so content does not slide under the fixed nav', () => {
    const { container } = render(
      <MainStreetSubPage content={content} skin={skin}><div /></MainStreetSubPage>,
    );
    const main = container.querySelector('main.ms-subpage-main');
    expect(main).toBeTruthy();
  });
});

describe('ContentPage', () => {
  it('renders a title and body paragraphs in the Main Street shell', () => {
    const { getByText, container } = render(<ContentPage content={content} skin={skin} title="Privacy Policy" body={['We respect your privacy.', 'We never sell your data.']} />);
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-content] p').length).toBe(2);
    // wears the shared sub-page nav
    expect(container.querySelector('a[href="/shop"]')).toBeTruthy();
  });

  it('renders pre-rendered HTML (legal docs) inside the shell', () => {
    const { container } = render(<ContentPage content={content} skin={skin} html={'<h1>Privacy</h1><p>We respect it.</p>'} />);
    const article = container.querySelector('.ms-legal') as HTMLElement;
    expect(article.querySelector('h1')?.textContent).toBe('Privacy');
    expect(article.querySelector('p')?.textContent).toBe('We respect it.');
  });
});

describe('EventsPage', () => {
  it('renders the dates when the maker has them', () => {
    const withDates: MainStreetContent = { ...content, founder: { ...content.founder, findUs: { label: 'Find us', rows: [{ day: 'Sat', where: 'Hope St Market', time: '9am' }] } } };
    const { getByText } = render(<EventsPage content={withDates} skin={skin} treatments={testTreatments} />);
    expect(getByText('Hope St Market')).toBeTruthy();
  });

  it('shows a check-back empty state with no dates', () => {
    const { container } = render(<EventsPage content={content} skin={skin} treatments={testTreatments} />);
    expect(container.querySelector('[data-ms-events]')?.textContent).toMatch(/check back/i);
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import type { ProductView } from '@/lib/archetypes/content';
import { NurseryHome, NurseryShop, NurseryCertificate, NurseryContentPage, NurseryCart } from './NurseryLanding';
import { CART_COOKIE } from '@/lib/storefront/cart';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import { NURSERY_STRINGS as S } from './strings';
import type { BoutiqueData } from './data';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const baby = (name: string, extra: Partial<ProductView> = {}): ProductView => ({
  slug: name.toLowerCase(),
  name,
  price: '$120',
  shortDescription: `${name}, sleeping`,
  description: `About ${name}.\n\nReady to go home.`,
  status: 'active',
  media: [{ kind: 'image', url: `https://cdn/${name}.webp`, alt: name }],
  variations: [],
  ...extra,
});
const babies = ['Theo', 'Rosie', 'Ruby', 'Ava', 'Holly', 'Oliver', 'Poppy'].map((n) => baby(n));

const full: BoutiqueData = {
  name: 'Rose n’ Cat Reborn Babies',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Reborn artist · Smithfield',
    headline: 'One-of-a-kind reborn babies',
    aboutTitle: 'Every baby is one of a kind',
    bio: 'I’m Renee.\n\nEvery baby is painted by hand.',
    signature: 'Renee',
    makes: ['Reborn babies', 'One of a kind'],
    phone: '(401) 555-0100',
    facebookUrl: 'https://www.facebook.com/rosencat',
    instagramUrl: 'https://instagram.com/rosencat',
  },
  dates: [{ id: 'd1', date: '2026-10-17', endDate: '', name: 'Scituate Art Festival', town: 'Scituate' }],
  gone: [
    { id: 'g1', url: 'https://cdn/g1.webp', caption: 'Christmas twins' },
    { id: 'g2', url: 'https://cdn/g2.webp', caption: '' },
    { id: 'g3', url: 'https://cdn/g3.webp', caption: 'Little elf' },
    { id: 'g4', url: 'https://cdn/g4.webp', caption: 'Owl hat' },
    { id: 'g5', url: 'https://cdn/g5.webp', caption: 'Sweet pea' },
  ],
  cart: false,
  newArrivals: false,
  sale: null,
};
const bare: BoutiqueData = { name: 'Rose', profile: EMPTY_PROFILE, dates: [], gone: [], cart: false, newArrivals: false, sale: null };

afterEach(() => {
  cleanup();
  document.cookie = `${CART_COOKIE}=; Path=/; Max-Age=0`;
});

describe('nursery home', () => {
  it('opens on the first baby in the window, with the shop name, headline and lowest price', () => {
    const { container } = render(
      <NurseryHome
        data={full}
        products={babies}
        tenantId={TENANT}
        logoUrl="https://cdn/logo.png"
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: full.name })).toBeTruthy();
    expect(screen.getByText('One-of-a-kind reborn babies')).toBeTruthy();
    expect(screen.getByText(S.hero.from('$120'))).toBeTruthy();
    expect(container.querySelector('.nn-window__arch img')?.getAttribute('src')).toBe(
      'https://cdn/Theo.webp',
    );
    expect(container.querySelector('.nn-brand__logo')?.getAttribute('src')).toBe(
      'https://cdn/logo.png',
    );
  });

  it('shows five babies behind the glass, each linking to its certificate, and a link to all of them', () => {
    const { container } = render(<NurseryHome data={full} products={babies} tenantId={TENANT} />);
    const links = [...container.querySelectorAll('.nn-grid .nn-baby')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/listings/theo',
      '/listings/rosie',
      '/listings/ruby',
      '/listings/ava',
      '/listings/holly',
    ]);
    expect(screen.getByRole('link', { name: S.nursery.all(7) }).getAttribute('href')).toBe('/shop');
    expect(screen.getByText(S.nursery.count(7))).toBeTruthy();
  });

  it('writes the bracelet beads from what she makes, read whole by screen readers', () => {
    const { container } = render(<NurseryHome data={full} products={babies} tenantId={TENANT} />);
    expect(container.querySelector('.nn-beads .nn-sr')?.textContent).toBe(
      'Reborn babies · One of a kind',
    );
    expect(container.querySelectorAll('.nn-bead--heart').length).toBe(4);
  });

  it('carries the artist’s letter, visiting hours and the ways to get in touch', () => {
    const { container } = render(
      <NurseryHome
        data={full}
        products={babies}
        tenantId={TENANT}
        logoUrl="https://cdn/logo.png"
      />,
    );
    expect(screen.getByRole('heading', { name: 'Every baby is one of a kind' })).toBeTruthy();
    expect(container.querySelector('.nn-sign')?.textContent).toBe('Renee');
    expect(container.querySelector('.nn-postmark img')).not.toBeNull();
    expect(screen.getByText('Scituate Art Festival')).toBeTruthy();
    expect(screen.getByRole('link', { name: S.nav.visit }).getAttribute('href')).toBe('#visit');
    expect(screen.getByRole('link', { name: '(401) 555-0100' }).getAttribute('href')).toBe(
      'tel:+14015550100',
    );
    expect(screen.getByRole('link', { name: S.touch.facebook })).toBeTruthy();
    expect(screen.getByRole('link', { name: S.touch.instagram })).toBeTruthy();
    expect(container.querySelector('form#contact-form')).not.toBeNull();
  });

  it('stays whole with nothing filled in', () => {
    const { container } = render(<NurseryHome data={bare} products={[]} tenantId={TENANT} />);
    expect(screen.getByText(S.nursery.empty)).toBeTruthy();
    expect(container.querySelector('.nn-window')).toBeNull();
    expect(container.querySelector('.nn-letter')).toBeNull();
    expect(container.querySelector('#visit')).toBeNull();
    expect(screen.queryByRole('link', { name: S.nav.visit })).toBeNull();
    expect(container.querySelector('.nn-brand__name')?.textContent).toBe('Rose');
    expect(container.querySelector('.nn-sr')?.textContent).toBe('Rose');
  });
});

describe('top bar menu', () => {
  it('opens on phones from the Menu button and closes on a pick or Escape', () => {
    const { container } = render(<NurseryHome data={full} products={babies} tenantId={TENANT} />);
    const nav = () => container.querySelector('.nn-nav');
    const btn = () => container.querySelector<HTMLButtonElement>('.nn-menu-btn');
    expect(btn()?.textContent).toBe(S.nav.menu);
    expect(btn()?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn() as HTMLButtonElement);
    expect(nav()?.getAttribute('data-open')).toBe('true');
    expect(btn()?.textContent).toBe(S.nav.close);
    expect(btn()?.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('link', { name: S.nav.artist }));
    expect(nav()?.getAttribute('data-open')).toBe('false');
    fireEvent.click(btn() as HTMLButtonElement);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(nav()?.getAttribute('data-open')).toBe('false');
    expect(screen.getByRole('link', { name: S.nav.touch }).className).toBe('nn-nav__cta');
  });
});

describe('gone home', () => {
  it('pegs past babies on clotheslines of four, captions under each, opening full size', () => {
    const { container } = render(<NurseryHome data={full} products={babies} tenantId={TENANT} />);
    const lines = container.querySelectorAll('#gone .nn-line');
    expect([...lines].map((l) => l.querySelectorAll('.nn-peg').length)).toEqual([4, 1]);
    expect(screen.getByText('Christmas twins')).toBeTruthy();
    expect(screen.getByRole('link', { name: S.nav.gone }).getAttribute('href')).toBe('#gone');
    fireEvent.click(screen.getByRole('button', { name: S.gone.open('Little elf', 3) }));
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn/g3.webp',
    );
    expect(screen.getByRole('button', { name: S.gone.open('', 2) })).toBeTruthy();
  });

  it('is left out, with its nav link, when there are no past babies', () => {
    const { container } = render(<NurseryHome data={bare} products={babies} tenantId={TENANT} />);
    expect(container.querySelector('#gone')).toBeNull();
    expect(screen.queryByRole('link', { name: S.nav.gone })).toBeNull();
  });
});

describe('nursery page', () => {
  it('shows every baby, marking an adopted one', () => {
    const list = [...babies, baby('Finn', { status: 'sold_out' })];
    const { container } = render(<NurseryShop data={full} products={list} />);
    expect(container.querySelectorAll('.nn-grid .nn-baby')).toHaveLength(8);
    expect(container.querySelector('.nn-baby--adopted')?.getAttribute('href')).toBe(
      '/listings/finn',
    );
    expect(screen.getByText(S.card.adopted)).toBeTruthy();
    expect(screen.getByText(S.nursery.count(7))).toBeTruthy();
    expect(screen.getByRole('link', { name: S.nav.artist }).getAttribute('href')).toBe('/#artist');
  });
});

describe('certificate of birth', () => {
  const theo = baby('Theo', {
    media: [
      { kind: 'image', url: 'https://cdn/t1.webp', alt: '' },
      { kind: 'image', url: 'https://cdn/t2.webp', alt: 'Theo, photo 2' },
    ],
  });

  it('fills in the certificate and asks to adopt', () => {
    render(<NurseryCertificate data={full} product={theo} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Theo' })).toBeTruthy();
    expect(screen.getByText(full.name, { selector: 'dd' })).toBeTruthy();
    expect(screen.getByText('Renee', { selector: 'dd' })).toBeTruthy();
    expect(screen.getByText(S.card.ready)).toBeTruthy();
    expect(screen.getByText('Ready to go home.')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: S.certificate.adopt('Theo') }).getAttribute('href'),
    ).toBe('/#touch');
  });

  it('swaps the big photo from the thumbnails', () => {
    const { container } = render(<NurseryCertificate data={full} product={theo} />);
    const main = () => container.querySelector('.nn-photos__main img');
    expect(main()?.getAttribute('alt')).toBe(S.certificate.photo('Theo', 1));
    fireEvent.click(screen.getByRole('button', { name: S.certificate.showPhoto(2) }));
    expect(main()?.getAttribute('src')).toBe('https://cdn/t2.webp');
    expect(main()?.getAttribute('alt')).toBe('Theo, photo 2');
  });

  it('says adopted, with no adopt button, and copes with no photos or signature', () => {
    const { container } = render(
      <NurseryCertificate
        data={bare}
        product={baby('Finn', { status: 'sold_out', media: [], description: '' })}
      />,
    );
    expect(screen.getByText(S.card.adopted)).toBeTruthy();
    expect(screen.queryByRole('link', { name: S.certificate.adopt('Finn') })).toBeNull();
    expect(container.querySelector('.nn-photos')).toBeNull();
    expect(container.querySelector('.nn-cert__desc')).toBeNull();
  });
});

describe('plain page', () => {
  it('paints a title with paragraphs or ready markup', () => {
    const { rerender } = render(
      <NurseryContentPage data={full} title="Privacy" body={['One.', 'Two.']} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy' })).toBeTruthy();
    expect(screen.getByText('Two.')).toBeTruthy();
    rerender(<NurseryContentPage data={full} html="<h2>Terms</h2>" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Terms' })).toBeTruthy();
  });
});

describe('footer', () => {
  it('links the terms and privacy pages on every page', () => {
    render(<NurseryContentPage data={full} title="Privacy" body={['One.']} />);
    const foot = document.querySelector('.nn-foot');
    const hrefs = [...(foot?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/terms');
    expect(hrefs).toContain('/privacy');
  });
});

const ID1 = '00000000-0000-4000-8000-000000000001';
const ID2 = '00000000-0000-4000-8000-000000000002';

describe('cart on the certificate', () => {
  it('keeps "Ask to adopt" when the cart is off', () => {
    render(<NurseryCertificate data={full} product={baby('Theo', { id: ID1 })} />);
    expect(screen.getByRole('link', { name: S.certificate.adopt('Theo') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: S.cart.add })).toBeNull();
  });

  it('adds the baby to the cart, then links to the cart', () => {
    render(<NurseryCertificate data={{ ...full, cart: true }} product={baby('Theo', { id: ID1 })} />);
    fireEvent.click(screen.getByRole('button', { name: S.cart.add }));
    expect(document.cookie).toContain(`${CART_COOKIE}=${ID1}`);
    expect(screen.getByRole('link', { name: S.cart.inCart }).getAttribute('href')).toBe('/cart');
    expect(screen.getByRole('link', { name: S.cart.ask('Theo') })).toBeTruthy();
  });

  it('offers no cart button for an adopted baby or one with options', () => {
    const { rerender } = render(
      <NurseryCertificate data={{ ...full, cart: true }} product={baby('Theo', { id: ID1, status: 'sold_out' })} />,
    );
    expect(screen.queryByRole('button', { name: S.cart.add })).toBeNull();
    rerender(
      <NurseryCertificate
        data={{ ...full, cart: true }}
        product={baby('Theo', { id: ID1, variations: [{ name: 'Outfit', options: ['Pink'] }] })}
      />,
    );
    expect(screen.queryByRole('button', { name: S.cart.add })).toBeNull();
    expect(screen.getByRole('link', { name: S.certificate.adopt('Theo') })).toBeTruthy();
  });

  it('shows the cart link in the bar with the count', () => {
    document.cookie = `${CART_COOKIE}=${ID1}.${ID2}; Path=/`;
    const { container } = render(<NurseryContentPage data={{ ...full, cart: true }} title="Privacy" body={['One.']} />);
    expect(container.querySelector('.nn-cartlink')?.textContent).toBe(S.cart.link(2));
  });
});

describe('cart page', () => {
  const line = (id: string, name: string, available = true) => ({
    id,
    slug: name.toLowerCase(),
    name,
    price: '$120',
    photo: { kind: 'image' as const, url: `https://cdn/${name}.webp`, alt: name },
    available,
  });

  it('says so when the cart is empty', () => {
    render(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: [], subtotal: '$0', total: '$0', codes: false }} />);
    expect(screen.getByText(S.cart.empty)).toBeTruthy();
    expect(screen.queryByRole('button', { name: S.cart.send })).toBeNull();
  });

  it('lists the babies with the total and the send form', () => {
    render(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: [line(ID1, 'Theo'), line(ID2, 'Rosie')], subtotal: '$240', total: '$240', codes: false }} />);
    expect(screen.getByRole('link', { name: 'Theo' })).toBeTruthy();
    expect(screen.getByText('$240')).toBeTruthy();
    expect(screen.getByRole('button', { name: S.cart.send })).toBeTruthy();
  });

  it('takes a baby out of the cart', () => {
    document.cookie = `${CART_COOKIE}=${ID1}.${ID2}; Path=/`;
    render(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: [line(ID1, 'Theo'), line(ID2, 'Rosie')], subtotal: '$240', total: '$240', codes: false }} />);
    fireEvent.click(screen.getByRole('button', { name: S.cart.removeLabel('Theo') }));
    expect(document.cookie).toContain(`${CART_COOKIE}=${ID2}`);
    expect(refresh).toHaveBeenCalled();
  });

  it('holds the form back until an adopted baby is taken out', () => {
    render(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: [line(ID1, 'Theo', false)], subtotal: '$0', total: '$0', codes: false }} />);
    expect(screen.getByText(S.cart.gone)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(S.cart.fix);
    expect(screen.queryByRole('button', { name: S.cart.send })).toBeNull();
  });
});

describe('just born', () => {
  const kids = [baby('Theo', { isNew: true }), baby('Rosie'), baby('Ruby', { isNew: true, status: 'sold_out' })];

  it('announces the babies ticked new, with a ribbon on their nursery cards', () => {
    const { container } = render(<NurseryHome data={{ ...full, newArrivals: true }} products={kids} tenantId={TENANT} />);
    const section = screen.getByRole('heading', { level: 2, name: S.born.title }).closest('section');
    const names = [...(section?.querySelectorAll('.nn-ann__name') ?? [])].map((n) => n.textContent);
    expect(names).toEqual(['Theo', 'Ruby']);
    expect(section?.textContent).toContain(S.born.bornAt(full.name));
    expect(section?.textContent).toContain(S.card.adopted);
    expect(container.querySelectorAll('.nn-grid .nn-newborn')).toHaveLength(2);
  });

  it('stays away when new arrivals are off or nothing is ticked', () => {
    const { container, rerender } = render(<NurseryHome data={full} products={kids} tenantId={TENANT} />);
    expect(screen.queryByRole('heading', { name: S.born.title })).toBeNull();
    expect(container.querySelector('.nn-newborn')).toBeNull();
    rerender(<NurseryHome data={{ ...full, newArrivals: true }} products={[baby('Rosie')]} tenantId={TENANT} />);
    expect(screen.queryByRole('heading', { name: S.born.title })).toBeNull();
  });
});

describe('sale', () => {
  it('flies the sale banner and shows the full price struck through', () => {
    const data = { ...full, sale: { name: 'Fall Sale', percentOff: 25, endsOn: '2026-10-31' } };
    const { container } = render(<NurseryCertificate data={data} product={baby('Theo', { salePrice: '$90' })} />);
    expect(container.querySelector('.nn-salebar')?.textContent).toBe(`${S.sale.banner('Fall Sale', 25)} · ${S.sale.until('Oct 31')}`);
    const fee = container.querySelector('.nn-fee');
    expect(fee?.querySelector('s')?.textContent).toBe(`${S.sale.was} $120`);
    expect(fee?.textContent).toContain('$90');
  });
});

describe('cart discounts', () => {
  const one = [{ id: ID1, slug: 'theo', name: 'Theo', price: '$120', available: true }];
  it('shows the subtotal, the discount and the total, with the code box', () => {
    render(
      <NurseryCart
        data={{ ...full, cart: true }}
        cart={{
          lines: one,
          subtotal: '$120',
          discount: { label: 'MARKET10', amount: '$12' },
          total: '$108',
          codes: true,
          code: { value: 'MARKET10', applied: true },
        }}
      />,
    );
    expect(screen.getByText(S.cart.discount('MARKET10'))).toBeTruthy();
    expect(screen.getByText('−$12')).toBeTruthy();
    expect(screen.getByText('$108')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(S.cart.codeApplied('MARKET10'));
    expect(screen.getByRole('button', { name: S.cart.codeRemove })).toBeTruthy();
  });

  it('applies a typed code by keeping it for the page to re-price', () => {
    render(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: one, subtotal: '$120', total: '$120', codes: true }} />);
    fireEvent.change(screen.getByLabelText(S.cart.codeField), { target: { value: 'market10' } });
    fireEvent.click(screen.getByRole('button', { name: S.cart.codeApply }));
    expect(document.cookie).toContain('bohdi_promo=MARKET10');
    expect(refresh).toHaveBeenCalled();
    document.cookie = 'bohdi_promo=; Path=/; Max-Age=0';
  });

  it('says why a code did not apply, and has no code box when the shop has no codes', () => {
    const { rerender } = render(
      <NurseryCart
        data={{ ...full, cart: true }}
        cart={{ lines: one, subtotal: '$120', total: '$120', codes: true, code: { value: 'NOPE', applied: false, message: 'That code isn’t valid.' } }}
      />,
    );
    expect(screen.getAllByRole('alert').some((a) => a.textContent === 'That code isn’t valid.')).toBe(true);
    rerender(<NurseryCart data={{ ...full, cart: true }} cart={{ lines: one, subtotal: '$120', total: '$120', codes: false }} />);
    expect(screen.queryByLabelText(S.cart.codeField)).toBeNull();
  });
});

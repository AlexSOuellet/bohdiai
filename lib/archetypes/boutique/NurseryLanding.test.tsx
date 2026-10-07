import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import type { ProductView } from '@/lib/archetypes/content';
import { NurseryHome, NurseryShop, NurseryCertificate, NurseryContentPage } from './NurseryLanding';
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
  dates: [{ id: 'd1', date: '2026-10-17', name: 'Scituate Art Festival', town: 'Scituate' }],
  gone: [
    { id: 'g1', url: 'https://cdn/g1.webp', caption: 'Christmas twins' },
    { id: 'g2', url: 'https://cdn/g2.webp', caption: '' },
    { id: 'g3', url: 'https://cdn/g3.webp', caption: 'Little elf' },
    { id: 'g4', url: 'https://cdn/g4.webp', caption: 'Owl hat' },
    { id: 'g5', url: 'https://cdn/g5.webp', caption: 'Sweet pea' },
  ],
};
const bare: BoutiqueData = { name: 'Rose', profile: EMPTY_PROFILE, dates: [], gone: [] };

afterEach(cleanup);

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

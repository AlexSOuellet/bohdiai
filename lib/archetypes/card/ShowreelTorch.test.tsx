import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { ShowreelLanding, ShowreelContentPage } from './ShowreelLanding';
import { TorchLanding, TorchContentPage } from './TorchLanding';
import { CARD_STRINGS as S } from './strings';
import type { CardData } from './data';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const photos = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, url: `https://cdn/m${i}.webp`, caption: i === 0 ? 'The studio' : `Piece ${i}` }));

const full: CardData = {
  name: 'Paper & Patina',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Mixed media in Warwick, RI',
    headline: 'Old furniture, reborn',
    aboutTitle: 'Nothing is too far gone',
    bio: 'I find the dressers nobody wants.\n\nNo two ever match.',
    signature: 'Dana',
    phone: '(401) 555-0100',
    facebookUrl: 'https://www.facebook.com/paperandpatina',
  },
  photos,
  dates: [{ id: 'd1', date: '2026-10-24', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Fall Festival of Crafts', town: 'Warwick' }],
};
const empty: CardData = { name: 'Frank', profile: EMPTY_PROFILE, photos: [], dates: [] };

afterEach(cleanup);

describe('show reel page', () => {
  it('opens on the first photo with the name slammed in, read whole by screen readers', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    expect(container.querySelector('.sr-open .sr-main')?.getAttribute('src')).toBe('https://cdn/m0.webp');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Paper & Patina' });
    expect([...h1.querySelectorAll('.sr-word')].map((w) => w.textContent)).toEqual(['Paper', '& Patina']);
    expect(container.querySelector('.sr-kick')?.textContent).toBe('Mixed media in Warwick, RI');
    expect(screen.getByRole('link', { name: S.showreel.seeWork }).getAttribute('href')).toBe('#piece-1');
  });

  it('gives every other photo its own screen with its caption, and no number badge', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const pieces = container.querySelectorAll('[data-piece]');
    expect(pieces).toHaveLength(9);
    expect(container.querySelector('.sr-no')).toBeNull();
    expect(pieces[0]?.querySelector('.sr-name')?.textContent).toBe('Piece 1');
    expect(pieces[0]?.querySelector('.sr-main')?.getAttribute('alt')).toBe('Piece 1');
  });

  it('puts the red about panel after the fourth piece, heading split in two', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const say = container.querySelector('#about');
    expect(say?.previousElementSibling?.getAttribute('data-piece')).toBe('4');
    expect([...(say?.querySelectorAll('h2 span') ?? [])].map((s) => s.textContent)).toEqual(['Nothing is', 'too far gone']);
    expect(say?.querySelector('.sr-sig')?.textContent).toBe('— Dana');
  });

  it('ends with the contact form and the ways to reach the owner, and ticks the market dates', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const end = container.querySelector('#touch') as HTMLElement;
    expect(within(end).getByRole('heading', { name: S.showreel.touch })).toBeTruthy();
    expect(within(end).getByRole('link', { name: '(401) 555-0100' }).getAttribute('href')).toBe('tel:+14015550100');
    expect(end.querySelector('form')).toBeTruthy();
    expect(screen.getByRole('list', { name: S.showreel.datesLabel }).textContent).toBe('Sat Oct 24 · Fall Festival of Crafts · Warwick');
    expect(container.querySelector('.sr-ticker')).toBeTruthy();
  });

  it('shows only the name and footer for an owner who has filled in nothing', () => {
    const { container } = render(<ShowreelLanding data={empty} tenantId={undefined} />);
    for (const sel of ['.sr-kick', '.sr-head', '.sr-go', '[data-piece]', '#about', '.sr-ticker', 'form']) expect(container.querySelector(sel)).toBeNull();
    expect(screen.getByRole('link', { name: `${S.footer.creditPrefix} ${S.footer.creditBrand}` })).toBeTruthy();
  });

  it('never uses inline styles, and renders at rest (motion arms only in the browser)', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('.sr-armed')).toBeNull();
  });

  it('puts privacy and terms on the bone panel', () => {
    render(<ShowreelContentPage name="Paper & Patina" title="Privacy" body={['We keep what you send us.']} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy');
    expect(screen.getByRole('link', { name: 'Paper & Patina' }).getAttribute('href')).toBe('/');
  });
});

describe('torch page', () => {
  const torch: CardData = { ...full, name: 'Ember & Pine' };

  it('burns the name in, one line per word with short words riding along', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Ember & Pine' });
    expect([...h1.querySelectorAll('.tt-row .tt-ghost')].map((r) => r.textContent)).toEqual(['Ember', '& Pine']);
    expect(container.querySelector('.tt-open--2')).toBeTruthy();
    const burn = h1.querySelector('[data-burn]');
    expect(burn?.getAttribute('data-d')).toBe('1.9');
    expect(burn?.className).toContain('tt-burn--name1');
  });

  it('links to the sections that exist', () => {
    render(<TorchLanding data={torch} tenantId={TENANT} />);
    const nav = screen.getByRole('navigation', { name: S.nav.label });
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#about', '#work', '#dates', '#touch']);
  });

  it('shows the about with the brand stamp, every photo as a panel, and opens one full size', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    expect(container.querySelector('.tt-initials')?.textContent).toBe('EP');
    expect(container.querySelector('#about .tt-sig')?.textContent).toBe('— Dana');
    expect(container.querySelectorAll('.tt-piece')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: S.work.open('Piece 3', 4) }));
    expect(within(screen.getByRole('dialog', { name: S.lightbox.label })).getByText(`Piece 3 · ${S.lightbox.count(4, 10)}`)).toBeTruthy();
  });

  it('puts the market dates on planks and the form on the char card', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    const plank = container.querySelector('.tt-plank');
    expect([...(plank?.children ?? [])].map((c) => c.textContent)).toEqual(['Sat Oct 24', 'Fall Festival of Crafts', 'Warwick']);
    expect(container.querySelector('#touch .tt-form form')).toBeTruthy();
  });

  it('leaves out every section with nothing to show', () => {
    const { container } = render(<TorchLanding data={empty} tenantId={undefined} />);
    for (const sel of ['.tt-kick', '.tt-head', '.tt-btns', '#about', '#work', '#dates', '#touch', '.tt-bar nav', '.tt-stripe']) expect(container.querySelector(sel)).toBeNull();
  });

  it('never uses inline styles, and renders every word already burned in', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('.tt-armed')).toBeNull();
  });

  it('puts privacy and terms on the pine board', () => {
    render(<TorchContentPage name="Ember & Pine" title="Terms" body={['Be kind.']} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Terms');
  });
});

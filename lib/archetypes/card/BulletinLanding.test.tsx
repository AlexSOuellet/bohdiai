import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { BulletinLanding, BulletinContentPage } from './BulletinLanding';
import { CARD_STRINGS as S } from './strings';
import type { CardData } from './data';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

const photos = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, url: `https://cdn/p${i}.webp`, caption: i === 0 ? 'The shop wall' : `Piece ${i}` }));

const full: CardData = {
  name: 'Rustic Rhody',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Handmade in Rhode Island',
    headline: 'Burned-wood flags and carved signs',
    makes: ['Burned-wood flags', 'Carved signs', 'Custom work'],
    aboutTitle: 'Pine boards and a torch',
    bio: 'Every flag starts as pine.\n\nNo two come out the same.',
    signature: 'Alex',
    facebookUrl: 'https://www.facebook.com/RhodyStrong',
  },
  photos,
  dates: [
    { id: 'd1', date: '2026-10-17', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Harvest Craft Fair', town: 'Wickford' },
    { id: 'd2', date: '2026-12-05', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Christmas on the Green', town: '' },
  ],
};

afterEach(cleanup);

function page(data: CardData = full) {
  return render(<BulletinLanding data={data} tenantId={TENANT} />);
}

describe('bulletin board page', () => {
  it('loads its own fonts and look, not a family’s', () => {
    const { container } = page();
    expect(container.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toContain('Permanent+Marker');
    expect(container.querySelector('.bb')?.getAttribute('data-design')).toBe('bulletin');
    expect(container.innerHTML).not.toContain('--bc-bg');
  });

  it('stamps the tag line and the name one word per line', () => {
    const { container } = page();
    expect(container.querySelector('.bb-stamp')?.textContent).toBe('Handmade in Rhode Island');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect([...h1.querySelectorAll('span')].map((s) => s.textContent)).toEqual(['Rustic', 'Rhody']);
    expect(h1.className).toContain('bb-big--xl');
  });

  it('lists what the maker makes in the strip, and leaves the strip out when there is nothing', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.bb-strip li')].map((li) => li.textContent)).toEqual(['Burned-wood flags', 'Carved signs', 'Custom work']);
    cleanup();
    const { container: bare } = page({ ...full, profile: { ...full.profile, makes: [] } });
    expect(bare.querySelector('.bb-strip')).toBeNull();
  });

  it('pins the first three photos on the flyer and the rest on the wall', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.bb-pins img')].map((i) => i.getAttribute('src'))).toEqual(['https://cdn/p0.webp', 'https://cdn/p1.webp', 'https://cdn/p2.webp']);
    expect(container.querySelectorAll('.bb-scatter img')).toHaveLength(9);
    expect(screen.getByRole('heading', { name: S.bulletin.more })).toBeTruthy();
  });

  it('leaves the wall out when there are three photos or fewer', () => {
    const { container } = page({ ...full, photos: photos.slice(0, 3) });
    expect(container.querySelector('.bb-scatter')).toBeNull();
    expect(screen.queryByRole('heading', { name: S.bulletin.more })).toBeNull();
  });

  it('opens any photo full size and steps through all of them', () => {
    page();
    fireEvent.click(screen.getByRole('button', { name: S.work.open('Piece 4', 5) }));
    const dialog = screen.getByRole('dialog', { name: S.lightbox.label });
    expect(within(dialog).getByText(`Piece 4 · ${S.lightbox.count(5, 12)}`)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: S.lightbox.next }));
    expect(within(dialog).getByText(`Piece 5 · ${S.lightbox.count(6, 12)}`)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: S.lightbox.close }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('circles each market day under Find me at, and leaves it out with no dates', () => {
    const { container } = page();
    expect(screen.getByRole('heading', { name: S.bulletin.findMe })).toBeTruthy();
    expect([...container.querySelectorAll('.bb-find b')].map((b) => b.textContent)).toEqual(['Sat Oct 17', 'Sat Dec 5']);
    expect(container.querySelector('.bb-find li')?.textContent).toBe('Sat Oct 17 Harvest Craft Fair · Wickford');
    cleanup();
    page({ ...full, dates: [] });
    expect(screen.queryByRole('heading', { name: S.bulletin.findMe })).toBeNull();
  });

  it('has tear-off tabs that lead to the contact form by the owner’s name, one already taken', () => {
    const { container } = page();
    const tabs = within(screen.getByRole('navigation', { name: S.bulletin.tabs })).getAllByRole('link');
    expect(tabs).toHaveLength(8);
    expect(tabs.every((t) => t.getAttribute('href') === '#touch' && t.textContent === 'Message Alex')).toBe(true);
    expect(container.querySelectorAll('.bb-tab--gone')).toHaveLength(1);
    expect(container.querySelector('#touch form')).toBeTruthy();
  });

  it('puts the phone number on the tabs when there is one, and a tap calls', () => {
    page({ ...full, profile: { ...full.profile, phone: '(401) 555-0100' } });
    const tabs = within(screen.getByRole('navigation', { name: S.bulletin.tabs })).getAllByRole('link');
    expect(tabs[0]?.getAttribute('href')).toBe('tel:+14015550100');
    expect(tabs[0]?.textContent).toBe('(401) 555-0100');
  });

  it('shows the about card with the heading, the bio, the sign-off and the Facebook link', () => {
    const { container } = page();
    const about = container.querySelector('#about');
    expect(about?.querySelector('h2')?.textContent).toBe('Pine boards and a torch');
    expect([...(about?.querySelectorAll('p') ?? [])].map((p) => p.textContent)).toEqual(['Every flag starts as pine.', 'No two come out the same.']);
    expect(about?.querySelector('.bb-sig')?.textContent).toBe('— Alex');
    expect(within(about as HTMLElement).getByRole('link', { name: S.touch.facebook }).getAttribute('href')).toBe('https://www.facebook.com/RhodyStrong');
  });

  it('shows only the name and the footer for an owner who has filled in nothing', () => {
    const { container } = render(<BulletinLanding data={{ name: 'Frank', profile: EMPTY_PROFILE, photos: [], dates: [] }} tenantId={undefined} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Frank');
    for (const sel of ['.bb-stamp', '.bb-strip', '.bb-lede', '.bb-pins', '.bb-find', '.bb-tabs', '.bb-cards']) expect(container.querySelector(sel)).toBeNull();
    expect(screen.getByRole('link', { name: `${S.footer.creditPrefix} ${S.footer.creditBrand}` })).toBeTruthy();
  });

  it('never uses inline styles', () => {
    const { container } = page();
    expect(container.querySelector('[style]')).toBeNull();
  });
});

describe('bulletin board content page', () => {
  it('puts privacy and terms on a kraft sheet with a way home', () => {
    const { container } = render(<BulletinContentPage name="Rustic Rhody" title="Privacy" body={['We keep what you send us.']} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy');
    expect(screen.getByRole('link', { name: 'Rustic Rhody' }).getAttribute('href')).toBe('/');
    expect(container.querySelector('.bb-flyer--prose')).toBeTruthy();
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { CardLanding, CardContentPage } from './CardLanding';
import { CARD_STRINGS as S } from './strings';
import type { CardData } from './data';
import { cardPaint } from './paint';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const paint = cardPaint({ mood: 'rustic', lookKey: 'main-street-sawdust', brandPalette: undefined });

const photos = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, url: `https://cdn/p${i}.webp`, caption: i === 0 ? 'Army flag' : '' }));

const full: CardData = {
  name: 'Rustic Rhody',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Handmade in Rhode Island',
    headline: 'Burned-wood flags and carved signs',
    aboutTitle: 'Pine boards and a torch',
    bio: 'Every flag starts as pine.\n\nNo two come out the same.',
    signature: 'Alex',
    phone: '(401) 555-0100',
    facebookUrl: 'https://www.facebook.com/RhodyStrong',
  },
  photos,
};

afterEach(cleanup);

function page(data: CardData = full) {
  return render(<CardLanding data={data} paint={paint} tenantId={TENANT} />);
}

describe('business card page', () => {
  it('paints in the family: the skin’s colors, the family’s fonts and wallpaper', () => {
    const { container } = page();
    expect(container.innerHTML).toContain('--bc-bg:#E7DAC4');
    expect(container.innerHTML).toContain("--bc-head:'Alfa Slab One'");
    expect(container.innerHTML).toContain("--bc-label:'Cutive Mono'");
    expect(container.innerHTML).toContain('/textures/wp-burlap.png');
    expect(container.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toContain('Alfa+Slab+One');
    expect(container.querySelector('.bc')?.getAttribute('data-family')).toBe('rustic');
  });

  it('opens with the overline, the name, and the best three photos pinned up with the stamp', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.bc-wall .bc-print img')].map((i) => i.getAttribute('src'))).toEqual([
      'https://cdn/p0.webp',
      'https://cdn/p1.webp',
      'https://cdn/p2.webp',
    ]);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Rustic Rhody');
    expect(container.querySelector('.bc-over')?.textContent).toBe('Handmade in Rhode Island');
    expect(container.querySelector('.bc-mark b')?.textContent).toBe('RR');
    expect(screen.getByText('Burned-wood flags and carved signs')).toBeTruthy();
  });

  it('shows the bio as paragraphs with the sign-off', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.bc-note p')].map((p) => p.textContent)).toEqual([
      'Every flag starts as pine.',
      'No two come out the same.',
    ]);
    expect(container.querySelector('.bc-sig')?.textContent).toBe('Alex');
  });

  it('runs the marquee on the owner’s own words, each once, looped', () => {
    const { container } = page();
    const words = [...container.querySelectorAll('.bc-marquee__row:not(.bc-marquee__row--quiet) span')].map((s) => s.textContent);
    expect(words.slice(0, 2)).toEqual(['Handmade in Rhode Island', 'Army flag']);
    expect(words).toHaveLength(4);
  });

  it('shows all twelve photos in an even grid, captions underneath', () => {
    const { container } = page();
    expect(container.querySelectorAll('.bc-grid > li .bc-tile')).toHaveLength(12);
    expect(container.querySelector('.bc-tile__cap')?.textContent).toBe('Army flag');
  });

  it('opens a photo full size, steps through and closes with Escape', () => {
    page();
    fireEvent.click(screen.getByRole('button', { name: S.work.open('Army flag', 1) }));
    const dialog = screen.getByRole('dialog', { name: S.lightbox.label });
    expect(within(dialog).getByText(`Army flag · ${S.lightbox.count(1, 12)}`)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: S.lightbox.next }));
    expect(within(dialog).getByText(S.lightbox.count(2, 12))).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(within(dialog).getByText(S.lightbox.count(12, 12))).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('gives a dialable phone link, the Facebook link and the contact form', () => {
    const { container } = page();
    expect(container.querySelector('a[href="tel:+14015550100"]')?.textContent).toContain('(401) 555-0100');
    expect(container.querySelector('a[href="https://www.facebook.com/RhodyStrong"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: S.form.send })).toBeTruthy();
  });

  it('credits BohdiAI and links privacy and terms in the footer', () => {
    const { container } = page();
    expect(container.querySelector('.bc-foot a[href="https://bohdiai.com"]')?.textContent).toBe('Empowered by BohdiAI');
    expect(container.querySelector('.bc-foot a[href="/privacy"]')).not.toBeNull();
    expect(container.querySelector('.bc-foot a[href="/terms"]')).not.toBeNull();
  });

  it('leaves out what the owner hasn’t filled in instead of painting it empty', () => {
    const { container } = page({ name: 'Frank', profile: EMPTY_PROFILE, photos: [] });
    expect(container.querySelector('.bc-wall .bc-print')).toBeNull();
    expect(container.querySelector('.bc-marquee')).toBeNull();
    expect(container.querySelector('#about')).toBeNull();
    expect(container.querySelector('#work')).toBeNull();
    expect(container.querySelector('.bc-ways')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Frank');
    // The form still lets visitors write.
    expect(container.querySelector('#touch form')).not.toBeNull();
  });

  it('drops the form without a tenant id, and the whole section when nothing is left to show', () => {
    const { container } = render(<CardLanding data={{ name: 'Frank', profile: EMPTY_PROFILE, photos: [] }} paint={paint} tenantId={undefined} />);
    expect(container.querySelector('#touch')).toBeNull();
  });
});

describe('card content page', () => {
  it('wraps legal html in the card’s chrome with a link home', () => {
    const { container } = render(<CardContentPage name="Rustic Rhody" paint={paint} html="<h1>Privacy</h1>" />);
    expect(container.querySelector('.bc-brand[href="/"]')?.textContent).toBe('Rustic Rhody');
    expect(container.querySelector('.bc-prose h1')?.textContent).toBe('Privacy');
  });
});

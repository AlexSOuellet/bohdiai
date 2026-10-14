import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { ShorelineLanding, ShorelineContentPage, nameParts } from './ShorelineLanding';
import { shorelineCss } from './shoreline-styles';
import { fill, keyWords } from '@/lib/site-words/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX, type CardWords } from './words';
import type { CardData } from './data';

const K = keyWords(CARD_WORD_SPOTS, CARD_WORDS_PREFIX);
/** Test words: every spot says its own key; a spot with blanks keeps them, and the
 *  date spots read a real locale so a date can be checked. */
const S: CardWords = {
  ...K,
  dates: { ...K.dates, locale: 'en-US', day: '{weekday} {month} {day}', range: 'card.dates.range {first}|{last}', canceled: 'card.dates.canceled {market}' },
  work: { ...K.work, open: 'card.work.open {caption}', openNumbered: 'card.work.openNumbered {n}' },
  shoreline: { ...K.shoreline, touch: 'card.shoreline.touch {name}' },
};

const TENANT = '1b54cb24-c467-4327-ae66-f9857a71a854';

const photos = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, url: `https://cdn/p${i}.jpg`, caption: i === 0 ? 'Cabbage rose oyster dish' : `Piece ${i}` }));

const full: CardData = {
  name: 'Saltmarsh & Lace',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Decoupage from Bristol',
    headline: 'Sealed to last',
    makes: ['Art bottles', 'Boards and trays', 'Oyster dishes'],
    aboutTitle: 'From the paint counter',
    bio: 'I run the paint counter.\n\nEvery sealer gets tested.',
    signature: 'Lena',
    facebookUrl: 'https://www.facebook.com/bohdiai',
  },
  photos,
  dates: [
    { id: 'd1', date: '2026-10-24', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Harvest Fair', town: 'Bristol' },
    { id: 'd2', date: '2026-12-05', endDate: '2026-12-06', hours: '', address: '', booth: '', url: '', canceled: true, name: 'Christmas Fair', town: 'Barrington' },
  ],
  portrait: null,
  words: S,
};

afterEach(cleanup);

function page(data: CardData = full) {
  return render(<ShorelineLanding data={data} tenantId={TENANT} />);
}

describe('shoreline page', () => {
  it('loads its own fonts and look, not a family’s', () => {
    const { container } = page();
    expect(container.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toContain('Bodoni+Moda');
    expect(container.querySelector('.sl')?.getAttribute('data-design')).toBe('shoreline');
    expect(container.innerHTML).not.toContain('--bc-bg');
  });

  it('sets the name on the sky with the ampersand apart, and the tag line under it', () => {
    const { container } = page();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('Saltmarsh & Lace');
    expect(h1.querySelector('em')?.textContent).toBe('&');
    expect(container.querySelector('.sl-kicker')?.textContent).toBe('Decoupage from Bristol');
    expect(nameParts('Ember and Pine')).toEqual([{ text: 'Ember and Pine', amp: false }]);
  });

  it('keeps the bay locked behind the page, hidden from screen readers', () => {
    const { container } = page();
    expect(container.querySelector('.sl-sea')?.getAttribute('aria-hidden')).toBe('true');
    expect(shorelineCss()).toMatch(/\.sl-sea\{position:fixed;inset:0;z-index:-1/);
  });

  it('floats every photo over the water as a print with its caption, in the owner’s order', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.sl-prints img')].map((i) => i.getAttribute('src'))).toEqual(photos.map((p) => p.url));
    expect(container.querySelector('.sl-print span')?.textContent).toBe('Cabbage rose oyster dish');
    expect(screen.getByRole('region', { name: S.shoreline.work })).toBeTruthy();
  });

  it('opens a piece full size and steps to the next', () => {
    page();
    fireEvent.click(screen.getByRole('button', { name: fill(S.work.open, { caption: 'Cabbage rose oyster dish' }) }));
    const viewer = screen.getByRole('dialog', { name: S.lightbox.label });
    expect(within(viewer).getByRole('img').getAttribute('src')).toBe('https://cdn/p0.jpg');
    fireEvent.click(within(viewer).getByRole('button', { name: S.lightbox.next }));
    expect(within(viewer).getByRole('img').getAttribute('src')).toBe('https://cdn/p1.jpg');
  });

  it('leaves the prints out when there are no photos, and a caption out when it is blank', () => {
    const { container } = page({ ...full, photos: [] });
    expect(container.querySelector('.sl-prints')).toBeNull();
    cleanup();
    const { container: blank } = page({ ...full, photos: [{ id: 'x', url: 'https://cdn/x.jpg', caption: '' }] });
    expect(blank.querySelector('.sl-print span')).toBeNull();
    expect(screen.getByRole('button', { name: fill(S.work.openNumbered, { n: 1 }) })).toBeTruthy();
  });

  it('lists What I make under the tag line, and leaves it out when there is nothing', () => {
    const { container } = page();
    expect([...container.querySelectorAll('.sl-makes li')].map((li) => li.textContent)).toEqual(['Art bottles', 'Boards and trays', 'Oyster dishes']);
    cleanup();
    const { container: bare } = page({ ...full, profile: { ...full.profile, makes: [] } });
    expect(bare.querySelector('.sl-makes')).toBeNull();
  });

  it('tells the story on the card with the headline and signature; her social links stay in the footer', () => {
    const { container } = page();
    const card = container.querySelector('.sl-card') as HTMLElement;
    expect(within(card).getByRole('heading', { level: 2 }).textContent).toBe('From the paint counter');
    expect(card.querySelector('.sl-lead')?.textContent).toBe('Sealed to last');
    expect([...card.querySelectorAll('p:not(.sl-lead)')].map((p) => p.textContent)).toEqual(['I run the paint counter.', 'Every sealer gets tested.']);
    expect(card.querySelector('.sl-sig')?.textContent).toBe('— Lena');
    expect(within(card).queryByRole('link', { name: S.touch.facebook })).toBeNull();
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: S.touch.facebook }).getAttribute('href')).toBe('https://www.facebook.com/bohdiai');
  });

  it('falls back to the renderer’s heading when the owner left the title blank', () => {
    const { container } = page({ ...full, profile: { ...full.profile, aboutTitle: '' } });
    expect(within(container.querySelector('.sl-card') as HTMLElement).getByRole('heading').textContent).toBe(S.shoreline.aboutFallback);
  });

  it('sets the market days out as a tide table, marking a canceled one', () => {
    render(<ShorelineLanding data={full} tenantId={TENANT} />);
    const table = screen.getByRole('table', { name: S.shoreline.find });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((r) => [...r.querySelectorAll('td')].map((td) => td.textContent))).toEqual([
      ['Sat Oct 24', 'Harvest Fair', 'Bristol'],
      [fill(S.dates.range, { first: 'Sat Dec 5', last: 'Sun Dec 6' }), fill(S.dates.canceled, { market: 'Christmas Fair' }), 'Barrington'],
    ]);
    expect(rows[1]?.className).toBe('sl-gone');
  });

  it('gives the card the whole row when there are no dates, and leaves both out when there is nothing', () => {
    const { container } = page({ ...full, dates: [] });
    expect(container.querySelector('.sl-tide')).toBeNull();
    expect(container.querySelector('.sl-below')?.className).toBe('sl-below sl-below--one');
    cleanup();
    const { container: bare } = page({ ...full, dates: [], profile: { ...EMPTY_PROFILE } });
    expect(bare.querySelector('.sl-below')).toBeNull();
  });

  it('addresses the letter to the signature, with the initials on the seal', () => {
    const { container } = page();
    expect(screen.getByRole('heading', { name: fill(S.shoreline.touch, { name: 'Lena' }) })).toBeTruthy();
    expect(container.querySelector('.sl-seal')?.textContent).toBe('SL');
    expect(container.querySelector('#write form')).not.toBeNull();
    expect(container.querySelector('.sl-skip')?.getAttribute('href')).toBe('#write');
    cleanup();
    page({ ...full, profile: { ...full.profile, signature: '' } });
    expect(screen.getByRole('heading', { name: S.shoreline.touchNoName })).toBeTruthy();
  });

  it('leaves the letter and skip link out when there is no site to send to', () => {
    const { container } = render(<ShorelineLanding data={full} tenantId={undefined} />);
    expect(container.querySelector('.sl-letter')).toBeNull();
    expect(container.querySelector('.sl-skip')).toBeNull();
  });

  it('ends with the footer, and drops the BohdiAI line when asked', () => {
    page();
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('link', { name: `${S.footer.creditPrefix} ${S.footer.creditBrand}` })).toBeTruthy();
    cleanup();
    render(<ShorelineLanding data={full} tenantId={TENANT} platformCredit={false} />);
    expect(within(screen.getByRole('contentinfo')).queryByText(S.footer.creditBrand, { exact: false })).toBeNull();
  });

  it('gives each print its own tilt and drop from the stylesheet, never inline', () => {
    const { container } = page();
    expect(container.querySelector('.sl-prints [style]')).toBeNull();
    expect(shorelineCss()).toContain('.sl-prints li:nth-child(6n+2){--r:0.8deg;--y:46px}');
  });
});

describe('shoreline content page', () => {
  it('renders the legal html on a sheet with the name linking home', () => {
    render(<ShorelineContentPage name="Saltmarsh & Lace" words={S} html="<h1>Privacy</h1><p>We keep little.</p>" />);
    expect(screen.getByRole('link', { name: S.shoreline.home }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy');
  });

  it('renders a title and paragraphs when there is no html', () => {
    render(<ShorelineContentPage name="Saltmarsh & Lace" words={S} title="Terms" body={['One.', 'Two.']} platformCredit={false} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Terms');
    expect(screen.getByText('Two.')).toBeTruthy();
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import { MAIN_STREET_SKINS } from './skins';
import { CollectionsBillboards, FindUsTicker, FounderPanel, GoodsReel, ReviewsSpotlight, SlamHero, slamLetters, slamSize } from './SpotlightPieces';
import { FAMILIES } from './families';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';

const W = { ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX), itemsOne: '{n} piece', items: '{n} pieces' };
const skin = MAIN_STREET_SKINS['main-street-reel']!;
const identity: MainStreetView['identity'] = { wordmark: 'Paper & Patina' };
const moment = {
  media: { kind: 'still', url: 'https://cdn/open.webp', alt: 'A box' },
  story: [],
  eyebrow: 'Decoupage',
  brand: 'Paper & Patina',
  sub: 'Boxes and trays made from old paper.',
  ctaLabel: 'See the work',
  ctaTarget: 'shop',
  secondaryCtaLabel: 'Find me',
  secondaryCtaTarget: 'events',
} as unknown as MainStreetView['moment'];

const piece = (n: number): ProductView => ({ slug: `p${n}`, name: `Piece ${n}`, price: `$${n}0`, description: '', status: 'active', media: [{ kind: 'image', url: `https://cdn/${n}.webp`, alt: `Piece ${n}` }], variations: [] });
const founder = {
  quote: 'I cut every piece by hand.',
  attribution: 'Mae',
  eyebrow: 'The maker',
  heading: 'Paper, glue and patience',
  photo: { url: 'https://cdn/mae.webp', alt: 'Mae' },
} as unknown as MainStreetView['founder'];

afterEach(cleanup);

describe('the Spotlight family', () => {
  it('wears its own pieces by default, the ticker right under the opening', () => {
    expect(FAMILIES.spotlight.sectionDefaults).toMatchObject({ hero: 'slam', goods: 'reel', founder: 'panel', collections: 'billboards', findUs: 'ticker', reviews: 'spotlight' });
    expect(FAMILIES.spotlight.sectionStack[1]?.section).toBe('findUs');
    expect(FAMILIES.spotlight.textureOpacity).toBe(0);
    expect(FAMILIES.spotlight.defaultSkin).toBe('main-street-reel');
  });
});

describe('slamLetters and slamSize', () => {
  it('numbers every letter across the whole name, word by word', () => {
    expect(slamLetters('Paper & Patina')).toEqual([
      { word: 'Paper', letters: [...'Paper'].map((ch, n) => ({ ch, n })) },
      { word: '&', letters: [{ ch: '&', n: 5 }] },
      { word: 'Patina', letters: [...'Patina'].map((ch, i) => ({ ch, n: 6 + i })) },
    ]);
  });
  it('sets a longer name smaller', () => {
    expect(slamSize('Tide')).toBe('l');
    expect(slamSize('Paper & Patina')).toBe('m');
    expect(slamSize('Saltmarsh & Lace Decoupage')).toBe('s');
    expect(slamSize('Extraordinarily')).toBe('s');
  });
  it('sets a headline that is a whole sentence as a sentence, smaller still when it runs long', () => {
    expect(slamSize('Hand-poured candles for dark rooms')).toBe('line');
    expect(slamSize('Tired old furniture and plain pieces, reborn in layers of paper, paint and pattern')).toBe('long');
  });
});

describe('SlamHero', () => {
  it('slams the name over the moment’s photo, read whole by screen readers, with its lines and buttons', () => {
    const { container } = render(<SlamHero identity={identity} moment={moment} words={W} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.getAttribute('aria-label')).toBe('Paper & Patina');
    expect(h1.getAttribute('data-size')).toBe('m');
    expect(container.querySelectorAll('.ms-sp-l')).toHaveLength(12);
    expect(container.querySelector('.ms-sp-hero-media img')?.getAttribute('alt')).toBe('A box');
    expect(container.querySelector('.ms-sp-kick')?.textContent).toBe('Decoupage');
    expect(container.querySelector('.ms-sp-sub')?.textContent).toBe('Boxes and trays made from old paper.');
    expect(screen.getByRole('link', { name: 'See the work' }).getAttribute('href')).toBe('/shop');
    expect(screen.getByRole('link', { name: 'Find me' }).getAttribute('href')).toBe('/events');
    expect(container.querySelector('[style]')).toBeNull();
  });
  it('caps the letter timing so a long name never needs a rule it doesn’t have', () => {
    const long = { ...moment, brand: 'The Very Long Name Of A Little Shop' } as unknown as MainStreetView['moment'];
    const { container } = render(<SlamHero identity={identity} moment={long} words={W} />);
    const ns = [...container.querySelectorAll('.ms-sp-l')].map((l) => Number(l.getAttribute('data-n')));
    expect(Math.max(...ns)).toBe(23);
  });
  it('with no photo, it stands on the page color', () => {
    const bare = { ...moment, media: { kind: 'still', alt: '' }, secondaryCtaLabel: undefined } as unknown as MainStreetView['moment'];
    const { container } = render(<SlamHero identity={identity} moment={bare} words={W} />);
    expect(container.querySelector('.ms-sp-hero--bare')).not.toBeNull();
    expect(container.querySelector('.ms-sp-hero-media')).toBeNull();
    expect(container.querySelectorAll('.ms-sp-go')).toHaveLength(1);
  });
});

describe('GoodsReel', () => {
  it('shows the work two to a row with quiet captions, each opening its page', () => {
    const { container } = render(<GoodsReel goods={{ title: 'The work', label: 'New' }} products={[piece(1), piece(2), piece(3)]} skin={skin} words={W} viewAll={{ href: '/shop', label: 'All the work' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The work');
    expect(container.querySelectorAll('.ms-sp-tile')).toHaveLength(3);
    expect(container.querySelector('.ms-sp-tile a')?.getAttribute('href')).toBe('/listings/p1');
    expect(container.querySelector('.ms-sp-cap-name')?.textContent).toBe('Piece 1');
    // The way on to the shop is the goods beat's own button, not a second one here.
    expect(screen.queryByRole('link', { name: 'All the work' })).toBeNull();
  });
});

describe('FounderPanel', () => {
  it('puts the heading, quote and signature on the color panel beside the portrait', () => {
    const { container } = render(<FounderPanel founder={founder} skin={skin} about={{ href: '/about', label: 'My story' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Paper, glue and patience');
    expect(container.querySelector('.ms-sp-panel-photo img')?.getAttribute('src')).toBe('https://cdn/mae.webp');
    expect(container.querySelector('.ms-sp-panel-sig')?.textContent).toBe('Mae');
    expect(screen.getByRole('link', { name: 'My story' }).getAttribute('href')).toBe('/about');
  });
  it('with no portrait, the panel is words only (no empty frame)', () => {
    const { container } = render(<FounderPanel founder={{ ...founder, photo: { alt: '' } }} skin={skin} />);
    expect(container.querySelector('.ms-sp-panel-photo')).toBeNull();
    expect(container.querySelector('.ms-sp-panel--words')).not.toBeNull();
  });
});

describe('CollectionsBillboards', () => {
  it('gives each collection a billboard with its name and count', () => {
    const items = [
      { slug: 'boxes', name: 'Boxes', count: 1, cover: { kind: 'image' as const, url: 'https://cdn/b.webp', alt: 'Boxes' } },
      { slug: 'trays', name: 'Trays', count: 3 },
    ];
    const { container } = render(<CollectionsBillboards section={{ title: 'Collections' }} items={items} skin={skin} words={W} />);
    expect(container.querySelectorAll('.ms-sp-board')).toHaveLength(2);
    expect(container.querySelector('.ms-sp-board')?.getAttribute('href')).toBe('/collections/boxes');
    expect([...container.querySelectorAll('.ms-sp-board-count')].map((c) => c.textContent)).toEqual(['1 piece', '3 pieces']);
  });
});

describe('ReviewsSpotlight', () => {
  it('sets each review large, signed', () => {
    const items = [{ quote: 'Stunning.', author: 'Ann', location: 'Newport' }];
    const { container } = render(<ReviewsSpotlight section={{ title: 'Said about it', items }} items={items} skin={skin} words={W} />);
    expect(container.querySelector('.ms-sp-say-quote')?.textContent).toBe('Stunning.');
    expect(container.querySelector('.ms-sp-say-who')?.textContent).toBe('Ann');
    expect(container.querySelector('.ms-sp-say-from')?.textContent).toBe('Newport');
  });
});

describe('FindUsTicker', () => {
  it('runs the dates twice for a seamless loop, the copy hidden from screen readers, one heading', () => {
    const events = [{ day: 'Sat Oct 18', where: 'Wickford', time: '9–3' }, { day: 'Sun Oct 19', where: 'Bristol', time: '' }];
    const { container } = render(<FindUsTicker section={{ label: 'Find me at', rows: events }} events={events} skin={skin} words={W} viewAll={{ href: '/events', label: 'Every date' }} />);
    const runs = container.querySelectorAll('.ms-sp-tick-run');
    expect(runs).toHaveLength(2);
    expect(runs[0]?.getAttribute('aria-hidden')).toBeNull();
    expect(runs[1]?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(container.querySelectorAll('[data-ms-fu-item]')).toHaveLength(2);
    expect(container.querySelector('[data-ms-fu-viewall]')?.getAttribute('href')).toBe('/events');
  });
});

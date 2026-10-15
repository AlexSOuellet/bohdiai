import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import { MAIN_STREET_SKINS } from './skins';
import { TradeCardHero } from './TradeCardHero';
import { GoodsScrapbook } from './GoodsScrapbook';
import { CollectionsDrawers, FindUsTickets, FounderCabinet, ReviewsPostcards } from './VintagePieces';
import { FAMILIES } from './families';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';

const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
const skin = MAIN_STREET_SKINS['main-street-parlor']!;
const identity: MainStreetView['identity'] = { wordmark: 'Saltmarsh & Lace' };
const moment = {
  media: { kind: 'still', url: 'https://cdn/open.webp', alt: 'A bottle' },
  story: [],
  eyebrow: 'Decoupage from Bristol',
  brand: 'Saltmarsh & Lace',
  sub: 'Old prints, given a second life.',
  ctaLabel: 'See the pieces',
  ctaTarget: 'shop',
  secondaryCtaLabel: 'Read the story',
  secondaryCtaTarget: 'about',
} as unknown as MainStreetView['moment'];

const piece = (n: number): ProductView => ({ slug: `p${n}`, name: `Piece ${n}`, price: `$${n}0`, description: '', status: 'active', media: [{ kind: 'image', url: `https://cdn/${n}.webp`, alt: `Piece ${n}` }], variations: [] });

afterEach(cleanup);

describe('the Vintage family wears its own scrapbook pieces', () => {
  it('picks them by default', () => {
    expect(FAMILIES.vintage.sectionDefaults).toMatchObject({ hero: 'trade-card', goods: 'scrapbook', founder: 'cabinet-card', collections: 'drawers', findUs: 'tickets', reviews: 'postcards' });
  });
});

describe('TradeCardHero', () => {
  it('sets the name in an ornamental card with its line, sentence and buttons, the photo pasted beside it', () => {
    const { container } = render(<TradeCardHero identity={identity} moment={moment} skin={skin} words={W} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Saltmarsh & Lace');
    expect(container.querySelectorAll('.ms-trade-corner')).toHaveLength(4);
    expect(container.querySelector('.ms-trade-eyebrow')?.textContent).toBe('Decoupage from Bristol');
    expect(screen.getByRole('link', { name: 'See the pieces' }).getAttribute('href')).toBe('/shop');
    expect(screen.getByRole('link', { name: 'Read the story' }).getAttribute('href')).toBe('/about');
    expect(container.querySelector('.ms-trade-scrap img')?.getAttribute('alt')).toBe('A bottle');
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('with no photo, the card stands alone; with no sentence, line or second button, they are left out', () => {
    const bare = { ...moment, media: { kind: 'still', alt: '' }, sub: undefined, eyebrow: '', secondaryCtaLabel: undefined, ctaTarget: undefined, secondaryCtaTarget: undefined } as unknown as MainStreetView['moment'];
    const { container } = render(<TradeCardHero identity={identity} moment={bare} skin={skin} words={W} />);
    expect(container.querySelector('.ms-trade-scrap')).toBeNull();
    expect(container.querySelector('.ms-trade-stage')?.getAttribute('data-photo')).toBe('false');
    expect(container.querySelector('.ms-trade-sub')).toBeNull();
    expect(container.querySelector('.ms-trade-eyebrow')).toBeNull();
    expect(container.querySelector('.ms-trade-cta2')).toBeNull();
    expect(screen.getByRole('link', { name: 'See the pieces' }).getAttribute('href')).toBe('/shop');
  });
});

describe('GoodsScrapbook', () => {
  it('pastes each piece on the album page with its corners and a tag, each opening its page', () => {
    const { container } = render(<GoodsScrapbook goods={{ title: 'From the workbench' }} products={[piece(1), piece(2)]} skin={skin} words={W} />);
    const links = container.querySelectorAll('[data-ms-scrap-piece]');
    expect([...links].map((a) => a.getAttribute('href'))).toEqual(['/listings/p1', '/listings/p2']);
    expect(links[0]?.querySelectorAll('.ms-scrap-corner')).toHaveLength(4);
    expect(links[0]?.querySelector('.ms-scrap-name')?.textContent).toBe('Piece 1');
    expect(links[0]?.querySelector('.ms-scrap-price')?.textContent).toBe('$10');
  });

  it('a piece with no photo still has its place', () => {
    const { container } = render(<GoodsScrapbook goods={{ title: 'Work' }} products={[{ ...piece(3), media: [] }]} skin={skin} words={W} />);
    expect(container.querySelector('.ms-scrap-photo .archetype-photo-empty')).not.toBeNull();
  });
});

describe('FounderCabinet', () => {
  const founder = { quote: 'Paper wants a second life.', attribution: 'Lena Brightman', photo: { kind: 'still', url: 'https://cdn/lena.webp', alt: 'Lena at her bench' } } as unknown as MainStreetView['founder'];

  it('mounts the portrait as a cabinet card with the maker’s words beside it, signed', () => {
    const { container } = render(<FounderCabinet founder={founder} skin={skin} about={{ href: '/about', label: 'Read the whole story' }} />);
    expect(container.querySelector('.ms-cab-window img')?.getAttribute('alt')).toBe('Lena at her bench');
    expect(container.querySelector('.ms-cab-imprint')?.textContent).toBe('Lena Brightman');
    expect(container.querySelector('.ms-cab-quote')?.textContent).toBe('Paper wants a second life.');
    expect(screen.getByRole('link', { name: 'Read the whole story' }).getAttribute('href')).toBe('/about');
  });

  it('has no story link on the About page itself', () => {
    const { container } = render(<FounderCabinet founder={founder} skin={skin} />);
    expect(container.querySelector('.ms-cab-cue')).toBeNull();
  });
});

describe('CollectionsDrawers', () => {
  it('gives each collection a drawer with a brass label and its count', () => {
    const items = [{ slug: 'bottles', name: 'Bottles', count: 3, cover: { kind: 'image' as const, url: 'https://cdn/b.webp', alt: 'Bottles' } }, { slug: 'boxes', name: 'Boxes', count: 1 }];
    const { container } = render(<CollectionsDrawers section={{ title: 'The cabinet', label: 'Browse' }} items={items} skin={skin} words={W} viewAll={{ href: '/collections', label: 'All collections' }} />);
    const drawers = container.querySelectorAll('.ms-drawer');
    expect([...drawers].map((d) => d.getAttribute('href'))).toEqual(['/collections/bottles', '/collections/boxes']);
    expect(drawers[0]?.querySelector('.ms-drawer-name')?.textContent).toBe('Bottles');
    expect(drawers[0]?.querySelector('.ms-drawer-count')?.textContent).toBe(W.items);
    expect(drawers[1]?.querySelector('.ms-drawer-count')?.textContent).toBe(W.itemsOne);
    expect(container.querySelector('.ms-drawers-eyebrow')?.textContent).toBe('Browse');
    expect(screen.getByRole('link', { name: 'All collections' }).getAttribute('href')).toBe('/collections');
  });

  it('leaves out the heading line and the link when there are none', () => {
    const { container } = render(<CollectionsDrawers section={{ title: 'The cabinet' }} items={[]} skin={skin} words={W} />);
    expect(container.querySelector('.ms-drawers-eyebrow')).toBeNull();
    expect(container.querySelector('.ms-drawers-all')).toBeNull();
  });
});

describe('FindUsTickets', () => {
  it('gives each market a ticket stub with its day, place and hours', () => {
    const events = [{ day: 'Sat Nov 7', where: 'Harvest Fair, Wickford', time: '9–4' }, { day: 'Sun Nov 8', where: 'Holiday Market', time: '' }];
    const { container } = render(<FindUsTickets section={{ label: 'Find me at', rows: events }} events={events} skin={skin} words={W} viewAll={{ href: '/events', label: 'Every market' }} />);
    const stubs = container.querySelectorAll('.ms-tix-stub');
    expect(stubs).toHaveLength(2);
    expect(stubs[0]?.querySelector('.ms-tix-day')?.textContent).toBe('Sat Nov 7');
    expect(stubs[0]?.querySelector('.ms-tix-time')?.textContent).toBe('9–4');
    expect(stubs[1]?.querySelector('.ms-tix-time')).toBeNull();
    expect(screen.getByRole('link', { name: 'Every market' }).getAttribute('href')).toBe('/events');
  });

  it('has no link when there is no markets page to go to', () => {
    const events = [{ day: 'Sat Nov 7', where: 'Fair', time: '' }];
    const { container } = render(<FindUsTickets section={{ label: 'Find me at', rows: events }} events={events} skin={skin} words={W} />);
    expect(container.querySelector('.ms-tix-all')).toBeNull();
  });
});

describe('ReviewsPostcards', () => {
  it('writes each review on a postcard with a stamp and postmark, signed where the address goes', () => {
    const items = [{ quote: 'Beautiful work.', author: 'Pat', location: 'Warren, RI' }, { quote: 'Lovely.', author: 'Sam' }];
    const { container } = render(<ReviewsPostcards section={{ title: 'Kind words', label: 'Letters', items }} items={items} skin={skin} words={W} viewAll={{ href: '/testimonials', label: 'All of them' }} />);
    const cards = container.querySelectorAll('.ms-post-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.querySelector('.ms-post-quote')?.textContent).toBe('Beautiful work.');
    expect(cards[0]?.querySelector('.ms-post-from')?.textContent).toBe('Warren, RI');
    expect(cards[1]?.querySelector('.ms-post-from')).toBeNull();
    expect(cards[0]?.querySelector('.ms-post-stamp')).not.toBeNull();
    expect(container.querySelector('.ms-post-eyebrow')?.textContent).toBe('Letters');
    expect(screen.getByRole('link', { name: 'All of them' }).getAttribute('href')).toBe('/testimonials');
  });

  it('leaves out the heading line and the link when there are none', () => {
    const { container } = render(<ReviewsPostcards section={{ title: 'Kind words', items: [] }} items={[{ quote: 'Yes.', author: 'A' }]} skin={skin} words={W} />);
    expect(container.querySelector('.ms-post-eyebrow')).toBeNull();
    expect(container.querySelector('.ms-post-all')).toBeNull();
  });
});

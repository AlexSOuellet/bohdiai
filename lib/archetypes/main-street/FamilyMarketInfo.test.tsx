import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX, type FamilyWords } from './words';
import { FamilyMarketInfo } from './FamilyMarketInfo';
import { MarketName } from './MarketName';
import type { MarketInfoView, ProductView } from '../content';

const K = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
/** Test words: every spot says its own key; the date and booth spots are filled in. */
const W: FamilyWords = { ...K, dateLocale: 'en-US', marketDay: '{weekday} {month} {day}', market: { ...K.market, separator: ' · ', booth: 'Booth {booth}' } };

const piece = (over: Partial<ProductView> = {}): ProductView => ({
  slug: 'tide',
  name: 'Tide candle',
  price: '$40',
  description: '',
  status: 'active',
  media: [{ kind: 'image', url: 'https://cdn/t.webp', alt: '' }],
  variations: [],
  ...over,
});
const market = (over: Partial<MarketInfoView> = {}): MarketInfoView => ({
  marketId: 'm1',
  name: 'Harvest Fair',
  date: '2026-10-17',
  endDate: '',
  town: 'Wickford',
  hours: '9am – 3pm',
  address: '1 Main St',
  booth: '12',
  url: 'https://harvest.example',
  state: 'before',
  pieces: [piece(), piece({ slug: 'moss', name: 'Moss bowl', status: 'sold_out' })],
  ...over,
});

afterEach(cleanup);

describe('FamilyMarketInfo — a market’s information page', () => {
  it('gives when and where, directions and the market’s website', () => {
    const { container } = render(<FamilyMarketInfo market={market()} words={W} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Harvest Fair');
    expect(container.querySelector('.ms-mi-day')?.textContent).toBe('Sat Oct 17');
    expect(container.querySelector('.ms-mi-facts')?.textContent).toBe('Wickford · 9am – 3pm · Booth 12');
    expect(screen.getByRole('link', { name: W.getDirections }).getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Wickford');
    expect(screen.getByRole('link', { name: W.market.website }).getAttribute('href')).toBe('https://harvest.example');
    expect(screen.getByRole('link', { name: W.market.allMarkets }).getAttribute('href')).toBe('/events');
  });

  it('shows what she’s bringing, each opening its own page, sold ones marked, and never a way to pay', () => {
    const { container } = render(<FamilyMarketInfo market={market()} words={W} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(W.market.bringing);
    expect(screen.getByRole('link', { name: /Tide candle/ }).getAttribute('href')).toBe('/listings/tide');
    expect(screen.getByRole('link', { name: /Moss bowl/ }).textContent).toContain(W.productSoldOut);
    expect(container.querySelector('.ms-mk-buy')).toBeNull();
    expect(container.textContent).not.toContain(W.market.pick);
  });

  it('says it’s coming soon while nothing is picked, and leaves out what isn’t filled in', () => {
    const { container } = render(<FamilyMarketInfo market={market({ pieces: [], address: '', url: '', hours: '', booth: '' })} words={W} />);
    expect(screen.getByText(W.market.soon)).toBeTruthy();
    expect(container.querySelector('.ms-mi-links')).toBeNull();
    expect(container.querySelector('.ms-mi-facts')?.textContent).toBe('Wickford');
  });

  it('says when the market is over or canceled instead of listing pieces', () => {
    const { rerender } = render(<FamilyMarketInfo market={market({ state: 'after' })} words={W} />);
    expect(screen.getByText(W.market.after)).toBeTruthy();
    expect(screen.queryByText(W.market.bringing)).toBeNull();
    rerender(<FamilyMarketInfo market={market({ state: 'canceled' })} words={W} />);
    expect(screen.getByText(W.market.canceled)).toBeTruthy();
  });
});

describe('MarketName', () => {
  it('links to the market’s page when it has one, and is plain text otherwise', () => {
    const { container, rerender } = render(<MarketName e={{ where: 'Harvest Fair', href: '/events/m1' }} />);
    expect(screen.getByRole('link', { name: 'Harvest Fair' }).getAttribute('href')).toBe('/events/m1');
    rerender(<MarketName e={{ where: 'Harvest Fair' }} />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toBe('Harvest Fair');
  });
});

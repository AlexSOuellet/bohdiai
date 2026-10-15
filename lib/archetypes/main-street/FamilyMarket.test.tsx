import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX, type FamilyWords } from './words';
import { FamilyMarket } from './FamilyMarket';
import type { MarketShopView, ProductView } from '../content';

const K = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
/** Test words: every spot says its own key; the date spots read a real locale. */
const W: FamilyWords = { ...K, dateLocale: 'en-US', marketDay: '{weekday} {month} {day}', market: { ...K.market, separator: ' · ' } };

const piece: ProductView = {
  slug: 'tide',
  name: 'Tide candle',
  price: '$40',
  salePrice: '$32',
  description: '',
  status: 'active',
  media: [{ kind: 'image', url: 'https://cdn/t.webp', alt: '' }],
  variations: [],
};
const market = (over: Partial<MarketShopView>): MarketShopView => ({
  marketId: 'm1', name: 'Harvest Fair', date: '2026-10-17', endDate: '', town: 'Wickford', booth: 'Booth 12', state: 'open', pieces: [piece], methods: ['cash'], ...over,
});

afterEach(cleanup);

describe('FamilyMarket — a market’s own page in the family look', () => {
  it('names the market, its day and where, with no menu or footer to lead away', () => {
    const { container } = render(<FamilyMarket shopName="Ember Candle Co" market={market({})} words={W} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Harvest Fair');
    expect(container.querySelector('.ms-mk-when')?.textContent).toBe('Sat Oct 17 · Wickford · Booth 12');
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('a[href="/shop"]')).toBeNull();
  });

  it('while open, offers her pieces to buy at the table', () => {
    const { container } = render(<FamilyMarket shopName="Ember Candle Co" market={market({})} words={W} />);
    expect(container.querySelector('.ms-mk-buy')).not.toBeNull();
    expect(screen.getByText('Tide candle')).toBeTruthy();
  });

  it('while open with no way to pay switched on, says to ask at the table', () => {
    render(<FamilyMarket shopName="Ember Candle Co" market={market({ methods: [] })} words={W} />);
    expect(screen.getByText(W.market.noPay)).toBeTruthy();
  });

  it('before the day, shows what she’s bringing at its sale price and the way to the shop', () => {
    const { container } = render(<FamilyMarket shopName="Ember Candle Co" market={market({ state: 'before' })} words={W} />);
    expect(screen.getByText(W.market.before)).toBeTruthy();
    expect(container.querySelector('.ms-mk-fee')?.textContent).toBe('$32');
    expect(screen.getByRole('link', { name: W.market.toShop }).getAttribute('href')).toBe('/shop');
  });

  it('after the day, or canceled, sends buyers to the shop', () => {
    render(<FamilyMarket shopName="Ember Candle Co" market={market({ state: 'after' })} words={W} />);
    expect(screen.getByText(W.market.after)).toBeTruthy();
    cleanup();
    render(<FamilyMarket shopName="Ember Candle Co" market={market({ state: 'canceled' })} words={W} />);
    expect(screen.getByText(W.market.canceled)).toBeTruthy();
    expect(screen.getByRole('link', { name: W.market.toShop })).toBeTruthy();
  });

  it('never uses inline styles', () => {
    const { container } = render(<FamilyMarket shopName="Ember Candle Co" market={market({ state: 'before' })} words={W} />);
    expect(container.querySelector('[style]')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { amount, roundUp, costToMake, priceIt, compareToOthers, marketDay, marketWorth, cents, dollars, markupText, type PriceInput, type MarketInput, type WorthInput } from './maths';

// The toolkit's own example: an 8 oz soy candle at CandleScience prices (Alex, 2026-10-24).
const candle = {
  yield: '12',
  batch: [
    { name: 'Soy wax, 10 lb bag', paid: '31.97', lasts: '2' },
    { name: 'Fragrance oil, 16 oz', paid: '30.77', lasts: '2.5' },
    { name: 'Wicks, pack of 100', paid: '9.93', lasts: '8' },
  ],
  piece: [
    { name: '8 oz jelly jar', each: '0.66' },
    { name: 'Gold lid', each: '0.33' },
  ],
  hours: '2',
  rate: '20',
};

const price = (over: Partial<PriceInput> = {}): PriceInput => ({
  materials: '3.45',
  time: '3.33',
  extras: '1.50',
  markup: 2.5,
  channels: new Set(),
  etsyPct: '9.5',
  etsyFix: '0.45',
  haggle: '15',
  sitePct: '3',
  siteFix: '0.30',
  consignPct: '30',
  consignRent: '0',
  consignSold: '10',
  ...over,
});

const day = (over: Partial<MarketInput> = {}): MarketInput => ({
  sales: '640',
  card: '380',
  cardRate: '3',
  booth: '75',
  gas: '18',
  food: '22',
  other: '15',
  materials: '160',
  hoursAtMarket: '7',
  hoursOther: '3',
  wage: '20',
  ...over,
});

describe('amount and roundUp', () => {
  it('reads a typed amount, treating blank, negative and nonsense as 0', () => {
    expect(amount('3.45')).toBe(3.45);
    expect(amount(7)).toBe(7);
    expect(amount('')).toBe(0);
    expect(amount('-2')).toBe(0);
    expect(amount('abc')).toBe(0);
    expect(amount(null)).toBe(0);
    expect(amount(undefined)).toBe(0);
    expect(amount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('rounds up to the dollar, but a whole dollar stays put', () => {
    expect(roundUp(20.7)).toBe(21);
    expect(roundUp(21)).toBe(21);
    expect(roundUp(21.0000000001)).toBe(21);
  });
});

describe('costToMake', () => {
  it('works out the candle: a share of the batch plus what every piece gets', () => {
    const r = costToMake(candle);
    expect(r.batch).toBeCloseTo(29.53425, 5);
    expect(r.shared).toBeCloseTo(2.4611875, 6);
    expect(r.piece).toBeCloseTo(0.99, 6);
    expect(r.materials).toBeCloseTo(3.45, 2);
    expect(r.time).toBeCloseTo(3.3333, 3);
    expect(r.withTime).toBeCloseTo(6.78, 2);
    expect(r.has).toBe(true);
  });

  it('counts a supply with no "batches it lasts" as one batch', () => {
    expect(costToMake({ ...candle, batch: [{ name: 'Clay', paid: '24', lasts: '' }] }).batch).toBe(24);
  });

  it('has no share and no time until it says how many the batch makes', () => {
    const r = costToMake({ ...candle, yield: '' });
    expect(r.shared).toBe(0);
    expect(r.time).toBe(0);
    expect(r.materials).toBeCloseTo(0.99, 6);
    expect(r.has).toBe(true);
    expect(costToMake({ yield: '', batch: [], piece: [], hours: '', rate: '' }).has).toBe(false);
  });
});

describe('priceIt', () => {
  it('gives the exact break-even, the price rounded up, and the shop price without other costs', () => {
    const r = priceIt(price());
    expect(r.cash).toBeCloseTo(4.95, 6);
    expect(r.breakEven).toBeCloseTo(8.28, 6);
    expect(r.fairRaw).toBeCloseTo(20.7, 6);
    expect(r.fair).toBe(21);
    expect(r.shopCost).toBeCloseTo(6.78, 6);
    expect(r.shop).toBe(17);
    expect(r.has).toBe(true);
  });

  it('follows the markup picked', () => {
    expect(priceIt(price({ markup: 2 })).fair).toBe(17);
    expect(priceIt(price({ markup: 3 })).fair).toBe(25);
  });

  it('prices each place she sells', () => {
    const r = priceIt(price({ channels: new Set(['markets', 'etsy', 'facebook', 'site', 'consign']) }));
    const by = Object.fromEntries(r.channels.map((c) => [c.channel, c]));
    expect(by['markets']).toEqual({ channel: 'markets', price: 21 });
    expect(by['etsy']?.price).toBe(24);
    expect(by['etsy']?.keeps).toBeCloseTo(21.27, 2);
    expect(by['facebook']).toEqual({ channel: 'facebook', price: 24, floor: 21 });
    expect(by['site']?.price).toBe(22);
    expect(by['consign']?.price).toBe(25);
    expect(by['consign']?.rentEach).toBe(0);
    expect(r.consignNeedsSold).toBe(false);
  });

  it('shares a consignment shop’s rent over the pieces that sell, and asks how many when it can’t', () => {
    const shared = priceIt(price({ channels: new Set(['consign']), consignRent: '50', consignSold: '10' })).channels[0];
    expect(shared?.rentEach).toBe(5);
    expect(shared?.price).toBe(roundUp((6.78 * 2.5 + 5) / 0.7));
    const missing = priceIt(price({ channels: new Set(['consign']), consignRent: '50', consignSold: '' }));
    expect(missing.consignNeedsSold).toBe(true);
    expect(missing.channels[0]?.rentEach).toBe(0);
  });

  it('caps the consignment cut at 90% and skips a place that takes everything', () => {
    expect(priceIt(price({ channels: new Set(['consign']), consignPct: '150' })).channels[0]?.price).toBe(roundUp((6.78 * 2.5) / 0.1));
    expect(priceIt(price({ channels: new Set(['etsy', 'site']), etsyPct: '100', sitePct: '120' })).channels).toEqual([]);
  });

  it('has nothing to show until there are costs', () => {
    const r = priceIt(price({ materials: '', time: '', extras: '', channels: new Set(['markets']) }));
    expect(r.has).toBe(false);
    expect(r.channels).toEqual([]);
  });
});

describe('compareToOthers', () => {
  const r = priceIt(price());

  it('says where her price sits among what others charge', () => {
    const c = compareToOthers(r, '16', '28');
    expect(c?.read).toBe('within');
    expect(c?.low).toBe(16);
    expect(c?.high).toBe(28);
    expect(c?.min).toBeCloseTo(8.28 * 0.85, 6);
    expect(c?.max).toBeCloseTo(28 * 1.1, 6);
    expect(c?.band.left).toBeGreaterThan(0);
    expect(c?.fairAt).toBeGreaterThan(c?.breakEvenAt ?? 100);
    expect(compareToOthers(r, '28', '16')?.low).toBe(16);
  });

  it('reads below, above, and costs above what others charge', () => {
    expect(compareToOthers(r, '30', '40')?.read).toBe('below');
    expect(compareToOthers(r, '10', '15')?.read).toBe('above');
    expect(compareToOthers(r, '5', '7')?.read).toBe('costs-above');
  });

  it('works from one price seen, and shows nothing with none or no costs', () => {
    expect(compareToOthers(r, '18', '')).toMatchObject({ low: 18, high: 18 });
    expect(compareToOthers(r, '', '18')).toMatchObject({ low: 18, high: 18 });
    expect(compareToOthers(r, '', '')).toBeNull();
    expect(compareToOthers({ ...r, has: false }, '16', '28')).toBeNull();
  });
});

describe('marketDay', () => {
  it('works out the example day: take-home, pay per hour, and the sales she’d need', () => {
    const r = marketDay(day());
    expect(r.cardFees).toBeCloseTo(11.4, 6);
    expect(r.totalCosts).toBeCloseTo(301.4, 6);
    expect(r.profit).toBeCloseTo(338.6, 6);
    expect(r.hours).toBe(10);
    expect(r.hourly).toBeCloseTo(33.86, 6);
    expect(r.verdict).toBe('worth');
    expect(r.salesNeeded).toBe(451);
    expect(r.costs.map((c) => c.kind)).toEqual(['materials', 'booth', 'gas', 'food', 'other', 'cardFees']);
  });

  it('never counts more card sales than sales', () => {
    expect(marketDay(day({ card: '9999' })).cardFees).toBeCloseTo(640 * 0.03, 6);
  });

  it('gives each verdict', () => {
    expect(marketDay(day({ sales: '', card: '', booth: '', gas: '', food: '', other: '', materials: '' })).verdict).toBe('empty');
    expect(marketDay(day({ sales: '100' })).verdict).toBe('lost');
    expect(marketDay(day({ hoursAtMarket: '', hoursOther: '' })).verdict).toBe('no-hours');
    expect(marketDay(day({ sales: '380', card: '' })).verdict).toBe('hard');
    expect(marketDay(day({ sales: '480', card: '' })).verdict).toBe('close');
    expect(marketDay(day({ wage: '' })).verdict).toBe('worth');
  });

  it('can’t work out the sales needed without a rate, hours and sales, or when costs eat every sale', () => {
    expect(marketDay(day({ wage: '' })).salesNeeded).toBeNull();
    expect(marketDay(day({ hoursAtMarket: '', hoursOther: '' })).salesNeeded).toBeNull();
    expect(marketDay(day({ sales: '' })).salesNeeded).toBeNull();
    expect(marketDay(day({ materials: '700' })).salesNeeded).toBe('never');
    expect(marketDay(day({ hoursAtMarket: '', hoursOther: '' })).hourly).toBe(0);
  });
});

describe('money in words', () => {
  it('shows cents, dollars and the markup', () => {
    expect(cents(3.4511)).toBe('$3.45');
    expect(cents(-12)).toBe('−$12.00');
    expect(cents(1234.5)).toBe('$1,234.50');
    expect(dollars(20.7)).toBe('$21');
    expect(dollars(-338.6)).toBe('−$339');
    expect(markupText(2.5)).toBe('2.5');
    expect(markupText(3)).toBe('3');
  });
});

describe('marketWorth (Alex, 2026-10-28)', () => {
  const W: WorthInput = { booth: '60', gas: '20', food: '15', other: '5', hoursAtMarket: '7', hoursOther: '3', wage: '20', price: '40', made: '10', cardShare: '50', cardRate: '3', guess: '' };

  it('works out what one piece earns and the pieces and sales to cover the day and to pay her', () => {
    const r = marketWorth(W);
    expect(r.dayCost).toBe(100);
    expect(r.hours).toBe(10);
    // 40 − 10 − 40 × 50% × 3% = 29.40
    expect(r.earns).toBeCloseTo(29.4);
    // 100 ÷ 29.40 → 4 pieces; (100 + 200) ÷ 29.40 → 11 pieces
    expect(r.cover).toEqual({ pieces: 4, sales: 160 });
    expect(r.pay).toEqual({ pieces: 11, sales: 440 });
    expect(r.verdict).toBe('no-guess');
  });

  it('gives a verdict against her guess', () => {
    expect(marketWorth({ ...W, guess: '150' }).verdict).toBe('hard');
    expect(marketWorth({ ...W, guess: '160' }).verdict).toBe('close');
    expect(marketWorth({ ...W, guess: '439' }).verdict).toBe('close');
    expect(marketWorth({ ...W, guess: '440' }).verdict).toBe('worth');
  });

  it('asks for what it needs, and says when a piece earns nothing', () => {
    const blank = { booth: '', gas: '', food: '', other: '', hoursAtMarket: '', hoursOther: '', wage: '', price: '', made: '', cardShare: '', cardRate: '', guess: '' };
    expect(marketWorth(blank).verdict).toBe('empty');
    expect(marketWorth({ ...W, price: '' }).verdict).toBe('no-sale');
    const lost = marketWorth({ ...W, made: '45', guess: '1000' });
    expect([lost.verdict, lost.cover, lost.pay]).toEqual(['no-margin', null, null]);
  });

  it('needs nothing when the day costs nothing, and caps the card share at all of it', () => {
    expect(marketWorth({ ...W, booth: '', gas: '', food: '', other: '', wage: '' }).cover).toEqual({ pieces: 0, sales: 0 });
    expect(marketWorth({ ...W, cardShare: '250' }).earns).toBeCloseTo(28.8);
  });
});

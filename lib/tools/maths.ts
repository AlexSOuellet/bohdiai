/**
 * The maker's money tools (Alex, 2026-10-24): what one piece costs to make, what to
 * charge for it, and whether a market day paid. The maths is Alex's agreed version
 * from the toolkit he built (Downloads/bohdiai/makers-toolkit.html); don't change it
 * without asking him. Every function takes numbers as typed (text) or as numbers and
 * treats anything blank, negative or not a number as 0.
 */

/** A typed amount: a positive number, or 0. */
export function amount(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '');
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Rounded up to a whole dollar; a hair over a whole number stays on it. */
export function roundUp(n: number): number {
  return Math.ceil(n - 1e-9);
}

// ── Cost to make ─────────────────────────────────────────────────────────────

/** A supply the batch uses up: what she paid, and how many batches it lasts. */
export type BatchSupply = { name: string; paid: string; lasts: string };
/** What every piece gets: the jar, the lid, the label. */
export type PieceItem = { name: string; each: string };

export type CostInput = {
  yield: string;
  batch: readonly BatchSupply[];
  piece: readonly PieceItem[];
  hours: string;
  rate: string;
};

export type CostResult = {
  /** What this batch used of its supplies. */
  batch: number;
  /** What every piece gets, for one piece. */
  piece: number;
  pieces: number;
  /** One piece's share of the batch supplies. */
  shared: number;
  /** Materials for one piece. */
  materials: number;
  /** Her pay for one piece. */
  time: number;
  withTime: number;
  /** Enough is filled in to give a cost. */
  has: boolean;
};

export function costToMake(input: CostInput): CostResult {
  const batch = input.batch.reduce((n, s) => n + amount(s.paid) / (amount(s.lasts) || 1), 0);
  const piece = input.piece.reduce((n, p) => n + amount(p.each), 0);
  const pieces = amount(input.yield);
  const shared = pieces > 0 ? batch / pieces : 0;
  const materials = shared + piece;
  const time = pieces > 0 ? (amount(input.hours) * amount(input.rate)) / pieces : 0;
  return { batch, piece, pieces, shared, materials, time, withTime: materials + time, has: pieces > 0 || piece > 0 };
}

// ── Price it ─────────────────────────────────────────────────────────────────

export const MARKUPS = [2, 2.5, 3] as const;
export type Markup = (typeof MARKUPS)[number];

export type Channel = 'markets' | 'etsy' | 'facebook' | 'site' | 'consign';
export const CHANNELS: readonly Channel[] = ['markets', 'etsy', 'facebook', 'site', 'consign'];

export type PriceInput = {
  materials: string;
  time: string;
  extras: string;
  markup: Markup;
  channels: ReadonlySet<Channel>;
  etsyPct: string;
  etsyFix: string;
  haggle: string;
  sitePct: string;
  siteFix: string;
  consignPct: string;
  consignRent: string;
  consignSold: string;
};

export type ChannelPrice = {
  channel: Channel;
  price: number;
  /** What she keeps after the place's cut (Etsy, her website, the consignment shop). */
  keeps?: number;
  /** The lowest to come down to (Facebook). */
  floor?: number;
  /** The consignment shop's rent, shared over the pieces that sell. */
  rentEach?: number;
};

export type PriceResult = {
  materials: number;
  extras: number;
  time: number;
  /** Below this she loses money: materials plus other costs. */
  cash: number;
  /** Break-even, exact to the cent: cash plus her time. Never rounded. */
  breakEven: number;
  /** Break-even times the markup, before rounding. */
  fairRaw: number;
  /** Her price: rounded up to a whole dollar. */
  fair: number;
  /** What a shop pays: (materials + time) times the markup, rounded up. Other costs
   *  are left out because the shop does the selling. */
  shopCost: number;
  shop: number;
  channels: ChannelPrice[];
  /** The consignment price needs how many sell a month, and it isn't filled in. */
  consignNeedsSold: boolean;
  has: boolean;
};

/** A price that keeps `want` after a cut of `pct` (0–1) plus a fixed fee. */
function grossUp(want: number, pct: number, fix: number): number {
  return roundUp((want + fix) / (1 - pct));
}

export function priceIt(input: PriceInput): PriceResult {
  const materials = amount(input.materials);
  const extras = amount(input.extras);
  const time = amount(input.time);
  const cash = materials + extras;
  const breakEven = cash + time;
  const fairRaw = breakEven * input.markup;
  const shopCost = materials + time;
  const shop = roundUp(shopCost * input.markup);
  const has = breakEven > 0;
  const channels: ChannelPrice[] = [];
  const on = input.channels;
  let consignNeedsSold = false;
  if (has) {
    if (on.has('markets')) channels.push({ channel: 'markets', price: roundUp(fairRaw) });
    if (on.has('etsy')) {
      const pct = amount(input.etsyPct) / 100;
      const fix = amount(input.etsyFix);
      if (pct < 1) {
        const price = grossUp(fairRaw, pct, fix);
        channels.push({ channel: 'etsy', price, keeps: price - price * pct - fix });
      }
    }
    if (on.has('facebook')) channels.push({ channel: 'facebook', price: roundUp(fairRaw * (1 + amount(input.haggle) / 100)), floor: roundUp(fairRaw) });
    if (on.has('site')) {
      const pct = amount(input.sitePct) / 100;
      const fix = amount(input.siteFix);
      if (pct < 1) {
        const price = grossUp(fairRaw, pct, fix);
        channels.push({ channel: 'site', price, keeps: price - price * pct - fix });
      }
    }
    if (on.has('consign')) {
      const pct = Math.min(amount(input.consignPct), 90) / 100;
      const rent = amount(input.consignRent);
      const sold = amount(input.consignSold);
      const rentEach = rent > 0 && sold > 0 ? rent / sold : 0;
      const price = roundUp((shopCost * input.markup + rentEach) / (1 - pct));
      consignNeedsSold = rent > 0 && sold === 0;
      channels.push({ channel: 'consign', price, keeps: price * (1 - pct), rentEach });
    }
  }
  return { materials, extras, time, cash, breakEven, fairRaw, fair: roundUp(fairRaw), shopCost, shop, channels, consignNeedsSold, has };
}

/** Where her price sits against the lowest and highest she's seen. */
export type CompareRead = 'costs-above' | 'below' | 'above' | 'within';

export type Compare = {
  read: CompareRead;
  low: number;
  high: number;
  /** The track's ends, and where each mark sits on it (0–100). */
  min: number;
  max: number;
  band: { left: number; width: number };
  breakEvenAt: number;
  fairAt: number;
};

/** Null until she's priced it and typed at least one of the two. */
export function compareToOthers(price: Pick<PriceResult, 'breakEven' | 'fair' | 'has'>, lowText: string, highText: string): Compare | null {
  const a0 = amount(lowText);
  const b0 = amount(highText);
  const lo = Math.min(a0, b0) || 0;
  const hi = Math.max(a0, b0) || 0;
  if (!price.has || (lo === 0 && hi === 0)) return null;
  const low = lo || hi;
  const high = hi || lo;
  const min = Math.min(low, price.breakEven) * 0.85;
  const max = Math.max(high, price.fair) * 1.1;
  const at = (v: number): number => ((v - min) / (max - min)) * 100;
  const read: CompareRead = price.breakEven > high ? 'costs-above' : price.fair < low ? 'below' : price.fair > high ? 'above' : 'within';
  return {
    read,
    low,
    high,
    min,
    max,
    band: { left: at(low), width: (Math.max(high - low, 0) / (max - min)) * 100 },
    breakEvenAt: at(price.breakEven),
    fairAt: at(price.fair),
  };
}

// ── Market day ───────────────────────────────────────────────────────────────

export type MarketInput = {
  sales: string;
  card: string;
  cardRate: string;
  booth: string;
  gas: string;
  food: string;
  other: string;
  materials: string;
  hoursAtMarket: string;
  hoursOther: string;
  wage: string;
};

export type MarketCost = 'materials' | 'booth' | 'gas' | 'food' | 'other' | 'cardFees';

export type Verdict = 'empty' | 'lost' | 'no-hours' | 'hard' | 'close' | 'worth';

export type MarketResult = {
  sales: number;
  cardFees: number;
  costs: { kind: MarketCost; amount: number }[];
  totalCosts: number;
  /** What she took home. Negative when costs beat sales. */
  profit: number;
  hours: number;
  hourly: number;
  wage: number;
  verdict: Verdict;
  /** Sales she'd need to pay herself her rate at this market. Null when it can't be
   *  worked out; 'never' when materials and fees eat every sale. */
  salesNeeded: number | 'never' | null;
};

export function marketDay(input: MarketInput): MarketResult {
  const sales = amount(input.sales);
  const card = Math.min(amount(input.card), sales);
  const rate = amount(input.cardRate) / 100;
  const cardFees = card * rate;
  const costs: MarketResult['costs'] = [
    { kind: 'materials', amount: amount(input.materials) },
    { kind: 'booth', amount: amount(input.booth) },
    { kind: 'gas', amount: amount(input.gas) },
    { kind: 'food', amount: amount(input.food) },
    { kind: 'other', amount: amount(input.other) },
    { kind: 'cardFees', amount: cardFees },
  ];
  const totalCosts = costs.reduce((n, c) => n + c.amount, 0);
  const profit = sales - totalCosts;
  const hours = amount(input.hoursAtMarket) + amount(input.hoursOther);
  const hourly = hours > 0 ? profit / hours : 0;
  const wage = amount(input.wage);

  let verdict: Verdict;
  if (sales === 0 && totalCosts === 0) verdict = 'empty';
  else if (profit < 0) verdict = 'lost';
  else if (hours === 0) verdict = 'no-hours';
  else if (wage > 0 && hourly < wage * 0.5) verdict = 'hard';
  else if (wage > 0 && hourly < wage) verdict = 'close';
  else verdict = 'worth';

  let salesNeeded: MarketResult['salesNeeded'] = null;
  if (wage > 0 && hours > 0 && sales > 0) {
    const fixed = amount(input.booth) + amount(input.gas) + amount(input.food) + amount(input.other);
    const denom = 1 - amount(input.materials) / sales - (card / sales) * rate;
    salesNeeded = denom > 0 ? Math.ceil((fixed + wage * hours) / denom) : 'never';
  }
  return { sales, cardFees, costs, totalCosts, profit, hours, hourly, wage, verdict, salesNeeded };
}

// ── Is this market worth it? ─────────────────────────────────────────────────
// Before paying for the booth (Alex, 2026-10-28; replaces Market day in the Tools).

export type WorthInput = {
  booth: string;
  gas: string;
  food: string;
  other: string;
  hoursAtMarket: string;
  hoursOther: string;
  wage: string;
  /** What an average piece sells for, and what it costs her to make. */
  price: string;
  made: string;
  /** The share of sales paid by card, and the card fee, both percents. */
  cardShare: string;
  cardRate: string;
  /** What she thinks she'll sell, in dollars; blank for no guess. */
  guess: string;
};

export type WorthVerdict = 'empty' | 'no-sale' | 'no-margin' | 'no-guess' | 'hard' | 'close' | 'worth';

export type WorthNeed = { pieces: number; sales: number };

export type WorthResult = {
  /** Booth, travel, food and other. */
  dayCost: number;
  hours: number;
  wage: number;
  /** What one typical piece earns once it's made and the card fee is paid. */
  earns: number;
  /** Just to cover the day, and to also pay herself her rate. Null when a piece earns nothing. */
  cover: WorthNeed | null;
  pay: WorthNeed | null;
  verdict: WorthVerdict;
};

export function marketWorth(input: WorthInput): WorthResult {
  const dayCost = amount(input.booth) + amount(input.gas) + amount(input.food) + amount(input.other);
  const hours = amount(input.hoursAtMarket) + amount(input.hoursOther);
  const wage = amount(input.wage);
  const price = amount(input.price);
  const card = (Math.min(amount(input.cardShare), 100) / 100) * (amount(input.cardRate) / 100);
  const earns = price - amount(input.made) - price * card;
  const need = (total: number): WorthNeed => {
    const pieces = Math.ceil(total / earns);
    return { pieces, sales: pieces * price };
  };
  const cover = earns > 0 ? need(dayCost) : null;
  const pay = earns > 0 ? need(dayCost + hours * wage) : null;
  const guess = input.guess.trim() === '' ? null : amount(input.guess);

  let verdict: WorthVerdict;
  if (dayCost === 0 && price === 0) verdict = 'empty';
  else if (price === 0) verdict = 'no-sale';
  else if (cover === null || pay === null) verdict = 'no-margin';
  else if (guess === null) verdict = 'no-guess';
  else if (guess < cover.sales) verdict = 'hard';
  else if (guess < pay.sales) verdict = 'close';
  else verdict = 'worth';
  return { dayCost, hours, wage, earns, cover, pay, verdict };
}

// ── Monthly goal ─────────────────────────────────────────────────────────────
// What she wants to make in a month, in pieces and markets (Alex, 2026-10-28).

export type GoalInput = {
  /** What she wants to make in a month, after what the pieces cost to make. */
  goal: string;
  price: string;
  made: string;
  /** How many pieces she usually sells at one market; blank leaves markets out. */
  perMarket: string;
};

export type GoalVerdict = 'empty' | 'no-sale' | 'no-margin' | 'ok';

export type GoalResult = {
  earns: number;
  /** Pieces to sell in the month, the sales they make, and the markets that takes. */
  pieces: number | null;
  sales: number | null;
  markets: number | null;
  verdict: GoalVerdict;
};

export function monthlyGoal(input: GoalInput): GoalResult {
  const goal = amount(input.goal);
  const price = amount(input.price);
  const earns = price - amount(input.made);
  const perMarket = amount(input.perMarket);
  let verdict: GoalVerdict;
  if (goal === 0) verdict = 'empty';
  else if (price === 0) verdict = 'no-sale';
  else if (earns <= 0) verdict = 'no-margin';
  else verdict = 'ok';
  if (verdict !== 'ok') return { earns, pieces: null, sales: null, markets: null, verdict };
  const pieces = roundUp(goal / earns);
  return { earns, pieces, sales: pieces * price, markets: perMarket > 0 ? roundUp(pieces / perMarket) : null, verdict };
}

// ── Shipping ─────────────────────────────────────────────────────────────────
// What one order really costs to ship, and what to charge (Alex, 2026-10-28). She
// looks up the postage herself; nothing is fetched from a carrier.

export type ShipInput = {
  box: string;
  padding: string;
  postage: string;
  /** The card fee on what she charges for shipping, a percent; blank for none. */
  cardRate: string;
};

export type ShipResult = {
  cost: number;
  /** What to charge so the card fee on it still leaves the whole cost: cost ÷ (1 − fee), up to the cent. */
  charge: number;
  cardFee: number;
};

export function shipping(input: ShipInput): ShipResult {
  const cost = amount(input.box) + amount(input.padding) + amount(input.postage);
  const rate = Math.min(amount(input.cardRate), 99) / 100;
  const charge = Math.max(0, roundUp((cost / (1 - rate)) * 100)) / 100;
  return { cost, charge, cardFee: charge - cost };
}

// ── Money in words ───────────────────────────────────────────────────────────

/** $3.45, or −$3.45. */
export function cents(n: number): string {
  return `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** $24, or −$24 (rounded to the dollar for showing; the maths keeps the cents). */
export function dollars(n: number): string {
  return `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** The markup in words: 2.5 → "2.5", 3 → "3". */
export function markupText(m: Markup): string {
  return m % 1 === 0 ? m.toFixed(0) : String(m);
}

/**
 * Promotions — the one place a sale or a discount code turns into money off.
 * Pure: callers load the shop's promotions and its "today" (in the shop's own
 * time zone) and pass them in.
 *
 * - A sale takes its percent off every piece while it runs (no code).
 * - A code takes a percent or an amount off the order.
 * - They don't stack: the shopper gets whichever saves more.
 * Order lines keep their full prices; the order carries the discount.
 */
import { formatPrice } from './catalog';

export type Promotion = {
  id: string;
  kind: 'sale' | 'code';
  name: string;
  code: string | null;
  percentOff: number | null;
  amountOffCents: number | null;
  startsOn: string | null;
  endsOn: string | null;
  maxUses: number | null;
  uses: number;
  active: boolean;
};

export const PROMO_COOKIE = 'bohdi_promo';

/** "YYYY-MM-DD" today in the shop's time zone. */
export function shopToday(timeZone: string | null, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone ?? 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
}

/** On, and today is inside its days. */
export function isRunning(p: Promotion, today: string): boolean {
  if (!p.active) return false;
  if (p.startsOn !== null && today < p.startsOn) return false;
  if (p.endsOn !== null && today > p.endsOn) return false;
  return true;
}

/** The running sale with the biggest percent off, if any. */
export function runningSale(promos: readonly Promotion[], today: string): Promotion | null {
  let best: Promotion | null = null;
  for (const p of promos) {
    if (p.kind !== 'sale' || p.percentOff === null || !isRunning(p, today)) continue;
    if (best === null || p.percentOff > (best.percentOff ?? 0)) best = p;
  }
  return best;
}

/** Codes are typed loosely; they're stored upper-case with no spaces. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export type CodeCheck = { ok: true; promo: Promotion } | { ok: false; error: string };

export function checkCode(promos: readonly Promotion[], raw: string, today: string): CodeCheck {
  const code = normalizeCode(raw);
  const p = promos.find((x) => x.kind === 'code' && x.code === code);
  if (p === undefined || !p.active || (p.startsOn !== null && today < p.startsOn)) {
    return { ok: false, error: 'That code isn’t valid.' };
  }
  if (p.endsOn !== null && today > p.endsOn) return { ok: false, error: 'That code has ended.' };
  if (p.maxUses !== null && p.uses >= p.maxUses) return { ok: false, error: 'That code has been used up.' };
  return { ok: true, promo: p };
}

/** A piece's price on sale: the percent off, rounded to the cent. */
export function salePriceCents(priceCents: number, percentOff: number): number {
  return priceCents - Math.round((priceCents * percentOff) / 100);
}

export type Discount = {
  cents: number;
  /** What the order records and the shopper sees: the code, or the sale's name. */
  label: string;
  /** Set for a code, so the order can count its use. */
  promotionId: string | null;
  source: 'sale' | 'code';
};

/** The best of the running sale and the shopper's code on these line prices. */
export function bestDiscount(linePrices: readonly number[], sale: Promotion | null, code: Promotion | null): Discount | null {
  const subtotal = linePrices.reduce((s, c) => s + c, 0);
  const options: Discount[] = [];
  if (sale !== null && sale.percentOff !== null) {
    const cents = linePrices.reduce((s, c) => s + (c - salePriceCents(c, sale.percentOff ?? 0)), 0);
    options.push({ cents, label: sale.name, promotionId: null, source: 'sale' });
  }
  if (code !== null && code.code !== null) {
    const cents =
      code.percentOff !== null ? Math.round((subtotal * code.percentOff) / 100) : Math.min(code.amountOffCents ?? 0, subtotal);
    options.push({ cents, label: code.code, promotionId: code.id, source: 'code' });
  }
  const best = options.filter((o) => o.cents > 0).sort((a, b) => b.cents - a.cents)[0];
  return best ?? null;
}

/** "10% off" / "$15 off" for the owner and the shopper. */
export function offLabel(p: Pick<Promotion, 'percentOff' | 'amountOffCents'>): string {
  return p.percentOff !== null ? `${p.percentOff}% off` : `${formatPrice(p.amountOffCents ?? 0)} off`;
}

/** Products wearing the running sale's price (their `price` stays the full one). */
export function withSale<T extends { priceCents?: number; salePrice?: string }>(products: readonly T[], sale: Pick<Promotion, 'percentOff'> | null): T[] {
  if (sale === null || sale.percentOff === null) return [...products];
  const pct = sale.percentOff;
  return products.map((p) => (p.priceCents === undefined || p.priceCents <= 0 ? p : { ...p, salePrice: formatPrice(salePriceCents(p.priceCents, pct)) }));
}

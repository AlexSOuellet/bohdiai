/**
 * Sell at the table (the Lite point of sale, Saltmarsh & Lace demo spec): she taps
 * the pieces the buyer is taking, sees the running total, and shows the buyer how
 * to pay — a QR that opens Venmo or Cash App with the amount filled in, her Zelle
 * address, or the cash to take. Pure, so the money and the pay step are testable.
 */
import { formatPrice } from '@/lib/storefront/catalog';
import { cashAppLink, venmoLink, type PaySettings } from '@/lib/market/pay';

/** One thing she can ring up: a piece, or one option of it. `id` is the line's own key;
 *  `left` is what's left of it at this market (null: not counted). */
export type SellPiece = { id: string; listingId: string; variantId: string | null; name: string; priceCents: number; price: string; left: number | null };

/** What's in the sale: how many of each line, by line id. */
export type Picked = Readonly<Record<string, number>>;

/** One more of a line, when there's one left to take. */
export function addOne(picked: Picked, piece: SellPiece): Picked {
  const now = picked[piece.id] ?? 0;
  if (piece.left !== null && now >= piece.left) return picked;
  return { ...picked, [piece.id]: now + 1 };
}

/** One fewer of a line; at none it leaves the sale. */
export function takeOne(picked: Picked, id: string): Picked {
  const now = picked[id] ?? 0;
  if (now <= 1) return Object.fromEntries(Object.entries(picked).filter(([k]) => k !== id));
  return { ...picked, [id]: now - 1 };
}

export function pickedCount(picked: Picked): number {
  return Object.values(picked).reduce((n, q) => n + q, 0);
}

export type SellMethod = 'venmo' | 'cashapp' | 'zelle' | 'cash';

export const SELL_METHOD_NAMES: Record<SellMethod, string> = { venmo: 'Venmo', cashapp: 'Cash App', zelle: 'Zelle', cash: 'Cash' };

/** The ways she takes payment, in the order the buttons show. */
export function sellMethods(s: PaySettings): SellMethod[] {
  const on: SellMethod[] = [];
  if (s.venmoOn && s.venmo !== '') on.push('venmo');
  if (s.cashappOn && s.cashapp !== '') on.push('cashapp');
  if (s.zelleOn && s.zelle !== '') on.push('zelle');
  if (s.cashOn) on.push('cash');
  return on;
}

/** A price agreed with the buyer for a line (haggling, Alex 2026-10-21): what that
 *  line comes to, in cents, by line id. Lines without one sell at their marked price. */
export type Agreed = Readonly<Record<string, number>>;

/** What a line comes to: the agreed price, or the marked price times how many. */
export function lineCents(piece: SellPiece, quantity: number, agreed: Agreed = {}): number {
  return agreed[piece.id] ?? piece.priceCents * quantity;
}

export function sellTotalCents(pieces: readonly SellPiece[], picked: Picked, agreed: Agreed = {}): number {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  return Object.entries(picked).reduce((sum, [id, q]) => {
    const piece = byId.get(id);
    return piece === undefined ? sum : sum + lineCents(piece, q, agreed);
  }, 0);
}

export function sellTotal(pieces: readonly SellPiece[], picked: Picked, agreed: Agreed = {}): string {
  return formatPrice(sellTotalCents(pieces, picked, agreed));
}

/** The price she typed for a line ("15", "$15", "14.50"): cents, from nothing up to
 *  the line's marked price. Haggling only ever comes down. */
export function readAgreed(text: string, markedCents: number): { ok: true; cents: number } | { ok: false; error: string } {
  const clean = text.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(clean)) return { ok: false, error: 'Type the price you agreed, like 15 or 14.50.' };
  const cents = Math.round(Number(clean) * 100);
  if (cents > markedCents) return { ok: false, error: `That’s more than the marked ${formatPrice(markedCents)}.` };
  return { ok: true, cents };
}

export type PayStep = { kind: 'qr'; url: string; label: string } | { kind: 'text'; label: string; text: string } | { kind: 'cash'; label: string };

/** What she shows the buyer for `method` and `cents`. */
export function payStep(method: SellMethod, s: PaySettings, cents: number, note: string): PayStep {
  if (method === 'venmo') return { kind: 'qr', url: venmoLink(s.venmo, cents, note), label: `Scan to pay ${formatPrice(cents)} with Venmo` };
  if (method === 'cashapp') return { kind: 'qr', url: cashAppLink(s.cashapp, cents), label: `Scan to pay ${formatPrice(cents)} with Cash App` };
  if (method === 'zelle') return { kind: 'text', label: `Zelle ${formatPrice(cents)} to`, text: s.zelle };
  return { kind: 'cash', label: `Take ${formatPrice(cents)} in cash` };
}

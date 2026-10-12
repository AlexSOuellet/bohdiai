/**
 * Sell at the table (the Lite point of sale, Saltmarsh & Lace demo spec): she taps
 * the pieces the buyer is taking, sees the running total, and shows the buyer how
 * to pay — a QR that opens Venmo or Cash App with the amount filled in, her Zelle
 * address, or the cash to take. Pure, so the money and the pay step are testable.
 */
import { formatPrice } from '@/lib/storefront/catalog';
import { cashAppLink, venmoLink, type PaySettings } from '@/lib/market/pay';

export type SellPiece = { id: string; name: string; priceCents: number; price: string };

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

export function sellTotalCents(pieces: readonly SellPiece[], picked: readonly string[]): number {
  const byId = new Map(pieces.map((p) => [p.id, p.priceCents]));
  return picked.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0);
}

export function sellTotal(pieces: readonly SellPiece[], picked: readonly string[]): string {
  return formatPrice(sellTotalCents(pieces, picked));
}

export type PayStep = { kind: 'qr'; url: string; label: string } | { kind: 'text'; label: string; text: string } | { kind: 'cash'; label: string };

/** What she shows the buyer for `method` and `cents`. */
export function payStep(method: SellMethod, s: PaySettings, cents: number, note: string): PayStep {
  if (method === 'venmo') return { kind: 'qr', url: venmoLink(s.venmo, cents, note), label: `Scan to pay ${formatPrice(cents)} with Venmo` };
  if (method === 'cashapp') return { kind: 'qr', url: cashAppLink(s.cashapp, cents), label: `Scan to pay ${formatPrice(cents)} with Cash App` };
  if (method === 'zelle') return { kind: 'text', label: `Zelle ${formatPrice(cents)} to`, text: s.zelle };
  return { kind: 'cash', label: `Take ${formatPrice(cents)} in cash` };
}

/**
 * The market page's buyer steps (Market POS piece 2): what a buyer sends to put a
 * piece on hold, and the payment step they get back — the amount and how to pay
 * her. Pure; the routes in app/api/market do the reads and writes.
 */
import { z } from 'zod';
import { cashAppLink, venmoLink, type PayMethod, type PaySettings } from './pay';

export const holdSchema = z.object({
  eventId: z.string().uuid(),
  listingId: z.string().uuid(),
  name: z.string().trim().min(1, 'Please type your first name.').max(40, 'Just your first name, please.'),
  email: z.union([z.literal(''), z.string().trim().toLowerCase().email('That email doesn’t look right.').max(254)]).default(''),
  method: z.enum(['venmo', 'cashapp', 'zelle', 'cash']),
  code: z.string().trim().max(40).default(''),
});

export type HoldInput = z.infer<typeof holdSchema>;

export const orderRefSchema = z.object({ orderId: z.string().uuid() });

/** How the buyer pays: an app link, a handle to copy, or "at the table". */
export type PayStep =
  | { method: 'venmo' | 'cashapp'; link: string; handle: string }
  | { method: 'zelle'; handle: string }
  | { method: 'cash' };

export function payStep(settings: PaySettings, method: PayMethod, cents: number, note: string): PayStep | null {
  switch (method) {
    case 'venmo':
      return settings.venmoOn && settings.venmo !== '' ? { method, link: venmoLink(settings.venmo, cents, note), handle: `@${settings.venmo}` } : null;
    case 'cashapp':
      return settings.cashappOn && settings.cashapp !== '' ? { method, link: cashAppLink(settings.cashapp, cents), handle: `$${settings.cashapp}` } : null;
    case 'zelle':
      return settings.zelleOn && settings.zelle !== '' ? { method, handle: settings.zelle } : null;
    case 'cash':
      return settings.cashOn ? { method } : null;
  }
}

/** The note on a Venmo payment, so she can match it: "Rose n’ Cat · Theo · #1004". */
export function payNote(shop: string, piece: string, orderNumber: string): string {
  return `${shop} · ${piece} · #${orderNumber}`;
}

/** Where a market stands today: taking orders only on its days. */
export type MarketState = 'before' | 'open' | 'after' | 'canceled';

export function marketState(m: { date: string; endDate: string; canceled: boolean }, today: string): MarketState {
  if (m.canceled) return 'canceled';
  if (today < m.date) return 'before';
  if (today > (m.endDate === '' ? m.date : m.endDate)) return 'after';
  return 'open';
}

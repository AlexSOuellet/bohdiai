/**
 * Market results (Full; Saltmarsh & Lace demo spec): which markets made money, this
 * year against last. Takings are her paid market sales (orders tagged to the
 * market); costs are what she logged on the market (booth fee, gas). Worked out
 * fresh from those rows each time, never stored.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatPrice } from '@/lib/storefront/catalog';

export type MarketResult = {
  id: string;
  name: string;
  date: string;
  town: string;
  rating: number;
  sales: number;
  takingsCents: number;
  costsCents: number;
  profitCents: number;
};

export type YearTotals = { year: number; markets: number; takingsCents: number; costsCents: number; profitCents: number };

export type MarketInput = { id: string; name: string; date: string; town: string; canceled: boolean; rating: number; costsCents: number };
export type SaleInput = { eventId: string; totalCents: number };

/** Each market's takings, costs and profit; canceled markets are left out. */
export function marketResults(markets: readonly MarketInput[], sales: readonly SaleInput[]): MarketResult[] {
  const takings = new Map<string, { cents: number; count: number }>();
  for (const s of sales) {
    const t = takings.get(s.eventId) ?? { cents: 0, count: 0 };
    takings.set(s.eventId, { cents: t.cents + s.totalCents, count: t.count + 1 });
  }
  return markets
    .filter((m) => !m.canceled)
    .map((m) => {
      const t = takings.get(m.id) ?? { cents: 0, count: 0 };
      return { id: m.id, name: m.name, date: m.date, town: m.town, rating: m.rating, sales: t.count, takingsCents: t.cents, costsCents: m.costsCents, profitCents: t.cents - m.costsCents };
    });
}

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export function yearTotals(results: readonly MarketResult[], year: number): YearTotals {
  const inYear = results.filter((r) => yearOf(r.date) === year);
  const sum = (f: (r: MarketResult) => number): number => inYear.reduce((s, r) => s + f(r), 0);
  return { year, markets: inYear.length, takingsCents: sum((r) => r.takingsCents), costsCents: sum((r) => r.costsCents), profitCents: sum((r) => r.profitCents) };
}

/** A year's markets, best profit first (ties by date). */
export function rankedForYear(results: readonly MarketResult[], year: number): MarketResult[] {
  return results.filter((r) => yearOf(r.date) === year).sort((a, b) => b.profitCents - a.profitCents || a.date.localeCompare(b.date));
}

/** "+$120" / "−$40" / "$0" for a change between years. */
export function change(nowCents: number, thenCents: number): string {
  const d = nowCents - thenCents;
  if (d === 0) return '$0';
  return d > 0 ? `+${formatPrice(d)}` : `−${formatPrice(-d)}`;
}

/** Money that can be negative: "−$40". */
export function signedMoney(cents: number): string {
  return cents < 0 ? `−${formatPrice(-cents)}` : formatPrice(cents);
}

/** Her markets with their costs, and her paid market sales. */
export async function loadMarketResults(db: SupabaseClient<Database>, tenantId: string): Promise<MarketResult[]> {
  const [events, orders] = await Promise.all([
    db.from('events').select('id, name, event_date, location, status, rating, event_expenses(amount_cents)').eq('tenant_id', tenantId),
    db.from('orders').select('event_id, total_cents').eq('tenant_id', tenantId).eq('status', 'paid').not('event_id', 'is', null),
  ]);
  if (events.error !== null) throw new Error(`Could not load your markets: ${events.error.message}`);
  if (orders.error !== null) throw new Error(`Could not load your market sales: ${orders.error.message}`);
  return marketResults(
    (events.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      date: e.event_date,
      town: e.location ?? '',
      canceled: e.status === 'canceled',
      rating: e.rating ?? 0,
      costsCents: e.event_expenses.reduce((s, x) => s + x.amount_cents, 0),
    })),
    (orders.data ?? []).flatMap((o) => (o.event_id === null ? [] : [{ eventId: o.event_id, totalCents: o.total_cents }])),
  );
}

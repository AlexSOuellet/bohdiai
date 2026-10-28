/**
 * Free's Home (Alex, 2026-10-24): the steps to know your numbers, then the numbers.
 * A step is done when the thing it asks for exists, so nothing about the steps is
 * stored. The numbers come from each product's costs and each market's own numbers.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { costsCents } from '@/lib/backend/markets/market-form';
import { formatCents } from '@/lib/backend/catalog/product-form';
import { loadCostSummaries, pricedBelowCost, type CostSummary } from './product-costs';
import { eventDay, loadAllTakings, type Takings } from './event-takings';

export type StepKey = 'price' | 'pieces' | 'event' | 'after';
export type Step = { key: StepKey; done: boolean; href: string };

export type FreeHome = {
  steps: Step[];
  /** The first step not done yet; null once every one is. */
  next: StepKey | null;
  /** Products priced below what they cost to make. */
  belowCost: { id: string; name: string }[];
  /** Products with no costs worked out. */
  noCosts: number;
  products: number;
  /** The latest market with its own numbers, and what it paid. */
  lastMarket: { id: string; name: string; profit: number; hourly: number | null } | null;
  /** The market that paid best an hour, when there are two or more to compare. */
  bestMarket: { id: string; name: string; hourly: number } | null;
};

/** At least this many products and her pieces are ready to show (Showcase's nudge). */
export const PIECES_READY = 3;

export type FreeHomeInput = {
  products: readonly { id: string; name: string; priceCents: number | null }[];
  costs: ReadonlyMap<string, CostSummary>;
  events: readonly { id: string; name: string; date: string; costsCents: number }[];
  takings: ReadonlyMap<string, Takings>;
};

export function freeHome(input: FreeHomeInput): FreeHome {
  const withCosts = input.products.filter((p) => input.costs.has(p.id));
  const latestEvent = [...input.events].sort((a, b) => b.date.localeCompare(a.date))[0];
  const steps: Step[] = [
    { key: 'price', done: withCosts.length > 0, href: '/manage/tools/cost' },
    { key: 'pieces', done: input.products.length >= PIECES_READY, href: '/manage/tools/cost' },
    { key: 'event', done: input.events.length > 0, href: '/manage/markets/new' },
    { key: 'after', done: input.takings.size > 0, href: latestEvent === undefined ? '/manage/tools/market' : `/manage/markets/${latestEvent.id}?tab=after` },
  ];
  const days = input.events
    .flatMap((e) => {
      const t = input.takings.get(e.id);
      if (t === undefined) return [];
      const r = eventDay(t, e.costsCents);
      return r.sales > 0 ? [{ id: e.id, name: e.name, date: e.date, profit: r.profit, hourly: r.hours > 0 ? r.hourly : null }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const timed = days.filter((d): d is (typeof days)[number] & { hourly: number } => d.hourly !== null);
  const best = timed.length >= 2 ? timed.reduce((a, b) => (b.hourly > a.hourly ? b : a)) : null;
  const last = days[0];
  return {
    steps,
    next: steps.find((s) => !s.done)?.key ?? null,
    belowCost: input.products.filter((p) => pricedBelowCost(p.priceCents, input.costs.get(p.id) ?? null)).map((p) => ({ id: p.id, name: p.name })),
    noCosts: input.products.length - withCosts.length,
    products: input.products.length,
    lastMarket: last === undefined ? null : { id: last.id, name: last.name, profit: last.profit, hourly: last.hourly },
    bestMarket: best === null ? null : { id: best.id, name: best.name, hourly: best.hourly },
  };
}

export async function loadFreeHome(db: SupabaseClient<Database>, tenantId: string): Promise<FreeHome> {
  const [products, events, costs, takings] = await Promise.all([
    db.from('listings').select('id, name, base_price_cents').eq('tenant_id', tenantId).is('deleted_at', null).neq('status', 'archived'),
    db.from('events').select('id, name, event_date, event_expenses(amount_cents)').eq('tenant_id', tenantId),
    loadCostSummaries(db, tenantId),
    loadAllTakings(db, tenantId),
  ]);
  if (products.error !== null) throw new Error(`Could not read the products: ${products.error.message}`);
  if (events.error !== null) throw new Error(`Could not read the events: ${events.error.message}`);
  return freeHome({
    products: (products.data ?? []).map((p) => ({ id: p.id, name: p.name, priceCents: p.base_price_cents > 0 ? p.base_price_cents : null })),
    costs,
    events: (events.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      date: e.event_date,
      costsCents: costsCents((e.event_expenses ?? []).map((x) => ({ description: '', amount: formatCents(x.amount_cents) }))),
    })),
    takings,
  });
}

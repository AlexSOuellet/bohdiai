/**
 * The home page's Events box (Alex, 2026-10-22): the next event, how the last one
 * went, and the year so far, each opening where you'd expect. Worked out from her
 * schedule and her paid market sales; never stored.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isPastMarket } from './market-form';
import { listMarkets, type MarketRowView } from './queries';
import { loadMarketResults, yearOf, yearTotals, type MarketResult } from './results';

export type HomeEvent = { id: string; name: string; date: string; endDate: string; town: string };

export type EventsHome = {
  /** Soonest event that isn't over, and whether it's on today. */
  next: (HomeEvent & { today: boolean }) | null;
  /** The most recent event that's over, with what it took in; null without the market shop. */
  last: (HomeEvent & { sales: number; takingsCents: number; costsCents: number }) | null;
  /** This year and last; null without market records (Results). */
  year: { year: number; markets: number; takingsCents: number; profitCents: number; lastYearProfitCents: number; lastYearMarkets: number } | null;
};

const event = (m: MarketRowView): HomeEvent => ({ id: m.id, name: m.name, date: m.date, endDate: m.endDate, town: m.town });

export function eventsHome(markets: readonly MarketRowView[], results: readonly MarketResult[] | null, today: string, records: boolean): EventsHome {
  const live = markets.filter((m) => !m.canceled);
  const coming = live.filter((m) => !isPastMarket(m, today)).sort((a, b) => a.date.localeCompare(b.date));
  const past = live.filter((m) => isPastMarket(m, today)).sort((a, b) => b.date.localeCompare(a.date));
  const soonest = coming[0];
  const latest = past[0];
  const byId = new Map((results ?? []).map((r) => [r.id, r]));
  const lastResult = latest === undefined ? undefined : byId.get(latest.id);
  const year = yearOf(today);
  // "So far": only events that have started, not the ones still coming.
  const held = (results ?? []).filter((r) => r.date <= today);
  const now = yearTotals(held, year);
  const then = yearTotals(held, year - 1);
  return {
    next: soonest === undefined ? null : { ...event(soonest), today: soonest.date <= today },
    last:
      results === null || latest === undefined
        ? null
        : { ...event(latest), sales: lastResult?.sales ?? 0, takingsCents: lastResult?.takingsCents ?? 0, costsCents: lastResult?.costsCents ?? 0 },
    year:
      !records || results === null
        ? null
        : { year, markets: now.markets, takingsCents: now.takingsCents, profitCents: now.profitCents, lastYearProfitCents: then.profitCents, lastYearMarkets: then.markets },
  };
}

/** `shop`: the plan has the market shop (takings to show); `records`: it has Results. */
export async function loadEventsHome(db: SupabaseClient<Database>, tenantId: string, today: string, { shop, records }: { shop: boolean; records: boolean }): Promise<EventsHome> {
  const [markets, results] = await Promise.all([listMarkets(db, tenantId), shop ? loadMarketResults(db, tenantId) : Promise.resolve(null)]);
  return eventsHome(markets, results, today, records);
}

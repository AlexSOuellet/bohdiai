/**
 * What to bring (Alex, 2026-10-28; Market and Full): from how each piece sold at her
 * past markets, all of them or the dates of one market, how many to pack. Worked out
 * from How it sold each time, never stored.
 *
 * The suggestion is the most she has sold of it at one of those markets, so she can
 * meet her best day; a piece that sold out somewhere is flagged, since it might have
 * sold more.
 */
import type { PieceResult } from '@/lib/backend/markets/piece-sales';

export type BringLine = {
  key: string;
  name: string;
  /** The markets it went to (counted, or sold without a count). */
  markets: number;
  sold: number;
  /** Sold per market, to one decimal. */
  average: number;
  /** The most she sold at one market: the suggestion. */
  best: number;
  /** How many of those markets it sold out at. */
  soldOut: number;
};

/** Each piece's line, best seller first; `eventIds` picks the markets to read. */
export function whatToBring(results: readonly PieceResult[], eventIds: ReadonlySet<string>): BringLine[] {
  const lines = new Map<string, BringLine>();
  for (const r of results) {
    if (!eventIds.has(r.eventId)) continue;
    const line = lines.get(r.key) ?? { key: r.key, name: r.name, markets: 0, sold: 0, average: 0, best: 0, soldOut: 0 };
    line.markets += 1;
    line.sold += r.sold;
    line.best = Math.max(line.best, r.sold);
    if (r.soldOutAt !== null) line.soldOut += 1;
    lines.set(r.key, line);
  }
  return [...lines.values()]
    .map((l) => ({ ...l, average: Math.round((l.sold / l.markets) * 10) / 10 }))
    .sort((a, b) => b.sold - a.sold || a.name.localeCompare(b.name));
}

export type PastMarket = { id: string; name: string; date: string };

/** The choices to read from: every past market, or each market by name (its dates together). */
export function bringChoices(markets: readonly PastMarket[]): { name: string; ids: string[] }[] {
  const byName = new Map<string, string[]>();
  for (const m of [...markets].sort((a, b) => b.date.localeCompare(a.date))) {
    const name = m.name.trim();
    byName.set(name, [...(byName.get(name) ?? []), m.id]);
  }
  return [...byName.entries()].map(([name, ids]) => ({ name, ids }));
}

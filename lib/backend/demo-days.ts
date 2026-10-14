/**
 * Demo timeline days (Alex, 2026-10-14: the demo keeps its weekdays). Craft fairs
 * run on Saturdays, so a demo's fairs are set on the Saturday nearest their spot
 * in the timeline; the database then moves the timeline by whole weeks only, so a
 * Saturday stays a Saturday. Today's market is the exception: it stays today.
 */
import { addDays } from './plan/billing';

/** The Saturday nearest a calendar day (YYYY-MM-DD): up to three days either way. */
export function nearestSaturday(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  const ahead = (6 - weekday + 7) % 7;
  return addDays(day, ahead <= 3 ? ahead : ahead - 7);
}

/** Where a demo market lands: today's market (offset 0) stays today; every other
 *  market goes on the Saturday nearest its offset from today. */
export function demoMarketDay(today: string, offset: number): string {
  return offset === 0 ? today : nearestSaturday(addDays(today, offset));
}

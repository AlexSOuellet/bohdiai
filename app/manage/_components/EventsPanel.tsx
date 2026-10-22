import Link from 'next/link';
import type { Route } from 'next';
import { formatPrice } from '@/lib/storefront/catalog';
import { signedMoney } from '@/lib/backend/markets/results';
import type { EventsHome } from '@/lib/backend/markets/home-events';
import { marketDays } from '../markets/MarketList';

const where = (e: { date: string; endDate: string; town: string }): string => `${marketDays(e)}${e.town === '' ? '' : `, ${e.town}`}`;
const sales = (n: number): string => (n === 1 ? 'one sale' : `${n} sales`);

/** The home page's Events box (Alex, 2026-10-22): three lines, each a link. The next
 *  event opens its page (the market day when it's on today); the last one opens How it
 *  sold; the year opens Results. */
export function EventsPanel({ view }: { view: EventsHome }): React.ReactElement {
  const { next, last, year } = view;
  return (
    <section className="bk-section bk-events" aria-labelledby="bk-events">
      <h2 id="bk-events" className="bk-section-title">
        Events
      </h2>
      <ul className="bk-events-list">
        <li>
          {next === null ? (
            <Link className="bk-events-row" href="/manage/markets/new">
              <span className="bk-events-label">Next</span>
              <span className="bk-events-text">Nothing coming up. Add your next event.</span>
            </Link>
          ) : next.today ? (
            <Link className="bk-events-row" data-today="true" href={`/manage/markets/${next.id}/day` as Route}>
              <span className="bk-events-label">Today</span>
              <span className="bk-events-text">
                <strong>{next.name}</strong>
                {next.town !== '' && `, ${next.town}`}. Open the market day.
              </span>
            </Link>
          ) : (
            <Link className="bk-events-row" href={`/manage/markets/${next.id}` as Route}>
              <span className="bk-events-label">Next</span>
              <span className="bk-events-text">
                <strong>{next.name}</strong>, {where(next)}
              </span>
            </Link>
          )}
        </li>
        {last !== null && (
          <li>
            <Link className="bk-events-row" href={`/manage/markets/${last.id}?tab=sold` as Route}>
              <span className="bk-events-label">Last</span>
              <span className="bk-events-text">
                <strong>{last.name}</strong>, {where(last)}.{' '}
                {last.sales === 0 ? (
                  'Nothing sold through BohdiAI.'
                ) : (
                  <>
                    Took in {formatPrice(last.takingsCents)} from {sales(last.sales)}
                    {last.costsCents > 0 ? `, ${signedMoney(last.takingsCents - last.costsCents)} after costs.` : '.'}
                  </>
                )}
              </span>
            </Link>
          </li>
        )}
        {year !== null && (
          <li>
            <Link className="bk-events-row" href="/manage/markets/results">
              <span className="bk-events-label">{year.year} so far</span>
              <span className="bk-events-text">
                {year.markets === 0 ? (
                  'No events yet this year.'
                ) : (
                  <>
                    {year.markets === 1 ? 'One event' : `${year.markets} events`} took in {formatPrice(year.takingsCents)}, {signedMoney(year.profitCents)} after costs.
                  </>
                )}
                {year.lastYearMarkets > 0 && ` Last year: ${signedMoney(year.lastYearProfitCents)} after costs.`}
              </span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

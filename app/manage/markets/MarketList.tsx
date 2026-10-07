import Link from 'next/link';
import type { Route } from 'next';
import type { MarketRowView } from '@/lib/backend/markets/queries';
import { isPastMarket } from '@/lib/backend/markets/market-form';

/** "Sat, Oct 10" or "Sat, Oct 10 to Mon, Oct 12" for the owner's list. */
export function marketDays(m: { date: string; endDate: string }): string {
  const day = (d: string): string =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return m.endDate === '' ? day(m.date) : `${day(m.date)} to ${day(m.endDate)}`;
}

function Row({ m }: { m: MarketRowView }): React.ReactElement {
  return (
    <li className="bk-list-item bk-market-row">
      <Link className="bk-market-link" href={`/manage/markets/${m.id}` as Route}>
        <span className="bk-list-name">{m.name}</span>
        <span className="bk-note">
          {marketDays(m)}
          {m.town !== '' && ` · ${m.town}`}
        </span>
      </Link>
      <span className="bk-market-meta">
        {m.canceled && <span className="bk-pill">Canceled</span>}
        {m.rating > 0 && (
          <span className="bk-stars" aria-label={`${m.rating} of 5 stars`}>
            {'★'.repeat(m.rating)}
            <span className="bk-stars-off">{'★'.repeat(5 - m.rating)}</span>
          </span>
        )}
      </span>
    </li>
  );
}

/** Markets: coming up soonest first, then past ones newest first so her reviews
 *  stay handy. The split is only in her backend; the site never hides a market. */
export function MarketList({ markets, today }: { markets: MarketRowView[]; today: string }): React.ReactElement {
  const upcoming = markets.filter((m) => !isPastMarket(m, today));
  const past = markets.filter((m) => isPastMarket(m, today)).reverse();
  if (markets.length === 0) {
    return <p className="bk-note">No markets yet. Add the markets and fairs you do, and they show up on your site.</p>;
  }
  return (
    <>
      <section className="bk-section" aria-labelledby="s-upcoming">
        <h2 id="s-upcoming" className="bk-section-title">
          Coming up
        </h2>
        {upcoming.length === 0 ? (
          <p className="bk-note">Nothing coming up. Add your next market.</p>
        ) : (
          <ul className="bk-list" aria-label="Coming up">
            {upcoming.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </ul>
        )}
      </section>
      {past.length > 0 && (
        <section className="bk-section" aria-labelledby="s-past">
          <h2 id="s-past" className="bk-section-title">
            Past markets
          </h2>
          <p className="bk-note">Open one to add your review: how it went, and whether to go back.</p>
          <ul className="bk-list" aria-label="Past markets">
            {past.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

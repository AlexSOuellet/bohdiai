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

/** pos: the market shop is on and the market isn't over, so the row opens its Market POS.
 *  took: what a past event took in, where the plan has the market shop. */
function Row({ m, records, pos = false, took }: { m: MarketRowView; records: boolean; pos?: boolean; took?: string | undefined }): React.ReactElement {
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
        {took !== undefined && !m.canceled && <span className="bk-market-took">Took in {took}</span>}
        {records && m.rating > 0 && (
          <span className="bk-stars" aria-label={`${m.rating} of 5 stars`}>
            {'★'.repeat(m.rating)}
            <span className="bk-stars-off">{'★'.repeat(5 - m.rating)}</span>
          </span>
        )}
        {pos && !m.canceled && (
          <Link className="bk-btn bk-btn-small" href={`/manage/markets/${m.id}/day` as Route} aria-label={`Market POS for ${m.name}`}>
            Market POS
          </Link>
        )}
      </span>
    </li>
  );
}

/** The schedule: coming up soonest first, then past events newest first, each with
 *  what it took in (`took`, by event, on plans with the market shop) so her reviews
 *  and results stay handy. The split is only in her backend; the site never hides a
 *  date. */
export function MarketList({
  markets,
  today,
  records,
  pos = false,
  took,
}: {
  markets: MarketRowView[];
  today: string;
  records: boolean;
  pos?: boolean;
  took?: ReadonlyMap<string, string>;
}): React.ReactElement {
  const upcoming = markets.filter((m) => !isPastMarket(m, today));
  const past = markets.filter((m) => isPastMarket(m, today)).reverse();
  if (markets.length === 0) {
    return <p className="bk-note">No events yet. Add the markets, fairs and pop-ups you do, and they show up on your site.</p>;
  }
  return (
    <>
      <section className="bk-section" aria-labelledby="s-upcoming">
        <h2 id="s-upcoming" className="bk-section-title">
          Coming up
        </h2>
        {upcoming.length === 0 ? (
          <p className="bk-note">Nothing coming up. Add your next event.</p>
        ) : (
          <ul className="bk-list" aria-label="Coming up">
            {upcoming.map((m) => (
              <Row key={m.id} m={m} records={records} pos={pos} />
            ))}
          </ul>
        )}
      </section>
      {past.length > 0 && (
        <section className="bk-section" aria-labelledby="s-past">
          <h2 id="s-past" className="bk-section-title">
            Past events
          </h2>
          {records && <p className="bk-note">Open one to add your review: how it went, and whether to go back.</p>}
          <ul className="bk-list" aria-label="Past events">
            {past.map((m) => (
              <Row key={m.id} m={m} records={records} took={took?.get(m.id)} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

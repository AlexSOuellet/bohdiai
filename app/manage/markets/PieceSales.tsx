/**
 * How each piece sold at a market: brought, sold, left, and when it sold out. And,
 * across her markets, what sold out where (the results page).
 */
import type { PieceResult } from '@/lib/backend/markets/piece-sales';

function timeIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso));
}

function dayIn(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone }).format(new Date(iso));
}

/** One market's pieces. Shows nothing until something was counted or sold. */
export function PieceSales({ rows, timeZone }: { rows: readonly PieceResult[]; timeZone: string }): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <section className="bk-section" aria-labelledby="s-sold">
      <h2 id="s-sold" className="bk-section-title">
        How it sold
      </h2>
      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th scope="col">Piece</th>
              <th scope="col">Brought</th>
              <th scope="col">Sold</th>
              <th scope="col">Left</th>
              <th scope="col">Sold out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.name}</td>
                <td>{r.brought ?? 'Not counted'}</td>
                <td>{r.sold}</td>
                <td>{r.left ?? '·'}</td>
                <td>{r.soldOutAt === null ? '·' : <strong>{timeIn(r.soldOutAt, timeZone)}</strong>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bk-note">Paid sales only. A piece you didn’t count sells from everything you have, so it never shows sold out here.</p>
    </section>
  );
}

/** Across her markets: every piece that sold out, where and when, newest first. */
export function SoldOutList({ rows, markets, timeZone }: { rows: readonly PieceResult[]; markets: ReadonlyMap<string, string>; timeZone: string }): React.ReactElement {
  const out = rows.filter((r) => r.soldOutAt !== null).sort((a, b) => (b.soldOutAt ?? '').localeCompare(a.soldOutAt ?? ''));
  return (
    <section className="bk-section" aria-labelledby="s-soldout">
      <h2 id="s-soldout" className="bk-section-title">
        Sold out at your markets
      </h2>
      {out.length === 0 ? (
        <p className="bk-note">Nothing has sold out yet. Count what you bring on a market’s page, and anything that sells out shows here, with when.</p>
      ) : (
        <ul className="bk-list">
          {out.map((r) => (
            <li key={`${r.eventId}|${r.key}`} className="bk-list-item">
              <span className="bk-list-name">{r.name}</span>
              <span>
                {markets.get(r.eventId) ?? 'A market'} · all {r.brought} gone by {timeIn(r.soldOutAt ?? '', timeZone)}, {dayIn(r.soldOutAt ?? '', timeZone)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

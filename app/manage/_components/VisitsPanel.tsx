/**
 * The backend home's visitor numbers (lib/visits/home.ts): this week against last
 * week, the most-seen pages and where visits came from over 30 days, and on Full
 * the saved months. Counted without cookies; nothing about any one visitor.
 */
import type { NamedCount, VisitsView } from '@/lib/visits/home';

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function n(v: number): string {
  return v.toLocaleString('en-US');
}

function compare(now: number, before: number): string {
  if (before === 0 && now === 0) return 'None last week either';
  if (now === before) return `Same as last week (${n(before)})`;
  const diff = now - before;
  return `${diff > 0 ? 'Up' : 'Down'} ${n(Math.abs(diff))} from last week (${n(before)})`;
}

function List({ title, rows, unit, empty }: { title: string; rows: NamedCount[]; unit: string; empty: string }): React.ReactElement {
  return (
    <div className="bk-visits-list">
      <p className="bk-kicker">{title}</p>
      {rows.length === 0 ? (
        <p className="bk-note">{empty}</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.name}>
              <span className="bk-visits-name">{r.name}</span>
              <span className="bk-visits-count">
                {n(r.count)} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VisitsPanel({ view }: { view: VisitsView }): React.ReactElement {
  return (
    <section className="bk-visits" aria-labelledby="bk-visits">
      <h2 id="bk-visits" className="bk-section-title">
        Visitors
      </h2>
      {view.kind === 'draft' && <p className="bk-note">Your visitor numbers start the day your site goes live.</p>}
      {view.kind === 'off' && <p className="bk-note">Visitor numbers aren’t switched on yet. They’ll show here as soon as they are.</p>}
      {view.kind === 'failed' && (
        <p role="alert" className="bk-error">
          Your visitor numbers couldn’t load. Refresh to try again.
        </p>
      )}
      {view.kind === 'numbers' && (
        <>
          <div className="bk-tiles">
            <div className="bk-tile">
              <p className="bk-tile-label">Visits this week</p>
              <p className="bk-tile-value">{n(view.week.visits)}</p>
              <p className="bk-tile-note">{compare(view.week.visits, view.lastWeek.visits)}</p>
            </div>
            <div className="bk-tile">
              <p className="bk-tile-label">Pages seen this week</p>
              <p className="bk-tile-value">{n(view.week.pageViews)}</p>
              <p className="bk-tile-note">{compare(view.week.pageViews, view.lastWeek.pageViews)}</p>
            </div>
          </div>
          <div className="bk-visits-lists">
            <List title="Most seen, last 30 days" rows={view.topPages} unit="views" empty="Nothing seen yet in the last 30 days." />
            <List title="Where visits came from, last 30 days" rows={view.sources} unit="visits" empty="No visits yet in the last 30 days." />
          </div>
          {view.months !== null && (
            <div className="bk-visits-months">
              <p className="bk-kicker">Month by month</p>
              {view.months.length === 0 ? (
                <p className="bk-note">Each month is saved here when it ends, for as long as you’re on Full.</p>
              ) : (
                <ul>
                  {view.months.map((m) => (
                    <li key={m.month}>
                      <span className="bk-visits-name">{MONTH.format(new Date(`${m.month}T00:00:00Z`))}</span>
                      <span className="bk-visits-count">
                        {n(m.visits)} visits · {n(m.pageViews)} pages seen
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
      <p className="bk-visits-foot">Counted without cookies. Nothing about any one visitor is kept.</p>
    </section>
  );
}

import Link from 'next/link';
import type { Dashboard } from '@/lib/founder/dashboard';
import { dollars, planName } from '@/lib/founder/sites';
import { StatTile } from '../manage/_components/StatTile';
import { shortDate } from './format';

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

function NeedsYou({ needs }: { needs: Dashboard['needs'] }): React.ReactElement {
  if (needs.failing + needs.stuck + needs.messages === 0) return <p className="bk-note">Nothing needs you right now.</p>;
  return (
    <ul className="fd-needs">
      {needs.failing > 0 && <li>{count(needs.failing, 'payment is failing', 'payments are failing')}</li>}
      {needs.stuck > 0 && <li>{count(needs.stuck, 'site build has stopped', 'site builds have stopped')}</li>}
      {needs.messages > 0 && (
        <li>
          <Link href="/founder/messages" className="bk-link">
            {count(needs.messages, 'message', 'messages')} this month
          </Link>
        </li>
      )}
    </ul>
  );
}

/** How the business stands today. */
export function DashboardView({ data }: { data: Dashboard }): React.ReactElement {
  return (
    <>
      <div className="bk-tiles fd-tiles">
        <StatTile label="MRR" value={dollars(data.mrrCents)} note={count(data.paying, 'paying maker', 'paying makers')} />
        <StatTile label="New sign-ups this month" value={String(data.signups.thisMonth)} note={`${data.signups.lastMonth} last month`} />
        <StatTile label="Cancellations this month" value={String(data.cancels.thisMonth)} note={`${data.cancels.leaving} leaving at the end of their term`} />
        <StatTile label="Live sites" value={String(data.sites.live)} note={`${count(data.sites.drafts, 'draft', 'drafts')}, ${count(data.sites.free, 'free site', 'free sites')}`} />
      </div>

      <section className="bk-section">
        <h2 className="bk-section-title">Needs you</h2>
        <NeedsYou needs={data.needs} />
      </section>

      <div className="fd-cols">
        <section className="bk-section">
          <h2 className="bk-section-title">MRR by plan</h2>
          {data.plans.length === 0 ? (
            <p className="bk-note">No one is paying yet.</p>
          ) : (
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">Paying</th>
                    <th scope="col">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map((line) => (
                    <tr key={line.plan ?? 'none'}>
                      <td>{planName(line.plan)}</td>
                      <td>{line.paying}</td>
                      <td>{dollars(line.monthlyCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bk-section">
          <h2 className="bk-section-title">Latest sign-ups</h2>
          {data.latest.length === 0 ? (
            <p className="bk-note">No sign-ups yet.</p>
          ) : (
            <ul className="fd-signups">
              {data.latest.map((s) => (
                <li key={s.id}>
                  <span>
                    <span className="fd-site">{s.name}</span>
                    <span className="fd-address">
                      {planName(s.plan)}
                      {s.free ? ', free site' : ''}
                      {s.maker === null ? '' : `, ${s.maker}`}
                    </span>
                  </span>
                  <span className="fd-address">{shortDate(s.joined)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

import { formatPrice } from '@/lib/storefront/catalog';
import { change, rankedForYear, signedMoney, yearTotals, type MarketResult, type YearTotals } from '@/lib/backend/markets/results';

function Totals({ now, then }: { now: YearTotals; then: YearTotals }): React.ReactElement {
  const rows: { label: string; now: number; then: number; signed?: boolean }[] = [
    { label: 'Takings', now: now.takingsCents, then: then.takingsCents },
    { label: 'Costs', now: now.costsCents, then: then.costsCents },
    { label: 'Profit', now: now.profitCents, then: then.profitCents, signed: true },
  ];
  return (
    <div className="bk-tiles">
      {rows.map((r) => (
        <div key={r.label} className="bk-tile">
          <p className="bk-tile-label">
            {r.label} {now.year}
          </p>
          <p className="bk-tile-value">{r.signed === true ? signedMoney(r.now) : formatPrice(r.now)}</p>
          <p className="bk-tile-note">
            {then.markets === 0 ? `No markets in ${then.year} to compare` : `${change(r.now, r.then)} on ${then.year} (${r.signed === true ? signedMoney(r.then) : formatPrice(r.then)})`}
          </p>
        </div>
      ))}
    </div>
  );
}

function Ranked({ title, rows }: { title: string; rows: readonly MarketResult[] }): React.ReactElement {
  return (
    <section className="bk-section" aria-label={title}>
      <h2 className="bk-section-title">{title}</h2>
      {rows.length === 0 ? (
        <p className="bk-note">No markets yet.</p>
      ) : (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col">Market</th>
                <th scope="col">Day</th>
                <th scope="col">Sales</th>
                <th scope="col">Takings</th>
                <th scope="col">Costs</th>
                <th scope="col">Profit</th>
                <th scope="col">Stars</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-loss={r.profitCents < 0 ? 'true' : undefined}>
                  <td>
                    {r.name}
                    {r.town !== '' && <span className="bk-note"> · {r.town}</span>}
                  </td>
                  <td>{r.date}</td>
                  <td>{r.sales}</td>
                  <td>{formatPrice(r.takingsCents)}</td>
                  <td>{formatPrice(r.costsCents)}</td>
                  <td>
                    <strong>{signedMoney(r.profitCents)}</strong>
                  </td>
                  <td>{r.rating > 0 ? '★'.repeat(r.rating) : '·'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** This year against last at the top; each year's markets best profit first. */
export function MarketResultsView({ results, year }: { results: readonly MarketResult[]; year: number }): React.ReactElement {
  const now = yearTotals(results, year);
  const then = yearTotals(results, year - 1);
  return (
    <div className="bk-results">
      <p className="bk-note">Takings are the sales you recorded at each market. Costs are what you entered on the market’s page (booth fee, gas, and so on).</p>
      <Totals now={now} then={then} />
      <Ranked title={`${year}, best first`} rows={rankedForYear(results, year)} />
      {then.markets > 0 && <Ranked title={`${year - 1}, best first`} rows={rankedForYear(results, year - 1)} />}
    </div>
  );
}

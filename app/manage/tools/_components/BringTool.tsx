'use client';

import { useState } from 'react';
import { bringChoices, whatToBring, type PastMarket } from '@/lib/tools/bring';
import type { PieceResult } from '@/lib/backend/markets/piece-sales';

const ALL = '';

/** What to bring (Alex, 2026-10-28; Market and Full): how many of each piece to pack,
 *  from how they sold at her past markets, every one or the dates of one market. */
export function BringTool({ markets, results }: { markets: readonly PastMarket[]; results: readonly PieceResult[] }): React.ReactElement {
  const choices = bringChoices(markets);
  const [pick, setPick] = useState(ALL);
  const chosen = choices.find((c) => c.name === pick);
  const ids = new Set(chosen === undefined ? markets.map((m) => m.id) : chosen.ids);
  const lines = whatToBring(results, ids);
  const where = ids.size === 1 ? 'at that market' : `at one of those ${ids.size} markets`;

  return (
    <section aria-labelledby="tool-bring">
      <h2 id="tool-bring" className="bk-tool-title">
        What should you bring?
      </h2>
      <p className="bk-tool-lede">From how each piece sold at your past markets, how many to pack so you’re ready for your best day.</p>

      {markets.length === 0 ? (
        <p className="bk-note">Nothing has sold at a market yet. Once you sell with the market app, what sold shows here.</p>
      ) : (
        <>
          <div className="bk-field">
            <label htmlFor="b-from" className="bk-label">
              Going by
            </label>
            <select id="b-from" className="bk-input" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value={ALL}>All your markets</option>
              {choices.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.ids.length === 1 ? c.name : `${c.name} (${c.ids.length} times)`}
                </option>
              ))}
            </select>
          </div>
          <div className="bk-table-wrap">
            <table className="bk-table">
              <thead>
                <tr>
                  <th scope="col">Piece</th>
                  <th scope="col">Bring</th>
                  <th scope="col">Sold on average</th>
                  <th scope="col">Sold out</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key}>
                    <td>{l.name}</td>
                    <td>
                      <strong>{l.best}</strong>
                    </td>
                    <td>{l.average}</td>
                    <td>{l.soldOut === 0 ? '·' : <strong>{l.soldOut === l.markets ? 'Every time' : `${l.soldOut} of ${l.markets}`}</strong>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="bk-note">{`Bring is the most you’ve sold of it ${where}. If it sold out, it might have sold more, so pack a few extra.`}</p>
        </>
      )}
    </section>
  );
}

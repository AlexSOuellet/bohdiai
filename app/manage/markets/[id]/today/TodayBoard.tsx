'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { setOrderStatus } from '@/lib/backend/orders/actions';
import { recordMarketSale } from '@/lib/backend/markets/today-actions';
import { takings, type TodayOrder } from '@/lib/backend/markets/today';
import { METHOD_LABEL } from '@/lib/market/pay';
import { useNotice } from '../../../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';
/** How often the board looks for new "I paid" taps. */
export const REFRESH_MS = 8000;

export type TodayPiece = { id: string; name: string };

function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
}

function methodName(m: TodayOrder['method']): string {
  return m === null ? 'Other' : METHOD_LABEL[m];
}

/** Today at the table: holds to confirm (newest first), the day's sales and
 *  takings, and recording a sale by hand. Refreshes itself so new holds appear. */
export function TodayBoard({
  eventId,
  marketName,
  orders,
  pieces,
  open,
  timeZone,
}: {
  eventId: string;
  marketName: string;
  orders: TodayOrder[];
  /** Pieces still on the shelf for this market, for recording a sale. */
  pieces: TodayPiece[];
  /** The market is on today (sales can be taken). */
  open: boolean;
  timeZone: string;
}): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [piece, setPiece] = useState('');
  const [method, setMethod] = useState('cash');
  const inFlight = useRef(false);
  const notice = useNotice();

  useEffect(() => {
    const t = window.setInterval(() => {
      if (!inFlight.current) router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [router]);

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, message: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        notice.showSaved(message);
        router.refresh();
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const holds = orders.filter((o) => o.status === 'pending');
  const sold = orders.filter((o) => o.status === 'paid');
  const day = takings(orders);

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Today: {marketName}</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href={`/manage/markets/${eventId}` as Route}>
            Back to the market
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content bk-today">
        {notice.area}
        {!open && <p className="bk-note">This market isn’t on today. Its page takes orders only on its own days.</p>}

        <section className="bk-section" aria-labelledby="s-holds">
          <h2 id="s-holds" className="bk-section-title">
            Waiting for you ({holds.length})
          </h2>
          {holds.length === 0 ? (
            <p className="bk-note">Nobody’s waiting. When a buyer picks a baby on your market page, they show up here.</p>
          ) : (
            <ul className="bk-list" aria-label="Waiting for you">
              {holds.map((o) => (
                <li key={o.id} className="bk-list-item bk-hold" data-paid={o.saysPaid ? 'true' : 'false'}>
                  <div className="bk-hold-who">
                    <span className="bk-list-name">
                      {o.name} · {o.piece}
                    </span>
                    <span className="bk-hold-amount">
                      {o.amount} by {methodName(o.method)}
                    </span>
                    <span className="bk-note">
                      {o.saysPaid ? 'Says they paid' : 'Paying now'} · {when(o.createdAt, timeZone)} · #{o.number}
                    </span>
                  </div>
                  <div className="bk-row">
                    <button type="button" className="bk-btn" disabled={busy} aria-label={`Confirm ${o.name}’s payment for ${o.piece}`} onClick={() => void run(() => setOrderStatus(o.id, 'paid'), `Confirmed. ${o.piece} is sold.`)}>
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="bk-btn bk-btn-quiet"
                      disabled={busy}
                      aria-label={`Not received from ${o.name} for ${o.piece}`}
                      onClick={() => void run(() => setOrderStatus(o.id, 'canceled'), `${o.piece} is back on the shelf.`)}
                    >
                      Not received
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {open && (
          <section className="bk-section" aria-labelledby="s-record">
            <h2 id="s-record" className="bk-section-title">
              Record a sale
            </h2>
            <p className="bk-note">For a buyer who pays you without the market page.</p>
            {pieces.length === 0 ? (
              <p className="bk-note">Nothing left on the shelf for this market.</p>
            ) : (
              <div className="bk-row">
                <div className="bk-field">
                  <label className="bk-label" htmlFor="rec-piece">
                    Piece
                  </label>
                  <select id="rec-piece" className="bk-input" value={piece} onChange={(e) => setPiece(e.target.value)}>
                    <option value="">Pick one</option>
                    {pieces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bk-field">
                  <label className="bk-label" htmlFor="rec-method">
                    Paid by
                  </label>
                  <select id="rec-method" className="bk-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {(['cash', 'venmo', 'cashapp', 'zelle', 'card'] as const).map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABEL[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="bk-btn"
                  disabled={busy || piece === ''}
                  onClick={() => {
                    const name = pieces.find((p) => p.id === piece)?.name ?? 'The piece';
                    void run(() => recordMarketSale(eventId, piece, method), `Recorded. ${name} is sold.`).then(() => setPiece(''));
                  }}
                >
                  Record sale
                </button>
              </div>
            )}
          </section>
        )}

        <section className="bk-section" aria-labelledby="s-sold">
          <h2 id="s-sold" className="bk-section-title">
            Sold here ({day.count})
          </h2>
          <p className="bk-today-total">
            Total <strong>{day.total}</strong>
            {day.byMethod.length > 0 && <span className="bk-note"> · {day.byMethod.map((m) => `${methodName(m.method === 'other' ? null : (m.method as TodayOrder['method']))} ${m.total}`).join(' · ')}</span>}
          </p>
          {sold.length > 0 && (
            <ul className="bk-list" aria-label="Sold here">
              {sold.map((o) => (
                <li key={o.id} className="bk-list-item">
                  <span className="bk-list-name">{o.piece}</span>
                  <span className="bk-note">
                    {o.amount} · {methodName(o.method)} · {o.name} · {when(o.createdAt, timeZone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { METHOD_LABEL } from '@/lib/market/pay';
import type { TodayOrder } from '@/lib/backend/markets/today';
import { refundMarketOrder, settleMarketOrder } from '@/lib/backend/markets/today-actions';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';
/** The name the till gives a sale nobody named; not worth repeating on every line. */
const UNNAMED = 'At the table';

function methodName(m: TodayOrder['method']): string {
  return m === null ? 'Other' : METHOD_LABEL[m];
}

/** "Sat 2:14 PM": the event's own day is on the page already, but an event can run
 *  more than one day. */
function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone });
}

/** How they paid, who, and when, as one line. */
function how(o: TodayOrder, timeZone: string): string {
  return [methodName(o.method), o.name === UNNAMED ? '' : o.name, when(o.createdAt, timeZone)].filter((s) => s !== '').join(', ');
}

/** One event's sales, one line each (Alex, 2026-10-22): buyers still waiting to pay
 *  first (Paid / Not received), then what sold, newest first, each with Refund (a yes
 *  first), then the refunded ones, greyed. Turned-away holds never show. Used on the
 *  Sales page and on the event's own "How it sold". */
export function MarketSales({ eventId, orders, timeZone }: { eventId: string; orders: readonly TodayOrder[]; timeZone: string }): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const waiting = orders.filter((o) => o.status === 'pending');
  const sold = orders.filter((o) => o.status === 'paid');
  const refunded = orders.filter((o) => o.status === 'refunded');

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        notice.showSaved(done);
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

  const refund = (o: TodayOrder): Promise<void> =>
    run(
      () => refundMarketOrder(eventId, o.id),
      o.method === 'card'
        ? `Refund recorded. ${o.piece} is back in stock. Refund the card in the Square app too, if you haven’t.`
        : `Refund recorded. ${o.piece} is back in stock. Give the money back the way it was paid.`,
    );

  if (orders.length === 0) return <p className="bk-note">Nothing sold here yet.</p>;

  return (
    <div className="bk-sales">
      {notice.area}
      <ul className="bk-sale-list" aria-label="Sales">
        {waiting.map((o) => (
          <li key={o.id} className="bk-sale" data-state="waiting">
            <span className="bk-sale-piece">{o.piece}</span>
            <span className="bk-sale-how">
              <strong>Waiting to pay</strong>, {how(o, timeZone)}
              {o.saysPaid && ' (says they paid)'}
            </span>
            <span className="bk-sale-amt">{o.amount}</span>
            <span className="bk-sale-act">
              <button type="button" className="bk-btn bk-btn-small" disabled={busy} aria-label={`Paid: order ${o.number}`} onClick={() => void run(() => settleMarketOrder(eventId, o.id, 'paid'), `Paid. ${o.piece} is sold.`)}>
                Paid
              </button>
              <button
                type="button"
                className="bk-btn bk-btn-quiet bk-btn-small"
                disabled={busy}
                aria-label={`Not received: order ${o.number}`}
                onClick={() => void run(() => settleMarketOrder(eventId, o.id, 'canceled'), `${o.piece} is back in stock.`)}
              >
                Not received
              </button>
            </span>
          </li>
        ))}
        {sold.map((o) => (
          <li key={o.id} className="bk-sale" data-state="sold">
            <span className="bk-sale-piece">{o.piece}</span>
            <span className="bk-sale-how">{how(o, timeZone)}</span>
            <span className="bk-sale-amt">{o.amount}</span>
            <span className="bk-sale-act">
              <ConfirmButton
                label="Refund"
                ariaLabel={`Refund: order ${o.number}`}
                confirmLabel={`Yes, refund ${o.amount}`}
                keepLabel="Keep the sale"
                disabled={busy}
                onConfirm={() => void refund(o)}
              />
            </span>
          </li>
        ))}
        {refunded.map((o) => (
          <li key={o.id} className="bk-sale" data-state="refunded">
            <span className="bk-sale-piece">{o.piece}</span>
            <span className="bk-sale-how">Refunded, {how(o, timeZone)}</span>
            <span className="bk-sale-amt">{o.amount}</span>
            <span className="bk-sale-act" />
          </li>
        ))}
      </ul>
    </div>
  );
}

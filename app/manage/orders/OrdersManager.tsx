'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setOrderStatus } from '@/lib/backend/orders/actions';
import { STATUS_LABEL, nextSteps, type OrderRow, type OrderStatus } from '@/lib/backend/orders/orders';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';
type Show = 'open' | OrderStatus | 'all';

/** "Oct 7, 2026, 4:12 PM" in the shop's own time zone. */
function showWhen(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone });
}

const SAVED: Readonly<Record<OrderStatus, string>> = {
  pending: 'Order reopened.',
  paid: 'Marked paid. Those pieces now show as sold on your site.',
  fulfilled: 'Marked handed over.',
  canceled: 'Order canceled. Any piece it held is back on your site.',
};

/** Orders: what shoppers sent from the cart, newest first, each with the buyer's
 *  details and a button per next step. "Open" (new + paid) is the default view. */
export function OrdersManager({ initial, timeZone }: { initial: OrderRow[]; timeZone: string }): React.ReactElement {
  const [orders, setOrders] = useState(initial);
  const [show, setShow] = useState<Show>('open');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();

  async function move(id: string, to: OrderStatus): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await setOrderStatus(id, to);
      if (r.ok) {
        setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: to } : o)));
        notice.showSaved(SAVED[to]);
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const shown = orders.filter((o) => (show === 'all' ? true : show === 'open' ? o.status === 'pending' || o.status === 'paid' : o.status === show));

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Orders</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-orders">
          <h2 id="s-orders" className="bk-section-title">
            What shoppers sent
          </h2>
          <p className="bk-note">
            Nothing is charged when someone sends an order. Reply to them to arrange payment and how they get it, then mark it
            paid here. Marking it paid shows those pieces as sold on your site.
          </p>
          <div className="bk-filters">
            <label className="bk-label" htmlFor="orders-show">
              Show
            </label>
            <select id="orders-show" className="bk-input bk-input-sm" value={show} onChange={(e) => setShow(e.target.value as Show)}>
              <option value="open">New and paid</option>
              <option value="pending">New</option>
              <option value="paid">Paid</option>
              <option value="fulfilled">Handed over</option>
              <option value="canceled">Canceled</option>
              <option value="all">All</option>
            </select>
          </div>
          {shown.length === 0 && <p className="bk-note">{orders.length === 0 ? 'No orders yet. When someone sends one from your cart, it shows up here and in your email.' : 'No orders here.'}</p>}
          {shown.length > 0 && (
            <ul className="bk-list" aria-label="Orders">
              {shown.map((o) => (
                <li key={o.id} className="bk-list-item bk-order">
                  <div className="bk-order-head">
                    <span className="bk-list-name">
                      #{o.number} · {o.name}
                    </span>
                    <span className="bk-pill" data-status={o.status}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="bk-note">
                    {showWhen(o.createdAt, timeZone)} · <a className="bk-link" href={`mailto:${o.email}`}>{o.email}</a>
                    {o.phone !== '' && (
                      <>
                        {' · '}
                        <a className="bk-link" href={`tel:${o.phone.replace(/[^0-9+]/g, '')}`}>{o.phone}</a>
                      </>
                    )}
                  </p>
                  <ul className="bk-order-items">
                    {o.items.map((i, n) => (
                      <li key={n}>
                        {i.name} <span className="bk-note">{i.price}</span>
                      </li>
                    ))}
                  </ul>
                  <p>
                    <strong>Total {o.total}</strong>
                  </p>
                  {o.note !== '' && <p className="bk-order-note">“{o.note}”</p>}
                  <div className="bk-row">
                    {nextSteps(o.status).map((s) => (
                      <button
                        key={s.to}
                        type="button"
                        className={s.to === 'canceled' ? 'bk-btn bk-btn-quiet bk-btn-small' : 'bk-btn bk-btn-small'}
                        disabled={busy}
                        aria-label={`${s.label}: order ${o.number}`}
                        onClick={() => void move(o.id, s.to)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

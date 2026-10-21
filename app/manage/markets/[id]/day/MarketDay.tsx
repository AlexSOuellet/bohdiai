'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { PaySettings } from '@/lib/market/pay';
import { METHOD_LABEL } from '@/lib/market/pay';
import type { SellMethod, SellPiece } from '@/lib/backend/markets/sell';
import { takings, type TodayOrder } from '@/lib/backend/markets/today';
import { refundMarketOrder, settleMarketOrder } from '@/lib/backend/markets/today-actions';
import { ConfirmButton } from '../../../_components/ConfirmButton';
import { useNotice } from '../../../_components/Notice';
import { RingUp } from '../sell/RingUp';
import type { CardState } from '@/lib/square/pos';
import { InstallTip } from '../../../pos/InstallTip';

const FAILED = 'Something went wrong. Check your connection and try again.';
/** How often the screen looks for buyers who just picked a piece. */
export const REFRESH_MS = 8000;

function clock(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
}

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function methodName(m: TodayOrder['method'] | string): string {
  return m === null || m === 'other' ? 'Other' : (METHOD_LABEL[m as keyof typeof METHOD_LABEL] ?? 'Other');
}

/** The market day on the seller's phone: buyers waiting to pay at the top, what sold
 *  below, and the till docked at the bottom (the day's takings and Ring up a sale).
 *  No backend menu; the one way out is back to the market's setup. */
export function MarketDay({
  eventId,
  marketName,
  date,
  booth,
  town,
  shopName,
  orders,
  pieces,
  pay,
  methods,
  open,
  timeZone,
  card = 'off',
  cardResult = null,
}: {
  eventId: string;
  marketName: string;
  date: string;
  booth: string;
  town: string;
  shopName: string;
  orders: TodayOrder[];
  pieces: SellPiece[];
  pay: PaySettings;
  methods: SellMethod[];
  /** The market is on today (buyers can pay, sales can be rung up). */
  open: boolean;
  timeZone: string;
  /** Cards through the maker's Square: ready, waiting on a step, or off. */
  card?: CardState;
  /** What happened to a card sale, when Square has just handed back. */
  cardResult?: { tone: 'ok' | 'error'; text: string } | null;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const [ringing, setRinging] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (cardResult === null) return;
    if (cardResult.tone === 'ok') notice.showSaved(cardResult.text);
    else notice.showError(cardResult.text);
    // The message came in the address: show it once, then drop it so a refresh doesn't repeat it.
    window.history.replaceState(null, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ringing) return;
    const t = window.setInterval(() => {
      if (!inFlight.current) router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [router, ringing]);

  async function settle(order: TodayOrder, outcome: 'paid' | 'canceled'): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await settleMarketOrder(eventId, order.id, outcome);
      if (r.ok) {
        notice.showSaved(outcome === 'paid' ? `Paid. ${order.piece} is sold to ${order.name}.` : `${order.piece} is back on the table.`);
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

  async function refund(order: TodayOrder): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await refundMarketOrder(eventId, order.id);
      if (r.ok) {
        notice.showSaved(
          order.method === 'card'
            ? `Refund recorded. ${order.piece} is back in stock. Refund the card in the Square app too, if you haven’t.`
            : `Refund recorded. ${order.piece} is back in stock.`,
        );
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

  const waiting = orders.filter((o) => o.status === 'pending');
  const sold = orders.filter((o) => o.status === 'paid');
  const refunded = orders.filter((o) => o.status === 'refunded');
  const day = takings(orders);
  const where = [booth, town].filter((s) => s !== '').join(', ');

  return (
    <div className="bk-day">
      <header className="bk-day-top">
        <div>
          <h1 className="bk-day-name">{marketName}</h1>
          <p className="bk-day-where">
            {dayLabel(date)}
            {where !== '' && <span>{where}</span>}
          </p>
        </div>
        <Link className="bk-day-exit" href={`/manage/markets/${eventId}` as Route}>
          Market setup
        </Link>
      </header>

      <main id="main" className="bk-day-main">
        {notice.area}
        <InstallTip />
        {!open && <p className="bk-day-closed">This market isn’t on today. Buyers can pay and you can ring up sales on its own day.</p>}

        <section aria-labelledby="d-wait">
          <h2 id="d-wait" className="bk-day-h">
            Waiting to pay <span className="bk-day-count">{waiting.length}</span>
          </h2>
          {waiting.length === 0 ? (
            <p className="bk-day-empty">No one’s waiting. When a buyer picks a piece on your market page, they show up here.</p>
          ) : (
            <ul className="bk-day-slips" aria-label="Waiting to pay">
              {waiting.map((o) => (
                <li key={o.id} className="bk-day-slip" data-says-paid={o.saysPaid ? 'true' : 'false'}>
                  <div className="bk-day-slip-head">
                    <span className="bk-day-buyer">{o.name}</span>
                    <strong className="bk-day-amount">{o.amount}</strong>
                  </div>
                  <p className="bk-day-piece">{o.piece}</p>
                  <p className="bk-day-meta">
                    <span className="bk-day-status">{o.saysPaid ? 'Says they paid' : 'Paying now'}</span>
                    <span>by {methodName(o.method)}</span>
                    <span>{clock(o.createdAt, timeZone)}</span>
                    <span>order {o.number}</span>
                  </p>
                  <div className="bk-day-acts">
                    <button type="button" className="bk-day-paid" disabled={busy} aria-label={`Paid: ${o.name}, ${o.piece}`} onClick={() => void settle(o, 'paid')}>
                      Paid
                    </button>
                    <button type="button" className="bk-day-not" disabled={busy} aria-label={`Not received from ${o.name} for ${o.piece}`} onClick={() => void settle(o, 'canceled')}>
                      Not received
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="d-sold">
          <h2 id="d-sold" className="bk-day-h">
            Sold today <span className="bk-day-count">{day.count}</span>
          </h2>
          {sold.length === 0 ? (
            <p className="bk-day-empty">Nothing sold yet.</p>
          ) : (
            <ul className="bk-day-sold" aria-label="Sold today">
              {sold.map((o) => (
                <li key={o.id}>
                  <span className="bk-day-sold-piece">{o.piece}</span>
                  <span className="bk-day-sold-amt">{o.amount}</span>
                  <span className="bk-day-sold-who">
                    {methodName(o.method)}, {o.name}, {clock(o.createdAt, timeZone)}
                  </span>
                  <span className="bk-day-sold-act">
                    <ConfirmButton
                      label="Refund"
                      confirmLabel={`Yes, refund ${o.amount}`}
                      keepLabel="Keep the sale"
                      disabled={busy}
                      onConfirm={() => void refund(o)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {refunded.length > 0 && (
            <>
              <h3 className="bk-day-h bk-day-h-small">
                Refunded <span className="bk-day-count">{refunded.length}</span>
              </h3>
              <ul className="bk-day-sold bk-day-refunded" aria-label="Refunded today">
                {refunded.map((o) => (
                  <li key={o.id}>
                    <span className="bk-day-sold-piece">{o.piece}</span>
                    <span className="bk-day-sold-amt">{o.amount}</span>
                    <span className="bk-day-sold-who">
                      Refunded, {methodName(o.method)}, {o.name}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      <div className="bk-day-till">
        <p className="bk-day-take">
          <span>Taken today</span>
          <strong>{day.total}</strong>
          {day.byMethod.length > 0 && <span className="bk-day-take-by">{day.byMethod.map((m) => `${methodName(m.method)} ${m.total}`).join(', ')}</span>}
        </p>
        <button type="button" className="bk-day-ring" disabled={!open} onClick={() => setRinging(true)}>
          Ring up a sale
        </button>
      </div>

      {ringing && (
        <div className="bk-day-sheet" role="dialog" aria-modal="true" aria-labelledby="d-ring">
          <div className="bk-day-sheet-top">
            <h2 id="d-ring" className="bk-day-name">
              Ring up a sale
            </h2>
            <button type="button" className="bk-day-exit" onClick={() => setRinging(false)}>
              Close
            </button>
          </div>
          <RingUp
            eventId={eventId}
            marketName={marketName}
            shopName={shopName}
            pieces={pieces}
            pay={pay}
            methods={methods}
            open={open}
            card={card}
            onRecorded={(message) => {
              setRinging(false);
              notice.showSaved(message);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

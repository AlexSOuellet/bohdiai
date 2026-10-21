'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import QRCode from 'qrcode';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { PaySettings } from '@/lib/market/pay';
import { SELL_METHOD_NAMES, addOne, payStep, pickedCount, sellTotal, sellTotalCents, takeOne, type Picked, type SellMethod, type SellPiece } from '@/lib/backend/markets/sell';
import { recordMarketSales } from '@/lib/backend/markets/today-actions';
import { startCardSale } from '@/lib/backend/payments/square-actions';
import { useNotice } from '../../../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** A big QR the buyer scans from her phone, made in the browser. */
function BigQr({ url, label }: { url: string; label: string }): React.ReactElement {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })
      .then((s) => live && setSvg(s))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [url]);
  return (
    <figure className="bk-sell-qr">
      {failed ? <p className="bk-notice">The code couldn’t be made. Use the link below.</p> : svg !== null && <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />}
      <figcaption>
        {label}
        <br />
        <a href={url} rel="noopener">
          Open the payment link
        </a>
      </figcaption>
    </figure>
  );
}

/** Ring up a sale at the table: tap what they're taking, show them how to pay, record
 *  it. Used by the market-day screen and by Sell at the table. */
export function RingUp({
  eventId,
  marketName,
  shopName,
  pieces,
  pay,
  methods,
  open,
  card = false,
  onRecorded,
}: {
  eventId: string;
  marketName: string;
  shopName: string;
  pieces: SellPiece[];
  pay: PaySettings;
  methods: SellMethod[];
  open: boolean;
  /** Cards through the maker's Square: connected, with a location picked. */
  card?: boolean;
  /** Called once a sale is recorded (the market-day screen closes the sheet). */
  onRecorded?: (message: string) => void;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [picked, setPicked] = useState<Picked>({});
  const [method, setMethod] = useState<SellMethod | 'card' | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const cents = sellTotalCents(pieces, picked);
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const step = method === null || method === 'card' || cents === 0 ? null : payStep(method, pay, cents, `${shopName} · ${marketName}`);

  const inSale = Object.keys(picked).filter((id) => byId.has(id));
  const add = (piece: SellPiece): void => {
    setPicked((p) => addOne(p, piece));
    notice.clear();
  };
  const less = (id: string): void => {
    setPicked((p) => takeOne(p, id));
    notice.clear();
  };

  function saleLines(): { id: string; listingId: string; variantId: string | null; quantity: number }[] {
    return inSale.flatMap((id) => {
      const piece = byId.get(id);
      return piece === undefined ? [] : [{ id, listingId: piece.listingId, variantId: piece.variantId, quantity: picked[id] ?? 1 }];
    });
  }

  /** Card: off to the Square app with the total; Square hands back to the market day,
   *  which says what happened. */
  async function charge(): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await startCardSale(
        eventId,
        saleLines().map(({ listingId, variantId, quantity }) => ({ listingId, variantId, quantity })),
      );
      if (!r.ok) {
        notice.showError(r.error);
        return;
      }
      window.location.assign(/android/i.test(navigator.userAgent) ? r.handOff.android : r.handOff.iphone);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function record(): Promise<void> {
    if (inFlight.current || method === null || method === 'card') return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await recordMarketSales(eventId, saleLines(), method);
      if (r.ok) {
        const message = `Sale recorded: ${sellTotal(pieces, picked)} by ${SELL_METHOD_NAMES[method]}.`;
        notice.showSaved(message);
        onRecorded?.(message);
        setPicked({});
        setMethod(null);
        router.refresh();
      } else {
        notice.showError(r.error);
        setPicked((p) => Object.fromEntries(Object.entries(p).filter(([id]) => !r.recorded.includes(id))));
        router.refresh();
      }
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="bk-sell">
      {notice.area}
        {!open ? (
          <p className="bk-note">This market isn’t on today, so it can’t take a sale. Selling opens on the market’s day.</p>
        ) : pieces.length === 0 ? (
          <p className="bk-note">
            Nothing to sell yet. On this market’s page, tick the pieces you’re bringing (they need a price).{' '}
            <Link href={`/manage/markets/${eventId}` as Route}>Go to the market’s page</Link>
          </p>
        ) : (
          <>
            <section className="bk-section" aria-labelledby="s-pieces">
              <h2 id="s-pieces" className="bk-section-title">
                Tap what they’re taking
              </h2>
              <ul className="bk-sell-grid">
                {pieces.map((p) => {
                  const n = picked[p.id] ?? 0;
                  const allGone = p.left === 0;
                  const noMore = p.left !== null && n >= p.left;
                  return (
                    <li key={p.id}>
                      <button type="button" className="bk-sell-tile" aria-pressed={n > 0} disabled={allGone || noMore} onClick={() => add(p)}>
                        <span>
                          {p.name}
                          {n > 0 && <span className="bk-sell-count"> × {n}</span>}
                        </span>
                        <strong>{p.price}</strong>
                        {p.left !== null && <span className="bk-note">{allGone ? 'All gone here' : `${p.left - n} left`}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="bk-section" aria-labelledby="s-total">
              <h2 id="s-total" className="bk-section-title">
                Total <span className="bk-sell-total">{sellTotal(pieces, picked)}</span>
              </h2>
              {inSale.length > 0 && (
                <ul className="bk-list" aria-label="In this sale">
                  {inSale.map((id) => {
                    const piece = byId.get(id);
                    const n = picked[id] ?? 0;
                    const name = piece?.name ?? 'piece';
                    return (
                      <li key={id} className="bk-list-item">
                        <span className="bk-list-name">{name}</span>
                        <span>
                          {n} × {piece?.price}
                        </span>
                        <span className="bk-row">
                          <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`One fewer ${name}`} onClick={() => less(id)}>
                            −
                          </button>
                          <button
                            type="button"
                            className="bk-btn bk-btn-quiet bk-btn-small"
                            aria-label={`One more ${name}`}
                            disabled={piece === undefined || (piece.left !== null && n >= piece.left)}
                            onClick={() => piece !== undefined && add(piece)}
                          >
                            +
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {methods.length === 0 && !card ? (
                <p className="bk-note">
                  Add how you take payment first. <Link href="/manage/payments">Go to Getting paid</Link>
                </p>
              ) : (
                <div className="bk-row" role="group" aria-label="How are they paying?">
                  {card && (
                    <button type="button" className="bk-btn bk-btn-quiet" aria-pressed={method === 'card'} disabled={pickedCount(picked) === 0} onClick={() => setMethod('card')}>
                      Card
                    </button>
                  )}
                  {methods.map((m) => (
                    <button key={m} type="button" className="bk-btn bk-btn-quiet" aria-pressed={method === m} disabled={pickedCount(picked) === 0} onClick={() => setMethod(m)}>
                      {SELL_METHOD_NAMES[m]}
                    </button>
                  ))}
                </div>
              )}
              {method === 'card' && cents > 0 && (
                <div className="bk-sell-pay">
                  <p className="bk-sell-handle">Square opens with {sellTotal(pieces, picked)}. Tap, insert or type the card there; the sale is recorded when Square comes back.</p>
                  <button type="button" className="bk-btn bk-sell-paid" disabled={busy} onClick={() => void charge()}>
                    {busy ? 'Opening Square…' : `Charge ${sellTotal(pieces, picked)} in Square`}
                  </button>
                </div>
              )}
              {step !== null && (
                <div className="bk-sell-pay">
                  {step.kind === 'qr' && <BigQr url={step.url} label={step.label} />}
                  {step.kind === 'text' && (
                    <p className="bk-sell-handle">
                      {step.label} <strong>{step.text}</strong>
                    </p>
                  )}
                  {step.kind === 'cash' && <p className="bk-sell-handle">{step.label}</p>}
                  <button type="button" className="bk-btn bk-sell-paid" disabled={busy} onClick={() => void record()}>
                    {busy ? 'Recording…' : 'Paid · record the sale'}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
    </div>
  );
}

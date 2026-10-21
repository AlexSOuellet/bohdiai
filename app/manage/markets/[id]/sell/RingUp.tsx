'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import QRCode from 'qrcode';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { PaySettings } from '@/lib/market/pay';
import {
  SELL_METHOD_NAMES,
  addOne,
  lineCents,
  payStep,
  pickedCount,
  readAgreed,
  sellTotal,
  sellTotalCents,
  takeOne,
  type Agreed,
  type Picked,
  type SellMethod,
  type SellPiece,
} from '@/lib/backend/markets/sell';
import { formatPrice } from '@/lib/storefront/catalog';
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
  // Prices agreed with the buyer, by line; the line being changed and what she's typed.
  const [agreed, setAgreed] = useState<Agreed>({});
  const [changing, setChanging] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [method, setMethod] = useState<SellMethod | 'card' | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const cents = sellTotalCents(pieces, picked, agreed);
  const total = sellTotal(pieces, picked, agreed);
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const step = method === null || method === 'card' || cents === 0 ? null : payStep(method, pay, cents, `${shopName} · ${marketName}`);

  const inSale = Object.keys(picked).filter((id) => byId.has(id));
  // A different count is a different deal: changing how many drops the agreed price.
  const forget = (id: string): void => {
    setAgreed((a) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== id)));
    if (changing === id) setChanging(null);
  };
  const add = (piece: SellPiece): void => {
    setPicked((p) => addOne(p, piece));
    forget(piece.id);
    notice.clear();
  };
  const less = (id: string): void => {
    setPicked((p) => takeOne(p, id));
    forget(id);
    notice.clear();
  };
  const startChange = (id: string, marked: number): void => {
    setChanging(id);
    setTyped(((agreed[id] ?? marked) / 100).toFixed(2).replace(/\.00$/, ''));
    notice.clear();
  };
  const applyAgreed = (piece: SellPiece, quantity: number): void => {
    const marked = piece.priceCents * quantity;
    const r = readAgreed(typed, marked);
    if (!r.ok) {
      notice.showError(r.error);
      return;
    }
    setAgreed((a) => (r.cents === marked ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== piece.id)) : { ...a, [piece.id]: r.cents }));
    setChanging(null);
    notice.clear();
  };

  function saleLines(): { id: string; listingId: string; variantId: string | null; quantity: number; agreedCents: number | null }[] {
    return inSale.flatMap((id) => {
      const piece = byId.get(id);
      return piece === undefined ? [] : [{ id, listingId: piece.listingId, variantId: piece.variantId, quantity: picked[id] ?? 1, agreedCents: agreed[id] ?? null }];
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
        saleLines().map(({ listingId, variantId, quantity, agreedCents }) => ({ listingId, variantId, quantity, agreedCents })),
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
        const message = `Sale recorded: ${total} by ${SELL_METHOD_NAMES[method]}.`;
        notice.showSaved(message);
        onRecorded?.(message);
        setPicked({});
        setAgreed({});
        setChanging(null);
        setMethod(null);
        router.refresh();
      } else {
        notice.showError(r.error);
        setPicked((p) => Object.fromEntries(Object.entries(p).filter(([id]) => !r.recorded.includes(id))));
        setAgreed((a) => Object.fromEntries(Object.entries(a).filter(([id]) => !r.recorded.includes(id))));
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
                Total <span className="bk-sell-total">{total}</span>
              </h2>
              {inSale.length > 0 && (
                <ul className="bk-list" aria-label="In this sale">
                  {inSale.map((id) => {
                    const piece = byId.get(id);
                    const n = picked[id] ?? 0;
                    const name = piece?.name ?? 'piece';
                    const deal = agreed[id];
                    const marked = (piece?.priceCents ?? 0) * n;
                    return (
                      <li key={id} className="bk-list-item">
                        <span className="bk-list-name">{name}</span>
                        <span>
                          {deal === undefined ? (
                            <>
                              {n} × {piece?.price}
                            </>
                          ) : (
                            <>
                              <strong>{formatPrice(piece === undefined ? deal : lineCents(piece, n, agreed))}</strong>{' '}
                              <span className="bk-note">agreed, marked {formatPrice(marked)}</span>
                            </>
                          )}
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
                          {piece !== undefined && changing !== id && (
                            <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => startChange(id, marked)}>
                              Change price
                            </button>
                          )}
                        </span>
                        {piece !== undefined && changing === id && (
                          <span className="bk-sell-deal">
                            <label className="bk-label" htmlFor={`deal-${id}`}>
                              Price you agreed{n > 1 ? ` for all ${n}` : ''}
                            </label>
                            <input
                              id={`deal-${id}`}
                              className="bk-input"
                              inputMode="decimal"
                              autoComplete="off"
                              value={typed}
                              onChange={(e) => setTyped(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') applyAgreed(piece, n);
                              }}
                            />
                            <button type="button" className="bk-btn bk-btn-small" onClick={() => applyAgreed(piece, n)}>
                              Use this price
                            </button>
                            <button
                              type="button"
                              className="bk-btn bk-btn-quiet bk-btn-small"
                              onClick={() => {
                                forget(id);
                                setChanging(null);
                              }}
                            >
                              {deal === undefined ? 'Cancel' : 'Back to the marked price'}
                            </button>
                          </span>
                        )}
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
                  <p className="bk-sell-handle">Square opens with {total}. Tap, insert or type the card there; the sale is recorded when Square comes back.</p>
                  <button type="button" className="bk-btn bk-sell-paid" disabled={busy} onClick={() => void charge()}>
                    {busy ? 'Opening Square…' : `Charge ${total} in Square`}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import QRCode from 'qrcode';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { PaySettings } from '@/lib/market/pay';
import { SELL_METHOD_NAMES, payStep, sellTotal, sellTotalCents, type SellMethod, type SellPiece } from '@/lib/backend/markets/sell';
import { recordMarketSales } from '@/lib/backend/markets/today-actions';
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

/** Sell at the table: tap what they're taking, show them how to pay, record the sale. */
export function SellBoard({
  eventId,
  marketName,
  shopName,
  pieces,
  pay,
  methods,
  open,
}: {
  eventId: string;
  marketName: string;
  shopName: string;
  pieces: SellPiece[];
  pay: PaySettings;
  methods: SellMethod[];
  open: boolean;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [picked, setPicked] = useState<string[]>([]);
  const [method, setMethod] = useState<SellMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const cents = sellTotalCents(pieces, picked);
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const step = method === null || cents === 0 ? null : payStep(method, pay, cents, `${shopName} · ${marketName}`);

  const toggle = (id: string): void => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    notice.clear();
  };

  async function record(): Promise<void> {
    if (inFlight.current || method === null) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await recordMarketSales(eventId, picked, method);
      if (r.ok) {
        notice.showSaved(`Sale recorded: ${sellTotal(pieces, picked)} by ${SELL_METHOD_NAMES[method]}.`);
        setPicked([]);
        setMethod(null);
        router.refresh();
      } else {
        notice.showError(r.error);
        setPicked((p) => p.filter((id) => !r.recorded.includes(id)));
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
    <>
      <div className="bk-head">
        <h1 className="bk-title">Sell · {marketName}</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href={`/manage/markets/${eventId}/today` as Route}>
            Back to Today
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content bk-sell">
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
                {pieces.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="bk-sell-tile" aria-pressed={picked.includes(p.id)} onClick={() => toggle(p.id)}>
                      <span>{p.name}</span>
                      <strong>{p.price}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bk-section" aria-labelledby="s-total">
              <h2 id="s-total" className="bk-section-title">
                Total <span className="bk-sell-total">{sellTotal(pieces, picked)}</span>
              </h2>
              {picked.length > 0 && (
                <ul className="bk-list" aria-label="In this sale">
                  {picked.map((id) => (
                    <li key={id} className="bk-list-item">
                      <span className="bk-list-name">{byId.get(id)?.name}</span>
                      <span>{byId.get(id)?.price}</span>
                      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`Remove ${byId.get(id)?.name ?? 'piece'}`} onClick={() => toggle(id)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {methods.length === 0 ? (
                <p className="bk-note">
                  Add how you take payment first. <Link href="/manage/payments">Go to Getting paid</Link>
                </p>
              ) : (
                <div className="bk-row" role="group" aria-label="How are they paying?">
                  {methods.map((m) => (
                    <button key={m} type="button" className="bk-btn bk-btn-quiet" aria-pressed={method === m} disabled={picked.length === 0} onClick={() => setMethod(m)}>
                      {SELL_METHOD_NAMES[m]}
                    </button>
                  ))}
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
      </main>
    </>
  );
}

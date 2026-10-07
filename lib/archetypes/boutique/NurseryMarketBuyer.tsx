'use client';

/**
 * Boutique, nursery design — the buyer's steps on a market's page (Market POS
 * piece 2): pick a baby, give a first name and how you're paying, Continue (the
 * baby is held), pay with the app button / Zelle handle / at the table, then
 * "I paid". Every failure says so; a buyer can step back before paying.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { ProductView } from '@/lib/archetypes/content';
import { METHOD_LABEL, type PayMethod } from '@/lib/market/pay';
import type { PayStep } from '@/lib/market/buyer';
import { NURSERY_STRINGS as S } from './strings';

type Held = {
  orderId: string;
  orderNumber: string;
  piece: string;
  amount: string;
  discount: { label: string; amount: string } | null;
  pay: PayStep;
};

type Step =
  | { kind: 'pick' }
  | { kind: 'details'; piece: ProductView }
  | { kind: 'pay'; held: Held; name: string }
  | { kind: 'done'; held: Held; name: string };

const PIECE_CLASS = 'nn-mk-piece';
const PIECE_GONE_CLASS = ['nn-mk-piece', 'nn-mk-piece--gone'].join(' ');

async function post(url: string, body: unknown): Promise<{ ok: true; body: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, body: json };
    const error = json !== null && typeof json === 'object' && 'error' in json && typeof json.error === 'string' ? json.error : S.market.error;
    return { ok: false, error };
  } catch {
    return { ok: false, error: S.market.errorNetwork };
  }
}

function isHeld(v: unknown): v is Held {
  return v !== null && typeof v === 'object' && 'orderId' in v && 'pay' in v && 'amount' in v;
}

function Photo({ piece }: { piece: ProductView }): ReactElement | null {
  const photo = piece.media.find((m) => m.kind === 'image' && m.url !== undefined);
  if (photo === undefined) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.url} alt={photo.alt} />;
}

function Fee({ piece }: { piece: ProductView }): ReactElement {
  if (piece.salePrice === undefined) return <>{piece.price}</>;
  return (
    <>
      <s className="nn-was">{piece.price}</s> {piece.salePrice}
    </>
  );
}

export function NurseryMarketBuyer({
  marketId,
  pieces,
  methods,
  codes,
}: {
  marketId: string;
  pieces: ProductView[];
  methods: PayMethod[];
  codes: boolean;
}): ReactElement {
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function hold(e: FormEvent<HTMLFormElement>, piece: ProductView): Promise<void> {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    setBusy(true);
    setError(null);
    const r = await post('/api/market/hold', {
      eventId: marketId,
      listingId: piece.id,
      name,
      email: String(data.get('email') ?? ''),
      method: String(data.get('method') ?? ''),
      code: String(data.get('code') ?? ''),
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (!isHeld(r.body)) return setError(S.market.error);
    setStep({ kind: 'pay', held: r.body, name });
  }

  async function follow(url: string, held: Held, then: () => void): Promise<void> {
    setBusy(true);
    setError(null);
    const r = await post(url, { orderId: held.orderId });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    then();
  }

  const alert = error === null ? null : (
    <p className="nn-mk-error" role="alert">
      {error}
    </p>
  );

  if (step.kind === 'done') {
    return (
      <div className="nn-mk-card nn-mk-done" role="status">
        <p className="nn-mk-big">{S.market.doneTitle(step.name)}</p>
        <p>{S.market.done(step.held.piece)}</p>
        <p className="nn-mk-small">{S.market.order(step.held.orderNumber)}</p>
      </div>
    );
  }

  if (step.kind === 'pay') {
    const { held } = step;
    const pay = held.pay;
    return (
      <div className="nn-mk-card">
        <p className="nn-mk-title">{S.market.payTitle(held.piece)}</p>
        <p className="nn-mk-label">{S.market.amount}</p>
        <p className="nn-mk-big">{held.amount}</p>
        {held.discount !== null && <p className="nn-mk-small">{S.market.discount(held.discount.label, held.discount.amount)}</p>}
        {(pay.method === 'venmo' || pay.method === 'cashapp') && (
          <>
            <p>{S.market.send(METHOD_LABEL[pay.method], pay.handle)}</p>
            <a className="nn-btn nn-mk-app" href={pay.link} target="_blank" rel="noopener">
              {S.market.open(METHOD_LABEL[pay.method])}
            </a>
          </>
        )}
        {pay.method === 'zelle' && (
          <p className="nn-mk-zelle">
            {S.market.zelle(pay.handle)}{' '}
            <button
              type="button"
              className="nn-mk-copy"
              onClick={() => {
                void navigator.clipboard?.writeText(pay.handle).then(() => setCopied(true), () => undefined);
              }}
            >
              {copied ? S.market.copied : S.market.copy}
            </button>
          </p>
        )}
        {pay.method === 'cash' && <p>{S.market.cash}</p>}
        {alert}
        <div className="nn-mk-actions">
          <button type="button" className="nn-btn" disabled={busy} onClick={() => void follow('/api/market/paid', held, () => setStep({ kind: 'done', held, name: step.name }))}>
            {busy ? S.market.sending : S.market.paid}
          </button>
          <button type="button" className="nn-mk-link" disabled={busy} onClick={() => void follow('/api/market/release', held, () => setStep({ kind: 'pick' }))}>
            {S.market.another}
          </button>
        </div>
      </div>
    );
  }

  if (step.kind === 'details') {
    const { piece } = step;
    return (
      <div className="nn-mk-card">
        <button type="button" className="nn-mk-link" onClick={() => setStep({ kind: 'pick' })}>
          {S.market.back}
        </button>
        <div className="nn-mk-chosen">
          <span className="nn-mk-thumb">
            <Photo piece={piece} />
          </span>
          <span>
            <span className="nn-mk-name">{piece.name}</span>
            <span className="nn-mk-fee">
              <Fee piece={piece} />
            </span>
          </span>
        </div>
        <form className="nn-mk-form" onSubmit={(e) => void hold(e, piece)}>
          <label>
            {S.market.yourName}
            <input name="name" required maxLength={40} autoComplete="given-name" />
          </label>
          <label>
            {S.market.yourEmail}
            <input name="email" type="email" maxLength={254} autoComplete="email" />
          </label>
          <fieldset>
            <legend>{S.market.payWith}</legend>
            <div className="nn-mk-methods">
              {methods.map((m, i) => (
                <label key={m} className="nn-mk-method">
                  <input type="radio" name="method" value={m} required defaultChecked={i === 0} />
                  <span>{METHOD_LABEL[m]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {codes && (
            <label>
              {S.market.code}
              <input name="code" maxLength={40} autoCapitalize="characters" autoComplete="off" />
            </label>
          )}
          {alert}
          <button className="nn-btn" type="submit" disabled={busy}>
            {busy ? S.market.holding : S.market.continue}
          </button>
        </form>
      </div>
    );
  }

  if (pieces.length === 0) return <p className="nn-mk-note">{S.market.none}</p>;
  return (
    <>
      <p className="nn-mk-note">{S.market.pick}</p>
      <ul className="nn-mk-grid" role="list">
        {pieces.map((p) => {
          const gone = p.status === 'sold_out';
          return (
            <li key={p.slug}>
              <button
                type="button"
                className={gone ? PIECE_GONE_CLASS : PIECE_CLASS}
                disabled={gone}
                onClick={() => {
                  setError(null);
                  setStep({ kind: 'details', piece: p });
                }}
              >
                <span className="nn-mk-thumb">
                  <Photo piece={p} />
                </span>
                <span className="nn-mk-name">{p.name}</span>
                <span className="nn-mk-fee">{gone ? S.card.adopted : <Fee piece={p} />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

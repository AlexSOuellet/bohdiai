'use client';

/**
 * The buyer's steps on a market's page (Market POS piece 2), shared by every
 * design that has one: pick a piece, give a first name and how you're paying,
 * Continue (the piece is held), pay with the app button / Zelle handle / at the
 * table, then "I paid". Every failure says so; a buyer can step back before
 * paying. Each design passes the site's own words (with named blanks, filled
 * here) and its class prefix (`nn` nursery, `ms` the families,
 * `sl` shoreline); the classes it uses are `<prefix>-mk-*`, `<prefix>-btn` and
 * `<prefix>-was`.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { MarketPieceCount, ProductView } from '@/lib/archetypes/content';
import { METHOD_LABEL, type PayMethod } from '@/lib/market/pay';
import type { PayStep } from '@/lib/market/buyer';
import { fill } from '@/lib/site-words/words';

export interface MarketBuyerStrings {
  readonly pick: string;
  readonly none: string;
  readonly back: string;
  readonly yourName: string;
  readonly yourEmail: string;
  readonly payWith: string;
  readonly continue: string;
  readonly holding: string;
  /** {piece} */
  readonly payTitle: string;
  readonly amount: string;
  /** {label} {amount} */
  readonly discount: string;
  /** {app} */
  readonly open: string;
  /** {app} {handle} */
  readonly send: string;
  /** {handle} */
  readonly zelle: string;
  readonly copy: string;
  readonly copied: string;
  readonly cash: string;
  readonly paid: string;
  readonly sending: string;
  readonly another: string;
  /** {name} */
  readonly doneTitle: string;
  /** {piece} */
  readonly done: string;
  /** {n} */
  readonly order: string;
  readonly error: string;
  readonly errorNetwork: string;
  /** Shown in place of the price on a piece that's already gone. */
  readonly gone: string;
  /** The label on how many of a piece the buyer is taking. */
  readonly quantity: string;
  /** The label on which option of a piece (a colour, a size) the buyer is taking. */
  readonly option: string;
  /** {n}: how many are left at this market, when the maker counted them. */
  readonly left: string;
}

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

/** The most a buyer can take of a piece in one go: what's left, at most 99. */
const MAX_AT_ONCE = 99;
function most(left: number | null): number {
  return left === null ? MAX_AT_ONCE : Math.min(left, MAX_AT_ONCE);
}

async function post(
  url: string,
  body: unknown,
  S: MarketBuyerStrings,
): Promise<{ ok: true; body: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, body: json };
    const error = json !== null && typeof json === 'object' && 'error' in json && typeof json.error === 'string' ? json.error : S.error;
    return { ok: false, error };
  } catch {
    return { ok: false, error: S.errorNetwork };
  }
}

function isHeld(v: unknown): v is Held {
  return v !== null && typeof v === 'object' && 'orderId' in v && 'pay' in v && 'amount' in v;
}

function Photo({ piece }: { piece: ProductView }): ReactElement | null {
  const photo = piece.media.find((m) => m.kind === 'image' && m.url !== undefined);
  if (photo === undefined) return null;
  // The owner's own upload, already shrunk at upload.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.url} alt={photo.alt} />;
}

/** The price, or the old price struck through beside the sale price. */
function Fee({ piece, prefix }: { piece: ProductView; prefix: 'nn' | 'sl' | 'ms' }): ReactElement {
  if (piece.salePrice === undefined) return <>{piece.price}</>;
  return (
    <>
      <s className={`${prefix}-was`}>{piece.price}</s> {piece.salePrice}
    </>
  );
}

export function MarketBuyer({
  marketId,
  pieces,
  stock = {},
  methods,
  strings: S,
  prefix: p,
  shop,
}: {
  marketId: string;
  pieces: ProductView[];
  /** What's left of each piece at this market (absent: not counted). */
  stock?: Record<string, MarketPieceCount> | undefined;
  methods: PayMethod[];
  strings: MarketBuyerStrings;
  prefix: 'nn' | 'sl' | 'ms';
  /** One way back to the site, shown only once the buyer is done (no links while buying). */
  shop?: { href: string; label: string };
}): ReactElement {
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const c = (...names: string[]): string => names.map((n) => `${p}-${n}`).join(' ');

  async function hold(e: FormEvent<HTMLFormElement>, piece: ProductView): Promise<void> {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const option = data.get('option');
    setBusy(true);
    setError(null);
    const r = await post(
      '/api/market/hold',
      {
        eventId: marketId,
        listingId: piece.id,
        ...(option === null ? {} : { variantId: String(option) }),
        quantity: Number(data.get('quantity') ?? 1),
        name,
        email: String(data.get('email') ?? ''),
        method: String(data.get('method') ?? ''),
      },
      S,
    );
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (!isHeld(r.body)) return setError(S.error);
    setStep({ kind: 'pay', held: r.body, name });
  }

  async function follow(url: string, held: Held, then: () => void): Promise<void> {
    setBusy(true);
    setError(null);
    const r = await post(url, { orderId: held.orderId }, S);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    then();
  }

  const alert =
    error === null ? null : (
      <p className={c('mk-error')} role="alert">
        {error}
      </p>
    );

  if (step.kind === 'done') {
    return (
      <div className={c('mk-card', 'mk-done')} role="status">
        <p className={c('mk-big')}>{fill(S.doneTitle, { name: step.name })}</p>
        <p>{fill(S.done, { piece: step.held.piece })}</p>
        <p className={c('mk-small')}>{fill(S.order, { n: step.held.orderNumber })}</p>
        {shop !== undefined && (
          <a className={c('btn')} href={shop.href}>
            {shop.label}
          </a>
        )}
      </div>
    );
  }

  if (step.kind === 'pay') {
    const { held } = step;
    const pay = held.pay;
    return (
      <div className={c('mk-card')}>
        <p className={c('mk-title')}>{fill(S.payTitle, { piece: held.piece })}</p>
        <p className={c('mk-label')}>{S.amount}</p>
        <p className={c('mk-big')}>{held.amount}</p>
        {held.discount !== null && <p className={c('mk-small')}>{fill(S.discount, { label: held.discount.label, amount: held.discount.amount })}</p>}
        {(pay.method === 'venmo' || pay.method === 'cashapp') && (
          <>
            <p>{fill(S.send, { app: METHOD_LABEL[pay.method], handle: pay.handle })}</p>
            <a className={c('btn', 'mk-app')} href={pay.link} target="_blank" rel="noopener">
              {fill(S.open, { app: METHOD_LABEL[pay.method] })}
            </a>
          </>
        )}
        {pay.method === 'zelle' && (
          <p className={c('mk-zelle')}>
            {fill(S.zelle, { handle: pay.handle })}{' '}
            <button
              type="button"
              className={c('mk-copy')}
              onClick={() => {
                void navigator.clipboard?.writeText(pay.handle).then(
                  () => setCopied(true),
                  () => undefined,
                );
              }}
            >
              {copied ? S.copied : S.copy}
            </button>
          </p>
        )}
        {pay.method === 'cash' && <p>{S.cash}</p>}
        {alert}
        <div className={c('mk-actions')}>
          <button
            type="button"
            className={c('btn')}
            disabled={busy}
            onClick={() => void follow('/api/market/paid', held, () => setStep({ kind: 'done', held, name: step.name }))}
          >
            {busy ? S.sending : S.paid}
          </button>
          <button
            type="button"
            className={c('mk-link')}
            disabled={busy}
            onClick={() => void follow('/api/market/release', held, () => setStep({ kind: 'pick' }))}
          >
            {S.another}
          </button>
        </div>
      </div>
    );
  }

  if (step.kind === 'details') {
    const { piece } = step;
    const count = piece.id === undefined ? undefined : stock[piece.id];
    const options = count?.options ?? [];
    const firstOpen = options.find((o) => o.left !== 0);
    // Without options the most is what's left of the piece; with options, of the most-stocked open one.
    const max = options.length === 0 ? most(count?.left ?? null) : Math.max(...options.filter((o) => o.left !== 0).map((o) => most(o.left)), 1);
    return (
      <div className={c('mk-card')}>
        <button type="button" className={c('mk-link')} onClick={() => setStep({ kind: 'pick' })}>
          {S.back}
        </button>
        <div className={c('mk-chosen')}>
          <span className={c('mk-thumb')}>
            <Photo piece={piece} />
          </span>
          <span>
            <span className={c('mk-name')}>{piece.name}</span>
            <span className={c('mk-fee')}>
              <Fee piece={piece} prefix={p} />
            </span>
          </span>
        </div>
        <form className={c('mk-form')} onSubmit={(e) => void hold(e, piece)}>
          {options.length > 0 && (
            <fieldset>
              <legend>{S.option}</legend>
              <div className={c('mk-methods')}>
                {options.map((o) => (
                  <label key={o.id} className={c('mk-method')}>
                    <input type="radio" name="option" value={o.id} required disabled={o.left === 0} defaultChecked={o.id === firstOpen?.id} />
                    <span>
                      {o.label} {o.price}
                      {o.left !== null && <span className={c('mk-small')}> {o.left === 0 ? S.gone : fill(S.left, { n: String(o.left) })}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {max > 1 && (
            <label>
              {S.quantity}
              <input name="quantity" type="number" inputMode="numeric" min={1} max={max} defaultValue={1} required />
            </label>
          )}
          <label>
            {S.yourName}
            <input name="name" required maxLength={40} autoComplete="given-name" />
          </label>
          <label>
            {S.yourEmail}
            <input name="email" type="email" maxLength={254} autoComplete="email" />
          </label>
          <fieldset>
            <legend>{S.payWith}</legend>
            <div className={c('mk-methods')}>
              {methods.map((m, i) => (
                <label key={m} className={c('mk-method')}>
                  <input type="radio" name="method" value={m} required defaultChecked={i === 0} />
                  <span>{METHOD_LABEL[m]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {alert}
          <button className={c('btn')} type="submit" disabled={busy}>
            {busy ? S.holding : S.continue}
          </button>
        </form>
      </div>
    );
  }

  if (pieces.length === 0) return <p className={c('mk-note')}>{S.none}</p>;
  return (
    <>
      <p className={c('mk-note')}>{S.pick}</p>
      <ul className={c('mk-grid')} role="list">
        {pieces.map((piece) => {
          const gone = piece.status === 'sold_out';
          const count = piece.id === undefined ? undefined : stock[piece.id];
          // How many are left here, shown when counted (options: their total, when every one is counted).
          const left =
            count === undefined
              ? null
              : count.options.length === 0
                ? count.left
                : count.options.every((o) => o.left !== null)
                  ? count.options.reduce((n, o) => n + (o.left ?? 0), 0)
                  : null;
          return (
            <li key={piece.slug}>
              <button
                type="button"
                className={gone ? c('mk-piece', 'mk-piece--gone') : c('mk-piece')}
                disabled={gone}
                onClick={() => {
                  setError(null);
                  setStep({ kind: 'details', piece });
                }}
              >
                <span className={c('mk-thumb')}>
                  <Photo piece={piece} />
                </span>
                <span className={c('mk-name')}>{piece.name}</span>
                <span className={c('mk-fee')}>{gone ? S.gone : <Fee piece={piece} prefix={p} />}</span>
                {!gone && left !== null && <span className={c('mk-small')}>{fill(S.left, { n: String(left) })}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

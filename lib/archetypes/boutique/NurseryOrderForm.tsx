'use client';

/**
 * Boutique, nursery design — the cart's "send your order" form. Posts the cart's
 * pieces and the shopper's details to /api/order-request; nothing is charged.
 * On success the cart empties and the order number shows. Every failure says so.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { ClearCart } from '@/lib/storefront/CartControls';
import { fill } from '@/lib/site-words/words';
import type { NurseryWords } from './words';

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; orderNumber: string | null }
  | { kind: 'error'; message: string };

export function NurseryOrderForm({
  listingIds,
  w,
  code = null,
}: {
  listingIds: string[];
  w: NurseryWords['cart'];
  code?: string | null;
}): ReactElement {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/order-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds,
          code: code ?? '',
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone') ?? '',
          note: data.get('note') ?? '',
          company: data.get('company') ?? '',
        }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (res.ok) {
        const n = body !== null && typeof body === 'object' && 'orderNumber' in body && typeof body.orderNumber === 'string' ? body.orderNumber : null;
        setState({ kind: 'sent', orderNumber: n });
        return;
      }
      const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : w.error;
      setState({ kind: 'error', message });
    } catch {
      setState({ kind: 'error', message: w.errorNetwork });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="bc-form__done" role="status">
        <ClearCart />
        {state.orderNumber !== null && <p className="nn-order__num">{fill(w.sentTitle, { n: state.orderNumber })}</p>}
        <p>{w.sent}</p>
      </div>
    );
  }

  return (
    <form className="bc-form" onSubmit={onSubmit}>
      <div className="bc-form__row">
        <label>
          {w.name}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {w.email}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <label>
        {w.phone}
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </label>
      <label>
        {w.note}
        <textarea name="note" maxLength={2000} />
      </label>
      <label className="bc-form__trap" aria-hidden="true">
        {w.honeypot}
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? w.sending : w.send}
      </button>
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

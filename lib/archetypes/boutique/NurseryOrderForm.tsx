'use client';

/**
 * Boutique, nursery design — the cart's "send your order" form. Posts the cart's
 * pieces and the shopper's details to /api/order-request; nothing is charged.
 * On success the cart empties and the order number shows. Every failure says so.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { ClearCart } from '@/lib/storefront/CartControls';
import { NURSERY_STRINGS as S } from './strings';

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; orderNumber: string | null }
  | { kind: 'error'; message: string };

export function NurseryOrderForm({ listingIds }: { listingIds: string[] }): ReactElement {
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
      const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : S.cart.error;
      setState({ kind: 'error', message });
    } catch {
      setState({ kind: 'error', message: S.cart.errorNetwork });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="bc-form__done" role="status">
        <ClearCart />
        {state.orderNumber !== null && <p className="nn-order__num">{S.cart.sentTitle(state.orderNumber)}</p>}
        <p>{S.cart.sent}</p>
      </div>
    );
  }

  return (
    <form className="bc-form" onSubmit={onSubmit}>
      <div className="bc-form__row">
        <label>
          {S.cart.name}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {S.cart.email}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <label>
        {S.cart.phone}
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </label>
      <label>
        {S.cart.note}
        <textarea name="note" maxLength={2000} />
      </label>
      <label className="bc-form__trap" aria-hidden="true">
        {S.cart.honeypot}
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? S.cart.sending : S.cart.send}
      </button>
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

'use client';

/**
 * Shoreline design — the cart's "send my order" letter (Full). Posts the cart's
 * pieces and the shopper's details to /api/order-request; nothing is charged (card
 * payment is off on the demo). On success the cart empties and the order number
 * shows. Every failure says so.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { ClearCart } from '@/lib/storefront/CartControls';
import { CARD_STRINGS } from './strings';

const C = CARD_STRINGS.shoreline.cart;

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; orderNumber: string | null } | { kind: 'error'; message: string };

export function ShorelineOrderForm({ listingIds, code = null }: { listingIds: string[]; code?: string | null }): ReactElement {
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
      const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : C.error;
      setState({ kind: 'error', message });
    } catch {
      setState({ kind: 'error', message: C.errorNetwork });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="bc-form__done" role="status">
        <ClearCart />
        {state.orderNumber !== null && <p className="sl-order-num">{C.sentTitle(state.orderNumber)}</p>}
        <p>{C.sent}</p>
      </div>
    );
  }

  return (
    <form className="bc-form" onSubmit={onSubmit}>
      <div className="bc-form__row">
        <label>
          {C.name}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {C.email}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <label>
        {C.phone}
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </label>
      <label>
        {C.note}
        <textarea name="note" maxLength={2000} />
      </label>
      <label className="bc-form__trap" aria-hidden="true">
        {CARD_STRINGS.form.honeypot}
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? C.sending : C.send}
      </button>
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

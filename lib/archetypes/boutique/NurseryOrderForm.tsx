'use client';

/**
 * Boutique, nursery design — the cart's "send your order" form. Posts the cart's
 * pieces and the shopper's details to /api/order-request; nothing is charged.
 * When the shop takes payment through its own Square (`square`), the same details
 * go with the Pay button to Square's own checkout page instead.
 * On success the cart empties and the order number shows. Every failure says so.
 */
import { useRef, useState, type FormEvent, type ReactElement } from 'react';
import { ClearCart } from '@/lib/storefront/CartControls';
import { fill } from '@/lib/site-words/words';
import type { NurseryWords } from './words';
import { SquarePayButton } from '@/lib/storefront/SquarePay';

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; orderNumber: string | null }
  | { kind: 'error'; message: string };

export function NurseryOrderForm({
  listingIds,
  w,
  code = null,
  square = false,
}: {
  listingIds: string[];
  w: NurseryWords['cart'];
  code?: string | null;
  /** The shop takes payment through its own Square. */
  square?: boolean;
}): ReactElement {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);

  /** The order's details from the form, or null after the browser shows what's missing. */
  function details(): Record<string, unknown> | null {
    const form = formRef.current;
    if (form === null || !form.reportValidity()) return null;
    const data = new FormData(form);
    return {
      listingIds,
      code: code ?? '',
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone') ?? '',
      note: data.get('note') ?? '',
      company: data.get('company') ?? '',
    };
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    // Paying online, the order only goes through the Pay button (Enter never sends it unpaid).
    if (square) return;
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
    <form className="bc-form" onSubmit={onSubmit} ref={formRef}>
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
      {square ? (
        <SquarePayButton details={details} w={w} />
      ) : (
        <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? w.sending : w.send}
        </button>
      )}
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

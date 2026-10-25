'use client';

/**
 * The cart's "send my order" form (Full), shared by every design with a cart.
 * Without online payment it posts the cart's pieces and the shopper's details to
 * /api/order-request and nothing is charged. When the shop takes PayPal (`pay`),
 * the same details go with the PayPal button instead, and the order is placed when
 * the payment goes through. On success the cart empties and the order number shows.
 * Every failure says so.
 */
import { useRef, useState, type FormEvent, type ReactElement } from 'react';
import type { OnlinePay } from '@/lib/archetypes/content';
import { ClearCart } from '@/lib/storefront/CartControls';
import { fill } from '@/lib/site-words/words';
import { PayPalButtons } from './PayPalButtons';

/** The site's words the order form shows (each design keeps them under its own spots). */
export type OrderFormWords = {
  name: string;
  email: string;
  phone: string;
  note: string;
  send: string;
  sending: string;
  sentTitle: string;
  sent: string;
  error: string;
  errorNetwork: string;
  /** Paying online: while PayPal finishes, when it fails, when the buyer closes PayPal, when PayPal can't load. */
  paying: string;
  payError: string;
  payCancelled: string;
  payUnavailable: string;
  /** Paid: the thank-you under the order number. */
  paid: string;
};

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; orderNumber: string | null; paid: boolean } | { kind: 'error'; message: string };

export function OrderRequestForm({
  listingIds,
  code = null,
  w: C,
  honeypot,
  pay = null,
}: {
  listingIds: string[];
  code?: string | null;
  w: OrderFormWords;
  /** The hidden spam trap's label. */
  honeypot: string;
  /** The shop takes payment through its own PayPal. */
  pay?: OnlinePay | null;
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
    // Paying online, the order only goes through the PayPal button (Enter never sends it unpaid).
    if (pay !== null) return;
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
        setState({ kind: 'sent', orderNumber: n, paid: false });
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
        {state.orderNumber !== null && <p className="order-num">{fill(C.sentTitle, { n: state.orderNumber })}</p>}
        <p>{state.paid ? C.paid : C.sent}</p>
      </div>
    );
  }

  return (
    <form className="bc-form" onSubmit={onSubmit} ref={formRef}>
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
        {honeypot}
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      {pay === null ? (
        <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? C.sending : C.send}
        </button>
      ) : (
        <PayPalButtons pay={pay} details={details} w={C} onPaid={(orderNumber) => setState({ kind: 'sent', orderNumber, paid: true })} />
      )}
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

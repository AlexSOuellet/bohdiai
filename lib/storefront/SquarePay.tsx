'use client';

/**
 * Paying through the shop's own Square (Full). The Pay button checks the shopper's
 * details, our server saves the order and has Square make its checkout page for
 * exactly that total, and the shopper goes there to pay: the card is typed only on
 * Square's page, never on the site. Coming back, `CheckoutReturned` says what Square
 * confirmed. Every failure says so.
 */
import { useState, type ReactElement } from 'react';
import type { CheckoutReturn } from '@/lib/archetypes/content';
import { ClearCart } from '@/lib/storefront/CartControls';
import { fill } from '@/lib/site-words/words';

/** The site's words for paying through Square (each design keeps them under its own spots). */
export type SquarePayWords = {
  /** The button, while it opens Square's page, and when no reason came back. */
  payButton: string;
  payGoing: string;
  payError: string;
  errorNetwork: string;
};

/** The site's words for coming back from Square's page; "{n}" is the order number. */
export type ReturnWords = {
  sentTitle: string;
  paid: string;
  payWaiting: string;
  paySold: string;
  payProblem: string;
};

export function SquarePayButton({ details, w }: { details: () => Record<string, unknown> | null; w: SquarePayWords }): ReactElement {
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'going' } | { kind: 'error'; message: string }>({ kind: 'idle' });

  async function go(): Promise<void> {
    const body = details();
    if (body === null) return;
    setState({ kind: 'going' });
    let res: Response;
    try {
      res = await fetch('/api/checkout/square/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      setState({ kind: 'error', message: w.errorNetwork });
      return;
    }
    const out: unknown = await res.json().catch(() => null);
    const field = (k: string): unknown => (out !== null && typeof out === 'object' ? (out as Record<string, unknown>)[k] : undefined);
    const url = field('url');
    if (res.ok && typeof url === 'string' && url.startsWith('https://')) {
      window.location.assign(url);
      return;
    }
    const error = field('error');
    setState({ kind: 'error', message: typeof error === 'string' ? error : w.payError });
  }

  return (
    <>
      <button className="bc-btn" type="button" disabled={state.kind === 'going'} onClick={() => void go()}>
        {state.kind === 'going' ? w.payGoing : w.payButton}
      </button>
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </>
  );
}

/** Paid or still being confirmed: the order is placed, so the cart is done with. */
export function returnedDone(r: CheckoutReturn | undefined): boolean {
  return r?.kind === 'paid' || r?.kind === 'waiting';
}

/** What Square said, back from its page. Paid or waiting empties the cart; sold or
 *  a mismatch leaves it, so the shopper sees what's still there. */
export function CheckoutReturned({ returned, w, numberClass }: { returned: CheckoutReturn; w: ReturnWords; numberClass: string }): ReactElement {
  const n = { n: returned.orderNumber };
  if (returnedDone(returned)) {
    return (
      <div className="bc-form__done" role="status">
        <ClearCart />
        <p className={numberClass}>{fill(w.sentTitle, n)}</p>
        <p>{returned.kind === 'paid' ? w.paid : fill(w.payWaiting, n)}</p>
      </div>
    );
  }
  return (
    <p className="bc-form__status" role="alert">
      {fill(returned.kind === 'sold' ? w.paySold : w.payProblem, n)}
    </p>
  );
}

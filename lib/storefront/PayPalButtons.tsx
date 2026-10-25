'use client';

/**
 * The cart's PayPal button (Full, when the shop's own PayPal is connected). PayPal's
 * own script draws it, with its card option for buyers without PayPal; BohdiAI never
 * sees a card. Clicking checks the shopper's details first; our server then saves
 * the order and asks PayPal for a payment of exactly its total (create); once the
 * buyer approves in PayPal, our server has PayPal take it and records the order paid
 * only when PayPal confirms (capture). Every failure says so; nothing is charged
 * unless capture succeeds.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { OnlinePay } from '@/lib/archetypes/content';

type PayPalActions = { reject: () => Promise<void>; resolve: () => Promise<void> };
type PayPalNamespace = {
  Buttons: (options: {
    style?: Record<string, string | number | boolean>;
    onClick: (data: unknown, actions: PayPalActions) => Promise<void> | void;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => Promise<void> };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

/** PayPal's script for this shop's account and currency (one per page). */
function sdkUrl(pay: OnlinePay): string {
  const q = new URLSearchParams({ 'client-id': pay.clientId, 'merchant-id': pay.merchantId, currency: pay.currency, intent: 'capture', components: 'buttons' });
  return `https://www.paypal.com/sdk/js?${q.toString()}`;
}

function loadSdk(pay: OnlinePay): Promise<PayPalNamespace> {
  if (window.paypal !== undefined) return Promise.resolve(window.paypal);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = sdkUrl(pay);
    s.async = true;
    s.onload = () => (window.paypal === undefined ? reject(new Error('no paypal')) : resolve(window.paypal));
    s.onerror = () => reject(new Error('paypal script failed'));
    document.head.appendChild(s);
  });
}

export type PayWords = { paying: string; payError: string; payCancelled: string; payUnavailable: string; errorNetwork: string };

export function PayPalButtons({
  pay,
  details,
  w,
  onPaid,
}: {
  pay: OnlinePay;
  /** The shopper's details from the form, or null (after showing what's missing) when they aren't filled in right. */
  details: () => Record<string, unknown> | null;
  w: PayWords;
  onPaid: (orderNumber: string | null) => void;
}): ReactElement {
  const slot = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{ kind: 'idle' } | { kind: 'paying' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  // The latest props, for PayPal's callbacks (drawn once).
  const latest = useRef({ details, onPaid, w });
  useEffect(() => {
    latest.current = { details, onPaid, w };
  });

  useEffect(() => {
    let live = true;
    let buttons: { close?: () => Promise<void> } | null = null;
    async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
      let res: Response;
      try {
        res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch {
        throw new Error(latest.current.w.errorNetwork);
      }
      const json: unknown = await res.json().catch(() => null);
      const out = json !== null && typeof json === 'object' ? (json as Record<string, unknown>) : {};
      if (!res.ok) throw new Error(typeof out['error'] === 'string' ? out['error'] : latest.current.w.payError);
      return out;
    }
    loadSdk(pay)
      .then((paypal) => {
        if (!live || slot.current === null) return;
        const b = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay' },
          onClick: (_data, actions) => {
            setStatus({ kind: 'idle' });
            return latest.current.details() === null ? actions.reject() : actions.resolve();
          },
          createOrder: async () => {
            const body = latest.current.details();
            if (body === null) throw new Error(latest.current.w.payError);
            try {
              const out = await post('/api/checkout/paypal/create', body);
              if (typeof out['paypalOrderId'] !== 'string') throw new Error(latest.current.w.payError);
              return out['paypalOrderId'];
            } catch (err) {
              setStatus({ kind: 'error', message: err instanceof Error ? err.message : latest.current.w.payError });
              throw err;
            }
          },
          onApprove: async ({ orderID }) => {
            setStatus({ kind: 'paying' });
            try {
              const out = await post('/api/checkout/paypal/capture', { paypalOrderId: orderID });
              latest.current.onPaid(typeof out['orderNumber'] === 'string' ? out['orderNumber'] : null);
            } catch (err) {
              setStatus({ kind: 'error', message: err instanceof Error ? err.message : latest.current.w.payError });
            }
          },
          onCancel: () => setStatus({ kind: 'error', message: latest.current.w.payCancelled }),
          onError: () => setStatus((s) => (s.kind === 'error' ? s : { kind: 'error', message: latest.current.w.payError })),
        });
        buttons = b;
        return b.render(slot.current);
      })
      .catch(() => live && setStatus({ kind: 'error', message: latest.current.w.payUnavailable }));
    return () => {
      live = false;
      void buttons?.close?.();
    };
  }, [pay]);

  return (
    <div className="bc-pay">
      <div ref={slot} className="bc-pay__buttons" aria-busy={status.kind === 'paying'} />
      {status.kind === 'paying' && (
        <p className="bc-form__status" role="status">
          {w.paying}
        </p>
      )}
      {status.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
}

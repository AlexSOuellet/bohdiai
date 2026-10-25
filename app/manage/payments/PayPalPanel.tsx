'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { checkPayPal, disconnectPayPal } from '@/lib/backend/payments/paypal-actions';
import type { PayPalLink } from '@/lib/paypal/connection';
import { useNotice } from '../_components/Notice';
import { ConfirmButton } from '../_components/ConfirmButton';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Online orders paid through the maker's own PayPal: connect it, check it again, or
 *  disconnect. Nothing secret ever reaches this screen. */
export function PayPalPanel({
  link,
  ready,
  testing,
  outcome,
}: {
  link: PayPalLink | null;
  /** PayPal is set up on BohdiAI (its partner details are in place). */
  ready: boolean;
  /** BohdiAI is on PayPal's test copy: no real money moves yet. */
  testing: boolean;
  /** What happened on the way back from PayPal's page. */
  outcome: { tone: 'ok' | 'error'; text: string } | null;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (outcome === null) return;
    if (outcome.tone === 'ok') notice.showSaved(outcome.text);
    else notice.showError(outcome.text);
    // Once: the message came in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        notice.showSaved(done);
        router.refresh();
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="bk-section" aria-labelledby="s-paypal">
      <h2 id="s-paypal" className="bk-section-title">
        Online orders, through your PayPal
      </h2>
      {notice.area}
      {testing && <p className="bk-note">PayPal is in test mode on BohdiAI while we wait for PayPal’s approval: only PayPal’s test accounts work, and no real money moves.</p>}
      {link === null ? (
        <>
          <p className="bk-note">
            Connect your PayPal and your shop’s checkout takes payment: shoppers pay with PayPal, or with a card even if they don’t have PayPal. The money goes
            straight to your own PayPal. BohdiAI never sees a card or your PayPal password, and takes no cut. You need a PayPal business account; PayPal lets you
            make one, or switch a personal account over, on its own page.
          </p>
          {ready ? (
            <p className="bk-row">
              <a className="bk-btn" href="/api/paypal/connect">
                Connect PayPal
              </a>
            </p>
          ) : (
            <p className="bk-note">PayPal isn’t set up on BohdiAI yet. We’re waiting on PayPal’s approval; this button turns on as soon as it comes through.</p>
          )}
        </>
      ) : (
        <>
          <p className="bk-sq-linked">
            Connected to <strong>{link.email === '' ? 'your PayPal' : link.email}</strong>
          </p>
          {link.ready ? (
            <p className="bk-note">Your checkout takes PayPal and cards. Refunds you give in Orders go back through your PayPal.</p>
          ) : (
            <>
              <p className="bk-note">
                PayPal says your account can’t take payments yet
                {!link.emailConfirmed && ': confirm your email address with PayPal'}
                {link.emailConfirmed && !link.paymentsReceivable && ': finish the steps PayPal emailed you'}
                . Your checkout won’t offer PayPal until it can.
              </p>
              <p className="bk-row">
                <button type="button" className="bk-btn" disabled={busy} onClick={() => void run(checkPayPal, 'PayPal says your account is ready. Your checkout takes PayPal now.')}>
                  Check again
                </button>
              </p>
            </>
          )}
          <p className="bk-row">
            <ConfirmButton
              label="Disconnect PayPal"
              confirmLabel="Yes, disconnect"
              keepLabel="Keep it connected"
              disabled={busy}
              onConfirm={() =>
                void run(
                  disconnectPayPal,
                  'Your PayPal is disconnected: your checkout no longer offers it. To take BohdiAI’s access away on PayPal’s side too, remove it in your PayPal account’s settings.',
                )
              }
            />
          </p>
        </>
      )}
    </section>
  );
}

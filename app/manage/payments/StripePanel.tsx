'use client';

import { useEffect } from 'react';
import { useNotice } from '../_components/Notice';

/** Online orders paid through the maker's own Stripe. Connect Stripe is here for her to
 *  find; the connection itself is built with online payments, so for now pressing it
 *  comes back saying Stripe isn't set up on BohdiAI yet. */
export function StripePanel({ outcome }: { outcome: { tone: 'ok' | 'error'; text: string } | null }): React.ReactElement {
  const notice = useNotice();

  useEffect(() => {
    if (outcome === null) return;
    if (outcome.tone === 'ok') notice.showSaved(outcome.text);
    else notice.showError(outcome.text);
    // Once: the message came in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bk-section" aria-labelledby="s-stripe">
      <h2 id="s-stripe" className="bk-section-title">
        Online orders, through your Stripe
      </h2>
      {notice.area}
      <p className="bk-note">
        Connect your Stripe and your shop’s checkout takes cards, with the money going straight to your own Stripe. BohdiAI never sees a card or your Stripe
        password, and takes no cut.
      </p>
      <p className="bk-note">Stripe isn’t set up on BohdiAI yet, so connecting isn’t open yet.</p>
      <p className="bk-row">
        <a className="bk-btn" href="/api/stripe/connect">
          Connect Stripe
        </a>
      </p>
    </section>
  );
}

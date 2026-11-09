'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { updateCard } from '@/lib/backend/plan/card-actions';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Opens Stripe's own page to put a new card on; the card is never typed here. */
export function CardButton(): React.ReactElement {
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  async function go(): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      // On success the action sends the browser on to Stripe and never returns.
      const r = await updateCard();
      notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="bk-plan-btns">
      {notice.area}
      <button type="button" className="bk-btn" disabled={busy} onClick={() => void go()}>
        {busy ? 'Opening Stripe…' : 'Update my card'}
      </button>
      <p className="bk-note">You’ll type your card on Stripe’s own page. BohdiAI never sees it.</p>
    </div>
  );
}

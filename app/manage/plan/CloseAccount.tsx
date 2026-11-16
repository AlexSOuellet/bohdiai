'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { closeAccount, keepSite, type ChangePlanResult } from '@/lib/backend/plan/actions';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Close my account (Alex, 2026-11-16): for a maker leaving BohdiAI completely, not just
 *  moving to Free. One plain line under Cancel opens it; it says exactly what goes and
 *  that it can't be undone, and the maker types the site's name to confirm. A paid site
 *  closes at the end of its term (and can be kept until then); one with nothing to pay
 *  for closes at once. */
export function CloseAccount({
  siteName,
  endsOn,
  closesNow,
  closing,
}: {
  siteName: string;
  endsOn: string;
  /** Nothing paid to run out (Free, or a free site): it closes as soon as it's confirmed. */
  closesNow: boolean;
  /** Already set to close at the end of the term. */
  closing: boolean;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  async function run(work: () => Promise<ChangePlanResult>): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) router.refresh();
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (closing) {
    return (
      <section className="bk-section bk-close" aria-labelledby="s-close">
        <h2 id="s-close" className="bk-section-title">
          Your account is closing
        </h2>
        {notice.area}
        <p className="bk-note">{`On ${endsOn}, at the end of your current term, your account closes and everything in it is removed for good: your site, photos, products, events, sales and customers. Changed your mind? Keep your account before then.`}</p>
        <button type="button" className="bk-btn" disabled={busy} onClick={() => void run(keepSite)}>
          Keep my account
        </button>
      </section>
    );
  }

  const when = closesNow
    ? 'as soon as you confirm'
    : `on ${endsOn}, at the end of your current term`;
  return (
    <section className="bk-close-line" aria-labelledby="s-close">
      {!open ? (
        <p className="bk-note">
          Want to leave BohdiAI completely?{' '}
          <button type="button" className="bk-link bk-close-open" onClick={() => setOpen(true)}>
            Close my account
          </button>
        </p>
      ) : (
        <div className="bk-section bk-close">
          <h2 id="s-close" className="bk-section-title">
            Close my account
          </h2>
          {notice.area}
          <p className="bk-note">{`Your account closes ${when}. This can’t be undone. Everything is removed for good:`}</p>
          <ul className="bk-close-list">
            <li>your site, and its web address</li>
            <li>every photo and file you uploaded</li>
            <li>your products, events, sales and customer lists</li>
            <li>your saved Print it pieces and tool numbers</li>
            <li>your login, so BohdiAI won’t email you again</li>
          </ul>
          <p className="bk-note">
            Stripe keeps its own record of your past payments, for receipts and tax.
          </p>
          <div className="bk-field">
            <label className="bk-label" htmlFor="close-name">{`Type ${siteName} to confirm`}</label>
            <input
              id="close-name"
              className="bk-input"
              type="text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
          <div className="bk-row">
            <button
              type="button"
              className="bk-btn bk-btn-danger"
              disabled={busy || typed.trim().toLowerCase() !== siteName.trim().toLowerCase()}
              onClick={() => void run(() => closeAccount(typed))}
            >
              {busy
                ? 'One moment…'
                : closesNow
                  ? 'Close my account now'
                  : `Close my account on ${endsOn}`}
            </button>
            <button
              type="button"
              className="bk-btn bk-btn-quiet"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setTyped('');
              }}
            >
              Keep my account
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

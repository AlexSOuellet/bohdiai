'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { cancelAtTermEnd, keepSite, type ChangePlanResult } from '@/lib/backend/plan/actions';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Cancel on Your plan (Alex, 2026-10-19): the site stays up to the end of the
 *  current term, then comes down (kept and hidden, never deleted). Until that day
 *  the maker can keep it. On Market and Full, Showcase is offered as a quieter
 *  choice first, never automatically. */
export function CancelPanel({ cancels, endsOn, offerShowcase }: { cancels: boolean; endsOn: string; offerShowcase: boolean }): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
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

  return (
    <section className="bk-section" aria-labelledby="s-cancel">
      <h2 id="s-cancel" className="bk-section-title">
        {cancels ? 'Your site is closing' : 'Cancel'}
      </h2>
      {notice.area}
      {cancels ? (
        <>
          <p className="bk-note">{`Your site goes down on ${endsOn}, at the end of your current term. Nothing is deleted. Changed your mind? Keep it before then.`}</p>
          <button type="button" className="bk-btn" disabled={busy} onClick={() => void run(keepSite)}>
            Keep my site
          </button>
        </>
      ) : (
        <>
          <p className="bk-note">{`If you cancel, your site stays up until ${endsOn}, the end of your current term, and then comes down. Nothing is deleted, and you can change your mind before then.`}</p>
          {offerShowcase && (
            <p className="bk-note">
              Quiet season? You can keep a small site on Showcase instead.{' '}
              <Link href="/manage/plan/change?to=showcase" className="bk-link">
                Move to Showcase
              </Link>
            </p>
          )}
          <ConfirmButton label="Cancel my site" confirmLabel={`Yes, close it on ${endsOn}`} keepLabel="Keep my site" disabled={busy} onConfirm={() => void run(cancelAtTermEnd)} />
        </>
      )}
    </section>
  );
}

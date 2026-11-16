'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { cancelAtTermEnd, keepSite, type ChangePlanResult } from '@/lib/backend/plan/actions';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Cancel on Your plan (Alex, 2026-10-19): the site stays up to the end of the
 *  current term, then comes down and the maker moves to Free (Alex, 2026-11-16): no
 *  more charges, their products and tools kept. Until that day the maker can keep it.
 *  Showcase is offered as a quieter choice first, unless it's the plan already or on
 *  its way; a downgrade waiting is named, since cancelling replaces it. */
export function CancelPanel({
  cancels,
  endsOn,
  offerShowcase,
  waiting,
}: {
  cancels: boolean;
  endsOn: string;
  offerShowcase: boolean;
  /** The plan a downgrade is waiting to move to at renewal, or null. */
  waiting: string | null;
}): React.ReactElement {
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
        {cancels ? 'You’re moving to Free' : 'Cancel'}
      </h2>
      {notice.area}
      {cancels ? (
        <>
          <p className="bk-note">{`On ${endsOn}, at the end of your current term, your site comes down and you move to Free. Nothing more is charged, and nothing is deleted: your products and tools stay. Changed your mind? Keep your site before then.`}</p>
          <button
            type="button"
            className="bk-btn"
            disabled={busy}
            onClick={() => void run(keepSite)}
          >
            Keep my site
          </button>
        </>
      ) : (
        <>
          <p className="bk-note">{`If you cancel, your site stays up until ${endsOn}, the end of your current term. Then it comes down and you move to Free: nothing more is charged, and your products and tools stay. You can move back up any time, and change your mind before then.`}</p>
          {waiting !== null && (
            <p className="bk-note">{`You’re set to move to ${waiting} on ${endsOn}. If you cancel instead, you move to Free that day.`}</p>
          )}
          {offerShowcase && (
            <p className="bk-note">
              Quiet season? You can keep a small site on Showcase instead.{' '}
              <Link href="/manage/plan/change?to=showcase" className="bk-link">
                Move to Showcase
              </Link>
            </p>
          )}
          <ConfirmButton
            label="Cancel my site"
            confirmLabel={`Yes, move me to Free on ${endsOn}`}
            keepLabel="Keep my site"
            disabled={busy}
            onConfirm={() => void run(cancelAtTermEnd)}
          />
        </>
      )}
    </section>
  );
}

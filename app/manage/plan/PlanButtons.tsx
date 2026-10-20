'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import {
  cancelScheduledChange,
  setDemoBilling,
  skipToRenewal,
  type ChangePlanResult,
} from '@/lib/backend/plan/actions';
import type { Billing } from '@/lib/backend/plan/billing';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** The small plan buttons on Your plan: keep the current plan after all, and on the
 *  demo, a note that plays out a waiting move now (a maker trying the demo can't wait
 *  for the renewal day) and the billing switch, so moves and credit can be shown. */
export function PlanButtons({
  keepLabel,
  demo,
  billing,
  pending = null,
}: {
  keepLabel: string | null;
  demo: boolean;
  billing: Billing;
  /** The move waiting for the renewal: the plan's name and the day, in words. */
  pending?: { planName: string; on: string } | null;
}): React.ReactElement | null {
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

  if (keepLabel === null && !demo) return null;
  return (
    <div className="bk-plan-btns">
      {notice.area}
      {keepLabel !== null && (
        <button
          type="button"
          className="bk-btn"
          disabled={busy}
          onClick={() => void run(cancelScheduledChange)}
        >
          {keepLabel}
        </button>
      )}
      {demo && (
        <>
          {pending !== null && (
            <div className="bk-demo-note" role="note">
              <p>
                <strong>This is a demo.</strong> On a real site, your move to {pending.planName} happens on {pending.on}, when
                your plan renews. Want to see it now?
              </p>
              <button type="button" className="bk-btn" disabled={busy} onClick={() => void run(skipToRenewal)}>
                Move to {pending.planName} now
              </button>
            </div>
          )}
          <span className="bk-demo-billing" role="group" aria-label="Demo only: try monthly or yearly billing">
            <span className="bk-label">Demo only: try monthly or yearly billing</span>
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                type="button"
                className="bk-btn bk-btn-small bk-btn-quiet"
                aria-pressed={billing === b}
                disabled={busy}
                onClick={() => void run(() => setDemoBilling(b))}
              >
                {b === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </span>
        </>
      )}
    </div>
  );
}

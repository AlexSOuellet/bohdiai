'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { cancelScheduledChange, setDemoBilling, skipToRenewal, type ChangePlanResult } from '@/lib/backend/plan/actions';
import type { Billing } from '@/lib/backend/plan/billing';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** The small plan buttons on Your plan: keep the current plan after all, and the
 *  demo's "skip to renewal" and billing switch so moves and credit can be shown on camera. */
export function PlanButtons({ keepLabel, demo, billing }: { keepLabel: string | null; demo: boolean; billing: Billing }): React.ReactElement | null {
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
        <button type="button" className="bk-btn" disabled={busy} onClick={() => void run(cancelScheduledChange)}>
          {keepLabel}
        </button>
      )}
      {demo && (
        <>
          <button type="button" className="bk-btn bk-btn-quiet" disabled={busy} onClick={() => void run(skipToRenewal)}>
            Skip to renewal (demo)
          </button>
          <span className="bk-demo-billing" role="group" aria-label="Billing (demo)">
            <span className="bk-label">Billing (demo)</span>
            {(['monthly', 'yearly'] as const).map((b) => (
              <button key={b} type="button" className="bk-btn bk-btn-small bk-btn-quiet" aria-pressed={billing === b} disabled={busy} onClick={() => void run(() => setDemoBilling(b))}>
                {b === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </span>
        </>
      )}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setBuyerAccounts } from '@/lib/backend/buyers/actions';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Customer accounts (Full): her switch. On, her site's menu shows Account and
 *  Customers joins the backend menu; off, sign-in hides and nothing is deleted. */
export function CustomerAccountsSwitch({ on: initialOn }: { on: boolean }): React.ReactElement {
  const [on, setOn] = useState(initialOn);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();

  async function toggle(next: boolean): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await setBuyerAccounts(next);
      if (r.ok) {
        setOn(next);
        notice.showSaved(
          next
            ? 'Customer accounts are on. Your site shows Account in its menu, and Customers is in your menu here.'
            : 'Customer accounts are off. Your customers can’t sign in until you turn them back on; nothing is deleted.',
        );
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
    <>
      <div className="bk-head">
        <h1 className="bk-title">Customer accounts</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-switch">
          <h2 id="s-switch" className="bk-section-title">
            Sign-in on your site
          </h2>
          <label className="bk-check">
            <input type="checkbox" checked={on} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
            <strong>Let customers make an account on my site</strong>
          </label>
          <p className="bk-note">
            With an account, a customer signs in on your site to see their past orders and order the same pieces again. Anyone can still check out without
            one. Turning this off hides sign-in; their accounts and orders are kept.
          </p>
        </section>
      </main>
    </>
  );
}

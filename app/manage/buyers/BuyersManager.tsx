'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setBuyerAccounts } from '@/lib/backend/buyers/actions';
import type { ShopBuyer } from '@/lib/backend/buyers/queries';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

const day = (iso: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

/** Buyers (Full): her switch for buyer accounts, then everyone with an account at her shop. */
export function BuyersManager({ on: initialOn, buyers }: { on: boolean; buyers: readonly ShopBuyer[] }): React.ReactElement {
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
        notice.showSaved(next ? 'Buyer accounts are on. Your site shows Account in its menu.' : 'Buyer accounts are off. Your buyers can’t sign in until you turn them back on; nothing is deleted.');
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
        <h1 className="bk-title">Buyers</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-switch">
          <h2 id="s-switch" className="bk-section-title">
            Buyer accounts
          </h2>
          <label className="bk-check">
            <input type="checkbox" checked={on} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
            <strong>Let buyers make an account on my site</strong>
          </label>
          <p className="bk-note">
            With an account, a buyer signs in on your site to see their past orders and order the same pieces again. Anyone can still check out without one.
            Turning this off hides sign-in; their accounts and orders are kept.
          </p>
        </section>
        <section className="bk-section" aria-labelledby="s-buyers">
          <h2 id="s-buyers" className="bk-section-title">
            Your buyers
          </h2>
          {buyers.length === 0 ? (
            <p className="bk-note">No one has made an account yet. When a buyer does, they show here.</p>
          ) : (
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((b) => (
                    <tr key={b.id}>
                      <td>{b.name}</td>
                      <td>
                        <a className="bk-link" href={`mailto:${b.email}`}>
                          {b.email}
                        </a>
                      </td>
                      <td>{day(b.joined)}</td>
                      <td>{b.orders}</td>
                      <td>{b.spent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

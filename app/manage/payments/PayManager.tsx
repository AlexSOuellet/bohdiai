'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { savePaySettings } from '@/lib/backend/payments/actions';
import { buildPayRow, type PaySettings } from '@/lib/market/pay';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

function Method({
  id,
  title,
  on,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bk-pay">
      <label className="bk-check">
        <input id={id} type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        <strong>{title}</strong>
      </label>
      {children}
    </div>
  );
}

/** Getting paid: the ways buyers can pay at a market, each switched on or off. */
export function PayManager({ initial }: { initial: PaySettings }): React.ReactElement {
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const update = (patch: Partial<PaySettings>): void => setS((x) => ({ ...x, ...patch }));

  async function save(): Promise<void> {
    const check = buildPayRow(s);
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await savePaySettings(s);
      if (r.ok) notice.showSaved('Saved. Your market pages offer these now.');
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
    <>
      <div className="bk-head">
        <h1 className="bk-title">Getting paid</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-pay">
          <h2 id="s-pay" className="bk-section-title">
            How buyers pay you at a market
          </h2>
          <p className="bk-note">
            Buyers see these only on the payment step of a market page, after they pick a piece. They’re the same details you’d put on a sign at your
            table, so nobody can use them to take money from you. Turn on just the ways you take.
          </p>
          <Method id="pay-venmo" title="Venmo" on={s.venmoOn} onToggle={(on) => update({ venmoOn: on })}>
            <div className="bk-field">
              <label className="bk-label" htmlFor="pay-venmo-user">
                Your Venmo username
              </label>
              <input id="pay-venmo-user" className="bk-input" placeholder="@" autoCapitalize="none" maxLength={31} value={s.venmo} onChange={(e) => update({ venmo: e.target.value })} />
            </div>
          </Method>
          <Method id="pay-cashapp" title="Cash App" on={s.cashappOn} onToggle={(on) => update({ cashappOn: on })}>
            <div className="bk-field">
              <label className="bk-label" htmlFor="pay-cashtag">
                Your $cashtag
              </label>
              <input id="pay-cashtag" className="bk-input" placeholder="$" autoCapitalize="none" maxLength={21} value={s.cashapp} onChange={(e) => update({ cashapp: e.target.value })} />
            </div>
          </Method>
          <Method id="pay-zelle" title="Zelle" on={s.zelleOn} onToggle={(on) => update({ zelleOn: on })}>
            <div className="bk-field">
              <label className="bk-label" htmlFor="pay-zelle-id">
                The phone number or email your Zelle uses
              </label>
              <input id="pay-zelle-id" className="bk-input" maxLength={254} value={s.zelle} onChange={(e) => update({ zelle: e.target.value })} />
            </div>
          </Method>
          <Method id="pay-cash" title="Cash at the table" on={s.cashOn} onToggle={(on) => update({ cashOn: on })} />
          <p className="bk-note">Cards come later, once your Square is connected.</p>
          <p className="bk-row">
            <button type="button" className="bk-btn" disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </p>
        </section>
      </main>
    </>
  );
}

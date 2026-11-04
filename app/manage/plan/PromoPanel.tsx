'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { redeemPromo } from '@/lib/backend/plan/promo-actions';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** A promo code on Your plan, and any discount already running. */
export function PromoPanel({ discount }: { discount: string | null }): React.ReactElement {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setSaid(null);
    try {
      const r = await redeemPromo(code);
      setSaid(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) {
        setCode('');
        router.refresh();
      }
    } catch (err) {
      unstable_rethrow(err);
      setSaid({ ok: false, text: FAILED });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bk-section">
      <h2 className="bk-section-title">Promo code</h2>
      {discount !== null && <p className="bk-note">Your discount: {discount}</p>}
      <form onSubmit={onSubmit}>
        <div className="bk-field">
          <label htmlFor="bk-promo" className="bk-label">
            Enter your code
          </label>
          <input id="bk-promo" autoComplete="off" maxLength={30} className="bk-input" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <button type="submit" className="bk-btn" disabled={busy}>
          {busy ? 'Checking…' : 'Use code'}
        </button>
        {said !== null && (
          <p role={said.ok ? 'status' : 'alert'} className={said.ok ? 'bk-note' : 'bk-error'}>
            {said.text}
          </p>
        )}
      </form>
    </section>
  );
}

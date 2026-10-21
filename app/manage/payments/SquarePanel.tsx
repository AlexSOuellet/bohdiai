'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { chooseSquareLocation, disconnectSquare, squareLocations } from '@/lib/backend/payments/square-actions';
import type { SquareLink } from '@/lib/square/connection';
import type { SquareLocation } from '@/lib/square/api';
import { useNotice } from '../_components/Notice';
import { ConfirmButton } from '../_components/ConfirmButton';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Cards at a market, through the maker's own Square: connect it, pick which Square
 *  location the sales go to, or disconnect. No keys ever reach this screen. */
export function SquarePanel({
  link,
  ready,
  outcome,
}: {
  link: SquareLink | null;
  /** Card payments are set up on BohdiAI (Square's app details are in place). */
  ready: boolean;
  /** What happened on the way back from Square's page. */
  outcome: { tone: 'ok' | 'error'; text: string } | null;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [busy, setBusy] = useState(false);
  const [locations, setLocations] = useState<SquareLocation[] | null>(null);
  const [pick, setPick] = useState('');
  const inFlight = useRef(false);
  const needsLocation = link !== null && link.locationId === null;

  useEffect(() => {
    if (outcome === null) return;
    if (outcome.tone === 'ok') notice.showSaved(outcome.text);
    else notice.showError(outcome.text);
    // Once: the message came in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!needsLocation) return;
    let live = true;
    squareLocations()
      .then((r) => {
        if (!live) return;
        if (r.ok) setLocations(r.locations);
        else notice.showError(r.error);
      })
      .catch(() => live && notice.showError(FAILED));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLocation]);

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        notice.showSaved(done);
        router.refresh();
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
    <section className="bk-section" aria-labelledby="s-square">
      <h2 id="s-square" className="bk-section-title">
        Cards, through your Square
      </h2>
      {notice.area}
      {link === null ? (
        <>
          <p className="bk-note">
            Connect your Square and the market app takes cards: it opens the Square app on your phone with the total filled in, you tap, insert or type the
            card there, and the sale is recorded here. The money goes straight to your own Square. BohdiAI never sees a card or your Square password.
          </p>
          {ready ? (
            <p className="bk-row">
              <a className="bk-btn" href="/api/square/connect">
                Connect Square
              </a>
            </p>
          ) : (
            <p className="bk-note">Card payments aren’t set up on BohdiAI yet.</p>
          )}
        </>
      ) : (
        <>
          <p className="bk-sq-linked">
            Connected to <strong>{link.businessName === '' ? 'your Square' : link.businessName}</strong>
            {link.locationName !== '' && (
              <>
                {' '}
                · card sales go to <strong>{link.locationName}</strong>
              </>
            )}
          </p>
          {needsLocation && (
            <div className="bk-field">
              <label className="bk-label" htmlFor="sq-location">
                Which Square location do your market sales go to?
              </label>
              <select id="sq-location" className="bk-input" value={pick} onChange={(e) => setPick(e.target.value)} disabled={locations === null}>
                <option value="">{locations === null ? 'Loading your locations…' : 'Pick one'}</option>
                {(locations ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <p className="bk-row">
                <button type="button" className="bk-btn" disabled={busy || pick === ''} onClick={() => void run(() => chooseSquareLocation(pick), 'Saved. Card sales go there now.')}>
                  Save
                </button>
              </p>
            </div>
          )}
          <p className="bk-note">
            Typing a card in by hand works too, in Square’s own screen, when a card won’t tap or read. Square charges a higher fee for a typed-in card.
          </p>
          <p className="bk-row">
            <ConfirmButton
              label="Disconnect Square"
              confirmLabel="Yes, disconnect"
              keepLabel="Keep it connected"
              disabled={busy}
              onConfirm={() => void run(disconnectSquare, 'Your Square is disconnected, and Square has cancelled BohdiAI’s access.')}
            />
          </p>
        </>
      )}
    </section>
  );
}

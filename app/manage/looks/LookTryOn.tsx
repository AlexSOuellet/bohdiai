'use client';

import { useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { keepThisLook } from '@/lib/backend/looks/actions';
import type { Look } from '@/lib/site/looks';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** Her own live site in every mood, the way bohdiai.com/looks shows the sample: a row of
 *  moods above her site in a browser window, a Computer/Phone switch, and Keep this look.
 *  Nothing changes on her site until she keeps one. */
export function LookTryOn({
  looks,
  current,
  siteUrl,
  noScene,
}: {
  looks: readonly Look[];
  /** The mood her site wears now. */
  current: string | null;
  /** Her site's address. */
  siteUrl: string;
  /** Moods she can look at but can't keep yet (Scenic without her own photo). */
  noScene: boolean;
}): React.ReactElement {
  const router = useRouter();
  const notice = useNotice();
  const [picked, setPicked] = useState<Look>(looks.find((l) => l.mood === current) ?? looks[0]!);
  const [phone, setPhone] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = `${siteUrl}/?previewMood=${encodeURIComponent(picked.mood)}&previewLook=${encodeURIComponent(picked.skin)}`;
  const wearing = picked.mood === current;
  const blocked = picked.mood === 'scenic' && noScene;

  async function keep(): Promise<void> {
    setBusy(true);
    notice.clear();
    try {
      const r = await keepThisLook(picked.mood);
      if (r.ok) {
        notice.showSaved(`Your site wears the ${picked.label} look now.`);
        router.refresh();
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bk-looks">
      <section className="bk-section" aria-labelledby="s-looks">
        <h2 id="s-looks" className="bk-section-title">
          Try on a look
        </h2>
        <p className="bk-note">Pick a mood to see your whole site in it, with your own pieces and words. Click around inside it too. Nothing changes until you keep one.</p>
        {notice.area}
        <div className="bk-looks-bar">
          <div role="group" aria-label="Moods" className="bk-looks-moods">
            {looks.map((look) => (
              <button key={look.mood} type="button" aria-pressed={look.mood === picked.mood} className="bk-looks-mood" onClick={() => setPicked(look)}>
                <svg aria-hidden="true" viewBox="0 0 18 12" className="bk-looks-swatch">
                  {look.swatch.map((c, i) => (
                    <rect key={i} x={i * 6} y={0} width={6} height={12} fill={c} />
                  ))}
                </svg>
                {look.label}
                {look.mood === current && <span className="bk-pill">Yours now</span>}
              </button>
            ))}
          </div>
          <div role="group" aria-label="View" className="bk-looks-view">
            {[false, true].map((isPhone) => (
              <button key={String(isPhone)} type="button" aria-pressed={phone === isPhone} className="bk-looks-viewbtn" onClick={() => setPhone(isPhone)}>
                {isPhone ? 'Phone' : 'Computer'}
              </button>
            ))}
          </div>
        </div>
        <p className="bk-row">
          {wearing ? (
            <span className="bk-note">This is the look your site wears now.</span>
          ) : blocked ? (
            <span className="bk-note">Scenic shows your own photo behind the page, and your site doesn’t have one yet. Contact support to add one, then you can keep it.</span>
          ) : (
            <button type="button" className="bk-btn" disabled={busy} onClick={() => void keep()}>
              {busy ? 'Keeping…' : `Keep the ${picked.label} look`}
            </button>
          )}
        </p>
      </section>
      <div className="bk-looks-window" data-phone={phone ? 'true' : 'false'}>
        <div className="bk-looks-chrome">
          <span className="bk-looks-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="bk-looks-label">{picked.label}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="bk-looks-open">
            Open in a new tab ↗
          </a>
        </div>
        <iframe key={url} src={url} title={`Your site in the ${picked.label} look`} className="bk-looks-frame" />
      </div>
    </div>
  );
}

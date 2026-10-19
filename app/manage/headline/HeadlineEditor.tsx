'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { saveHeadline } from '@/lib/backend/moment/actions';
import { buildHeadlineRow, type HeadlineForm } from '@/lib/backend/moment/headline-form';
import { MOMENT_LIMITS } from '@/lib/backend/moment/moment-form';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** The headline at the top of the home page and the line under it. One form, one
 *  Save; every failure lands in the notice at the top. */
export function HeadlineEditor({ initial, siteUrl }: { initial: HeadlineForm; siteUrl: string }): React.ReactElement {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = form.headline !== saved.headline || form.sub !== saved.sub;

  const update = (patch: Partial<HeadlineForm>): void => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  async function save(): Promise<void> {
    if (inFlight.current) return;
    const checked = buildHeadlineRow(form);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await saveHeadline(form);
      if (r.ok) {
        setSaved(form);
        notice.showSaved('Saved. Your site shows the changes now.');
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
        <h1 className="bk-title">Headline</h1>
        <div className="bk-head-actions">
          <a className="bk-btn bk-btn-quiet" href={siteUrl} target="_blank" rel="noopener noreferrer">
            View your site
          </a>
          {unsaved && <span className="bk-note">Unsaved changes</span>}
          <button type="button" className="bk-btn" disabled={busy || !unsaved} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <section className="bk-section" aria-labelledby="s-headline">
          <h2 id="s-headline" className="bk-section-title">The top of your home page</h2>
          <div className="bk-field">
            <label htmlFor="h-headline" className="bk-label">
              Headline
            </label>
            <input id="h-headline" className="bk-input" aria-describedby="h-headline-hint" value={form.headline} onChange={(e) => update({ headline: e.target.value })} />
            <p id="h-headline-hint" className="bk-note">
              The big words visitors see first, often your business name. {form.headline.length}/{MOMENT_LIMITS.headline}
            </p>
          </div>
          <div className="bk-field">
            <label htmlFor="h-sub" className="bk-label">
              The line under it
            </label>
            <textarea id="h-sub" className="bk-input bk-textarea" aria-describedby="h-sub-hint" value={form.sub} onChange={(e) => update({ sub: e.target.value })} />
            <p id="h-sub-hint" className="bk-note">
              One plain sentence about what you make. Leave it blank to show none. {form.sub.length}/{MOMENT_LIMITS.sub}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

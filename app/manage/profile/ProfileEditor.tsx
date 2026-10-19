'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { saveAbout, type AboutForm } from '@/lib/backend/profile/actions';
import { buildProfileHomes, EMPTY_PROFILE, PROFILE_LIMITS } from '@/lib/backend/profile/profile-form';
import { useNotice } from '../_components/Notice';
import { PortraitField } from './PortraitField';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** About you holds only what's in the About section (Alex, 2026-10-19): the about
 *  heading, the story, the quote and who it's from, and the portrait. The words at
 *  the top of the page live on Headline; the scrolling line, contact information
 *  and socials each have their own screen. One Save (the portrait saves on its own);
 *  every failure lands in the notice at the top. */
export function ProfileEditor({ initial, portraitUrl, siteUrl }: { initial: AboutForm; portraitUrl: string | null; siteUrl: string }): React.ReactElement {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = JSON.stringify(form) !== JSON.stringify(saved);

  const update = (patch: Partial<AboutForm>): void => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  async function save(): Promise<void> {
    if (inFlight.current) return;
    const checked = buildProfileHomes({ ...EMPTY_PROFILE, ...form });
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await saveAbout(form);
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
        <h1 className="bk-title">About you</h1>
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

        <section className="bk-section" aria-labelledby="s-words">
          <h2 id="s-words" className="bk-section-title">About</h2>
          <div className="bk-field">
            <label htmlFor="p-aboutTitle" className="bk-label">
              About heading
            </label>
            <input id="p-aboutTitle" className="bk-input" aria-describedby="p-aboutTitle-hint" value={form.aboutTitle} onChange={(e) => update({ aboutTitle: e.target.value })} />
            <p id="p-aboutTitle-hint" className="bk-note">
              The heading over your story. {form.aboutTitle.length}/{PROFILE_LIMITS.aboutTitle}
            </p>
          </div>
          <div className="bk-field">
            <label htmlFor="p-bio" className="bk-label">
              Your story
            </label>
            <textarea id="p-bio" className="bk-input bk-textarea" aria-describedby="p-bio-hint" value={form.bio} onChange={(e) => update({ bio: e.target.value })} />
            <p id="p-bio-hint" className="bk-note">
              A few short paragraphs. Leave a blank line between paragraphs. {form.bio.length}/{PROFILE_LIMITS.bio}
            </p>
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-quote">
          <h2 id="s-quote" className="bk-section-title">In your words</h2>
          <p className="bk-note">A line in your own voice, with your photo beside it.</p>
          <div className="bk-field">
            <label htmlFor="p-quote" className="bk-label">
              Your quote
            </label>
            <textarea id="p-quote" className="bk-input bk-textarea" aria-describedby="p-quote-hint" value={form.quote} onChange={(e) => update({ quote: e.target.value })} />
            <p id="p-quote-hint" className="bk-note">
              Something you’d say about your work. {form.quote.length}/{PROFILE_LIMITS.quote}
            </p>
          </div>
          <div className="bk-field">
            <label htmlFor="p-quoteAttribution" className="bk-label">
              Who it’s from
            </label>
            <input id="p-quoteAttribution" className="bk-input" aria-describedby="p-quoteAttribution-hint" value={form.quoteAttribution} onChange={(e) => update({ quoteAttribution: e.target.value })} />
            <p id="p-quoteAttribution-hint" className="bk-note">
              Your name, and a word about you if you like. {form.quoteAttribution.length}/{PROFILE_LIMITS.quoteAttribution}
            </p>
          </div>
          <PortraitField initialUrl={portraitUrl} notice={notice} />
        </section>
      </main>
    </>
  );
}

'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { saveProfile } from '@/lib/backend/profile/actions';
import { buildProfileRow, PROFILE_LIMITS, type ProfileForm } from '@/lib/backend/profile/profile-form';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

type TextKey = keyof typeof PROFILE_LIMITS;

const TEXT_FIELDS: { key: TextKey; label: string; hint: string; long?: boolean }[] = [
  { key: 'kicker', label: 'Short line above your name', hint: 'A few words, like “Handmade in Rhode Island”.' },
  { key: 'headline', label: 'Headline', hint: 'One sentence under your name: what you make, in your words.' },
  { key: 'aboutTitle', label: 'About heading', hint: 'The big heading over your story.' },
  { key: 'bio', label: 'Your story', hint: 'A few short paragraphs. Leave a blank line between paragraphs.', long: true },
  { key: 'signature', label: 'Sign-off name', hint: 'The name your story is signed with, like your first name.' },
];

/** About you: the words on the business card and how people reach the owner. One
 *  form, one Save; every failure lands in the notice at the top. */
export function ProfileEditor({ initial, siteUrl }: { initial: ProfileForm; siteUrl: string }): React.ReactElement {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = JSON.stringify(form) !== JSON.stringify(saved);

  const update = (patch: Partial<ProfileForm>): void => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  async function save(): Promise<void> {
    if (inFlight.current) return;
    const checked = buildProfileRow(form);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await saveProfile(form);
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
          <h2 id="s-words" className="bk-section-title">Your words</h2>
          {TEXT_FIELDS.map(({ key, label, hint, long }) => {
            const id = `p-${key}`;
            const used = form[key].length;
            return (
              <div className="bk-field" key={key}>
                <label htmlFor={id} className="bk-label">
                  {label}
                </label>
                {long === true ? (
                  <textarea id={id} className="bk-input bk-textarea" aria-describedby={`${id}-hint`} value={form[key]} onChange={(e) => update({ [key]: e.target.value })} />
                ) : (
                  <input id={id} className="bk-input" aria-describedby={`${id}-hint`} value={form[key]} onChange={(e) => update({ [key]: e.target.value })} />
                )}
                <p id={`${id}-hint`} className="bk-note">
                  {hint} {used}/{PROFILE_LIMITS[key]}
                </p>
              </div>
            );
          })}
        </section>

        <section className="bk-section" aria-labelledby="s-reach">
          <h2 id="s-reach" className="bk-section-title">How people reach you</h2>
          <p className="bk-note">Each one shows on your site only when it’s filled in. Messages from your contact form go to your email.</p>
          <div className="bk-field">
            <label htmlFor="p-phone" className="bk-label">
              Phone
            </label>
            <input id="p-phone" className="bk-input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="p-facebook" className="bk-label">
              Facebook page
            </label>
            <input id="p-facebook" className="bk-input" inputMode="url" placeholder="facebook.com/yourpage" value={form.facebookUrl} onChange={(e) => update({ facebookUrl: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="p-instagram" className="bk-label">
              Instagram
            </label>
            <input id="p-instagram" className="bk-input" inputMode="url" placeholder="instagram.com/yourname or @yourname" value={form.instagramUrl} onChange={(e) => update({ instagramUrl: e.target.value })} />
          </div>
        </section>
      </main>
    </>
  );
}

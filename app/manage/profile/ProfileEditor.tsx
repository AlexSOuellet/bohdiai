'use client';

import { Fragment, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { saveProfile } from '@/lib/backend/profile/actions';
import {
  buildProfileRow,
  MAKE_MAX,
  MAKES_LIMIT,
  MARQUEE_LIMIT,
  MARQUEE_PHRASE_MAX,
  PROFILE_LIMITS,
  type ProfileForm,
} from '@/lib/backend/profile/profile-form';
import { useNotice } from '../_components/Notice';
import { PortraitField } from './PortraitField';

const FAILED = 'Something went wrong. Check your connection and try again.';

type TextKey = keyof typeof PROFILE_LIMITS;

const TEXT_FIELDS: { key: TextKey; label: string; hint: string; long?: boolean }[] = [
  { key: 'kicker', label: 'Short line above your name', hint: 'A few words, like “Handmade in Rhode Island”.' },
  { key: 'headline', label: 'Headline', hint: 'One sentence under your name: what you make, in your words.' },
  { key: 'aboutTitle', label: 'About heading', hint: 'The big heading over your story.' },
  { key: 'bio', label: 'Your story', hint: 'A few short paragraphs. Leave a blank line between paragraphs.', long: true },
  { key: 'signature', label: 'Sign-off name', hint: 'The name your story is signed with, like your first name.' },
];

/** The form always holds three What I make slots; blanks are dropped on save. */
const withSlots = (f: ProfileForm): ProfileForm => ({ ...f, makes: Array.from({ length: MAKES_LIMIT }, (_, i) => f.makes[i] ?? '') });

/** Marquee boxes: the phrases typed so far plus one empty box, up to the limit. */
export function marqueeSlots(phrases: readonly string[]): string[] {
  const kept = [...phrases];
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();
  return kept.length < MARQUEE_LIMIT ? [...kept, ''] : kept.slice(0, MARQUEE_LIMIT);
}

/** About you: the words on the business card and how people reach the owner. One
 *  form, one Save (the portrait saves on its own); every failure lands in the
 *  notice at the top. */
export function ProfileEditor({ initial, portraitUrl, siteUrl }: { initial: ProfileForm; portraitUrl: string | null; siteUrl: string }): React.ReactElement {
  const [form, setForm] = useState(() => withSlots(initial));
  const [saved, setSaved] = useState(() => withSlots(initial));
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = JSON.stringify(form) !== JSON.stringify(saved);

  const update = (patch: Partial<ProfileForm>): void => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  const setMake = (i: number, value: string): void => update({ makes: form.makes.map((m, j) => (j === i ? value : m)) });
  const marquee = marqueeSlots(form.marqueePhrases);
  const setPhrase = (i: number, value: string): void => {
    const next = marquee.map((m, j) => (j === i ? value : m));
    while (next.length > 0 && next[next.length - 1] === '') next.pop();
    update({ marqueePhrases: next });
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
              <Fragment key={key}>
              <div className="bk-field">
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
              {key === 'headline' && (
                <fieldset className="bk-field" aria-describedby="p-makes-hint">
                  <legend className="bk-label">What I make</legend>
                  {form.makes.map((m, i) => (
                    <input key={i} id={`p-make-${i}`} className="bk-input" aria-label={`Thing you make ${i + 1}`} maxLength={MAKE_MAX} value={m} onChange={(e) => setMake(i, e.target.value)} />
                  ))}
                  <p id="p-makes-hint" className="bk-note">
                    Up to {MAKES_LIMIT} short things, like “Carved signs”. Some designs show them under your name.
                  </p>
                </fieldset>
              )}
              </Fragment>
            );
          })}
        </section>

        <section className="bk-section" aria-labelledby="s-quote">
          <h2 id="s-quote" className="bk-section-title">In your words</h2>
          <p className="bk-note">A line in your own voice, with your photo beside it. Some designs show this.</p>
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

        <section className="bk-section" aria-labelledby="s-marquee">
          <h2 id="s-marquee" className="bk-section-title">Marquee</h2>
          <fieldset className="bk-field" aria-describedby="p-marquee-hint">
            <legend className="bk-label">Marquee phrases</legend>
            {marquee.map((m, i) => (
              <input key={i} id={`p-marquee-${i}`} className="bk-input" aria-label={`Marquee phrase ${i + 1}`} maxLength={MARQUEE_PHRASE_MAX} value={m} onChange={(e) => setPhrase(i, e.target.value)} />
            ))}
            <p id="p-marquee-hint" className="bk-note">
              Short phrases that scroll across your site, in this order. Up to {MARQUEE_LIMIT}, {MARQUEE_PHRASE_MAX} characters each. A new box appears as you fill the last one; clear a box to drop it. Some designs show this.
            </p>
          </fieldset>
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

'use client';

import { saveMarquee } from '@/lib/backend/profile/actions';
import { buildProfileHomes, EMPTY_PROFILE, MARQUEE_LIMIT, MARQUEE_PHRASE_MAX } from '@/lib/backend/profile/profile-form';
import { useSaveForm } from '../_components/useSaveForm';
import { ScreenHead } from '../_components/ScreenHead';

/** Boxes: the phrases typed so far plus one empty box, up to the limit. */
export function marqueeSlots(phrases: readonly string[]): string[] {
  const kept = [...phrases];
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();
  return kept.length < MARQUEE_LIMIT ? [...kept, ''] : kept.slice(0, MARQUEE_LIMIT);
}

/** The scrolling line: the short phrases that run across the home page, in order. */
export function MarqueeEditor({ initial, siteUrl }: { initial: string[]; siteUrl: string }): React.ReactElement {
  const s = useSaveForm(
    { phrases: initial },
    (f) => saveMarquee(f.phrases.filter((p) => p.trim() !== '')),
    (f) => {
      const r = buildProfileHomes({ ...EMPTY_PROFILE, marqueePhrases: f.phrases });
      return r.ok ? null : r.error;
    },
  );
  const slots = marqueeSlots(s.form.phrases);
  const setPhrase = (i: number, value: string): void => {
    const next = slots.map((m, j) => (j === i ? value : m));
    while (next.length > 0 && next[next.length - 1] === '') next.pop();
    s.update({ phrases: next });
  };
  return (
    <>
      <ScreenHead title="Scrolling line" siteUrl={siteUrl} unsaved={s.unsaved} busy={s.busy} onSave={() => void s.submit()} />
      <main id="main" className="bk-content">
        {s.notice.area}
        <section className="bk-section" aria-labelledby="s-marquee">
          <h2 id="s-marquee" className="bk-section-title">The words that scroll across your page</h2>
          <fieldset className="bk-field" aria-describedby="m-hint">
            <legend className="bk-label">Phrases</legend>
            {slots.map((m, i) => (
              <input key={i} className="bk-input" aria-label={`Phrase ${i + 1}`} maxLength={MARQUEE_PHRASE_MAX} value={m} onChange={(e) => setPhrase(i, e.target.value)} />
            ))}
            <p id="m-hint" className="bk-note">
              {`Short phrases, in this order. Up to ${MARQUEE_LIMIT}, ${MARQUEE_PHRASE_MAX} characters each. A new box appears as you fill the last one; clear a box to drop it. With none, the line doesn’t show.`}
            </p>
          </fieldset>
        </section>
      </main>
    </>
  );
}

'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setHomeSection } from '@/lib/backend/home-sections/actions';
import type { HomeSection } from '@/lib/storefront/home-sections';
import type { HomeSectionRow } from '@/lib/backend/my-site';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** On your home page: a switch beside each section, top to bottom. Off hides it
 *  from her home page straight away; its words and photos are kept. */
export function HomeSectionSwitches({ rows: initial }: { rows: readonly HomeSectionRow[] }): React.ReactElement {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<HomeSection | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function flip(row: HomeSectionRow, on: boolean): Promise<void> {
    if (busy !== null) return;
    setBusy(row.section);
    setMessage(null);
    try {
      const r = await setHomeSection(row.section, on);
      if (r.ok) {
        setRows((list) => list.map((x) => (x.section === row.section ? { ...x, on } : x)));
        setMessage({ error: false, text: on ? `${row.label} shows on your home page.` : `${row.label} is hidden from your home page. Nothing is deleted.` });
      } else setMessage({ error: true, text: r.error });
    } catch (err) {
      unstable_rethrow(err);
      setMessage({ error: true, text: FAILED });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bk-home-switches" aria-labelledby="bk-home-switches">
      <h2 id="bk-home-switches" className="bk-tools-title">
        On your home page
      </h2>
      <ul className="bk-switch-list">
        {rows.map((row) => (
          <li key={row.section}>
            <label className="bk-switch-row">
              <span className="bk-switch-text">
                <span className="bk-switch-name">{row.label}</span>
                {row.heading !== '' && <span className="bk-switch-heading">{row.heading}</span>}
              </span>
              <input
                type="checkbox"
                role="switch"
                className="bk-toggle"
                checked={row.on}
                disabled={busy !== null}
                onChange={(e) => void flip(row, e.target.checked)}
              />
            </label>
          </li>
        ))}
      </ul>
      <p className={message?.error === true ? 'bk-error' : 'bk-note'} role="status" aria-live="polite">
        {message?.text ?? 'Turn a section off to hide it. Its words and photos are kept.'}
      </p>
    </section>
  );
}

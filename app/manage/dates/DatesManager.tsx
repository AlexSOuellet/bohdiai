'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { addMarketDate, updateMarketDate, removeMarketDate } from '@/lib/backend/dates/actions';
import { DATES_LIMIT, DATE_LIMITS, EMPTY_DATE, buildDateRow, byDay, type MarketDate, type MarketDateForm } from '@/lib/backend/dates/dates-form';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** "Sat, Oct 11, 2026" for the owner's list. */
function showDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function DateFields({ form, onChange, idPrefix }: { form: MarketDateForm; onChange: (patch: Partial<MarketDateForm>) => void; idPrefix: string }): React.ReactElement {
  return (
    <div className="bk-row">
      <div className="bk-field">
        <label className="bk-label" htmlFor={`${idPrefix}-date`}>
          Day
        </label>
        <input id={`${idPrefix}-date`} className="bk-input" type="date" value={form.date} onChange={(e) => onChange({ date: e.target.value })} />
      </div>
      <div className="bk-field">
        <label className="bk-label" htmlFor={`${idPrefix}-name`}>
          Market
        </label>
        <input id={`${idPrefix}-name`} className="bk-input" maxLength={DATE_LIMITS.name} value={form.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="bk-field">
        <label className="bk-label" htmlFor={`${idPrefix}-town`}>
          Town <span className="bk-note">(optional)</span>
        </label>
        <input id={`${idPrefix}-town`} className="bk-input" maxLength={DATE_LIMITS.town} value={form.town} onChange={(e) => onChange({ town: e.target.value })} />
      </div>
    </div>
  );
}

/** Market dates: add one (saved straight away), change one in place, remove one
 *  after a confirm. Listed earliest first; past dates stay until the owner removes
 *  them. Every failure lands in the notice at the top. */
export function DatesManager({ initial, siteUrl }: { initial: MarketDate[]; siteUrl: string }): React.ReactElement {
  const [items, setItems] = useState(() => [...initial].sort(byDay));
  const [draft, setDraft] = useState<MarketDateForm>(EMPTY_DATE);
  const [editing, setEditing] = useState<{ id: string; form: MarketDateForm } | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const full = items.length >= DATES_LIMIT;

  async function run<T extends { ok: true } | { ok: false; error: string }>(work: () => Promise<T>, onDone: (r: Extract<T, { ok: true }>) => void, message: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        onDone(r as Extract<T, { ok: true }>);
        notice.showSaved(message);
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function add(): void {
    const checked = buildDateRow(draft);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    void run(
      () => addMarketDate(draft),
      (r) => {
        setItems((list) => [...list, r.item].sort(byDay));
        setDraft(EMPTY_DATE);
      },
      'Date added. Your site shows it now.',
    );
  }

  function save(): void {
    if (editing === null) return;
    const checked = buildDateRow(editing.form);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    const { id, form } = editing;
    void run(
      () => updateMarketDate(id, form),
      (r) => {
        setItems((list) => list.map((x) => (x.id === id ? r.item : x)).sort(byDay));
        setEditing(null);
      },
      'Saved. Your site shows the change now.',
    );
  }

  const remove = (id: string): void =>
    void run(
      () => removeMarketDate(id),
      () => {
        setItems((list) => list.filter((x) => x.id !== id));
        if (editing?.id === id) setEditing(null);
      },
      'Date removed.',
    );

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Market dates</h1>
        <div className="bk-head-actions">
          <a className="bk-btn bk-btn-quiet" href={siteUrl} target="_blank" rel="noopener noreferrer">
            View your site
          </a>
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <section className="bk-section" aria-labelledby="s-add">
          <h2 id="s-add" className="bk-section-title">Add a date</h2>
          <p className="bk-note">Your dates scroll across your site under your name. Past dates stay up until you remove them.</p>
          {full ? (
            <p className="bk-note">You have {DATES_LIMIT} dates, the most a site lists. Remove a past one to add another.</p>
          ) : (
            <>
              <DateFields form={draft} idPrefix="new" onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
              <p className="bk-row">
                <button type="button" className="bk-btn" disabled={busy} onClick={add}>
                  {busy ? 'Saving…' : 'Add date'}
                </button>
              </p>
            </>
          )}
        </section>

        <section className="bk-section" aria-labelledby="s-dates">
          <h2 id="s-dates" className="bk-section-title">
            Your dates ({items.length} of {DATES_LIMIT})
          </h2>
          {items.length === 0 && <p className="bk-note">No dates yet. Add the markets where people can find you.</p>}
          {items.length > 0 && (
            <ul className="bk-list" aria-label="Market dates">
              {items.map((d) =>
                editing?.id === d.id ? (
                  <li key={d.id} className="bk-list-item">
                    <DateFields form={editing.form} idPrefix={`e-${d.id}`} onChange={(patch) => setEditing((e) => (e === null ? e : { ...e, form: { ...e.form, ...patch } }))} />
                    <div className="bk-row">
                      <button type="button" className="bk-btn bk-btn-small" disabled={busy} onClick={save}>
                        {busy ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy} onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={d.id} className="bk-list-item">
                    <span className="bk-list-name">
                      {showDay(d.date)} · {d.name}
                      {d.town !== '' && ` · ${d.town}`}
                    </span>
                    <div className="bk-row">
                      <button
                        type="button"
                        className="bk-btn bk-btn-quiet bk-btn-small"
                        disabled={busy}
                        aria-label={`Change ${d.name} on ${showDay(d.date)}`}
                        onClick={() => setEditing({ id: d.id, form: { date: d.date, name: d.name, town: d.town } })}
                      >
                        Change
                      </button>
                      <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => remove(d.id)} />
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

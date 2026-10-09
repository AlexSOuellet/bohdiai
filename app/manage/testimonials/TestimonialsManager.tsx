'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { DETAIL_MAX, EMPTY_TESTIMONIAL, NAME_MAX, QUOTE_MAX, buildTestimonialRow, type Testimonial, type TestimonialForm } from '@/lib/backend/testimonials/testimonial-form';
import { orderTestimonials, removeTestimonial, saveTestimonial } from '@/lib/backend/testimonials/actions';
import { useNotice } from '../_components/Notice';
import { ConfirmButton } from '../_components/ConfirmButton';

const FAILED = 'Something went wrong. Check your connection and try again.';

function Editor({ form, busy, onChange, onSave, onCancel }: { form: TestimonialForm; busy: boolean; onChange: (f: TestimonialForm) => void; onSave: () => void; onCancel: (() => void) | null }): React.ReactElement {
  const id = form.id ?? 'new';
  return (
    <div className="bk-section">
      <div className="bk-field">
        <label className="bk-label" htmlFor={`t-quote-${id}`}>
          What they said
        </label>
        <textarea id={`t-quote-${id}`} className="bk-input bk-textarea" maxLength={QUOTE_MAX} value={form.quote} onChange={(e) => onChange({ ...form, quote: e.target.value })} />
      </div>
      <div className="bk-row">
        <div className="bk-field">
          <label className="bk-label" htmlFor={`t-name-${id}`}>
            Who said it
          </label>
          <input id={`t-name-${id}`} className="bk-input" maxLength={NAME_MAX} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        </div>
        <div className="bk-field">
          <label className="bk-label" htmlFor={`t-detail-${id}`}>
            Detail <span className="bk-note">(optional, like a town or what they bought)</span>
          </label>
          <input id={`t-detail-${id}`} className="bk-input" maxLength={DETAIL_MAX} value={form.detail} onChange={(e) => onChange({ ...form, detail: e.target.value })} />
        </div>
      </div>
      <div className="bk-row">
        <button type="button" className="bk-btn" disabled={busy} onClick={onSave}>
          {busy ? 'Saving…' : form.id === null ? 'Add testimonial' : 'Save'}
        </button>
        {onCancel !== null && (
          <button type="button" className="bk-btn bk-btn-quiet" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/** Her testimonials, in the order the site shows them: add, change, remove, move. */
export function TestimonialsManager({ initial }: { initial: Testimonial[] }): React.ReactElement {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<TestimonialForm>(EMPTY_TESTIMONIAL);
  const [editing, setEditing] = useState<TestimonialForm | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();

  async function run<T>(work: () => Promise<T>, then: (r: T) => void): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      then(await work());
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function save(form: TestimonialForm, after: () => void): void {
    const check = buildTestimonialRow(form);
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    void run(
      () => saveTestimonial(form),
      (r) => {
        if (!r.ok) return notice.showError(r.error);
        setItems((list) => (form.id === null ? [...list, r.item] : list.map((t) => (t.id === r.item.id ? r.item : t))));
        notice.showSaved(form.id === null ? 'Added.' : 'Saved.');
        after();
      },
    );
  }

  function move(i: number, by: -1 | 1): void {
    const next = [...items];
    const [it] = next.splice(i, 1);
    if (it === undefined) return;
    next.splice(i + by, 0, it);
    void run(
      () => orderTestimonials(next.map((t) => t.id)),
      (r) => (r.ok ? setItems(next) : notice.showError(r.error)),
    );
  }

  function remove(id: string): void {
    void run(
      () => removeTestimonial(id),
      (r) => {
        if (!r.ok) return notice.showError(r.error);
        setItems((list) => list.filter((t) => t.id !== id));
        notice.showSaved('Removed.');
      },
    );
  }

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Testimonials</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}
        <p className="bk-note">Your home page shows the first three, with “See more” to the rest. Paste what customers have said in messages, reviews or comments.</p>
        {items.length === 0 ? (
          <p className="bk-note">No testimonials yet. Add your first one below.</p>
        ) : (
          <ul className="bk-list" aria-label="Your testimonials">
            {items.map((t, i) =>
              editing !== null && editing.id === t.id ? (
                <li key={t.id} className="bk-list-item bk-testi-edit">
                  <Editor form={editing} busy={busy} onChange={setEditing} onSave={() => save(editing, () => setEditing(null))} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={t.id} className="bk-list-item bk-testi">
                  <blockquote>
                    <p>“{t.quote}”</p>
                    <footer>
                      {t.name}
                      {t.detail !== '' && `, ${t.detail}`}
                    </footer>
                  </blockquote>
                  <div className="bk-row">
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy || i === 0} aria-label={`Move ${t.name}'s testimonial up`} onClick={() => move(i, -1)}>
                      ↑
                    </button>
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy || i === items.length - 1} aria-label={`Move ${t.name}'s testimonial down`} onClick={() => move(i, 1)}>
                      ↓
                    </button>
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy} onClick={() => setEditing({ id: t.id, quote: t.quote, name: t.name, detail: t.detail })}>
                      Edit
                    </button>
                    <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => remove(t.id)} />
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
        <h2 className="bk-section-title">Add a testimonial</h2>
        <Editor form={draft} busy={busy} onChange={setDraft} onSave={() => save(draft, () => setDraft(EMPTY_TESTIMONIAL))} onCancel={null} />
      </main>
    </>
  );
}

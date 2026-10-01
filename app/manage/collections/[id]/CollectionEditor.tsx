'use client';

import { useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { saveCollection } from '@/lib/backend/catalog/actions';
import { buildCollectionPayload, moveItem, type CollectionForm } from '@/lib/backend/catalog/collection-form';
import type { ItemStatus } from '@/lib/backend/catalog/product-form';
import type { ProductRowView } from '@/lib/backend/catalog/queries';
import { ConfirmButton } from '../../_components/ConfirmButton';
import { useNotice } from '../../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'draft', label: 'Draft — only you can see it' },
  { value: 'active', label: 'Live on your shop' },
  { value: 'archived', label: 'Archived — hidden from the shop, kept here' },
];

/** One form, one Save: the basics, which products and in what order, the cover, the status. */
export function CollectionEditor({ initial, products }: { initial: CollectionForm; products: ProductRowView[] }): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  /** The last saved version — drives the title and the archive button. */
  const [stored, setStored] = useState(initial);
  const [busy, setBusy] = useState(false);
  /** Set the moment a save starts, so a second click before the next render does nothing. */
  const inFlight = useRef(false);
  const notice = useNotice();

  const byId = new Map(products.map((p) => [p.id, p]));
  const inIt = form.productIds.map((id) => byId.get(id)).filter((p): p is ProductRowView => p !== undefined);
  const addable = products.filter((p) => p.status !== 'archived' && !form.productIds.includes(p.id));
  const covers = inIt.filter((p): p is ProductRowView & { photoUploadId: string; photoUrl: string } => p.photoUploadId !== null && p.photoUrl !== null);
  const update = (patch: Partial<CollectionForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };

  /** Take a product out. If its photo was the chosen cover, the cover goes back to
   *  automatic rather than pointing at a photo no longer in the collection. */
  function remove(p: ProductRowView): void {
    const productIds = form.productIds.filter((x) => x !== p.id);
    const coverLeft =
      form.featuredImageId === null ||
      p.photoUploadId !== form.featuredImageId ||
      productIds.some((id) => byId.get(id)?.photoUploadId === form.featuredImageId);
    update(coverLeft ? { productIds } : { productIds, featuredImageId: null });
  }

  /** Save everything in the form. */
  function save(): Promise<void> {
    return send(form, {}, 'Saved.');
  }

  /** Archive the SAVED copy, so edits not yet saved stay pending in the form
   *  (shown as archived now) instead of going out silently with the archive. */
  function archive(): Promise<void> {
    return send(stored, { status: 'archived' }, 'Archived.');
  }

  /** Send `base` with `patch` on top. On success the saved copy takes the sent version
   *  and the form takes only `patch`: anything else in the form (unsaved edits, or
   *  changes made while the save was in flight) stays as it is. */
  async function send(base: CollectionForm, patch: Partial<CollectionForm>, done: string): Promise<void> {
    if (inFlight.current) return;
    const next = { ...base, ...patch };
    const check = buildCollectionPayload(next);
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await saveCollection(next);
      if (r.ok) {
        setStored(next);
        setForm((f) => ({ ...f, ...patch }));
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
    <>
      <div className="bk-head">
        <h1 className="bk-title">{stored.name}</h1>
        <div className="bk-head-actions">
          {stored.status !== 'archived' && (
            <ConfirmButton label="Archive" confirmLabel="Yes, archive it" disabled={busy} onConfirm={() => void archive()} />
          )}
          <button type="button" className="bk-btn" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <section className="bk-section" aria-labelledby="c-basics">
          <h2 id="c-basics" className="bk-section-title">The basics</h2>
          <div className="bk-field">
            <label htmlFor="c-name" className="bk-label">Name</label>
            <input id="c-name" className="bk-input" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="c-desc" className="bk-label">Short description</label>
            <textarea id="c-desc" className="bk-input bk-textarea" value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="c-products">
          <h2 id="c-products" className="bk-section-title">Products in this collection</h2>
          {inIt.length === 0 ? (
            <p className="bk-note">No products yet. Add some below.</p>
          ) : (
            <ul className="bk-list">
              {inIt.map((p, i) => (
                <li key={p.id} className="bk-list-item">
                  {p.photoUrl !== null ? (
                    <>
                      {/* Maker photos come from private-bucket signed URLs — a plain img, like the other maker-photo spots. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photoUrl} alt="" className="bk-thumb" />
                    </>
                  ) : (
                    <span className="bk-thumb bk-thumb-empty">No photo</span>
                  )}
                  <span className="bk-list-name">{p.name}</span>
                  <span className="bk-row">
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move ${p.name} up`} onClick={() => update({ productIds: moveItem(form.productIds, form.productIds.indexOf(p.id), -1) })}>↑</button>
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === inIt.length - 1} aria-label={`Move ${p.name} down`} onClick={() => update({ productIds: moveItem(form.productIds, form.productIds.indexOf(p.id), 1) })}>↓</button>
                    <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove ${p.name} from this collection`} onClick={() => remove(p)}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {addable.length > 0 && (
            <>
              <p className="bk-label">Add products</p>
              <div className="bk-picker">
                {addable.map((p) => (
                  <button key={p.id} type="button" className="bk-pick" aria-pressed="false" onClick={() => update({ productIds: [...form.productIds, p.id] })}>
                    {p.photoUrl !== null ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photoUrl} alt="" />
                      </>
                    ) : (
                      <span className="bk-thumb-empty">No photo</span>
                    )}
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="bk-section" aria-labelledby="c-cover">
          <fieldset className="bk-fieldset">
            <legend>
              <h2 id="c-cover" className="bk-section-title">Cover photo</h2>
            </legend>
            <div className="bk-checks">
              <label className="bk-check">
                <input type="radio" name="cover" checked={form.featuredImageId === null} onChange={() => update({ featuredImageId: null })} />
                First product’s photo (automatic)
              </label>
              {covers.map((p) => (
                <label key={p.id} className="bk-check">
                  <input type="radio" name="cover" checked={form.featuredImageId === p.photoUploadId} onChange={() => update({ featuredImageId: p.photoUploadId })} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl} alt="" className="bk-thumb" />
                  {`${p.name}’s photo`}
                </label>
              ))}
              {form.featuredImageId !== null && !covers.some((p) => p.photoUploadId === form.featuredImageId) && (
                <label className="bk-check">
                  <input type="radio" name="cover" checked readOnly />
                  The cover photo chosen before
                </label>
              )}
            </div>
          </fieldset>
        </section>

        <section className="bk-section" aria-labelledby="c-status">
          <fieldset className="bk-fieldset">
            <legend>
              <h2 id="c-status" className="bk-section-title">Status</h2>
            </legend>
            <div className="bk-checks">
              {STATUSES.map((s) => (
                <label key={s.value} className="bk-check">
                  <input type="radio" name="c-status" checked={form.status === s.value} onChange={() => update({ status: s.value })} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </main>
    </>
  );
}

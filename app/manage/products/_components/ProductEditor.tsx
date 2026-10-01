'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { saveProduct, duplicateProduct } from '@/lib/backend/catalog/actions';
import type { SaveResult } from '@/lib/backend/catalog/results';
import { combinationKey } from '@/lib/catalog/combinations';
import {
  buildProductPayload,
  syncVariants,
  renameOptionInVariants,
  type ProductForm,
  type OptionForm,
  type VariantForm,
  type ItemStatus,
  type PhotoForm,
} from '@/lib/backend/catalog/product-form';
import { ConfirmButton } from '../../_components/ConfirmButton';
import { useNotice } from '../../_components/Notice';
import { PhotosField } from './PhotosField';
import { OptionsField } from './OptionsField';
import { FileField } from './FileField';

const FAILED = 'Something went wrong. Check your connection and try again.';
const CHOICE_GONE = 'That choice changed while its file was uploading — upload the file again.';
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'draft', label: 'Draft — only you can see it' },
  { value: 'active', label: 'Live on your shop' },
  { value: 'archived', label: 'Archived — hidden from the shop, kept here' },
];

/** Merge rows into the memory of typed combinations, newest wins per combination. */
function remember(memory: readonly VariantForm[], rows: readonly VariantForm[]): VariantForm[] {
  const byKey = new Map(memory.map((v) => [combinationKey(v.choices), v]));
  for (const r of rows) byKey.set(combinationKey(r.choices), r);
  return [...byKey.values()];
}

/** Does the form still have this choice where it was when its file upload started? */
const hasChoice = (f: ProductForm, optionIndex: number, value: string): boolean =>
  f.options[optionIndex]?.choices.some((c) => c.value === value) === true;

/** One form, one Save (Penny's bundles editor): the basics, photos, price and stock,
 *  options, collections, status. Every failure lands in the notice at the top. */
export function ProductEditor({
  initial,
  collections,
  digital,
  shopUrl,
}: {
  initial: ProductForm;
  collections: { id: string; name: string }[];
  digital: boolean;
  shopUrl: string;
}): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  /** The last saved version — drives the title, the shop link, the archive button, and
   *  whether there are unsaved changes. */
  const [stored, setStored] = useState(initial);
  /** Every combination row typed this session, so a combination that disappears
   *  (choice removed, option renamed or blanked mid-edit) comes back with its values. */
  const [variantMemory, setVariantMemory] = useState<VariantForm[]>(initial.variants);
  /** The last non-blank name at each option position, so clearing a name and typing a
   *  new one is still a rename of what it was. */
  const lastNames = useRef(initial.options.map((o) => o.name.trim()));
  const [busy, setBusy] = useState(false);
  /** Set the moment a call starts, so a second click before the next render does nothing. */
  const inFlight = useRef(false);
  /** The form as last rendered, for upload results that arrive later. */
  const latest = useRef(form);
  useEffect(() => {
    latest.current = form;
  }, [form]);
  const notice = useNotice();

  const update = (patch: Partial<ProductForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    notice.clearSaved();
  };
  const setVariants = (variants: VariantForm[]) => {
    setVariantMemory((m) => remember(m, variants));
    update({ variants });
  };
  const setOptions = (next: OptionForm[]) => {
    // Memory holds every typed row (initial rows + every edit), so the current rows
    // are all in it; rows never typed are blank defaults that syncVariants rebuilds.
    // Only a same-length change can be a rename: removing an option shifts positions,
    // and pairing names by position then would wrongly rename one option to another.
    let memory = variantMemory;
    const names = next.map((o) => o.name.trim());
    if (next.length === form.options.length) {
      const last = [...lastNames.current];
      names.forEach((to, i) => {
        if (to === '') return; // blanked: keep what it was, for when a name comes back
        if (names.some((n, j) => j !== i && n === to)) return; // another option has that name
        const from = last[i] ?? '';
        if (from !== '' && from !== to) memory = renameOptionInVariants(memory, from, to);
        last[i] = to;
      });
      lastNames.current = last;
    } else {
      lastNames.current = names;
    }
    memory = remember([], memory); // a rename can land on a key already remembered; keep one row per combination
    setVariantMemory(memory);
    setForm((f) => ({ ...f, options: next, variants: syncVariants(next, memory) }));
    notice.clearSaved();
  };
  const addPhoto = (photo: PhotoForm) => {
    setForm((f) => ({ ...f, photos: [...f.photos, photo] }));
    notice.clear();
  };
  /** A choice's file landed. Options may have changed while it uploaded, so find the
   *  choice in the form as it is now, never in the arrays from when the upload began. */
  const setChoiceFile = (optionIndex: number, value: string, uploadId: string, fileName: string) => {
    if (!hasChoice(latest.current, optionIndex, value)) {
      notice.showError(CHOICE_GONE);
      return;
    }
    setForm((f) =>
      !hasChoice(f, optionIndex, value)
        ? f
        : {
            ...f,
            options: f.options.map((o, i) =>
              i !== optionIndex ? o : { ...o, choices: o.choices.map((c) => (c.value === value ? { ...c, fileUploadId: uploadId, fileName } : c)) },
            ),
          },
    );
    notice.clear();
  };

  /** Run one server call. When `done` navigates away it returns 'leave' and the page
   *  stays busy, so the buttons can't fire again while the next page loads. */
  async function run(action: () => Promise<SaveResult>, done: (id: string) => 'leave' | 'stay'): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    let leaving = false;
    try {
      const r = await action();
      if (r.ok) leaving = done(r.id) === 'leave';
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      if (!leaving) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  /** Save everything in the form. */
  function save(): void {
    send(form, {}, 'Saved.');
  }

  /** Archive the SAVED copy, so edits not yet saved stay pending in the form
   *  (shown as archived now) instead of going out silently with the archive. */
  function archive(): void {
    send(stored, { status: 'archived' }, 'Archived.');
  }

  /** Send `base` with `patch` on top. On success the saved copy takes the sent version
   *  and the form takes only `patch`: anything else in the form (unsaved edits, or
   *  anything typed or uploaded while the save was in flight) stays as it is. */
  function send(base: ProductForm, patch: Partial<ProductForm>, done: string): void {
    if (inFlight.current) return;
    const next = { ...base, ...patch };
    const check = buildProductPayload(next, { digital });
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    void run(
      () => saveProduct(next),
      (id) => {
        if (next.id === null) {
          router.replace(`/manage/products/${id}`);
          return 'leave';
        }
        setStored(next);
        setForm((f) => ({ ...f, ...patch }));
        notice.showSaved(done);
        router.refresh();
        return 'stay';
      },
    );
  }

  const noOptions = form.options.length === 0;
  const isNew = form.id === null;
  const unsaved = JSON.stringify(form) !== JSON.stringify(stored);
  const saveButton = (
    <button type="button" className="bk-btn" disabled={busy} onClick={() => save()}>
      {busy ? 'Saving…' : 'Save'}
    </button>
  );

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{isNew ? 'New product' : stored.name}</h1>
        <div className="bk-head-actions">
          {!isNew && stored.status === 'active' && stored.slug !== null && (
            <a className="bk-btn bk-btn-quiet" href={`${shopUrl}/listings/${stored.slug}`} target="_blank" rel="noopener noreferrer">
              View on your shop
            </a>
          )}
          {!isNew && unsaved && (
            <span id="dup-note" className="bk-note">
              Save your changes first
            </span>
          )}
          {!isNew && (
            <button
              type="button"
              className="bk-btn bk-btn-quiet"
              disabled={busy || unsaved}
              aria-describedby={unsaved ? 'dup-note' : undefined}
              onClick={() =>
                void run(
                  () => duplicateProduct(form),
                  (id) => {
                    router.push(`/manage/products/${id}`);
                    return 'leave';
                  },
                )
              }
            >
              Duplicate
            </button>
          )}
          {!isNew && stored.status !== 'archived' && (
            <ConfirmButton label="Archive" confirmLabel="Yes, archive it" disabled={busy} onConfirm={archive} />
          )}
          {saveButton}
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <section className="bk-section" aria-labelledby="s-basics">
          <h2 id="s-basics" className="bk-section-title">The basics</h2>
          <div className="bk-field">
            <label htmlFor="name" className="bk-label">Name</label>
            <input id="name" className="bk-input" value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="short" className="bk-label">Short description</label>
            <input id="short" className="bk-input" value={form.shortDescription} onChange={(e) => update({ shortDescription: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="long" className="bk-label">Description</label>
            <textarea id="long" className="bk-input bk-textarea" value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-photos">
          <h2 id="s-photos" className="bk-section-title">Photos</h2>
          <PhotosField photos={form.photos} samplePhotoUrl={form.samplePhotoUrl} onAdd={addPhoto} onChange={(photos) => update({ photos })} onError={notice.showError} />
        </section>

        <section className="bk-section" aria-labelledby="s-price">
          <h2 id="s-price" className="bk-section-title">Price and stock</h2>
          <div className="bk-grid-2">
            <div className="bk-field">
              <label htmlFor="price" className="bk-label">Price</label>
              <input id="price" className="bk-input" inputMode="decimal" placeholder="24 or 24.50" value={form.price} onChange={(e) => update({ price: e.target.value })} />
            </div>
            {noOptions && form.kind === 'physical' && (
              <div className="bk-field">
                <label htmlFor="stock" className="bk-label">Stock</label>
                <input id="stock" className="bk-input" inputMode="numeric" placeholder="Blank = made to order" value={form.stock} onChange={(e) => update({ stock: e.target.value })} />
              </div>
            )}
          </div>
          {!noOptions && <p className="bk-note">With options, each combination below has its own stock. A blank combination price uses this one.</p>}
          {digital && noOptions && (
            <fieldset className="bk-field bk-fieldset">
              <legend className="bk-label">How it’s sold</legend>
              <div className="bk-row">
                <label className="bk-check">
                  <input type="radio" name="kind" checked={form.kind === 'physical'} onChange={() => update({ kind: 'physical' })} />
                  Ships
                </label>
                <label className="bk-check">
                  <input type="radio" name="kind" checked={form.kind === 'digital'} onChange={() => update({ kind: 'digital' })} />
                  Download
                </label>
              </div>
              {form.kind === 'digital' && (
                <FileField
                  fileName={form.fileName}
                  label="Upload the download file"
                  onUploaded={(id, fileName) => {
                    update({ fileUploadId: id, fileName });
                    notice.clearError();
                  }}
                  onError={notice.showError}
                />
              )}
            </fieldset>
          )}
        </section>

        <section className="bk-section" aria-labelledby="s-options">
          <h2 id="s-options" className="bk-section-title">Options</h2>
          <OptionsField
            options={form.options}
            variants={form.variants}
            basePrice={form.price}
            digital={digital}
            onOptions={setOptions}
            onVariants={setVariants}
            onChoiceFile={setChoiceFile}
            onError={notice.showError}
          />
        </section>

        <section className="bk-section" aria-labelledby="s-collections">
          <h2 id="s-collections" className="bk-section-title">Collections</h2>
          {collections.length === 0 ? (
            <p className="bk-note">No collections yet. You can make them under Collections.</p>
          ) : (
            <div className="bk-checks">
              {collections.map((c) => (
                <label key={c.id} className="bk-check">
                  <input
                    type="checkbox"
                    checked={form.collectionIds.includes(c.id)}
                    onChange={(e) => update({ collectionIds: e.target.checked ? [...form.collectionIds, c.id] : form.collectionIds.filter((x) => x !== c.id) })}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="bk-section" aria-labelledby="s-status">
          <fieldset className="bk-fieldset">
            <legend>
              <h2 id="s-status" className="bk-section-title">Status</h2>
            </legend>
            <div className="bk-checks">
              {STATUSES.map((s) => (
                <label key={s.value} className="bk-check">
                  <input type="radio" name="status" checked={form.status === s.value} onChange={() => update({ status: s.value })} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <p className="bk-row">{saveButton}</p>
      </main>
    </>
  );
}

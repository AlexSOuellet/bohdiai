'use client';

import { useRef, useState } from 'react';
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
import { PhotosField } from './PhotosField';
import { OptionsField } from './OptionsField';
import { FileField } from './FileField';

const FAILED = 'Something went wrong. Check your connection and try again.';
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
  /** The last saved version — drives the title, the shop link and the archive button. */
  const [stored, setStored] = useState(initial);
  /** Every combination row typed this session, so a combination that disappears
   *  (choice removed, option renamed or blanked mid-edit) comes back with its values. */
  const [variantMemory, setVariantMemory] = useState<VariantForm[]>(initial.variants);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<ProductForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved('');
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
    if (next.length === form.options.length) next.forEach((o, i) => {
      const before = form.options[i];
      if (before === undefined) return;
      const from = before.name.trim();
      const to = o.name.trim();
      if (from !== '' && to !== '' && from !== to) memory = renameOptionInVariants(memory, from, to);
    });
    memory = remember([], memory); // a rename can land on a key already remembered; keep one row per combination
    setVariantMemory(memory);
    setForm((f) => ({ ...f, options: next, variants: syncVariants(next, memory) }));
    setSaved('');
  };
  const addPhoto = (photo: PhotoForm) => setForm((f) => ({ ...f, photos: [...f.photos, photo] }));
  const showError = (message: string) => {
    setError(message);
    setSaved('');
    notice.current?.scrollIntoView({ block: 'nearest' });
  };

  async function run(action: () => Promise<SaveResult>, done: (id: string) => void): Promise<void> {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const r = await action();
      if (r.ok) done(r.id);
      else showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      showError(FAILED);
    } finally {
      setBusy(false);
    }
  }

  function save(next: ProductForm): void {
    const check = buildProductPayload(next, { digital });
    if (!check.ok) {
      showError(check.error);
      return;
    }
    void run(
      () => saveProduct(next),
      (id) => {
        if (next.id === null) {
          router.replace(`/manage/products/${id}`);
          return;
        }
        setForm(next);
        setStored(next);
        setSaved('Saved.');
        router.refresh();
      },
    );
  }

  const noOptions = form.options.length === 0;
  const isNew = form.id === null;
  const saveButton = (
    <button type="button" className="bk-btn" disabled={busy} onClick={() => save(form)}>
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
          {!isNew && (
            <button type="button" className="bk-btn bk-btn-quiet" disabled={busy} onClick={() => void run(() => duplicateProduct(form), (id) => router.push(`/manage/products/${id}`))}>
              Duplicate
            </button>
          )}
          {!isNew && stored.status !== 'archived' && (
            <ConfirmButton label="Archive" confirmLabel="Yes, archive it" disabled={busy} onConfirm={() => save({ ...form, status: 'archived' })} />
          )}
          {saveButton}
        </div>
      </div>
      <main id="main" className="bk-content">
        <div ref={notice}>
          {error !== '' && <p role="alert" className="bk-notice">{error}</p>}
          {saved !== '' && <p role="status" className="bk-notice" data-tone="ok">{saved}</p>}
        </div>

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
          <PhotosField photos={form.photos} onAdd={addPhoto} onChange={(photos) => update({ photos })} onError={showError} />
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
            <fieldset className="bk-field">
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
                <FileField fileName={form.fileName} label="Upload the download file" onUploaded={(id, fileName) => update({ fileUploadId: id, fileName })} onError={showError} />
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
            onError={showError}
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
          <h2 id="s-status" className="bk-section-title">Status</h2>
          <div className="bk-checks">
            {STATUSES.map((s) => (
              <label key={s.value} className="bk-check">
                <input type="radio" name="status" checked={form.status === s.value} onChange={() => update({ status: s.value })} />
                {s.label}
              </label>
            ))}
          </div>
        </section>

        <p className="bk-row">{saveButton}</p>
      </main>
    </>
  );
}

'use client';

import { StockChoice } from './StockChoice';
import { useEffect, useRef, useState } from 'react';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { saveProduct, duplicateProduct } from '@/lib/backend/catalog/actions';
import { costSummary as costSummaryOf, pricedBelowCost, type CostSettings, type CostSummary } from '@/lib/tools/product-costs';
import { cents as centsText, dollars } from '@/lib/tools/maths';
import type { SaveResult } from '@/lib/backend/catalog/results';
import { combinationKey } from '@/lib/catalog/combinations';
import {
  buildProductPayload,
  formatCents,
  parseDollars,
  syncVariants,
  renameOptionInVariants,
  type ProductForm,
  type OptionForm,
  type VariantForm,
  type ItemStatus,
  type PhotoForm,
  HOME_MAX,
  GALLERY_MAX,
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
 *  options, collections, status. Every failure lands in the notice at the top; a
 *  save or an archive that works goes back to the list, which says what was done. */
export function ProductEditor({
  initial,
  collections,
  digital,
  photoLimit,
  newArrivals = false,
  shopUrl,
  homeCount,
  showcase = false,
  free = false,
  hasCollections = true,
  costs = null,
  costSummary = null,
  costsUnsaved = false,
}: {
  initial: ProductForm;
  /** What the Tools worked out, saved with a new product (Alex, 2026-10-24). */
  costs?: CostSettings | null;
  /** A saved product's costs from the Tools: materials, break-even, suggested price. */
  costSummary?: CostSummary | null;
  /** It saved, but the costs that came with it from the Tools didn't. */
  costsUnsaved?: boolean;
  collections: { id: string; name: string }[];
  digital: boolean;
  /** How many photos this site's plan allows a product. */
  photoLimit: number;
  /** The site shows new arrivals in their own home section, so offer the tick. */
  newArrivals?: boolean;
  shopUrl: string;
  /** How many OTHER products are on the home page (not archived, not deleted). */
  homeCount: number;
  /** Showcase: no shop, so no shop link, home tick, stock, options or collections.
   *  The price is kept for when the site moves up to Market. */
  showcase?: boolean;
  /** Free (Alex, 2026-10-24): no site at all; a piece is kept for its costs and price.
   *  The same as Showcase here, without its notes about the site. */
  free?: boolean;
  /** The site has collections (Full); Market and Showcase have none, so no Collections section. */
  hasCollections?: boolean;
}): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  /** The site sells (Market and Full): it asks about stock, options, the home page and collections. */
  const sells = !showcase && !free;
  /** The saved version — drives the title, the shop link, the archive button, and
   *  whether there are unsaved changes. A save leaves the page, so it never changes. */
  const stored = initial;
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

  const update = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));
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
  };
  const addPhoto = (photo: PhotoForm) => {
    setForm((f) => ({ ...f, photos: [...f.photos, photo] }));
    notice.clear();
  };
  /** A choice's file landed. Options may have changed while it uploaded, so find the
   *  choice in the form as it is now, never in the arrays from when the upload began. */
  const setChoiceFile = (
    optionIndex: number,
    value: string,
    uploadId: string,
    fileName: string,
  ) => {
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
              i !== optionIndex
                ? o
                : {
                    ...o,
                    choices: o.choices.map((c) =>
                      c.value === value ? { ...c, fileUploadId: uploadId, fileName } : c,
                    ),
                  },
            ),
          },
    );
    notice.clear();
  };

  /** Run one server call. On success `done` navigates away and the page stays busy,
   *  so the buttons can't fire again while the next page loads. */
  async function run(action: () => Promise<SaveResult>, done: (id: string, warning?: 'costs' | 'takings') => void): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    let leaving = false;
    try {
      const r = await action();
      if (r.ok) {
        leaving = true;
        done(r.id, r.warning);
      } else notice.showError(r.error);
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
    send(form, 'saved');
  }

  /** Archive the saved copy. Archive is off while there are unsaved edits, so none
   *  go out unseen with the archive or get dropped when the page leaves. */
  function archive(): void {
    send({ ...stored, status: 'archived' }, 'archived');
  }

  /** Send `next`; on success go back to the list, which names what was done. */
  function send(next: ProductForm, done: 'saved' | 'archived'): void {
    if (inFlight.current) return;
    const check = buildProductPayload(next, {
      digital,
      photos: { limit: photoLimit, kept: stored.photos.length },
      stock: sells,
    });
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    void run(
      () => saveProduct(next, next.id === null ? costs : null),
      (id, warning) => router.push(warning === 'costs' ? `/manage/products/${id}?costs=unsaved` : `/manage/products?${done}=${encodeURIComponent(check.payload.name)}`),
    );
  }

  const noOptions = form.options.length === 0;
  const isNew = form.id === null;
  const unsaved = JSON.stringify(form) !== JSON.stringify(stored);
  /** Mirrors the database's limit: a sixth can't be ticked; a ticked one can always be unticked. */
  const homeFull = homeCount >= HOME_MAX && !form.onHome;
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
          {sells && !isNew && stored.status === 'active' && stored.slug !== null && (
            <a
              className="bk-btn bk-btn-quiet"
              href={`${shopUrl}/listings/${stored.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on your shop
            </a>
          )}
          {!isNew && unsaved && (
            <span id="unsaved-note" className="bk-note">
              Save your changes first
            </span>
          )}
          {!isNew && (
            <button
              type="button"
              className="bk-btn bk-btn-quiet"
              disabled={busy || unsaved}
              aria-describedby={unsaved ? 'unsaved-note' : undefined}
              onClick={() =>
                void run(
                  () => duplicateProduct(form),
                  (id) => router.push(`/manage/products/${id}`),
                )
              }
            >
              Duplicate
            </button>
          )}
          {!isNew && stored.status !== 'archived' && (
            <ConfirmButton
              label="Archive"
              confirmLabel="Yes, archive it"
              disabled={busy || unsaved}
              describedBy={unsaved ? 'unsaved-note' : undefined}
              onConfirm={archive}
            />
          )}
          {saveButton}
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <div className="bk-product">
          {/* The piece leads: its photos sit beside the form (on top on a phone). */}
          <section className="bk-section bk-product-photos" aria-labelledby="s-photos">
            <h2 id="s-photos" className="bk-section-title">
              Photos
            </h2>
            <PhotosField
              photos={form.photos}
              samplePhotoUrl={form.samplePhotoUrl}
              limit={photoLimit}
              onAdd={addPhoto}
              onChange={(photos) => update({ photos })}
              onError={notice.showError}
            />
          </section>
          <div className="bk-product-form">
            <section className="bk-section" aria-labelledby="s-basics">
              <h2 id="s-basics" className="bk-section-title">
                The basics
              </h2>
              <div className="bk-field">
                <label htmlFor="name" className="bk-label">
                  Name
                </label>
                <input
                  id="name"
                  className="bk-input"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </div>
              {sells && (
                <div className="bk-field">
                  <label className="bk-check">
                    <input
                      type="checkbox"
                      checked={form.onHome}
                      disabled={homeFull}
                      aria-describedby={homeFull ? 'home-full-note' : undefined}
                      onChange={(e) => update({ onHome: e.target.checked })}
                    />
                    Show on your home page
                  </label>
                  {homeFull && (
                    <p id="home-full-note" className="bk-note">
                      {`Your home page already shows ${HOME_MAX} products. Untick one to add this one.`}
                    </p>
                  )}
                </div>
              )}
              {newArrivals && (
                <div className="bk-field">
                  <label className="bk-check">
                    <input
                      type="checkbox"
                      checked={form.isNew}
                      onChange={(e) => update({ isNew: e.target.checked })}
                    />
                    New arrival
                  </label>
                  <p className="bk-note">
                    Shows it in the new arrivals section of your home page, with a little “new”
                    ribbon. Untick it when it isn’t new any more.
                  </p>
                </div>
              )}
              <div className="bk-field">
                <label htmlFor="short" className="bk-label">
                  Short description
                </label>
                <input
                  id="short"
                  className="bk-input"
                  value={form.shortDescription}
                  onChange={(e) => update({ shortDescription: e.target.value })}
                />
              </div>
              <div className="bk-field">
                <label htmlFor="long" className="bk-label">
                  Description
                </label>
                <textarea
                  id="long"
                  className="bk-input bk-textarea"
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </div>
              {showcase && (
                <p className="bk-note">
                  {`Pick which pieces show on your site with the Gallery ticks on your products list. With none picked, your site shows your newest ${GALLERY_MAX}.`}
                </p>
              )}
            </section>

            <section className="bk-section" aria-labelledby="s-price">
              <h2 id="s-price" className="bk-section-title">
                {sells ? 'Price and stock' : 'Price'}
              </h2>
              <div className="bk-grid-2">
                <div className="bk-field">
                  <label htmlFor="price" className="bk-label">
                    Price
                  </label>
                  <input
                    id="price"
                    className="bk-input"
                    inputMode="decimal"
                    placeholder="24 or 24.50"
                    value={form.price}
                    onChange={(e) => update({ price: e.target.value })}
                  />
                </div>
              </div>
              <CostLine
                summary={costSummary ?? (costs === null ? null : costSummaryOf(costs))}
                price={form.price}
                productId={form.id}
                fromTools={isNew && costs !== null}
                unsaved={costsUnsaved}
                onUse={(cents) => update({ price: formatCents(cents) })}
              />
              {sells && noOptions && form.kind === 'physical' && (
                <StockChoice kind={form.stockKind} stock={form.stock} onChange={(next) => update(next)} />
              )}
              {showcase && (
                <p className="bk-note">
                  Prices don’t show on your site on Showcase. Fill it in anyway and it shows when
                  you move up to Market.
                </p>
              )}
              {free && (
                <p className="bk-note">
                  Your price list, for your own numbers. Nothing here shows anywhere until you have a
                  site, and it all comes with you when you do.
                </p>
              )}
              {sells && !noOptions && (
                <p className="bk-note">
                  With options, each combination below says how you stock it. A blank combination
                  price uses this one.
                </p>
              )}
              {digital && noOptions && (
                <fieldset className="bk-field bk-fieldset">
                  <legend className="bk-label">How it’s sold</legend>
                  <div className="bk-row">
                    <label className="bk-check">
                      <input
                        type="radio"
                        name="kind"
                        checked={form.kind === 'physical'}
                        onChange={() => update({ kind: 'physical' })}
                      />
                      Ships
                    </label>
                    <label className="bk-check">
                      <input
                        type="radio"
                        name="kind"
                        checked={form.kind === 'digital'}
                        onChange={() => update({ kind: 'digital' })}
                      />
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

            {sells && (
              <section className="bk-section" aria-labelledby="s-options">
                <h2 id="s-options" className="bk-section-title">
                  Options
                </h2>
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
            )}

            {sells && hasCollections && (
              <section className="bk-section" aria-labelledby="s-collections">
                <h2 id="s-collections" className="bk-section-title">
                  Collections
                </h2>
                {collections.length === 0 ? (
                  <p className="bk-note">
                    No collections yet. You can make them under Collections.
                  </p>
                ) : (
                  <div className="bk-checks">
                    {collections.map((c) => (
                      <label key={c.id} className="bk-check">
                        <input
                          type="checkbox"
                          checked={form.collectionIds.includes(c.id)}
                          onChange={(e) =>
                            update({
                              collectionIds: e.target.checked
                                ? [...form.collectionIds, c.id]
                                : form.collectionIds.filter((x) => x !== c.id),
                            })
                          }
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="bk-section" aria-labelledby="s-status">
              <fieldset className="bk-fieldset">
                <legend>
                  <h2 id="s-status" className="bk-section-title">
                    Status
                  </h2>
                </legend>
                <div className="bk-checks">
                  {STATUSES.map((s) => (
                    <label key={s.value} className="bk-check">
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === s.value}
                        onChange={() => update({ status: s.value })}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <p className="bk-row">{saveButton}</p>
          </div>
        </div>
      </main>
    </>
  );
}

/** What the piece costs her and what the Tools suggest, under the price (Alex,
 *  2026-10-24): her price stays her own; the suggested one is a tap away. */
function CostLine({
  summary,
  price,
  productId,
  fromTools,
  unsaved,
  onUse,
}: {
  summary: CostSummary | null;
  price: string;
  productId: string | null;
  fromTools: boolean;
  unsaved: boolean;
  onUse: (cents: number) => void;
}): React.ReactElement | null {
  const toolHref = productId === null ? '/manage/tools/cost' : `/manage/tools/cost?product=${productId}`;
  if (unsaved)
    return (
      <p className="bk-notice bk-cost-line">
        This product saved, but the costs from Cost to make didn’t. <a href={toolHref}>Work them out again in Cost to make</a>.
      </p>
    );
  if (summary === null)
    return productId === null ? null : (
      <p className="bk-note bk-cost-line">
        Not sure what to charge? <a className="bk-link" href={toolHref}>Work it out in Cost to make</a>.
      </p>
    );
  const typed = parseDollars(price);
  const priceCents = typed.ok ? typed.cents : null;
  const below = pricedBelowCost(priceCents, summary);
  return (
    <div className="bk-cost-line" data-below={below ? 'true' : undefined}>
      <p className="bk-cost-line-figures">
        <span>
          Costs you <strong>{centsText(summary.breakEven)}</strong>
        </span>
        <span>
          Suggested <strong>{dollars(summary.suggestedCents / 100)}</strong>
        </span>
        {priceCents !== summary.suggestedCents && (
          <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => onUse(summary.suggestedCents)}>
            Use the suggested price
          </button>
        )}
      </p>
      {below && <p className="bk-cost-line-warn">This price is below what the piece costs you to make. Each one you sell loses money.</p>}
      <p className="bk-note">
        {fromTools ? 'From Cost to make. Its costs save with the product.' : 'From Cost to make, with your time and other costs.'}{' '}
        {productId !== null && (
          <a className="bk-link" href={toolHref}>
            Change the costs
          </a>
        )}
      </p>
    </div>
  );
}

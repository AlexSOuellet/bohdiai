'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import type { ProductRowView } from '@/lib/backend/catalog/queries';
import { HOME_MAX, GALLERY_MAX } from '@/lib/backend/catalog/product-form';
import { setProductOnHome, setProductInGallery } from '@/lib/backend/catalog/actions';
import { useNotice } from '../_components/Notice';

type Show = 'current' | 'active' | 'draft' | 'archived';
const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;
const FAILED = 'Something went wrong. Check your connection and try again.';

/** What the list's tick columns pick: products for the home page (a site with a
 *  shop), pieces for Showcase's gallery (up to 12), or pieces for a Market or Full
 *  site's gallery (no limit). */
export type Pick = 'home' | 'gallery' | 'gallery-open';

type PickSpec = {
  max: number;
  column: string;
  full: string;
  count: (n: number) => string;
  boxLabel: (name: string) => string;
  of: (p: ProductRowView) => boolean;
  save: (id: string, on: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const PICKS: Record<Pick, PickSpec> = {
  home: {
    max: HOME_MAX,
    column: 'Home',
    full: `Your home page shows up to ${HOME_MAX} products. Untick one first.`,
    count: (n) => `On your home page: ${n} of ${HOME_MAX}`,
    boxLabel: (name) => `Show ${name} on your home page`,
    of: (p) => p.onHome,
    save: setProductOnHome,
  },
  gallery: {
    max: GALLERY_MAX,
    column: 'Gallery',
    full: `Your gallery shows up to ${GALLERY_MAX} pieces. Untick one first.`,
    count: (n) =>
      n === 0 ? `In your gallery: none picked, so your site shows your newest ${GALLERY_MAX}` : `In your gallery: ${n} of ${GALLERY_MAX}`,
    boxLabel: (name) => `Show ${name} in your gallery`,
    of: (p) => p.inGallery,
    save: setProductInGallery,
  },
  'gallery-open': {
    max: Number.POSITIVE_INFINITY,
    column: 'Gallery',
    full: '',
    count: (n) => `In your gallery: ${n}`,
    boxLabel: (name) => `Show ${name} in your gallery`,
    of: (p) => p.inGallery,
    save: setProductInGallery,
  },
};

export function ProductTable({
  products,
  picks = ['home'],
}: {
  products: ProductRowView[];
  picks?: readonly Pick[];
}): React.ReactElement {
  /** A Showcase site shows no prices, so the list doesn't either. */
  const showsPrice = !picks.includes('gallery');
  const [find, setFind] = useState('');
  const [show, setShow] = useState<Show>('current');
  /** Ticks changed here, by "pick:product id", over what the server sent. */
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  /** Ticks still saving: their box waits, so a failure can't undo a later click. */
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const inFlight = useRef(new Set<string>());
  /** A fresh list from the server is the truth again, except for ticks still saving. */
  const [shown, setShown] = useState(products);
  if (shown !== products) {
    setShown(products);
    setTicked((t) =>
      Object.fromEntries(Object.entries(t).filter(([key]) => inFlight.current.has(key))),
    );
  }
  const notice = useNotice();

  if (products.length === 0)
    return <p className="bk-note">No products yet. Add your first one to get started.</p>;

  const keyOf = (pick: Pick, p: ProductRowView): string => `${pick}:${p.id}`;
  const isTicked = (pick: Pick, p: ProductRowView): boolean => ticked[keyOf(pick, p)] ?? PICKS[pick].of(p);
  const countOf = (pick: Pick): number => products.filter((p) => isTicked(pick, p) && p.status !== 'archived').length;

  const done = (key: string): void => {
    inFlight.current.delete(key);
    setSaving(new Set(inFlight.current));
  };

  /** Tick or untick one product: shown at once, put back if the save fails. */
  async function toggle(pick: Pick, p: ProductRowView, next: boolean): Promise<void> {
    const key = keyOf(pick, p);
    const spec = PICKS[pick];
    if (inFlight.current.has(key)) return;
    if (next && countOf(pick) >= spec.max) {
      notice.showError(spec.full);
      return;
    }
    const before = isTicked(pick, p);
    inFlight.current.add(key);
    setSaving(new Set(inFlight.current));
    setTicked((t) => ({ ...t, [key]: next }));
    notice.clearError();
    try {
      const r = await spec.save(p.id, next);
      if (!r.ok) {
        setTicked((t) => ({ ...t, [key]: before }));
        notice.showError(r.error);
      }
    } catch (err) {
      unstable_rethrow(err);
      setTicked((t) => ({ ...t, [key]: before }));
      notice.showError(FAILED);
    } finally {
      done(key);
    }
  }
  const needle = find.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (show === 'current' ? p.status !== 'archived' : p.status === show) &&
      (needle === '' || p.name.toLowerCase().includes(needle)),
  );

  return (
    <>
      {notice.area}
      <div className="bk-filters">
        <div className="bk-field">
          <label htmlFor="find" className="bk-label">
            Find a product
          </label>
          <input
            id="find"
            className="bk-input"
            value={find}
            onChange={(e) => setFind(e.target.value)}
          />
        </div>
        <div className="bk-field">
          <label htmlFor="show" className="bk-label">
            Show
          </label>
          <select
            id="show"
            className="bk-input"
            value={show}
            onChange={(e) => setShow(e.target.value as Show)}
          >
            <option value="current">Live and drafts</option>
            <option value="active">Live</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {picks.map((pick) => (
        <p key={pick} className="bk-note">
          {PICKS[pick].count(countOf(pick))}
        </p>
      ))}
      {visible.length === 0 ? (
        <p className="bk-note">No products match.</p>
      ) : (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="bk-sr">Photo</span>
                </th>
                <th scope="col">Name</th>
                {showsPrice && <th scope="col">Price</th>}
                {showsPrice && <th scope="col">Stock</th>}
                <th scope="col">Status</th>
                {picks.map((pick) => (
                  <th key={pick} scope="col">
                    {PICKS[pick].column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} aria-label={p.name}>
                  <td>
                    {p.photoUrl !== null ? (
                      // The maker's own upload, already shrunk to WebP on upload: plain img like the other maker-photo spots.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="bk-thumb" />
                    ) : (
                      <span className="bk-thumb bk-thumb-empty">No photo</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/manage/products/${p.id}`} className="bk-link">
                      {p.name}
                    </Link>
                  </td>
                  {showsPrice && <td>{p.priceLabel}</td>}
                  {showsPrice && <td>{p.stockLabel}</td>}
                  <td>
                    <span className="bk-pill" data-status={p.status}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  {picks.map((pick) => (
                    <td key={pick}>
                      {p.status !== 'archived' && (
                        <input
                          type="checkbox"
                          className="bk-home-box"
                          aria-label={PICKS[pick].boxLabel(p.name)}
                          checked={isTicked(pick, p)}
                          disabled={saving.has(keyOf(pick, p))}
                          onChange={(e) => void toggle(pick, p, e.target.checked)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

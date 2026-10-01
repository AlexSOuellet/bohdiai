'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import type { ProductRowView } from '@/lib/backend/catalog/queries';
import { HOME_MAX } from '@/lib/backend/catalog/product-form';
import { setProductOnHome } from '@/lib/backend/catalog/actions';
import { useNotice } from '../_components/Notice';

type Show = 'current' | 'active' | 'draft' | 'archived';
const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;
const HOME_FULL = `Your home page shows up to ${HOME_MAX} products. Untick one first.`;
const FAILED = 'Something went wrong. Check your connection and try again.';

export function ProductTable({ products }: { products: ProductRowView[] }): React.ReactElement {
  const [find, setFind] = useState('');
  const [show, setShow] = useState<Show>('current');
  /** Home-page ticks changed here, by product id, over what the server sent. */
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  /** Products whose tick is saving: their box waits, so a failure can't undo a later click. */
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const inFlight = useRef(new Set<string>());
  /** A fresh list from the server is the truth again, except for ticks still saving. */
  const [shown, setShown] = useState(products);
  if (shown !== products) {
    setShown(products);
    setTicked((t) => Object.fromEntries(Object.entries(t).filter(([id]) => inFlight.current.has(id))));
  }
  const notice = useNotice();

  if (products.length === 0) return <p className="bk-note">No products yet. Add your first one to get started.</p>;

  const isOnHome = (p: ProductRowView): boolean => ticked[p.id] ?? p.onHome;
  const onHome = products.filter((p) => isOnHome(p) && p.status !== 'archived').length;

  const done = (id: string): void => {
    inFlight.current.delete(id);
    setSaving(new Set(inFlight.current));
  };

  /** Tick or untick one product for the home page: shown at once, put back if the save fails. */
  async function toggleHome(p: ProductRowView, next: boolean): Promise<void> {
    if (inFlight.current.has(p.id)) return;
    if (next && onHome >= HOME_MAX) {
      notice.showError(HOME_FULL);
      return;
    }
    const before = isOnHome(p);
    inFlight.current.add(p.id);
    setSaving(new Set(inFlight.current));
    setTicked((t) => ({ ...t, [p.id]: next }));
    notice.clearError();
    try {
      const r = await setProductOnHome(p.id, next);
      if (!r.ok) {
        setTicked((t) => ({ ...t, [p.id]: before }));
        notice.showError(r.error);
      }
    } catch (err) {
      unstable_rethrow(err);
      setTicked((t) => ({ ...t, [p.id]: before }));
      notice.showError(FAILED);
    } finally {
      done(p.id);
    }
  }
  const needle = find.trim().toLowerCase();
  const visible = products.filter(
    (p) => (show === 'current' ? p.status !== 'archived' : p.status === show) && (needle === '' || p.name.toLowerCase().includes(needle)),
  );

  return (
    <>
      {notice.area}
      <div className="bk-filters">
        <div className="bk-field">
          <label htmlFor="find" className="bk-label">Find a product</label>
          <input id="find" className="bk-input" value={find} onChange={(e) => setFind(e.target.value)} />
        </div>
        <div className="bk-field">
          <label htmlFor="show" className="bk-label">Show</label>
          <select id="show" className="bk-input" value={show} onChange={(e) => setShow(e.target.value as Show)}>
            <option value="current">Live and drafts</option>
            <option value="active">Live</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <p className="bk-note">{`On your home page: ${onHome} of ${HOME_MAX}`}</p>
      {visible.length === 0 ? (
        <p className="bk-note">No products match.</p>
      ) : (
        <div className="bk-table-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th scope="col"><span className="bk-sr">Photo</span></th>
                <th scope="col">Name</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
                <th scope="col">Home</th>
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
                    <Link href={`/manage/products/${p.id}`} className="bk-link">{p.name}</Link>
                  </td>
                  <td>{p.priceLabel}</td>
                  <td>{p.stockLabel}</td>
                  <td>
                    <span className="bk-pill" data-status={p.status}>{STATUS_LABEL[p.status]}</span>
                  </td>
                  <td>
                    {p.status !== 'archived' && (
                      <input
                        type="checkbox"
                        className="bk-home-box"
                        aria-label={`Show ${p.name} on your home page`}
                        checked={isOnHome(p)}
                        disabled={saving.has(p.id)}
                        onChange={(e) => void toggleHome(p, e.target.checked)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

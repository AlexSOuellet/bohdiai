'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

type Show = 'current' | 'active' | 'draft' | 'archived';
const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;

export function ProductTable({ products }: { products: ProductRowView[] }): React.ReactElement {
  const [find, setFind] = useState('');
  const [show, setShow] = useState<Show>('current');

  if (products.length === 0) return <p className="bk-note">No products yet. Add your first one to get started.</p>;

  const needle = find.trim().toLowerCase();
  const visible = products.filter(
    (p) => (show === 'current' ? p.status !== 'archived' : p.status === show) && (needle === '' || p.name.toLowerCase().includes(needle)),
  );

  return (
    <>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

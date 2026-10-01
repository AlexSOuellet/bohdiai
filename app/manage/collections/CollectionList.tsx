'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { createCollection, orderCollections } from '@/lib/backend/catalog/actions';
import { moveItem } from '@/lib/backend/catalog/collection-form';
import type { CollectionRowView } from '@/lib/backend/catalog/queries';
import { useNotice } from '../_components/Notice';

const STATUS_LABEL = { active: 'Live', draft: 'Draft', archived: 'Archived' } as const;
const FAILED = 'Something went wrong. Check your connection and try again.';

/** Add a collection and put them in shop order with up / down buttons (no drag, like Penny's admin). */
export function CollectionList({ collections }: { collections: CollectionRowView[] }): React.ReactElement {
  const router = useRouter();
  const [list, setList] = useState(collections);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  /** Set the moment an add starts, so a second click before the next render does nothing. */
  const inFlight = useRef(false);
  /** True while an order save is in flight: the move buttons wait, so a failure
   *  putting the list back can't undo a later move that did save. */
  const [ordering, setOrdering] = useState(false);
  const orderInFlight = useRef(false);
  const { showError, clearError, area } = useNotice();

  async function add(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    clearError();
    let leaving = false;
    try {
      const r = await createCollection(name);
      if (r.ok) {
        // Stay busy while the new collection opens, so a second click adds no second one.
        leaving = true;
        router.push(`/manage/collections/${r.id}`);
      } else showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      showError(FAILED);
    } finally {
      if (!leaving) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  async function move(index: number, delta: -1 | 1): Promise<void> {
    if (orderInFlight.current) return;
    orderInFlight.current = true;
    setOrdering(true);
    const before = list;
    const next = moveItem(list, index, delta);
    setList(next);
    clearError();
    try {
      const r = await orderCollections(next.map((c) => c.id));
      if (!r.ok) {
        setList(before);
        showError(r.error);
      }
    } catch (err) {
      unstable_rethrow(err);
      setList(before);
      showError(FAILED);
    } finally {
      orderInFlight.current = false;
      setOrdering(false);
    }
  }

  return (
    <>
      {area}
      <form className="bk-section bk-row" onSubmit={(e) => void add(e)}>
        <div className="bk-field">
          <label htmlFor="new-collection" className="bk-label">New collection name</label>
          <input id="new-collection" className="bk-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button type="submit" className="bk-btn" disabled={busy}>Add collection</button>
      </form>
      {list.length === 0 ? (
        <p className="bk-note">No collections yet. Collections group products on your shop, like “Autumn” or “Gifts under $30”.</p>
      ) : (
        <ul className="bk-list">
          {list.map((c, i) => (
            <li key={c.id} className="bk-list-item">
              <span className="bk-list-name">{c.name}</span>
              <span className="bk-note">{`${c.productCount} ${c.productCount === 1 ? 'product' : 'products'}`}</span>
              <span className="bk-pill" data-status={c.status}>{STATUS_LABEL[c.status]}</span>
              <span className="bk-row">
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={ordering || i === 0} aria-label={`Move ${c.name} up`} onClick={() => void move(i, -1)}>↑</button>
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={ordering || i === list.length - 1} aria-label={`Move ${c.name} down`} onClick={() => void move(i, 1)}>↓</button>
                <Link href={`/manage/collections/${c.id}`} className="bk-btn bk-btn-quiet bk-btn-small" aria-label={`Edit ${c.name}`}>Edit</Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

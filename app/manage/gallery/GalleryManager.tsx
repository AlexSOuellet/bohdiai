'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { uploadGalleryPhoto, saveGallery, removeGalleryPhoto } from '@/lib/backend/gallery/actions';
import { GALLERY_LIMIT, CAPTION_MAX, moveGalleryItem, type GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

const sameOrder = (a: readonly GalleryItem[], b: readonly GalleryItem[]): boolean =>
  a.length === b.length && a.every((x, i) => x.id === b[i]?.id && x.caption === b[i]?.caption);

/** The gallery: add photos (they upload straight away and join the end), caption
 *  and reorder them (saved together with Save), remove one (straight away, after a
 *  confirm). The first photo opens the site. */
export function GalleryManager({ initial, siteUrl }: { initial: GalleryItem[]; siteUrl: string }): React.ReactElement {
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const unsaved = !sameOrder(items, saved);
  const room = GALLERY_LIMIT - items.length;

  async function add(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length === 0) return;
    notice.clear();
    if (room <= 0) {
      notice.showError(`Your gallery holds up to ${GALLERY_LIMIT} photos. Remove one to add another.`);
      return;
    }
    const failures: string[] = [];
    let added = 0;
    for (const file of files.slice(0, room)) {
      setUploading((n) => n + 1);
      try {
        const data = new FormData();
        data.set('file', file);
        const r = await uploadGalleryPhoto(data);
        if (r.ok) {
          added += 1;
          // A new photo is already saved at the end; add it to both views so it isn't "unsaved".
          setItems((list) => [...list, r.item]);
          setSaved((list) => [...list, r.item]);
        } else failures.push(`${file.name}: ${r.error}`);
      } catch (err) {
        unstable_rethrow(err);
        failures.push(`${file.name}: The photo couldn’t be uploaded. Check your connection and try again.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (files.length > room) {
      failures.unshift(`Your gallery holds up to ${GALLERY_LIMIT} photos, so ${added} of the ${files.length} you picked ${added === 1 ? 'was' : 'were'} added.`);
    }
    if (failures.length > 0) notice.showError(failures.join(' '));
    else notice.showSaved(added === 1 ? 'Photo added.' : `${added} photos added.`);
  }

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, onDone: () => void, message: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await work();
      if (r.ok) {
        onDone();
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

  const save = (): Promise<void> =>
    run(
      () => saveGallery(items.map(({ id, caption }) => ({ id, caption }))),
      () => setSaved(items),
      'Saved. Your site shows the new order now.',
    );

  const remove = (id: string): Promise<void> =>
    run(
      () => removeGalleryPhoto(id),
      () => {
        setItems((list) => list.filter((x) => x.id !== id));
        setSaved((list) => list.filter((x) => x.id !== id));
      },
      'Photo removed.',
    );

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Gallery</h1>
        <div className="bk-head-actions">
          <a className="bk-btn bk-btn-quiet" href={siteUrl} target="_blank" rel="noopener noreferrer">
            View your site
          </a>
          {unsaved && <span className="bk-note">Unsaved changes</span>}
          <button type="button" className="bk-btn" disabled={busy || uploading > 0 || !unsaved} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <section className="bk-section" aria-labelledby="s-photos">
          <h2 id="s-photos" className="bk-section-title">
            Your photos ({items.length} of {GALLERY_LIMIT})
          </h2>
          <p className="bk-note">The first photo is the big one at the top of your site. Use the arrows to change the order, then Save.</p>

          {items.length > 0 && (
            <ul className="bk-photos" aria-label="Gallery photos">
              {items.map((p, i) => (
                <li key={p.id} className="bk-photo">
                  {/* The owner's own upload, already shrunk to WebP by the upload action. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption === '' ? `Photo ${i + 1}` : p.caption} />
                  {i === 0 && <span className="bk-tag">Top of your site</span>}
                  <label className="bk-label" htmlFor={`cap-${p.id}`}>
                    Caption <span className="bk-note">(optional)</span>
                  </label>
                  <input
                    id={`cap-${p.id}`}
                    className="bk-input"
                    maxLength={CAPTION_MAX}
                    value={p.caption}
                    onChange={(e) => {
                      const caption = e.target.value;
                      setItems((list) => list.map((x) => (x.id === p.id ? { ...x, caption } : x)));
                      notice.clearSaved();
                    }}
                  />
                  <div className="bk-row">
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} onClick={() => setItems((list) => moveGalleryItem(list, i, i - 1))}>
                      ←
                    </button>
                    <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === items.length - 1} aria-label={`Move photo ${i + 1} later`} onClick={() => setItems((list) => moveGalleryItem(list, i, i + 1))}>
                      →
                    </button>
                    <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => void remove(p.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {items.length === 0 && <p className="bk-note">No photos yet. Add a few of your best pieces.</p>}

          <p className="bk-row">
            <label className="bk-btn bk-btn-quiet" aria-disabled={room <= 0 || uploading > 0}>
              {uploading > 0 ? 'Uploading…' : 'Add photos'}
              <input
                type="file"
                className="bk-sr"
                accept="image/jpeg,image/png,image/webp"
                multiple
                aria-label="Add photos"
                disabled={room <= 0 || uploading > 0}
                onChange={(e) => void add(e)}
              />
            </label>
            <span className="bk-note">
              {room <= 0 ? `Your gallery is full. Remove a photo to add another.` : `JPG, PNG or WebP, up to 20MB each. Room for ${room} more.`}
            </span>
          </p>
        </section>
      </main>
    </>
  );
}

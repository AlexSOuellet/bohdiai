'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setMomentPhoto } from '@/lib/backend/moment/actions';
import type { useNotice } from '../_components/Notice';

const UPLOAD_FAILED = 'The photo couldn’t be uploaded. Check your connection and try again.';

/** The opening photo at the top of her home page. It saves the moment it's picked,
 *  like her portrait, so it stays out of the words' Save. Replace only: every design
 *  opens on a photo. */
export function OpeningPhotoField({ initial, notice }: { initial: { kind: 'image' | 'video'; url: string; posterUrl: string } | null; notice: ReturnType<typeof useNotice> }): React.ReactElement {
  const [shown, setShown] = useState(initial === null ? null : initial.kind === 'video' ? (initial.posterUrl === '' ? null : initial.posterUrl) : initial.url);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set('file', file);
      const r = await setMomentPhoto(data);
      if (r.ok) {
        setShown(r.url);
        notice.showSaved('Your opening photo is saved. Your site shows it now.');
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(UPLOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bk-section" aria-labelledby="s-opening-photo">
      <h2 id="s-opening-photo" className="bk-section-title">
        Your opening photo
      </h2>
      {shown !== null ? (
        <div className="bk-opening-photo">
          {/* The owner's own upload, already shrunk to WebP by the upload action. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt="Your opening photo" />
        </div>
      ) : (
        <p className="bk-note">{initial?.kind === 'video' ? 'Your site opens on a video.' : 'No opening photo yet.'}</p>
      )}
      <p className="bk-row">
        <label className="bk-btn bk-btn-quiet" aria-disabled={busy}>
          {busy ? 'Working…' : 'Replace'}
          <input type="file" className="bk-sr" accept="image/jpeg,image/png,image/webp" aria-label="Replace your opening photo" disabled={busy} onChange={(e) => void pick(e)} />
        </label>
      </p>
      <p className="bk-note">
        The big photo at the top of your home page. For the best look in every style, pick a wide photo of your work with no words or logos in it: your
        site writes its own words over it. Swap it with the seasons whenever you like. JPG, PNG or WebP, up to 20MB. It saves as soon as you pick it.
      </p>
    </section>
  );
}

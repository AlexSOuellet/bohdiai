'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { removePortrait, uploadPortrait } from '@/lib/backend/profile/actions';
import { ConfirmButton } from '../_components/ConfirmButton';
import type { useNotice } from '../_components/Notice';

const UPLOAD_FAILED = 'The photo couldn’t be uploaded. Check your connection and try again.';
const REMOVE_FAILED = 'The portrait couldn’t be removed. Check your connection and try again.';

/** The maker's portrait. It saves the moment it's picked or removed, like the
 *  gallery, so it stays out of the page's Save. */
export function PortraitField({ initialUrl, notice }: { initialUrl: string | null; notice: ReturnType<typeof useNotice> }): React.ReactElement {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set('file', file);
      const r = await uploadPortrait(data);
      if (r.ok) {
        setUrl(r.url);
        notice.showSaved('Your portrait is saved. Your site shows it now.');
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(UPLOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    setBusy(true);
    try {
      const r = await removePortrait();
      if (r.ok) {
        setUrl(null);
        notice.showSaved('Your portrait is removed.');
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(REMOVE_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bk-field">
      <p className="bk-label">
        Your portrait
      </p>
      {url !== null ? (
        <div className="bk-portrait">
          {/* The owner's own upload, already shrunk to WebP by the upload action. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Your portrait" />
        </div>
      ) : (
        <p className="bk-note">No portrait yet.</p>
      )}
      <p className="bk-row">
        <label className="bk-btn bk-btn-quiet" aria-disabled={busy}>
          {busy ? 'Working…' : url === null ? 'Add a portrait' : 'Replace'}
          <input
            type="file"
            className="bk-sr"
            accept="image/jpeg,image/png,image/webp"
            aria-label={url === null ? 'Add a portrait' : 'Replace your portrait'}
            disabled={busy}
            onChange={(e) => void pick(e)}
          />
        </label>
        {url !== null && <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => void remove()} />}
      </p>
      <p className="bk-note">A photo of you, shown beside your quote. JPG, PNG or WebP, up to 20MB. It saves as soon as you pick it.</p>
    </div>
  );
}

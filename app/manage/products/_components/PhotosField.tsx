'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { uploadProductPhoto } from '@/lib/backend/catalog/actions';
import { MAX_PHOTOS, type PhotoForm } from '@/lib/backend/catalog/product-form';
import { moveItem } from '@/lib/backend/catalog/collection-form';

/** Several photos; the first is the main one; the maker reorders (spec §4). Photos
 *  upload one at a time and each failure is named. */
export function PhotosField({
  photos,
  onAdd,
  onChange,
  onError,
}: {
  photos: PhotoForm[];
  onAdd: (photo: PhotoForm) => void;
  onChange: (photos: PhotoForm[]) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [uploading, setUploading] = useState(0);

  async function add(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      onError(`A product can have up to ${MAX_PHOTOS} photos. Remove one to add another.`);
      return;
    }
    const failures: string[] = [];
    if (files.length > room) failures.push(`A product can have up to ${MAX_PHOTOS} photos, so only the first ${room} were added.`);
    for (const file of files.slice(0, room)) {
      setUploading((n) => n + 1);
      try {
        const data = new FormData();
        data.set('file', file);
        const r = await uploadProductPhoto(data);
        if (r.ok) onAdd({ uploadId: r.uploadId, url: r.url });
        else failures.push(`${file.name}: ${r.error}`);
      } catch (err) {
        unstable_rethrow(err);
        failures.push(`${file.name}: The photo couldn’t be uploaded. Check your connection and try again.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (failures.length > 0) onError(failures.join(' '));
  }

  return (
    <div>
      {photos.length > 0 && (
        <ul className="bk-photos" aria-label="Photos">
          {photos.map((p, i) => (
            <li key={p.uploadId} className="bk-photo">
              {/* The maker's own upload, already shrunk to WebP by the upload action, so a
                  plain img like the other maker-photo spots (no next/image optimiser hop). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} />
              {i === 0 && <span className="bk-tag">Main photo</span>}
              <div className="bk-row">
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} onClick={() => onChange(moveItem(photos, i, -1))}>←</button>
                <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`} onClick={() => onChange(moveItem(photos, i, 1))}>→</button>
                <button type="button" className="bk-btn bk-btn-danger bk-btn-small" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(photos.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="bk-row">
        <label className="bk-btn bk-btn-quiet">
          {uploading > 0 ? 'Uploading…' : 'Add photos'}
          <input type="file" className="bk-sr" accept="image/jpeg,image/png,image/webp" multiple aria-label="Add photos" disabled={uploading > 0} onChange={(e) => void add(e)} />
        </label>
        <span className="bk-note">JPG, PNG or WebP, up to 20MB each. Big photos are made smaller for you.</span>
      </p>
    </div>
  );
}

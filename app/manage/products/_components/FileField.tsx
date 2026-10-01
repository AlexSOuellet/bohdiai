'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { uploadProductFile } from '@/lib/backend/catalog/actions';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.svg,.zip';

/** Upload (or replace) one private download file. The file is stored now; buyers get it in piece 2. */
export function FileField({
  fileName,
  label,
  onUploaded,
  onError,
}: {
  fileName: string | null;
  label: string;
  onUploaded: (uploadId: string, fileName: string) => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file === undefined) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set('file', file);
      const r = await uploadProductFile(data);
      if (r.ok) onUploaded(r.uploadId, r.fileName);
      else onError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      onError('The file couldn’t be uploaded. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bk-row">
      <span className="bk-note">{fileName ?? 'No file yet'}</span>
      <label className="bk-btn bk-btn-quiet bk-btn-small">
        {busy ? 'Uploading…' : fileName === null ? 'Upload file' : 'Replace file'}
        <input type="file" className="bk-sr" accept={ACCEPT} aria-label={label} disabled={busy} onChange={(e) => void pick(e)} />
      </label>
    </div>
  );
}

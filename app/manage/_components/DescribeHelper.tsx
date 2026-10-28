'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { describePiece } from '@/lib/tools/describe-actions';
import { FACTS_MAX, type Description } from '@/lib/tools/describe-limits';

/** "Help me write it" (Alex, 2026-10-28): writes the short description and the full
 *  one from the piece's name, what it's made of, its main photo and its price, with
 *  a few facts the maker adds. It fills the boxes; the maker edits from there. */
export function DescribeHelper({
  name,
  materials,
  price,
  photoUploadId,
  onWritten,
}: {
  name: string;
  materials: readonly string[];
  price: string;
  photoUploadId: string | null;
  onWritten: (text: Description) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [facts, setFacts] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [written, setWritten] = useState(false);

  async function write(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const done = await describePiece({ name, materials: [...materials], facts, price, photoUploadId });
      if (done.ok) {
        onWritten(done.text);
        setLeft(done.left);
        setWritten(true);
      } else setProblem(done.error);
    } catch (err) {
      unstable_rethrow(err);
      setProblem('Something went wrong. Check your connection and try again.');
    }
    setBusy(false);
  }

  if (!open)
    return (
      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small bk-describe-open" onClick={() => setOpen(true)}>
        Help me write it
      </button>
    );

  const uses = [materials.some((m) => m.trim() !== '') ? 'what it’s made of' : null, photoUploadId === null ? null : 'its main photo', price.trim() === '' ? null : 'the price'].filter((u): u is string => u !== null);
  return (
    <div className="bk-describe" role="group" aria-label="Help me write it">
      <p className="bk-note">{`Writes both descriptions from the name${uses.length === 0 ? '' : `, ${uses.join(', ')}`} and anything you add here. It replaces what’s in those two boxes; change anything after.`}</p>
      <div className="bk-field">
        <label htmlFor="describe-facts" className="bk-label">
          Anything to add?
        </label>
        <textarea id="describe-facts" className="bk-input bk-textarea bk-describe-facts" maxLength={FACTS_MAX} value={facts} onChange={(e) => setFacts(e.target.value)} />
        <span className="bk-note">The finished size, what makes it special, who it’s for. Leave it blank if you like.</span>
      </div>
      <div className="bk-row">
        <button type="button" className="bk-btn bk-btn-small" disabled={busy || name.trim() === ''} onClick={() => void write()}>
          {busy ? 'Writing…' : written ? 'Write it again' : 'Write it'}
        </button>
        {name.trim() === '' && <span className="bk-note">Give it a name first.</span>}
        {left !== null && <span className="bk-note">{left === 1 ? '1 more this month' : `${left} more this month`}</span>}
      </div>
      {problem !== null && (
        <p className="bk-error" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}

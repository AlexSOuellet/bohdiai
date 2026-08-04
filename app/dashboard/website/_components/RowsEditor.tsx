'use client';

import { useState, useTransition } from 'react';

/** One field in a row — a labelled input the maker fills. `kind` picks the control:
 *  a single line, a small paragraph box, or a native date picker. */
export interface RowColumn {
  readonly key: string;
  readonly label: string;
  readonly kind: 'text' | 'textarea' | 'date';
  /** Required cells must be filled for the row to count (blank rows are dropped). */
  readonly required?: boolean;
  readonly placeholder?: string;
}

type Row = Record<string, string>;

export interface RowsEditorProps {
  /** The columns each row exposes (e.g. quote / name / location, or place / date / time). */
  readonly columns: readonly RowColumn[];
  /** The rows to seed the editor with (the maker's saved rows on a resume, else empty). */
  readonly initialRows: readonly Row[];
  /** Button copy. */
  readonly addLabel: string;
  readonly saveLabel: string;
  /** Persist the complete rows. Resolves `{ ok }` like the other editor actions. */
  readonly onSave: (rows: Row[]) => Promise<{ ok: boolean; error?: string | undefined }>;
  /** Called after a successful save so the host resolves the step + refreshes the preview. */
  readonly onSaved: () => void;
}

/** A fresh, all-blank row for the given columns. */
function blankRow(columns: readonly RowColumn[]): Row {
  return Object.fromEntries(columns.map((c) => [c.key, ''])) as Row;
}

/** Whether every cell in a row is empty (a row the maker hasn't started). */
function isBlank(row: Row, columns: readonly RowColumn[]): boolean {
  return columns.every((c) => (row[c.key] ?? '').trim().length === 0);
}

/** Whether every REQUIRED cell in a row is filled. */
function isComplete(row: Row, columns: readonly RowColumn[]): boolean {
  return columns.every((c) => !c.required || (row[c.key] ?? '').trim().length > 0);
}

/** A repeatable rows editor — the maker types their own real rows (testimonials,
 *  event dates) rather than accepting seeded placeholders (D68/D70/D71). Content-only
 *  and self-contained: it manages the row list and hands the complete rows to the
 *  host's save action; it never touches look, structure, or link destinations. */
export default function RowsEditor({ columns, initialRows, addLabel, saveLabel, onSave, onSaved }: RowsEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => (initialRows.length > 0 ? initialRows.map((r) => ({ ...r })) : [blankRow(columns)]));
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function setCell(i: number, key: string, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    setSaved(false);
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow(columns)]);
    setSaved(false);
  }

  function removeRow(i: number) {
    // Never drop the last row — leave one blank so there's always something to fill.
    setRows((prev) => (prev.length <= 1 ? [blankRow(columns)] : prev.filter((_, idx) => idx !== i)));
    setSaved(false);
  }

  function save() {
    setMessage(null);
    const started = rows.filter((r) => !isBlank(r, columns));
    // A row the maker part-filled is almost certainly a mistake — flag it rather than
    // silently dropping it.
    if (started.some((r) => !isComplete(r, columns))) {
      setMessage('Fill in every field on a row, or clear it.');
      return;
    }
    if (started.length === 0) {
      setMessage('Add at least one, or turn the section off below.');
      return;
    }
    startTransition(async () => {
      const res = await onSave(started);
      if (res.ok) {
        setSaved(true);
        onSaved();
      } else {
        setMessage(res.error ?? 'Could not save your changes.');
      }
    });
  }

  return (
    <div className="mt-4">
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-white/12 bg-bg-2/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] uppercase tracking-wider text-muted">#{i + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-[11px] text-muted underline-offset-4 transition-colors hover:text-text-soft hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {columns.map((col) => (
                <label key={col.key} className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    {col.label}
                    {col.required ? '' : ' (optional)'}
                  </span>
                  {col.kind === 'textarea' ? (
                    <textarea
                      value={row[col.key] ?? ''}
                      rows={2}
                      placeholder={col.placeholder}
                      onChange={(e) => setCell(i, col.key, e.target.value)}
                      className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
                    />
                  ) : (
                    <input
                      type={col.kind === 'date' ? 'date' : 'text'}
                      value={row[col.key] ?? ''}
                      placeholder={col.placeholder}
                      onChange={(e) => setCell(i, col.key, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-lg border border-dashed border-white/15 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
      >
        + {addLabel}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? 'Saving…' : saveLabel}
        </button>
        {saved && <span className="text-sm text-honey-warm">Saved — see it in your store on the right.</span>}
      </div>
      {message && <p className="mt-3 text-sm text-text-soft">{message}</p>}
    </div>
  );
}

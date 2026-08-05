'use client';

import { useState, useTransition } from 'react';

/** One of the maker's real collections, as the editor list shows it. */
export interface EditorCollection {
  id: string;
  name: string;
  description: string;
  productIds: string[];
}

/** A product the maker can drop into a collection. */
export interface CollectionProduct {
  id: string;
  name: string;
  imageUrl: string | null;
}

type ActionResult = { ok: boolean; error?: string | undefined };
type SaveResult = { ok: true; id: string } | { ok: false; error: string };

interface CollectionForm {
  name: string;
  description: string;
  productIds: string[];
}

export interface CollectionsEditorProps {
  readonly initialCollections: readonly EditorCollection[];
  /** The maker's real products, to choose which belong in a collection. */
  readonly availableProducts: readonly CollectionProduct[];
  readonly onSave: (form: CollectionForm) => Promise<SaveResult>;
  readonly onUpdate: (id: string, form: CollectionForm) => Promise<ActionResult>;
  readonly onRemove: (id: string) => Promise<ActionResult>;
  readonly onResolved: (resolved: boolean) => void;
  readonly onChanged: () => void;
}

const EMPTY_FORM: CollectionForm = { name: '', description: '', productIds: [] };

/** The walk's collections step — the maker groups their real products into their own
 *  collections (name + which products; the band's cover comes from those products).
 *  Making the first real collection clears the seeded ones (server-side). Real-or-off:
 *  real collections, or the section is turned off — never the made-up ones. */
export default function CollectionsEditor({
  initialCollections,
  availableProducts,
  onSave,
  onUpdate,
  onRemove,
  onResolved,
  onChanged,
}: CollectionsEditorProps) {
  const [collections, setCollections] = useState<EditorCollection[]>(() => initialCollections.map((c) => ({ ...c })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionForm>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSave = form.name.trim().length > 0 && form.productIds.length > 0;
  const missing: string[] = [];
  if (form.name.trim().length === 0) missing.push('a name');
  if (form.productIds.length === 0) missing.push('at least one product');

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
    }));
  }

  function startEdit(c: EditorCollection) {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description, productIds: [...c.productIds] });
    setMessage(null);
  }

  function save() {
    setMessage(null);
    const clean: CollectionForm = {
      name: form.name.trim(),
      description: form.description.trim(),
      productIds: form.productIds,
    };
    startTransition(async () => {
      try {
        if (editingId !== null) {
          const res = await onUpdate(editingId, clean);
          if (!res.ok) {
            setMessage(res.error ?? 'Could not save your changes.');
            return;
          }
          setCollections((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...clean } : c)));
          resetForm();
          onChanged();
        } else {
          const res = await onSave(clean);
          if (!res.ok) {
            setMessage(res.error);
            return;
          }
          const next = [...collections, { id: res.id, ...clean }];
          setCollections(next);
          onResolved(next.length > 0);
          resetForm();
          onChanged();
        }
      } catch {
        setMessage('Something went wrong saving that collection — try again.');
      }
    });
  }

  function remove(id: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await onRemove(id);
        if (!res.ok) {
          setMessage(res.error ?? 'Could not remove that collection.');
          return;
        }
        const next = collections.filter((c) => c.id !== id);
        setCollections(next);
        onResolved(next.length > 0);
        if (editingId === id) resetForm();
        onChanged();
      } catch {
        setMessage('Something went wrong removing that — try again.');
      }
    });
  }

  if (availableProducts.length === 0) {
    return (
      <p className="mt-4 text-sm leading-relaxed text-text-soft">
        Add your products first — collections are groups of the products you’ve made, so there’s
        nothing to group yet.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {/* The maker's real collections so far */}
      {collections.length > 0 && (
        <ul className="space-y-3">
          {collections.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-white/12 bg-bg-2/40 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.productIds.length} {c.productIds.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(c)}
                className="text-[11px] text-text-soft underline-offset-4 transition-colors hover:text-honey-warm hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={pending}
                className="text-[11px] text-muted underline-offset-4 transition-colors hover:text-text-soft hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* The add / edit form */}
      <div className="mt-4 rounded-xl border border-white/12 bg-bg-2/40 p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted">
          {editingId !== null ? 'Edit this collection' : 'Add a collection'}
        </p>

        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Collection name</span>
            <input
              type="text"
              value={form.name}
              placeholder="e.g. Weekend Bakes"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">A short line (optional)</span>
            <input
              type="text"
              value={form.description}
              placeholder="what ties these together"
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted">Which products are in it</span>
            <ul className="mt-2 space-y-2">
              {availableProducts.map((p) => {
                const checked = form.productIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-bg-2/40 p-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 accent-honey"
                        aria-label={p.name}
                      />
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded bg-white/5" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-text-soft">{p.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!canSave || pending}
            className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {editingId !== null ? 'Save changes' : 'Add this collection'}
          </button>
          {!canSave && missing.length > 0 && (
            <span className="text-xs text-muted">Add {missing.join(' and ')} to save this collection.</span>
          )}
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-text-soft underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-text-soft">{message}</p>}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { parsePriceToCents } from '@/lib/listings/price';

/** One of the maker's real products, as the editor list shows it. */
export interface EditorProduct {
  id: string;
  name: string;
  price: string;
  shortDescription: string;
  description: string;
  imageUrl: string | null;
}

type ActionResult = { ok: boolean; error?: string | undefined };
type UploadResult = { ok: true; uploadId: string; url: string } | { ok: false; error: string };
type SaveResult = { ok: true; id: string } | { ok: false; error: string };
type DraftResult =
  | { ok: true; copy: { shortDescription?: string; description?: string } }
  | { ok: false; error: string };

/** The raw form the maker fills for one product. */
interface ProductForm {
  name: string;
  price: string;
  shortDescription: string;
  description: string;
}

export interface ProductsEditorProps {
  /** The maker's real products already saved (empty on a fresh walk). */
  readonly initialProducts: readonly EditorProduct[];
  /** Upload a photo file → its id (for the product) + public url (for the thumbnail). */
  readonly onUpload: (file: File) => Promise<UploadResult>;
  /** Save a NEW product; returns its id. */
  readonly onSave: (form: ProductForm & { uploadId: string }) => Promise<SaveResult>;
  /** Update an existing product. */
  readonly onUpdate: (id: string, form: ProductForm & { uploadId?: string }) => Promise<ActionResult>;
  /** Remove a product. */
  readonly onRemove: (id: string) => Promise<ActionResult>;
  /** Ask Bohdi to draft this product's words from a hint. */
  readonly onDraftCopy: (name: string, hint: string) => Promise<DraftResult>;
  /** Report whether the step is resolved (≥1 real product) so the host gates Next. */
  readonly onResolved: (resolved: boolean) => void;
  /** Ask the host to refresh the preview after a change. */
  readonly onChanged: () => void;
}

const EMPTY_FORM: ProductForm = { name: '', price: '', shortDescription: '', description: '' };

/** The walk's goods step — a simple product manager. The maker adds their real
 *  products (name, price, their own uploaded photo, and words they type or Bohdi
 *  drafts). One real product finishes the step; the AI placeholders clear on the
 *  first save (server-side). Photo + price are always the maker's own — Bohdi only
 *  ever helps with the words (D68). */
export default function ProductsEditor({
  initialProducts,
  onUpload,
  onSave,
  onUpdate,
  onRemove,
  onDraftCopy,
  onResolved,
  onChanged,
}: ProductsEditorProps) {
  const [products, setProducts] = useState<EditorProduct[]>(() => initialProducts.map((p) => ({ ...p })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  // A product needs a name, a real (parseable) price, and — for a new one — a photo.
  // Editing keeps the existing photo unless the maker uploads a new one.
  const priceOk = parsePriceToCents(form.price) !== null;
  const needsPhoto = editingId === null && uploadId === null;
  const canSave = form.name.trim().length > 0 && priceOk && !needsPhoto;
  // What's still missing, so the disabled Save button explains itself instead of
  // sitting dead with no reason.
  const missing: string[] = [];
  if (form.name.trim().length === 0) missing.push('a name');
  if (!priceOk) missing.push('a price');
  if (needsPhoto) missing.push('a photo');

  function resetForm() {
    setForm(EMPTY_FORM);
    setUploadId(null);
    setImageUrl(null);
    setHint('');
    setEditingId(null);
  }

  function setField(key: keyof ProductForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploading(true);
    void onUpload(file)
      .then((res) => {
        if (res.ok) {
          setUploadId(res.uploadId);
          setImageUrl(res.url);
        } else {
          setMessage(res.error);
        }
      })
      .finally(() => setUploading(false));
  }

  function askBohdi() {
    if (form.name.trim().length === 0) {
      setMessage('Name your product first, then Bohdi can help with the words.');
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await onDraftCopy(form.name.trim(), hint);
      if (res.ok) {
        setForm((f) => ({
          ...f,
          shortDescription: res.copy.shortDescription ?? f.shortDescription,
          description: res.copy.description ?? f.description,
        }));
      } else {
        setMessage(res.error);
      }
    });
  }

  function startEdit(p: EditorProduct) {
    setEditingId(p.id);
    setForm({ name: p.name, price: p.price, shortDescription: p.shortDescription, description: p.description });
    setImageUrl(p.imageUrl);
    setUploadId(null);
    setHint('');
    setMessage(null);
  }

  function save() {
    setMessage(null);
    const clean: ProductForm = {
      name: form.name.trim(),
      price: form.price.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
    };
    startTransition(async () => {
      if (editingId !== null) {
        const res = await onUpdate(editingId, { ...clean, ...(uploadId ? { uploadId } : {}) });
        if (!res.ok) {
          setMessage(res.error ?? 'Could not save your changes.');
          return;
        }
        const nextImage = imageUrl;
        setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...clean, imageUrl: nextImage } : p)));
        resetForm();
        onChanged();
      } else {
        if (uploadId === null) {
          setMessage('Add a photo of your product first.');
          return;
        }
        const res = await onSave({ ...clean, uploadId });
        if (!res.ok) {
          setMessage(res.error);
          return;
        }
        const added: EditorProduct = { id: res.id, ...clean, imageUrl };
        const next = [...products, added];
        setProducts(next);
        onResolved(next.length > 0);
        resetForm();
        onChanged();
      }
    });
  }

  function remove(id: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await onRemove(id);
      if (!res.ok) {
        setMessage(res.error ?? 'Could not remove that product.');
        return;
      }
      const next = products.filter((p) => p.id !== id);
      setProducts(next);
      onResolved(next.length > 0);
      if (editingId === id) resetForm();
      onChanged();
    });
  }

  return (
    <div className="mt-4">
      {/* The maker's real products so far */}
      {products.length > 0 && (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-white/12 bg-bg-2/40 p-3">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-14 w-14 flex-none rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-14 flex-none rounded-lg bg-white/5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text">{p.name}</p>
                <p className="text-xs text-muted">{p.price}</p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="text-[11px] text-text-soft underline-offset-4 transition-colors hover:text-honey-warm hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
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
          {editingId !== null ? 'Edit this product' : 'Add a product'}
        </p>

        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Product name</span>
            <input
              type="text"
              value={form.name}
              placeholder="e.g. Amber & Oud"
              onChange={(e) => setField('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Price</span>
            <input
              type="text"
              value={form.price}
              placeholder="e.g. $24"
              onChange={(e) => setField('price', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPickFile}
              className="mt-1 block w-full text-sm text-text-soft file:mr-3 file:rounded-lg file:border-0 file:bg-honey/15 file:px-3 file:py-1.5 file:text-sm file:text-honey-warm"
            />
          </label>
          {uploading && <p className="text-xs text-muted">Uploading your photo…</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Your product" className="h-24 w-24 rounded-lg object-cover" />
          )}

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Short line</span>
            <input
              type="text"
              value={form.shortDescription}
              placeholder="the one line under the name"
              onChange={(e) => setField('shortDescription', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Description</span>
            <textarea
              value={form.description}
              rows={3}
              placeholder="a little more about this piece"
              onChange={(e) => setField('description', e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
            />
          </label>

          {/* Bohdi's help with the words (photo + price stay the maker's own) */}
          <div className="rounded-lg border border-white/10 bg-bg-2/40 p-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted">Tell Bohdi about it (optional)</span>
              <input
                type="text"
                value={hint}
                placeholder="e.g. lavender soy, 8oz, burns 40 hours"
                onChange={(e) => setHint(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-bg-2/60 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-honey/50 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={askBohdi}
              disabled={pending}
              className="mt-2 rounded-lg border border-white/12 px-3 py-1.5 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:opacity-40"
            >
              {pending ? 'Bohdi’s writing…' : 'Ask Bohdi to write the words'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!canSave || pending}
            className="rounded-lg bg-honey px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {editingId !== null ? 'Save changes' : 'Add this product'}
          </button>
          {!canSave && missing.length > 0 && (
            <span className="text-xs text-muted">Add {missing.join(', ')} to save this product.</span>
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

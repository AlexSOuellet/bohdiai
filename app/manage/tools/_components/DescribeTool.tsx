'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { PhotoForm } from '@/lib/backend/catalog/product-form';
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { describePiece, loadPieceForDescribe, saveDescriptionsToProduct } from '@/lib/tools/describe-actions';
import { FACTS_MAX, type Description } from '@/lib/tools/describe-limits';
import { productLink } from '@/lib/tools/handoff';
import { PhotosField } from '../../products/_components/PhotosField';
import { HangTag, TextField } from './ToolParts';

/** Describe it (Alex, 2026-10-28): the description writer on its own. The maker
 *  names the piece, says what it's made of, adds a photo and anything else, and gets
 *  both descriptions on the tag, ready to save as a product. The same writer sits
 *  under the description on the product screen. It can start from one of the
 *  maker's products, and then saves to it (Alex, 2026-10-28). */
export function DescribeTool({ canSaveProduct, products = [] }: { canSaveProduct: boolean; products?: readonly { id: string; name: string }[] }): React.ReactElement {
  const router = useRouter();
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [madeOf, setMadeOf] = useState('');
  const [price, setPrice] = useState('');
  const [facts, setFacts] = useState('');
  const [photos, setPhotos] = useState<PhotoForm[]>([]);
  const [text, setText] = useState<Description | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const photo = photos[0] ?? null;

  async function write(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const done = await describePiece({ name, materials: madeOf.split('\n'), facts, price, photoUploadId: photo?.uploadId ?? null });
      if (done.ok) {
        setText(done.text);
        setLeft(done.left);
      } else setProblem(done.error);
    } catch (err) {
      unstable_rethrow(err);
      setProblem('Something went wrong. Check your connection and try again.');
    }
    setBusy(false);
  }

  /** Start from one of her products, or from nothing. */
  async function pick(id: string): Promise<void> {
    setProductId(id);
    setText(null);
    setProblem(null);
    if (id === '') {
      setName('');
      setMadeOf('');
      setPrice('');
      setPhotos([]);
      return;
    }
    setLoading(true);
    try {
      const got = await loadPieceForDescribe(id);
      if (got.ok) {
        setName(got.piece.name);
        setMadeOf(got.piece.materials.join('\n'));
        setPrice(got.piece.price);
        setPhotos(got.piece.photo === null ? [] : [got.piece.photo]);
      } else setProblem(got.error);
    } catch (err) {
      unstable_rethrow(err);
      setProblem('Something went wrong. Check your connection and try again.');
    }
    setLoading(false);
  }

  async function saveToProduct(): Promise<void> {
    if (saving || text === null) return;
    setSaving(true);
    setProblem(null);
    try {
      const done = await saveDescriptionsToProduct(productId, text);
      if (done.ok) {
        router.push(`/manage/products/${productId}`);
        return;
      }
      setProblem(done.error);
    } catch (err) {
      unstable_rethrow(err);
      setProblem('Something went wrong. Check your connection and try again.');
    }
    setSaving(false);
  }

  const picked = products.find((p) => p.id === productId) ?? null;
  const cents = parseDollars(price);
  const priceCents = cents.ok && cents.cents !== null ? cents.cents : 0;

  return (
    <section aria-labelledby="tool-describe">
      <h2 id="tool-describe" className="bk-tool-title">
        {`Describe ${name.trim() === '' ? 'your product' : name.trim()}`}
      </h2>
      <p className="bk-tool-lede">Say what it is and what it’s made of, add a photo, and get a short description and a full one to start from. Change any of it after.</p>

      <div className="bk-tool-main">
        <form
          className="bk-tool-form"
          onSubmit={(e) => {
            e.preventDefault();
            void write();
          }}
        >
          <section className="bk-section">
            <h3 className="bk-section-title">The piece</h3>
            {products.length > 0 && (
              <div className="bk-field">
                <label htmlFor="d-product" className="bk-label">
                  Start from one of your products
                </label>
                <select id="d-product" className="bk-input" value={productId} disabled={loading} onChange={(e) => void pick(e.target.value)}>
                  <option value="">A new piece</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {loading && <span className="bk-note">Loading…</span>}
              </div>
            )}
            <TextField id="d-name" label="What it’s called" value={name} onChange={setName} wide />
            <div className="bk-field">
              <label htmlFor="d-made" className="bk-label">
                What it’s made of
              </label>
              <textarea id="d-made" className="bk-input bk-textarea bk-describe-facts" value={madeOf} onChange={(e) => setMadeOf(e.target.value)} />
              <span className="bk-note">One thing a line, as exactly as you can: 1 inch thick pine round, 18 inches across.</span>
            </div>
            <TextField id="d-price" label="Price, if you have one" value={price} onChange={setPrice} />
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">A photo</h3>
            <PhotosField photos={photos} limit={1} onAdd={(p) => setPhotos([p])} onChange={setPhotos} onError={setProblem} />
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Anything to add?</h3>
            <div className="bk-field">
              <label htmlFor="d-facts" className="bk-label">
                Your own facts
              </label>
              <textarea id="d-facts" className="bk-input bk-textarea bk-describe-facts" maxLength={FACTS_MAX} value={facts} onChange={(e) => setFacts(e.target.value)} />
              <span className="bk-note">The finished size, what makes it special, who it’s for. Leave it blank if you like.</span>
            </div>
            <div className="bk-row">
              <button type="submit" className="bk-btn" disabled={busy || name.trim() === ''}>
                {busy ? 'Writing…' : text === null ? 'Write it' : 'Write it again'}
              </button>
              {name.trim() === '' && <span className="bk-note">Give it a name first.</span>}
              {left !== null && <span className="bk-note">{left === 1 ? '1 more this month' : `${left} more this month`}</span>}
            </div>
            {problem !== null && (
              <p className="bk-error" role="alert">
                {problem}
              </p>
            )}
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Its description" title={name.trim() === '' ? 'Your piece' : name.trim()}>
            {text === null ? (
              <p className="bk-hangtag-say">Fill in the piece and press Write it.</p>
            ) : (
              <>
                <p className="bk-hangtag-for">Short description</p>
                <p className="bk-hangtag-say bk-describe-text">{text.short}</p>
                <p className="bk-hangtag-for">Description</p>
                <p className="bk-hangtag-say bk-describe-text">{text.description}</p>
              </>
            )}
            {picked !== null && text !== null && (
              <button type="button" className="bk-btn bk-hangtag-save" disabled={saving} onClick={() => void saveToProduct()}>
                {saving ? 'Saving…' : `Save to ${picked.name}`}
              </button>
            )}
            {picked === null && canSaveProduct && text !== null && (
              <Link
                className="bk-btn bk-hangtag-save"
                href={productLink(name, priceCents, null, { short: text.short, description: text.description, ...(photo === null ? {} : { photoUploadId: photo.uploadId }) }) as Route}
              >
                Save as a product
              </Link>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

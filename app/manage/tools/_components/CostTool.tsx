'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import type { Route } from 'next';
import { cents, type BatchSupply, type PieceItem } from '@/lib/tools/maths';
import { productLink } from '@/lib/tools/handoff';
import { toolCosts } from './ToolsShell';
import { saveCostsToProduct } from '@/lib/tools/actions';
import type { CostSettings } from '@/lib/tools/product-costs';
import { BLANK_COST, EXAMPLE_COST, useTools } from './ToolsShell';
import { ExampleRow, HangTag, NumberField, TextField } from './ToolParts';

/** A product she opened in Cost to make, with its saved costs (null: none yet). */
export type FromProduct = { id: string; name: string; costs: CostSettings | null };

/** Cost to make: one batch, its supplies, what every piece gets, then her time. */
export function CostTool({ product = null }: { product?: FromProduct | null }): React.ReactElement {
  const { cost, setCost, costResult: r, price, setPrice, priceResult, canSaveProduct } = useTools();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Opened from a product: start from its own costs (or a blank batch named for it), once.
  const loaded = useRef<string | null>(null);
  useEffect(() => {
    if (product === null || loaded.current === product.id) return;
    loaded.current = product.id;
    const c = product.costs;
    setCost(
      c === null
        ? { ...BLANK_COST, name: product.name }
        : { name: product.name, yield: c.yield, hours: c.hours, rate: c.rate, batch: c.batch.length > 0 ? c.batch : BLANK_COST.batch, piece: c.piece.length > 0 ? c.piece : BLANK_COST.piece },
    );
    if (c !== null) setPrice({ ...price, extras: c.extras, markup: c.markup, linked: true });
  }, [product, price, setCost, setPrice]);

  async function saveToProduct(id: string): Promise<void> {
    if (saving) return;
    setSaving(true);
    setProblem(null);
    try {
      const done = await saveCostsToProduct(id, toolCosts(cost, price));
      if (done.ok) {
        router.push(`/manage/products/${id}`);
        return;
      }
      setProblem(done.error);
    } catch (err) {
      unstable_rethrow(err);
      setProblem('Something went wrong. Check your connection and try again.');
    }
    setSaving(false);
  }
  const set = (patch: Partial<typeof cost>): void => setCost({ ...cost, ...patch });
  const setBatch = (i: number, patch: Partial<BatchSupply>): void => set({ batch: cost.batch.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const setPiece = (i: number, patch: Partial<PieceItem>): void => set({ piece: cost.piece.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const name = cost.name.trim() === '' ? 'Your piece' : cost.name.trim();

  return (
    <section aria-labelledby="tool-cost">
      <h2 id="tool-cost" className="bk-tool-title">
        What does it cost you to make one?
      </h2>
      <p className="bk-tool-lede">Think about one batch. Put in what you paid for the supplies and how many pieces the batch made, and you’ll see the real cost of each piece.</p>
      {product !== null && (
        <p className="bk-tool-example">
          <span className="bk-tool-example-what">{`Working on ${product.name}`}</span>
          <Link className="bk-link" href={`/manage/products/${product.id}`}>
            Back to the product
          </Link>
        </p>
      )}
      {cost === EXAMPLE_COST && <ExampleRow what="Example: a batch of candles at real supplier prices" onBlank={() => setCost(BLANK_COST)} />}

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">The batch</h3>
            <div className="bk-tool-grid">
              <TextField id="c-name" label="What you’re making" value={cost.name} onChange={(v) => set({ name: v })} />
              <NumberField id="c-yield" label="How many one batch makes" value={cost.yield} onChange={(v) => set({ yield: v })} after="pieces" decimal={false} />
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Supplies the batch uses up</h3>
            <p className="bk-note bk-tool-help">Things you buy in bulk and share across pieces. If a bag or bottle lasts more than one batch, say how many batches you get out of it. A $30 bottle of fragrance that does 2 batches costs this batch $15.</p>
            <ul className="bk-tool-rows">
              {cost.batch.map((b, i) => (
                <li key={i} className="bk-tool-row bk-tool-row-batch">
                  <TextField id={`c-b-name-${i}`} label="Supply" value={b.name} onChange={(v) => setBatch(i, { name: v })} />
                  <NumberField id={`c-b-paid-${i}`} label="What you paid" before="$" value={b.paid} onChange={(v) => setBatch(i, { paid: v })} />
                  <NumberField id={`c-b-lasts-${i}`} label="Batches it lasts" value={b.lasts} onChange={(v) => setBatch(i, { lasts: v })} />
                  <button type="button" className="bk-tool-remove" aria-label={`Remove ${b.name.trim() === '' ? 'this supply' : b.name}`} onClick={() => set({ batch: cost.batch.length > 1 ? cost.batch.filter((_, j) => j !== i) : [{ name: '', paid: '', lasts: '1' }] })}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="bk-tool-foot">
              <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => set({ batch: [...cost.batch, { name: '', paid: '', lasts: '1' }] })}>
                Add a supply
              </button>
              <span className="bk-tool-sum">
                This batch used <strong>{cents(r.batch)}</strong>
              </span>
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">What every piece gets</h3>
            <p className="bk-note bk-tool-help">One of these goes with each piece: the jar, the lid, the label, the box, the bag.</p>
            <ul className="bk-tool-rows">
              {cost.piece.map((p, i) => (
                <li key={i} className="bk-tool-row bk-tool-row-piece">
                  <TextField id={`c-p-name-${i}`} label="Item" value={p.name} onChange={(v) => setPiece(i, { name: v })} />
                  <NumberField id={`c-p-each-${i}`} label="Costs you each" before="$" value={p.each} onChange={(v) => setPiece(i, { each: v })} />
                  <button type="button" className="bk-tool-remove" aria-label={`Remove ${p.name.trim() === '' ? 'this item' : p.name}`} onClick={() => set({ piece: cost.piece.length > 1 ? cost.piece.filter((_, j) => j !== i) : [{ name: '', each: '' }] })}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="bk-tool-foot">
              <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => set({ piece: [...cost.piece, { name: '', each: '' }] })}>
                Add one
              </button>
              <span className="bk-tool-sum">
                Per piece <strong>{cents(r.piece)}</strong>
              </span>
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Your time</h3>
            <p className="bk-note bk-tool-help">Your time is a cost too. Fill these in and your pay is added to each piece.</p>
            <div className="bk-tool-grid">
              <NumberField id="c-hours" label="Hours to make the batch" after="hrs" value={cost.hours} onChange={(v) => set({ hours: v })} note="Hands-on time only: prep, making, cleanup, packing. Not waiting for things to dry or cure." />
              <NumberField id="c-rate" label="Your hourly pay" before="$" after="/hr" value={cost.rate} onChange={(v) => set({ rate: v })} note="What you’d want if someone hired you to make it." />
            </div>
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Cost to make one" title={name}>
            <p className="bk-hangtag-big">
              <span className="bk-hangtag-big-label">Materials</span>
              <span className="bk-hangtag-big-value">{r.has ? cents(r.materials) : '—'}</span>
            </p>
            <dl className="bk-hangtag-lines">
              <dt>Share of the batch supplies</dt>
              <dd>{r.pieces > 0 ? cents(r.shared) : 'add how many it makes'}</dd>
              {r.pieces > 0 && <dd className="bk-hangtag-math">{`${cents(r.batch)} for the batch ÷ ${r.pieces} pieces`}</dd>}
              <dt>What every piece gets</dt>
              <dd>{cents(r.piece)}</dd>
              {r.time > 0 && (
                <>
                  <dt>Your time</dt>
                  <dd>{cents(r.time)}</dd>
                  <dd className="bk-hangtag-math">{`${cost.hours.trim()} hrs × ${cents(parseFloat(cost.rate) || 0)} ÷ ${r.pieces} pieces`}</dd>
                  <dt className="bk-hangtag-total">With your time</dt>
                  <dd className="bk-hangtag-total">{cents(r.withTime)}</dd>
                </>
              )}
            </dl>
            <p className="bk-hangtag-next">
              Next: <Link href="/manage/tools/price">Price it</Link>. Your numbers carry over.
            </p>
            {product !== null && (
              <button type="button" className="bk-btn bk-hangtag-save" disabled={saving} onClick={() => void saveToProduct(product.id)}>
                {saving ? 'Saving…' : `Save to ${product.name}`}
              </button>
            )}
            {problem !== null && (
              <p className="bk-error" role="alert">
                {problem}
              </p>
            )}
            {product === null && canSaveProduct && r.has && (
              <Link className="bk-btn bk-hangtag-save" href={productLink(cost.name, priceResult.has ? priceResult.fair * 100 : 0, toolCosts(cost, price)) as Route}>
                Save as a product
              </Link>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

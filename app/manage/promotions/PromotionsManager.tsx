'use client';

import { useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { addPromotion, removePromotion, setPromotionActive, updatePromotion } from '@/lib/backend/promotions/actions';
import { EMPTY_PROMO, STATE_LABEL, buildPromoRow, promoFormFrom, promoState, promoSummary, type PromoForm } from '@/lib/backend/promotions/promo-form';
import type { Promotion } from '@/lib/storefront/promotions';
import { ConfirmButton } from '../_components/ConfirmButton';
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

/** "Oct 31, 2026" for the owner's list. */
function showDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function showDays(p: Promotion): string {
  if (p.startsOn === null && p.endsOn === null) return 'No end date';
  if (p.startsOn === null) return `Until ${showDay(p.endsOn ?? '')}`;
  if (p.endsOn === null) return `From ${showDay(p.startsOn)}`;
  return `${showDay(p.startsOn)} to ${showDay(p.endsOn)}`;
}

function PromoFields({ form, onChange, idPrefix }: { form: PromoForm; onChange: (patch: Partial<PromoForm>) => void; idPrefix: string }): React.ReactElement {
  const sale = form.kind === 'sale';
  return (
    <>
      <fieldset className="bk-fieldset">
        <legend className="bk-label">Kind</legend>
        <label className="bk-check">
          <input type="radio" name={`${idPrefix}-kind`} checked={!sale} onChange={() => onChange({ kind: 'code' })} />
          Discount code: shoppers type it in the cart
        </label>
        <label className="bk-check">
          <input type="radio" name={`${idPrefix}-kind`} checked={sale} onChange={() => onChange({ kind: 'sale', amountType: 'percent' })} />
          Sale: a percent off everything, no code needed
        </label>
      </fieldset>
      <div className="bk-row">
        {sale ? (
          <div className="bk-field">
            <label className="bk-label" htmlFor={`${idPrefix}-name`}>
              Sale name <span className="bk-note">(shoppers see it)</span>
            </label>
            <input id={`${idPrefix}-name`} className="bk-input" maxLength={60} value={form.name} onChange={(e) => onChange({ name: e.target.value })} />
          </div>
        ) : (
          <div className="bk-field">
            <label className="bk-label" htmlFor={`${idPrefix}-code`}>
              Code
            </label>
            <input
              id={`${idPrefix}-code`}
              className="bk-input"
              maxLength={20}
              autoCapitalize="characters"
              value={form.code}
              onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            />
          </div>
        )}
        {!sale && (
          <div className="bk-field">
            <label className="bk-label" htmlFor={`${idPrefix}-type`}>
              Takes off
            </label>
            <select
              id={`${idPrefix}-type`}
              className="bk-input"
              value={form.amountType}
              onChange={(e) => onChange({ amountType: e.target.value === 'dollars' ? 'dollars' : 'percent' })}
            >
              <option value="percent">A percent</option>
              <option value="dollars">A dollar amount</option>
            </select>
          </div>
        )}
        <div className="bk-field">
          <label className="bk-label" htmlFor={`${idPrefix}-amount`}>
            {sale || form.amountType === 'percent' ? 'Percent off' : 'Dollars off'}
          </label>
          <input id={`${idPrefix}-amount`} className="bk-input bk-input-sm" inputMode="decimal" value={form.amount} onChange={(e) => onChange({ amount: e.target.value })} />
        </div>
      </div>
      <div className="bk-row">
        <div className="bk-field">
          <label className="bk-label" htmlFor={`${idPrefix}-start`}>
            First day <span className="bk-note">(optional)</span>
          </label>
          <input id={`${idPrefix}-start`} className="bk-input" type="date" value={form.startsOn} onChange={(e) => onChange({ startsOn: e.target.value })} />
        </div>
        <div className="bk-field">
          <label className="bk-label" htmlFor={`${idPrefix}-end`}>
            Last day <span className="bk-note">(optional)</span>
          </label>
          <input id={`${idPrefix}-end`} className="bk-input" type="date" min={form.startsOn === '' ? undefined : form.startsOn} value={form.endsOn} onChange={(e) => onChange({ endsOn: e.target.value })} />
        </div>
        {!sale && (
          <div className="bk-field">
            <label className="bk-label" htmlFor={`${idPrefix}-uses`}>
              Times it can be used <span className="bk-note">(optional)</span>
            </label>
            <input id={`${idPrefix}-uses`} className="bk-input bk-input-sm" inputMode="numeric" value={form.maxUses} onChange={(e) => onChange({ maxUses: e.target.value })} />
          </div>
        )}
      </div>
    </>
  );
}

/** Promotions: sales and discount codes. Add one, change it, pause or resume it,
 *  remove it. Every failure lands in the notice at the top. */
export function PromotionsManager({ initial, today }: { initial: Promotion[]; today: string }): React.ReactElement {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<PromoForm>(EMPTY_PROMO);
  const [editing, setEditing] = useState<{ id: string; form: PromoForm } | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();

  async function run<T extends { ok: true } | { ok: false; error: string }>(work: () => Promise<T>, onDone: (r: Extract<T, { ok: true }>) => void, message: string): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) {
        onDone(r as Extract<T, { ok: true }>);
        notice.showSaved(message);
      } else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function add(): void {
    const checked = buildPromoRow(draft);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    void run(
      () => addPromotion(draft),
      (r) => {
        setItems((list) => [r.item, ...list]);
        setDraft(EMPTY_PROMO);
      },
      draft.kind === 'sale' ? 'Sale added.' : 'Code added. Shoppers can use it in the cart.',
    );
  }

  function save(): void {
    if (editing === null) return;
    const checked = buildPromoRow(editing.form);
    if (!checked.ok) {
      notice.showError(checked.error);
      return;
    }
    const { id, form } = editing;
    void run(
      () => updatePromotion(id, form),
      (r) => {
        setItems((list) => list.map((x) => (x.id === id ? r.item : x)));
        setEditing(null);
      },
      'Saved.',
    );
  }

  const toggle = (p: Promotion): void =>
    void run(
      () => setPromotionActive(p.id, !p.active),
      () => setItems((list) => list.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x))),
      p.active ? 'Paused.' : 'Back on.',
    );

  const remove = (id: string): void =>
    void run(
      () => removePromotion(id),
      () => {
        setItems((list) => list.filter((x) => x.id !== id));
        if (editing?.id === id) setEditing(null);
      },
      'Removed.',
    );

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Promotions</h1>
      </div>
      <main id="main" className="bk-content">
        {notice.area}

        <section className="bk-section" aria-labelledby="s-add">
          <h2 id="s-add" className="bk-section-title">
            Add a promotion
          </h2>
          <p className="bk-note">
            A sale shows the lower price on every piece while it runs. A code is for handing out, at a market or online. A code and a sale don’t add
            up: the shopper gets whichever saves them more.
          </p>
          <PromoFields form={draft} idPrefix="new" onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          <p className="bk-row">
            <button type="button" className="bk-btn" disabled={busy} onClick={add}>
              {busy ? 'Saving…' : draft.kind === 'sale' ? 'Add sale' : 'Add code'}
            </button>
          </p>
        </section>

        <section className="bk-section" aria-labelledby="s-promos">
          <h2 id="s-promos" className="bk-section-title">
            Your promotions
          </h2>
          {items.length === 0 && <p className="bk-note">No promotions yet.</p>}
          {items.length > 0 && (
            <ul className="bk-list" aria-label="Promotions">
              {items.map((p) => {
                const state = promoState(p, today);
                const title = p.kind === 'code' ? (p.code ?? p.name) : p.name;
                return editing?.id === p.id ? (
                  <li key={p.id} className="bk-list-item bk-order">
                    <PromoFields
                      form={editing.form}
                      idPrefix={`e-${p.id}`}
                      onChange={(patch) => setEditing((e) => (e === null ? e : { ...e, form: { ...e.form, ...patch } }))}
                    />
                    <div className="bk-row">
                      <button type="button" className="bk-btn bk-btn-small" disabled={busy} onClick={save}>
                        {busy ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy} onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={p.id} className="bk-list-item bk-order">
                    <div className="bk-order-head">
                      <span className="bk-list-name">
                        {p.kind === 'code' ? 'Code ' : 'Sale: '}
                        {title}
                      </span>
                      <span className="bk-pill" data-status={state === 'running' ? 'paid' : state === 'scheduled' ? 'pending' : undefined}>
                        {STATE_LABEL[state]}
                      </span>
                    </div>
                    <p className="bk-note">
                      {promoSummary(p)} · {showDays(p)}
                      {p.kind === 'code' && ` · used ${p.uses}${p.maxUses === null ? '' : ` of ${p.maxUses}`} ${p.uses === 1 && p.maxUses === null ? 'time' : 'times'}`}
                    </p>
                    <div className="bk-row">
                      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy} aria-label={`Change ${title}`} onClick={() => setEditing({ id: p.id, form: promoFormFrom(p) })}>
                        Change
                      </button>
                      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={busy} aria-label={`${p.active ? 'Pause' : 'Turn back on'} ${title}`} onClick={() => toggle(p)}>
                        {p.active ? 'Pause' : 'Turn back on'}
                      </button>
                      <ConfirmButton label="Remove" confirmLabel="Yes, remove it" disabled={busy} onConfirm={() => remove(p.id)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

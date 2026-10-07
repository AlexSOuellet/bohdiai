'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { removeMarket, saveMarket } from '@/lib/backend/markets/actions';
import {
  COSTS_LIMIT,
  GO_BACK_LABEL,
  MARKET_LIMITS as L,
  buildMarketPayload,
  costsTotal,
  type GoBack,
  type MarketForm,
} from '@/lib/backend/markets/market-form';
import { ConfirmButton } from '../_components/ConfirmButton';
import { QrCode } from '../_components/QrCode';

import type { ShopPick } from '@/lib/backend/markets/shop-props';

/** The market shop's part of the page, on sites that have it. `marketUrl` is the
 *  page buyers scan to (null until the market is saved). */
export type MarketShopProps = { products: ShopPick[]; marketUrl: string | null; fileBase: string; todayHref: string | null };
import { useNotice } from '../_components/Notice';

const FAILED = 'Something went wrong. Check your connection and try again.';

function Text({
  id,
  label,
  note,
  value,
  max,
  onChange,
  type = 'text',
  inputMode,
}: {
  id: string;
  label: string;
  note?: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url';
  inputMode?: 'text' | 'decimal' | 'url' | 'email' | 'tel';
}): React.ReactElement {
  return (
    <div className="bk-field">
      <label className="bk-label" htmlFor={id}>
        {label} {note !== undefined && <span className="bk-note">({note})</span>}
      </label>
      <input id={id} className="bk-input" type={type} inputMode={inputMode} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** One market: everything about it on one page, Save at the top and bottom. Saving
 *  or removing goes back to the list, which says what happened. */
export function MarketEditor({ initial, shop }: { initial: MarketForm; shop?: MarketShopProps | undefined }): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const isNew = initial.id === null;
  const update = (patch: Partial<MarketForm>): void => setForm((f) => ({ ...f, ...patch }));
  const setCost = (i: number, patch: Partial<MarketForm['costs'][number]>): void =>
    setForm((f) => ({ ...f, costs: f.costs.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, then: () => void): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) then();
      else notice.showError(r.error);
    } catch (err) {
      unstable_rethrow(err);
      notice.showError(FAILED);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function save(): void {
    const check = buildMarketPayload(form);
    if (!check.ok) {
      notice.showError(check.error);
      return;
    }
    void run(
      () => saveMarket(form),
      () => router.push(`/manage/markets?saved=${encodeURIComponent(check.payload.name)}`),
    );
  }

  function remove(): void {
    if (initial.id === null) return;
    const id = initial.id;
    void run(
      () => removeMarket(id),
      () => router.push(`/manage/markets?removed=${encodeURIComponent(initial.name)}`),
    );
  }

  const saveButton = (
    <button type="button" className="bk-btn" disabled={busy} onClick={save}>
      {busy ? 'Saving…' : 'Save'}
    </button>
  );

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{isNew ? 'Add a market' : initial.name}</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href="/manage/markets">
            Back to markets
          </Link>
          {saveButton}
        </div>
      </div>
      <main id="main" className="bk-content bk-market">
        {notice.area}

        <section className="bk-section" aria-labelledby="s-when">
          <h2 id="s-when" className="bk-section-title">
            When and where
          </h2>
          <p className="bk-note">Everything in this part shows on your site, so shoppers can find you.</p>
          <Text id="m-name" label="Market name" value={form.name} max={L.name} onChange={(v) => update({ name: v })} />
          <div className="bk-row">
            <div className="bk-field">
              <label className="bk-label" htmlFor="m-date">
                {form.endDate === '' ? 'Day' : 'First day'}
              </label>
              <input id="m-date" className="bk-input" type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} />
            </div>
            <div className="bk-field">
              <label className="bk-label" htmlFor="m-end">
                Last day <span className="bk-note">(if it runs more than one day)</span>
              </label>
              <input id="m-end" className="bk-input" type="date" min={form.date === '' ? undefined : form.date} value={form.endDate} onChange={(e) => update({ endDate: e.target.value })} />
            </div>
          </div>
          <Text id="m-hours" label="Hours" note="like 10am – 4pm" value={form.hours} max={L.hours} onChange={(v) => update({ hours: v })} />
          <Text id="m-town" label="Town" value={form.town} max={L.town} onChange={(v) => update({ town: v })} />
          <Text id="m-address" label="Address" note="shoppers can tap it for directions" value={form.address} max={L.address} onChange={(v) => update({ address: v })} />
          <Text id="m-booth" label="Booth or table" note="like Booth 12" value={form.booth} max={L.booth} onChange={(v) => update({ booth: v })} />
          <Text id="m-url" label="The market’s website" note="optional" type="url" inputMode="url" value={form.url} max={L.url} onChange={(v) => update({ url: v })} />
          <div className="bk-field">
            <label className="bk-check">
              <input type="checkbox" checked={form.canceled} onChange={(e) => update({ canceled: e.target.checked })} />
              Canceled
            </label>
            <p className="bk-note">Your site shows it as canceled, so nobody drives out for it.</p>
          </div>
        </section>

        {shop !== undefined && (
          <section className="bk-section" aria-labelledby="s-table">
            <h2 id="s-table" className="bk-section-title">
              Your table
            </h2>
            {shop.todayHref !== null && (
              <p className="bk-row">
                <Link className="bk-btn" href={shop.todayHref as Route}>
                  Open Today: sales at the table
                </Link>
              </p>
            )}
            <fieldset className="bk-fieldset">
              <legend className="bk-label">What you’re bringing ({form.listingIds.length})</legend>
              <p className="bk-note">Buyers who scan this market’s code see only these.</p>
              {shop.products.length === 0 ? (
                <p className="bk-note">No live products yet. Add some under Products.</p>
              ) : (
                <ul className="bk-picks">
                  {shop.products.map((p) => (
                    <li key={p.id}>
                      <label className="bk-check bk-pick-row">
                        <input
                          type="checkbox"
                          checked={form.listingIds.includes(p.id)}
                          onChange={(e) =>
                            update({ listingIds: e.target.checked ? [...form.listingIds, p.id] : form.listingIds.filter((x) => x !== p.id) })
                          }
                        />
                        {p.photoUrl !== null && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="bk-thumb" src={p.photoUrl} alt="" />
                        )}
                        <span>
                          {p.name}
                          {p.soldOut && <span className="bk-note"> · sold</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
            <div className="bk-field">
              <p className="bk-label">This market’s QR code</p>
              {shop.marketUrl === null ? (
                <p className="bk-note">Save the market first, then its code shows here.</p>
              ) : (
                <>
                  <p className="bk-note bk-qr-url">{shop.marketUrl}</p>
                  <QrCode url={shop.marketUrl} fileBase={shop.fileBase} />
                </>
              )}
            </div>
          </section>
        )}

        <section className="bk-section" aria-labelledby="s-costs">
          <h2 id="s-costs" className="bk-section-title">
            Costs
          </h2>
          <p className="bk-note">Only you see these. They’re taken off this market’s sales so you can see what it really made.</p>
          {form.costs.length > 0 && (
            <ul className="bk-list" aria-label="Costs">
              {form.costs.map((c, i) => (
                <li key={i} className="bk-list-item bk-cost">
                  <div className="bk-field">
                    <label className="bk-label" htmlFor={`m-cost-${i}`}>
                      What
                    </label>
                    <input id={`m-cost-${i}`} className="bk-input" maxLength={L.costWhat} value={c.description} onChange={(e) => setCost(i, { description: e.target.value })} />
                  </div>
                  <div className="bk-field">
                    <label className="bk-label" htmlFor={`m-cost-${i}-amt`}>
                      Amount
                    </label>
                    <input id={`m-cost-${i}-amt`} className="bk-input bk-input-sm" inputMode="decimal" value={c.amount} onChange={(e) => setCost(i, { amount: e.target.value })} />
                  </div>
                  <button
                    type="button"
                    className="bk-btn bk-btn-quiet bk-btn-small"
                    aria-label={`Remove ${c.description === '' ? `cost ${i + 1}` : c.description}`}
                    onClick={() => setForm((f) => ({ ...f, costs: f.costs.filter((_, j) => j !== i) }))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="bk-row">
            {form.costs.length < COSTS_LIMIT && (
              <button
                type="button"
                className="bk-btn bk-btn-quiet bk-btn-small"
                onClick={() => setForm((f) => ({ ...f, costs: [...f.costs, { description: f.costs.length === 0 ? 'Booth fee' : '', amount: '' }] }))}
              >
                Add a cost
              </button>
            )}
            {form.costs.length > 0 && (
              <p className="bk-note" aria-live="polite">
                Costs total <strong>{costsTotal(form.costs)}</strong>
              </p>
            )}
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-org">
          <h2 id="s-org" className="bk-section-title">
            Organizer
          </h2>
          <p className="bk-note">Only you see these.</p>
          <Text id="m-org-name" label="Name" value={form.organizerName} max={L.organizerName} onChange={(v) => update({ organizerName: v })} />
          <div className="bk-row">
            <Text id="m-org-phone" label="Phone" type="tel" inputMode="tel" value={form.organizerPhone} max={L.organizerPhone} onChange={(v) => update({ organizerPhone: v })} />
            <Text id="m-org-email" label="Email" type="email" inputMode="email" value={form.organizerEmail} max={L.organizerEmail} onChange={(v) => update({ organizerEmail: v })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-notes">
          <h2 id="s-notes" className="bk-section-title">
            Notes
          </h2>
          <div className="bk-field">
            <label className="bk-label" htmlFor="m-notes">
              Notes to yourself <span className="bk-note">(only you see these)</span>
            </label>
            <textarea id="m-notes" className="bk-input bk-textarea" maxLength={L.notes} value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
          </div>
        </section>

        <section className="bk-section" aria-labelledby="s-review">
          <h2 id="s-review" className="bk-section-title">
            Your review
          </h2>
          <p className="bk-note">After the market: how did it go? Only you see this.</p>
          <fieldset className="bk-fieldset">
            <legend className="bk-label">Stars</legend>
            <div className="bk-stars-pick">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="bk-star"
                  aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                  aria-pressed={form.rating === n}
                  data-on={n <= form.rating ? 'true' : 'false'}
                  onClick={() => update({ rating: form.rating === n ? 0 : n })}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="bk-fieldset">
            <legend className="bk-label">Go back next year?</legend>
            <div className="bk-row">
              {(Object.keys(GO_BACK_LABEL) as GoBack[]).map((g) => (
                <label key={g} className="bk-check">
                  <input type="radio" name="m-go-back" checked={form.goBack === g} onChange={() => update({ goBack: g })} />
                  {GO_BACK_LABEL[g]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="bk-field">
            <label className="bk-label" htmlFor="m-review">
              How it went
            </label>
            <textarea id="m-review" className="bk-input bk-textarea" maxLength={L.review} value={form.review} onChange={(e) => update({ review: e.target.value })} />
          </div>
        </section>

        <div className="bk-row">
          {saveButton}
          {!isNew && <ConfirmButton label="Remove this market" confirmLabel="Yes, remove it" disabled={busy} onConfirm={remove} />}
        </div>
      </main>
    </>
  );
}

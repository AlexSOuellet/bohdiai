'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, unstable_rethrow } from 'next/navigation';
import { removeMarket, saveMarket } from '@/lib/backend/markets/actions';
import {
  COSTS_LIMIT,
  GO_BACK_LABEL,
  MARKET_LIMITS as L,
  STOCK_MAX,
  buildMarketPayload,
  costsCents,
  costsTotal,
  stockKey,
  type GoBack,
  type MarketForm,
} from '@/lib/backend/markets/market-form';
import { ConfirmButton } from '../_components/ConfirmButton';
import { EMPTY_TAKINGS, eventDay, hasTakings, type Takings } from '@/lib/tools/event-takings';
import { cents as centsText, dollars } from '@/lib/tools/maths';
import { QrCode } from '../_components/QrCode';

import type { ShopPick } from '@/lib/backend/markets/shop-props';
import { EVENT_TABS, type EventTab } from '@/lib/backend/markets/event-tabs';

/** A count box's starting number: what's on hand, when it's counted. */
const onHandText = (n: number | null): string => (n === null ? '' : String(Math.max(n, 0)));

/** Ticking a piece starts its count (or each option's) at what she has on hand,
 *  unless she already typed one. */
function startCounts(p: ShopPick, stock: Record<string, string>): Record<string, string> {
  const next = { ...stock };
  if (p.options.length === 0) {
    const k = stockKey(p.id);
    if (next[k] === undefined) next[k] = onHandText(p.onHand);
  } else {
    for (const o of p.options) {
      const k = stockKey(p.id, o.id);
      if (next[k] === undefined) next[k] = onHandText(o.onHand);
    }
  }
  return next;
}

function CountBox({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }): React.ReactElement {
  return (
    <span className="bk-count">
      <label className="bk-sr" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="bk-input bk-input-count" inputMode="numeric" maxLength={String(STOCK_MAX).length} placeholder="—" value={value} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

const TAB_LABEL: Readonly<Record<EventTab, string>> = {
  details: 'Details',
  bringing: 'What I’m bringing',
  sold: 'How it sold',
  after: 'After',
};

/** The market shop's part of the page, on sites that have it. `marketUrl` is the
 *  page buyers scan to (null until the market is saved). */
export type MarketShopProps = {
  products: ShopPick[];
  marketUrl: string | null;
  fileBase: string;
};
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
      <input
        id={id}
        className="bk-input"
        type={type}
        inputMode={inputMode}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** One event, split into tabs (Alex, 2026-10-22): Details (when and where, the
 *  organizer), What I'm bringing (with the QR code), How it sold, and After (costs,
 *  notes, review). Showcase has only the Details, so no tabs. The
 *  form keeps every tab's changes; Save saves them all. Saving or removing goes back
 *  to the schedule, which says what happened. */
/** What each plan asks (Saltmarsh & Lace demo spec): Showcase reports the day, market
 *  and town only; `details` (Lite up) adds hours, address, booth and website; `records`
 *  (Full) adds the private Costs, Organizer, Notes and Review. Hidden values stay in the
 *  form and are saved untouched, so moving down never loses them. */
export function MarketEditor({
  initial,
  shop,
  details,
  records,
  sold,
  summary,
  tab: firstTab = 'details',
  takings,
  takingsUnsaved = false,
}: {
  initial: MarketForm;
  shop?: MarketShopProps | undefined;
  details: boolean;
  records: boolean;
  /** How it sold at this event (piece counts and the sales): the How it sold tab. */
  sold?: React.ReactNode;
  /** The line across the top: the day, what it took in, the market day button. */
  summary?: React.ReactNode;
  /** The tab to open on (from the address, so a link can land on How it sold). */
  tab?: EventTab;
  /** Market day's own numbers (Alex, 2026-10-24), where there's no till to count the
   *  sales; null when none are saved yet. Leave out where the till counts them. */
  takings?: Takings | null;
  /** It saved, but its Market day numbers didn't. */
  takingsUnsaved?: boolean;
}): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const offersTakings = takings !== undefined;
  const [day, setDay] = useState<Takings>(takings ?? EMPTY_TAKINGS);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const notice = useNotice();
  const isNew = initial.id === null;
  // A new event can be filled in on every tab but How it sold (nothing has sold yet).
  const tabs = EVENT_TABS.filter(
    (t) => t === 'details' || (t === 'bringing' && shop !== undefined) || (t === 'sold' && sold !== undefined && !isNew) || (t === 'after' && records),
  );
  const [tab, setTab] = useState<EventTab>(tabs.includes(firstTab) ? firstTab : 'details');
  function openTab(t: EventTab): void {
    setTab(t);
    notice.clear();
    // Keep the tab in the address, so a refresh or a shared link lands on it.
    window.history.replaceState(null, '', t === 'details' ? window.location.pathname : `${window.location.pathname}?tab=${t}`);
  }
  const update = (patch: Partial<MarketForm>): void => setForm((f) => ({ ...f, ...patch }));
  const setCost = (i: number, patch: Partial<MarketForm['costs'][number]>): void =>
    setForm((f) => ({ ...f, costs: f.costs.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  async function run(
    work: () => Promise<{ ok: true; id?: string; warning?: 'costs' | 'takings' } | { ok: false; error: string }>,
    then: (id: string, warning?: 'costs' | 'takings') => void,
  ): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    notice.clear();
    try {
      const r = await work();
      if (r.ok) then(r.id ?? initial.id ?? '', r.warning);
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
      () => saveMarket(form, offersTakings && (takings !== null || hasTakings(day)) ? day : null),
      (id, warning) => router.push(warning === 'takings' ? `/manage/markets/${id}?tab=after&takings=unsaved` : `/manage/markets?saved=${encodeURIComponent(check.payload.name)}`),
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
        <h1 className="bk-title">{isNew ? 'Add an event' : initial.name}</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href="/manage/markets">
            Back to schedule
          </Link>
          {tab !== 'sold' && saveButton}
        </div>
      </div>
      <main id="main" className="bk-content bk-market">
        {summary}
        {tabs.length > 1 && (
          <div className="bk-tabs" role="tablist" aria-label="This event">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls="event-panel"
                className="bk-tab"
                onClick={() => openTab(t)}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>
        )}
        {notice.area}
        <div id="event-panel" role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? `tab-${tab}` : undefined}>

        {tab === 'details' && (
        <>
        <section className="bk-section" aria-labelledby="s-when">
          <h2 id="s-when" className="bk-section-title">
            When and where
          </h2>
          <p className="bk-note">
            Everything in this part shows on your site, so shoppers can find you.
          </p>
          <Text
            id="m-name"
            label="Event name"
            value={form.name}
            max={L.name}
            onChange={(v) => update({ name: v })}
          />
          <div className="bk-row">
            <div className="bk-field">
              <label className="bk-label" htmlFor="m-date">
                {form.endDate === '' ? 'Day' : 'First day'}
              </label>
              <input
                id="m-date"
                className="bk-input"
                type="date"
                value={form.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </div>
            <div className="bk-field">
              <label className="bk-label" htmlFor="m-end">
                Last day <span className="bk-note">(if it runs more than one day)</span>
              </label>
              <input
                id="m-end"
                className="bk-input"
                type="date"
                min={form.date === '' ? undefined : form.date}
                value={form.endDate}
                onChange={(e) => update({ endDate: e.target.value })}
              />
            </div>
          </div>
          <Text
            id="m-town"
            label="Town"
            value={form.town}
            max={L.town}
            onChange={(v) => update({ town: v })}
          />
          {details && (
            <>
              <Text
                id="m-hours"
                label="Hours"
                note="like 10am – 4pm"
                value={form.hours}
                max={L.hours}
                onChange={(v) => update({ hours: v })}
              />
              <Text
                id="m-address"
                label="Address"
                note="shoppers can tap it for directions"
                value={form.address}
                max={L.address}
                onChange={(v) => update({ address: v })}
              />
              <Text
                id="m-booth"
                label="Booth or table"
                note="like Booth 12"
                value={form.booth}
                max={L.booth}
                onChange={(v) => update({ booth: v })}
              />
              <Text
                id="m-url"
                label="The event’s website"
                note="optional"
                type="url"
                inputMode="url"
                value={form.url}
                max={L.url}
                onChange={(v) => update({ url: v })}
              />
            </>
          )}
          <div className="bk-field">
            <label className="bk-check">
              <input
                type="checkbox"
                checked={form.canceled}
                onChange={(e) => update({ canceled: e.target.checked })}
              />
              Canceled
            </label>
            <p className="bk-note">Your site shows it as canceled, so nobody drives out for it.</p>
          </div>
        </section>
        {records && (
            <section className="bk-section" aria-labelledby="s-org">
              <h2 id="s-org" className="bk-section-title">
                Organizer
              </h2>
              <p className="bk-note">Only you see these.</p>
              <Text
                id="m-org-name"
                label="Name"
                value={form.organizerName}
                max={L.organizerName}
                onChange={(v) => update({ organizerName: v })}
              />
              <div className="bk-row">
                <Text
                  id="m-org-phone"
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  value={form.organizerPhone}
                  max={L.organizerPhone}
                  onChange={(v) => update({ organizerPhone: v })}
                />
                <Text
                  id="m-org-email"
                  label="Email"
                  type="email"
                  inputMode="email"
                  value={form.organizerEmail}
                  max={L.organizerEmail}
                  onChange={(v) => update({ organizerEmail: v })}
                />
              </div>
            </section>
        )}
        </>
        )}

        {tab === 'bringing' && shop !== undefined && (
          <section className="bk-section" aria-labelledby="s-table">
            <h2 id="s-table" className="bk-section-title">
              Your table
            </h2>
            <fieldset className="bk-fieldset">
              <legend className="bk-label">What you’re bringing ({form.listingIds.length})</legend>
              <p className="bk-note">
                Buyers who scan this market’s code see only these. Type how many of each you’re bringing: it starts at
                what you have on hand, so lower it for anything staying home. When they’re gone, the piece shows sold out
                at this market. Leave a box empty to sell from everything you have.
              </p>
              {shop.products.length === 0 ? (
                <p className="bk-note">No live products yet. Add some under Products.</p>
              ) : (
                <ul className="bk-picks">
                  {shop.products.map((p) => {
                    const bringing = form.listingIds.includes(p.id);
                    const setCount = (key: string, v: string): void => update({ stock: { ...form.stock, [key]: v } });
                    return (
                      <li key={p.id} className="bk-bring">
                        <div className="bk-bring-row">
                          <label className="bk-check bk-pick-row">
                            <input
                              type="checkbox"
                              checked={bringing}
                              onChange={(e) =>
                                update(
                                  e.target.checked
                                    ? { listingIds: [...form.listingIds, p.id], stock: startCounts(p, form.stock) }
                                    : { listingIds: form.listingIds.filter((x) => x !== p.id) },
                                )
                              }
                            />
                            {p.photoUrl !== null && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img className="bk-thumb" src={p.photoUrl} alt="" />
                            )}
                            <span>
                              {p.name}
                              {p.soldOut && <span className="bk-note"> · sold out</span>}
                              {p.options.length === 0 && p.onHand !== null && <span className="bk-note"> · {p.onHand} on hand</span>}
                            </span>
                          </label>
                          {bringing && p.options.length === 0 && (
                            <CountBox id={`bring-${p.id}`} label={`How many ${p.name} you’re bringing`} value={form.stock[stockKey(p.id)] ?? ''} onChange={(v) => setCount(stockKey(p.id), v)} />
                          )}
                        </div>
                        {bringing && p.options.length > 0 && (
                          <ul className="bk-bring-options">
                            {p.options.map((o) => (
                              <li key={o.id} className="bk-bring-row">
                                <span>
                                  {o.label}
                                  {o.onHand !== null && <span className="bk-note"> · {o.onHand} on hand</span>}
                                </span>
                                <CountBox id={`bring-${o.id}`} label={`How many ${p.name}, ${o.label}, you’re bringing`} value={form.stock[stockKey(p.id, o.id)] ?? ''} onChange={(v) => setCount(stockKey(p.id, o.id), v)} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
            <div className="bk-field">
              <p className="bk-label">This event’s QR code</p>
              {shop.marketUrl === null ? (
                <p className="bk-note">Save the event first, then its code shows here.</p>
              ) : (
                <>
                  <p className="bk-note bk-qr-url">{shop.marketUrl}</p>
                  <QrCode url={shop.marketUrl} fileBase={shop.fileBase} />
                </>
              )}
            </div>
          </section>
        )}

        {tab === 'after' && records && (
          <>
            <section className="bk-section" aria-labelledby="s-costs">
              <h2 id="s-costs" className="bk-section-title">
                Costs
              </h2>
              <p className="bk-note">
                Only you see these. They’re taken off this market’s sales so you can see what it
                really made.
              </p>
              {form.costs.length > 0 && (
                <ul className="bk-list" aria-label="Costs">
                  {form.costs.map((c, i) => (
                    <li key={i} className="bk-list-item bk-cost">
                      <div className="bk-field">
                        <label className="bk-label" htmlFor={`m-cost-${i}`}>
                          What
                        </label>
                        <input
                          id={`m-cost-${i}`}
                          className="bk-input"
                          maxLength={L.costWhat}
                          value={c.description}
                          onChange={(e) => setCost(i, { description: e.target.value })}
                        />
                      </div>
                      <div className="bk-field">
                        <label className="bk-label" htmlFor={`m-cost-${i}-amt`}>
                          Amount
                        </label>
                        <input
                          id={`m-cost-${i}-amt`}
                          className="bk-input bk-input-sm"
                          inputMode="decimal"
                          value={c.amount}
                          onChange={(e) => setCost(i, { amount: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        className="bk-btn bk-btn-quiet bk-btn-small"
                        aria-label={`Remove ${c.description === '' ? `cost ${i + 1}` : c.description}`}
                        onClick={() =>
                          setForm((f) => ({ ...f, costs: f.costs.filter((_, j) => j !== i) }))
                        }
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
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        costs: [
                          ...f.costs,
                          { description: f.costs.length === 0 ? 'Booth fee' : '', amount: '' },
                        ],
                      }))
                    }
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
            {offersTakings && <MarketDayNumbers day={day} setDay={setDay} costsCents={costsCents(form.costs)} unsaved={takingsUnsaved} />}



            <section className="bk-section" aria-labelledby="s-notes">
              <h2 id="s-notes" className="bk-section-title">
                Notes
              </h2>
              <div className="bk-field">
                <label className="bk-label" htmlFor="m-notes">
                  Notes to yourself <span className="bk-note">(only you see these)</span>
                </label>
                <textarea
                  id="m-notes"
                  className="bk-input bk-textarea"
                  maxLength={L.notes}
                  value={form.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                />
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
                      <input
                        type="radio"
                        name="m-go-back"
                        checked={form.goBack === g}
                        onChange={() => update({ goBack: g })}
                      />
                      {GO_BACK_LABEL[g]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="bk-field">
                <label className="bk-label" htmlFor="m-review">
                  How it went
                </label>
                <textarea
                  id="m-review"
                  className="bk-input bk-textarea"
                  maxLength={L.review}
                  value={form.review}
                  onChange={(e) => update({ review: e.target.value })}
                />
              </div>
            </section>
          </>
        )}

        {tab === 'sold' && sold}
        </div>

        <div className="bk-row">
          {tab !== 'sold' && saveButton}
          {!isNew && tab === 'details' && (
            <ConfirmButton
              label="Remove this event"
              confirmLabel="Yes, remove it"
              disabled={busy}
              onConfirm={remove}
            />
          )}
        </div>
      </main>
    </>
  );
}

const DAY_VERDICT: Readonly<Record<string, string>> = {
  lost: 'You paid to be there.',
  'no-hours': 'Add your hours to see what it paid you an hour.',
  hard: 'Hard to justify: less than half of what your time is worth.',
  close: 'Close, but under your rate.',
  worth: 'Worth the trip.',
};

/** Market day on the event (Alex, 2026-10-24): her own numbers with the costs above. */
function MarketDayNumbers({ day, setDay, costsCents: costs, unsaved }: { day: Takings; setDay: (t: Takings) => void; costsCents: number; unsaved: boolean }): React.ReactElement {
  const r = eventDay(day, costs);
  const set = (patch: Partial<Takings>): void => setDay({ ...day, ...patch });
  const box = (id: string, label: string, key: keyof Takings, unit?: string): React.ReactElement => (
    <div className="bk-field">
      <label className="bk-label" htmlFor={id}>
        {label}
      </label>
      <span className="bk-row">
        <input id={id} className="bk-input bk-input-sm" inputMode="decimal" value={day[key]} onChange={(e) => set({ [key]: e.target.value })} />
        {unit !== undefined && <span className="bk-note">{unit}</span>}
      </span>
    </div>
  );
  return (
    <section className="bk-section" aria-labelledby="s-day">
      <h2 id="s-day" className="bk-section-title">
        Market day
      </h2>
      {unsaved && <p className="bk-notice">The event saved, but these numbers didn’t. Save again to keep them.</p>}
      <p className="bk-note">What you sold and the time you gave it. With the costs above, this shows what the day really paid you.</p>
      <div className="bk-grid-2">
        {box('d-sales', 'Total sales', 'sales', 'dollars')}
        {box('d-card', 'Of that, paid by card', 'card', 'dollars')}
        {box('d-rate', 'Card fee', 'cardRate', '%')}
        {box('d-mat', 'What the things you sold cost you to make', 'materials', 'dollars')}
        {box('d-hrs', 'Hours at the market', 'hoursAtMarket', 'hrs')}
        {box('d-hrs2', 'Hours driving and packing', 'hoursOther', 'hrs')}
        {box('d-wage', 'What an hour of your time is worth', 'wage', 'dollars')}
      </div>
      {r.sales > 0 && (
        <p className="bk-event-day" aria-live="polite">
          You took home <strong>{dollars(r.profit)}</strong>
          {r.hours > 0 && (
            <>
              , <strong>{centsText(r.hourly)}</strong> an hour
            </>
          )}
          . {DAY_VERDICT[r.verdict] ?? ''}
        </p>
      )}
    </section>
  );
}

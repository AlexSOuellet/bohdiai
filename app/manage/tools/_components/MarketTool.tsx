'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { cents, dollars, type MarketCost, type Verdict } from '@/lib/tools/maths';
import { eventLink } from '@/lib/tools/handoff';
import { BLANK_DAY, EXAMPLE_DAY, useTools, type DayForm } from './ToolsShell';
import { ExampleRow, HangTag, NumberField, Placed, TextField } from './ToolParts';

const COST_WORDS: Readonly<Record<MarketCost, string>> = {
  materials: 'Materials',
  booth: 'Booth fee',
  gas: 'Gas, tolls and parking',
  food: 'Food and coffee',
  other: 'Bags, signs, other',
  cardFees: 'Card fees',
};

const VERDICT_WORDS: Readonly<Record<Verdict, { say: string; note: (wage: string) => string }>> = {
  empty: { say: 'Fill in your day', note: () => 'Start with your total sales.' },
  lost: { say: 'You paid to be there', note: () => 'Costs were bigger than sales. Worth asking if the crowd was right for what you make.' },
  'no-hours': { say: 'Add your hours', note: () => 'Your time is part of the cost.' },
  hard: { say: 'Hard to justify', note: () => 'You earned less than half of what your time is worth.' },
  close: { say: 'Close, but under your rate', note: (wage) => `You made money, just not ${wage} an hour.` },
  worth: { say: 'Worth the trip', note: (wage) => (wage === '' ? '' : `You beat the ${wage} an hour you set for your time.`) },
};

/** Market day: what came in, what it cost to be there, and her time. */
export function MarketTool(): React.ReactElement {
  const { day, setDay, dayResult: r, canSaveEvent } = useTools();
  const set = (patch: Partial<DayForm>): void => setDay({ ...day, ...patch });
  const wage = r.wage > 0 ? dollars(r.wage) : '';
  const v = VERDICT_WORDS[r.verdict];
  const base = Math.max(r.sales, r.totalCosts) || 1;
  const shown = r.costs.filter((c) => c.amount > 0);
  // Booth, gas, food and other go to the event's costs; materials and card fees are
  // already counted by the sales once she records them.
  const eventCosts = r.costs.filter((c) => c.kind === 'booth' || c.kind === 'gas' || c.kind === 'food' || c.kind === 'other').map((c) => ({ description: COST_WORDS[c.kind], cents: c.amount * 100 }));

  return (
    <section aria-labelledby="tool-market">
      <h2 id="tool-market" className="bk-tool-title">
        Was that market worth it?
      </h2>
      <p className="bk-tool-lede">Put in what you sold and what it cost you to be there. You’ll see what you really took home, and what you earned for every hour you gave it.</p>
      {day === EXAMPLE_DAY && <ExampleRow what="Example numbers" onBlank={() => setDay(BLANK_DAY)} />}

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">The day</h3>
            <TextField id="m-name" label="Market name" value={day.name} onChange={(x) => set({ name: x })} />
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">What came in</h3>
            <div className="bk-tool-grid">
              <NumberField id="m-sales" label="Total sales" before="$" value={day.sales} onChange={(x) => set({ sales: x })} note="Cash, card, Venmo, everything." />
              <NumberField id="m-card" label="Of that, paid by card" before="$" value={day.card} onChange={(x) => set({ card: x })} note="Leave at 0 if you only took cash and apps." />
              <NumberField id="m-rate" label="Card fee" after="%" value={day.cardRate} onChange={(x) => set({ cardRate: x })} note="Check your card reader’s rate." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">What it cost to be there</h3>
            <div className="bk-tool-grid">
              <NumberField id="m-booth" label="Booth fee" before="$" value={day.booth} onChange={(x) => set({ booth: x })} />
              <NumberField id="m-gas" label="Gas, tolls and parking" before="$" value={day.gas} onChange={(x) => set({ gas: x })} />
              <NumberField id="m-food" label="Food and coffee" before="$" value={day.food} onChange={(x) => set({ food: x })} />
              <NumberField id="m-other" label="Bags, signs, other" before="$" value={day.other} onChange={(x) => set({ other: x })} />
              <NumberField id="m-mat" label="What the things you sold cost you to make" before="$" value={day.materials} onChange={(x) => set({ materials: x })} wide note="Materials only. Your time goes below. A rough guess is fine." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">Your time</h3>
            <div className="bk-tool-grid">
              <NumberField id="m-hrs" label="Hours at the market" after="hrs" value={day.hoursAtMarket} onChange={(x) => set({ hoursAtMarket: x })} note="Setup to teardown." />
              <NumberField id="m-hrs2" label="Hours driving and packing" after="hrs" value={day.hoursOther} onChange={(x) => set({ hoursOther: x })} note="Loading the car counts." />
              <NumberField id="m-wage" label="What’s an hour of your time worth?" before="$" after="/hr" value={day.wage} onChange={(x) => set({ wage: x })} wide note="The pay you’d want if someone hired you for the day." />
            </div>
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Market day" title={day.name.trim() === '' ? 'Your market' : day.name.trim()}>
            <p className="bk-tool-verdict" data-tone={r.verdict === 'worth' ? 'good' : r.verdict === 'close' ? 'warn' : r.verdict === 'lost' || r.verdict === 'hard' ? 'bad' : undefined}>
              {v.say}
            </p>
            {v.note(wage) !== '' && <p className="bk-hangtag-say">{v.note(wage)}</p>}
            <div className="bk-tool-pair">
              <p className="bk-hangtag-big">
                <span className="bk-hangtag-big-label">You took home</span>
                <span className="bk-hangtag-big-value">{dollars(r.profit)}</span>
              </p>
              <p className="bk-hangtag-big">
                <span className="bk-hangtag-big-label">Per hour</span>
                <span className="bk-hangtag-big-value">{r.hours > 0 ? cents(r.hourly) : '—'}</span>
              </p>
            </div>
            {(shown.length > 0 || r.profit > 0) && (
              <span className="bk-tool-split" role="img" aria-label="Where each sales dollar went">
                {shown.map((c) => (
                  <Placed key={c.kind} className="bk-tool-seg" width={(c.amount / base) * 100} title={`${COST_WORDS[c.kind]}: ${cents(c.amount)}`} />
                ))}
                {r.profit > 0 && <Placed className="bk-tool-seg bk-tool-seg-keep" width={(r.profit / base) * 100} title={`You keep: ${cents(r.profit)}`} />}
              </span>
            )}
            <dl className="bk-hangtag-lines">
              {shown.map((c) => (
                <div key={c.kind} className="bk-hangtag-pair">
                  <dt>{COST_WORDS[c.kind]}</dt>
                  <dd>{cents(c.amount)}</dd>
                </div>
              ))}
              {r.profit > 0 && (
                <>
                  <dt className="bk-hangtag-total">You keep</dt>
                  <dd className="bk-hangtag-total">{cents(r.profit)}</dd>
                </>
              )}
              {r.profit < 0 && (
                <>
                  <dt className="bk-hangtag-total">Short by</dt>
                  <dd className="bk-hangtag-total">{cents(-r.profit)}</dd>
                </>
              )}
            </dl>
            <p className="bk-hangtag-say">
              {r.salesNeeded === null
                ? 'Add your sales, hours and hourly rate to see what this market needs to bring in.'
                : r.salesNeeded === 'never'
                  ? 'Your materials and fees eat every sale. Take a look at your prices.'
                  : `To pay yourself ${wage} an hour at this market, you’d need about ${dollars(r.salesNeeded)} in sales.`}
            </p>
            {canSaveEvent && (
              <Link className="bk-btn bk-hangtag-save" href={eventLink(day.name, eventCosts) as Route}>
                Save as an event
              </Link>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

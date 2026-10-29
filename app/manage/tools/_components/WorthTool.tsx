'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { amount, cents, dollars, marketWorth, type WorthNeed, type WorthVerdict } from '@/lib/tools/maths';
import { eventLink } from '@/lib/tools/handoff';
import { BLANK_WORTH, type WorthForm } from '@/lib/tools/forms';
import { HangTag, NumberField, TextField } from './ToolParts';

const VERDICT_WORDS: Readonly<Record<WorthVerdict, { say: string; note: (wage: string) => string }>> = {
  empty: { say: 'Fill in the market', note: () => 'Start with the booth fee and a typical sale.' },
  'no-sale': { say: 'Add a typical sale', note: () => 'What an average piece sells for, and what it costs you to make.' },
  'no-margin': { say: 'Each piece loses money', note: () => 'What a piece costs to make and the card fee come to more than it sells for. Take a look at your prices.' },
  'no-guess': { say: 'What do you think you’ll sell?', note: () => 'Add a guess at the bottom to see if it’s worth the trip.' },
  hard: { say: 'Hard to justify', note: () => 'At what you think you’ll sell, it won’t cover the day.' },
  close: { say: 'Close', note: (wage) => (wage === '' ? 'It covers the day, but not your time.' : `It covers the day, but not ${wage} an hour for your time.`) },
  worth: { say: 'Worth the trip', note: (wage) => (wage === '' ? 'It covers the day.' : `It covers the day and pays you ${wage} an hour.`) },
};

const piecesText = (n: number): string => (n === 1 ? '1 piece' : `${n} pieces`);

function Need({ label, need }: { label: string; need: WorthNeed | null }): React.ReactElement {
  return (
    <p className="bk-hangtag-big">
      <span className="bk-hangtag-big-label">{label}</span>
      <span className="bk-hangtag-big-value">{need === null ? '—' : piecesText(need.pieces)}</span>
      {need !== null && <span className="bk-hangtag-math">{`${dollars(need.sales)} in sales`}</span>}
    </p>
  );
}

/** Is this market worth it? (Alex, 2026-10-28; replaces Market day): before she pays
 *  for the booth, what she'd have to sell to cover the day, and to pay herself too.
 *  Counting the day itself is the market app's job, on Market. */
export function WorthTool({ canSaveEvent, initial = BLANK_WORTH }: { canSaveEvent: boolean; initial?: WorthForm }): React.ReactElement {
  const [form, setForm] = useState<WorthForm>(initial);
  const r = marketWorth(form);
  const set = (patch: Partial<WorthForm>): void => setForm({ ...form, ...patch });
  const wage = r.wage > 0 && r.hours > 0 ? dollars(r.wage) : '';
  const v = VERDICT_WORDS[r.verdict];
  const costs = [
    { description: 'Booth fee', amount: form.booth },
    { description: 'Gas, tolls and parking', amount: form.gas },
    { description: 'Food and coffee', amount: form.food },
    { description: 'Bags, signs, other', amount: form.other },
  ].map((c) => ({ description: c.description, cents: Math.round(amount(c.amount) * 100) }));

  return (
    <section aria-labelledby="tool-worth">
      <h2 id="tool-worth" className="bk-tool-title">
        Is this market worth it?
      </h2>
      <p className="bk-tool-lede">Before you pay for the booth, see how much you’d have to sell just to cover the day, and how much to pay yourself for your time too.</p>

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">The market</h3>
            <TextField id="w-name" label="Market name" value={form.name} onChange={(x) => set({ name: x })} />
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">What it costs to go</h3>
            <div className="bk-tool-grid">
              <NumberField id="w-booth" label="Booth fee" before="$" value={form.booth} onChange={(x) => set({ booth: x })} />
              <NumberField id="w-gas" label="Gas, tolls and parking" before="$" value={form.gas} onChange={(x) => set({ gas: x })} />
              <NumberField id="w-food" label="Food and coffee" before="$" value={form.food} onChange={(x) => set({ food: x })} />
              <NumberField id="w-other" label="Bags, signs, other" before="$" value={form.other} onChange={(x) => set({ other: x })} />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">Your time</h3>
            <div className="bk-tool-grid">
              <NumberField id="w-hrs" label="Hours at the market" after="hrs" value={form.hoursAtMarket} onChange={(x) => set({ hoursAtMarket: x })} note="Setup to teardown." />
              <NumberField id="w-hrs2" label="Hours driving and packing" after="hrs" value={form.hoursOther} onChange={(x) => set({ hoursOther: x })} note="Loading the car counts." />
              <NumberField id="w-wage" label="What’s an hour of your time worth?" before="$" after="/hr" value={form.wage} onChange={(x) => set({ wage: x })} wide note="The pay you’d want if someone hired you for the day." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">A typical sale</h3>
            <div className="bk-tool-grid">
              <NumberField id="w-price" label="What an average piece sells for" before="$" value={form.price} onChange={(x) => set({ price: x })} />
              <NumberField id="w-made" label="What it costs you to make" before="$" value={form.made} onChange={(x) => set({ made: x })} note="Materials only. A rough guess is fine." />
              <NumberField id="w-share" label="Paid by card" after="%" value={form.cardShare} onChange={(x) => set({ cardShare: x })} note="About how much of your sales come in by card." />
              <NumberField id="w-rate" label="Card fee" after="%" value={form.cardRate} onChange={(x) => set({ cardRate: x })} note="Check your card reader’s rate." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">Your guess</h3>
            <NumberField id="w-guess" label="What do you think you’ll sell?" before="$" value={form.guess} onChange={(x) => set({ guess: x })} wide note="Leave it blank if you have no idea yet." />
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Is it worth it?" title={form.name.trim() === '' ? 'Your market' : form.name.trim()}>
            <p className="bk-tool-verdict" data-tone={r.verdict === 'worth' ? 'good' : r.verdict === 'close' ? 'warn' : r.verdict === 'hard' || r.verdict === 'no-margin' ? 'bad' : undefined}>
              {v.say}
            </p>
            <p className="bk-hangtag-say">{v.note(wage)}</p>
            <div className="bk-tool-pair">
              <Need label="Just to cover the day" need={r.cover} />
              <Need label="To also pay yourself" need={r.pay} />
            </div>
            <dl className="bk-hangtag-lines">
              <div className="bk-hangtag-pair">
                <dt>The day costs</dt>
                <dd>{cents(r.dayCost)}</dd>
              </div>
              {r.hours > 0 && r.wage > 0 && (
                <div className="bk-hangtag-pair">
                  <dt>Your time</dt>
                  <dd>{cents(r.hours * r.wage)}</dd>
                </div>
              )}
              {r.earns > 0 && (
                <div className="bk-hangtag-pair">
                  <dt className="bk-hangtag-total">Each piece earns</dt>
                  <dd className="bk-hangtag-total">{cents(r.earns)}</dd>
                </div>
              )}
            </dl>
            {canSaveEvent && (
              <Link className="bk-btn bk-hangtag-save" href={eventLink(form.name, costs) as Route}>
                Save as an event
              </Link>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

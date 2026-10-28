'use client';

import { useState } from 'react';
import { amount, cents, dollars, monthlyGoal, type GoalInput, type GoalVerdict } from '@/lib/tools/maths';
import { BLANK_GOAL } from '@/lib/tools/forms';
import { HangTag, NumberField } from './ToolParts';

const SAY: Readonly<Record<Exclude<GoalVerdict, 'ok'>, { say: string; note: string }>> = {
  empty: { say: 'Set your goal', note: 'Start with what you want to make in a month.' },
  'no-sale': { say: 'Add a typical sale', note: 'What an average piece sells for, and what it costs you to make.' },
  'no-margin': { say: 'Each piece loses money', note: 'What a piece costs to make is more than it sells for. Take a look at your prices.' },
};

const piecesText = (n: number): string => (n === 1 ? '1 piece' : `${n} pieces`);
const marketsText = (n: number): string => (n === 1 ? '1 market' : `${n} markets`);

/** Monthly goal (Alex, 2026-10-28): what she wants to make in a month, as the pieces
 *  to sell and the markets that takes. */
export function GoalTool({ initial = BLANK_GOAL }: { initial?: GoalInput }): React.ReactElement {
  const [form, setForm] = useState<GoalInput>(initial);
  const r = monthlyGoal(form);
  const set = (patch: Partial<GoalInput>): void => setForm({ ...form, ...patch });

  return (
    <section aria-labelledby="tool-goal">
      <h2 id="tool-goal" className="bk-tool-title">
        What does it take to reach your goal?
      </h2>
      <p className="bk-tool-lede">Say what you want to make in a month, and see how many pieces you’d need to sell, and how many markets that is.</p>

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">Your goal</h3>
            <NumberField id="g-goal" label="What you want to make in a month" before="$" value={form.goal} onChange={(x) => set({ goal: x })} wide note="What you keep after what your pieces cost to make." />
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">A typical sale</h3>
            <div className="bk-tool-grid">
              <NumberField id="g-price" label="What an average piece sells for" before="$" value={form.price} onChange={(x) => set({ price: x })} />
              <NumberField id="g-made" label="What it costs you to make" before="$" value={form.made} onChange={(x) => set({ made: x })} note="Materials only. A rough guess is fine." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">Your markets</h3>
            <NumberField id="g-per" label="Pieces you usually sell at one market" value={form.perMarket} onChange={(x) => set({ perMarket: x })} decimal={false} wide note="Leave it blank if you don’t do markets." />
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Your goal" title={r.verdict === 'empty' ? 'Each month' : `${dollars(amount(form.goal))} a month`}>
            {r.verdict !== 'ok' ? (
              <>
                <p className="bk-tool-verdict" data-tone={r.verdict === 'no-margin' ? 'bad' : undefined}>
                  {SAY[r.verdict].say}
                </p>
                <p className="bk-hangtag-say">{SAY[r.verdict].note}</p>
              </>
            ) : (
              <>
                <div className="bk-tool-pair">
                  <p className="bk-hangtag-big">
                    <span className="bk-hangtag-big-label">Pieces to sell</span>
                    <span className="bk-hangtag-big-value">{piecesText(r.pieces ?? 0)}</span>
                    <span className="bk-hangtag-math">{`${dollars(r.sales ?? 0)} in sales`}</span>
                  </p>
                  {r.markets !== null && (
                    <p className="bk-hangtag-big">
                      <span className="bk-hangtag-big-label">Markets</span>
                      <span className="bk-hangtag-big-value">{marketsText(r.markets)}</span>
                    </p>
                  )}
                </div>
                <dl className="bk-hangtag-lines">
                  <div className="bk-hangtag-pair">
                    <dt className="bk-hangtag-total">Each piece earns</dt>
                    <dd className="bk-hangtag-total">{cents(r.earns)}</dd>
                  </div>
                </dl>
              </>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}


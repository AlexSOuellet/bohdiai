'use client';

import { useState } from 'react';
import { cents, shipping, type ShipInput } from '@/lib/tools/maths';
import { BLANK_SHIP } from '@/lib/tools/forms';
import { HangTag, NumberField } from './ToolParts';

/** Shipping (Alex, 2026-10-28): what one order really costs to ship, and what to
 *  charge so it doesn't cost her. She looks the postage up herself; nothing is
 *  fetched from a carrier. */
export function ShipTool({ initial = BLANK_SHIP }: { initial?: ShipInput }): React.ReactElement {
  const [form, setForm] = useState<ShipInput>(initial);
  const r = shipping(form);
  const set = (patch: Partial<ShipInput>): void => setForm({ ...form, ...patch });

  return (
    <section aria-labelledby="tool-ship">
      <h2 id="tool-ship" className="bk-tool-title">
        What does shipping really cost you?
      </h2>
      <p className="bk-tool-lede">Add up the box, the padding and the postage for one order, and see what to charge so shipping never comes out of your pocket.</p>

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">One order</h3>
            <div className="bk-tool-grid">
              <NumberField id="s-box" label="The box or mailer" before="$" value={form.box} onChange={(x) => set({ box: x })} />
              <NumberField id="s-pad" label="Padding, tape and labels" before="$" value={form.padding} onChange={(x) => set({ padding: x })} />
              <NumberField id="s-post" label="Postage" before="$" value={form.postage} onChange={(x) => set({ postage: x })} wide note="Weigh the packed order and look up the price on your post office’s or carrier’s site." />
            </div>
          </section>
          <section className="bk-section">
            <h3 className="bk-section-title">Card fees</h3>
            <NumberField id="s-rate" label="Card fee on what you charge for shipping" after="%" value={form.cardRate} onChange={(x) => set({ cardRate: x })} wide note="Leave it blank if the buyer doesn’t pay you by card." />
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Shipping" title="One order">
            {r.cost === 0 ? (
              <p className="bk-hangtag-say">Fill in the box, padding and postage.</p>
            ) : (
              <>
                <div className="bk-tool-pair">
                  <p className="bk-hangtag-big">
                    <span className="bk-hangtag-big-label">It costs you</span>
                    <span className="bk-hangtag-big-value">{cents(r.cost)}</span>
                  </p>
                  <p className="bk-hangtag-big">
                    <span className="bk-hangtag-big-label">Charge at least</span>
                    <span className="bk-hangtag-big-value">{cents(r.charge)}</span>
                  </p>
                </div>
                {r.cardFee > 0 && <p className="bk-hangtag-say">{`That covers the ${cents(r.cardFee)} card fee on it too.`}</p>}
              </>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

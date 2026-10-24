'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { MARKUPS, compareToOthers, cents, dollars, markupText, type Channel, type Markup, type CompareRead } from '@/lib/tools/maths';
import { productLink } from '@/lib/tools/handoff';
import { EXAMPLE_PRICE, useTools, type PriceForm } from './ToolsShell';
import { ExampleRow, HangTag, NumberField, Placed, TextField } from './ToolParts';

const MARKUP_WORDS: Readonly<Record<Markup, { label: string; note: string }>> = {
  2: { label: 'Double', note: 'the least most makers use' },
  2.5: { label: 'Two and a half times', note: 'what most makers aim for' },
  3: { label: 'Triple', note: 'standout or premium pieces' },
};

const CHANNEL_WORDS: Readonly<Record<Channel, { pick: string; line: string }>> = {
  markets: { pick: 'Craft markets', line: 'Ask at markets' },
  etsy: { pick: 'Etsy', line: 'List on Etsy at' },
  facebook: { pick: 'Facebook', line: 'List on Facebook at' },
  site: { pick: 'My own website', line: 'On your website' },
  consign: { pick: 'Consignment shop', line: 'Tag it at the consignment shop' },
};
const CHANNEL_ORDER: readonly Channel[] = ['markets', 'etsy', 'facebook', 'site', 'consign'];

const COMPARE_WORDS: Readonly<Record<CompareRead, (low: string, breakEven: string) => string>> = {
  'costs-above': (_low, breakEven) => `Your costs are higher than what others charge. Others may be underpricing, or there may be a cheaper way to make it. Selling below ${breakEven} doesn’t pay you for your time either way.`,
  below: (low) => `Your price is below everyone you’ve seen. You have room to charge more. Pricing up to ${low} still puts you at the low end.`,
  above: () => 'Your price is above what others charge. That can work if yours looks or feels better. Say why on your sign.',
  within: () => 'Your price sits right in with other makers. That’s a good place to be.',
};

/** Price it: her costs, a markup, where she sells, and what others charge. */
export function PriceTool(): React.ReactElement {
  const { price, priceShown: p, setPrice, priceResult: r, canSaveProduct } = useTools();
  const set = (patch: Partial<PriceForm>): void => setPrice({ ...p, ...patch });
  // Typing over a number Cost to make filled in stops it following Cost to make.
  const setOwn = (patch: Partial<PriceForm>): void => setPrice({ ...p, ...patch, linked: false });
  const on = new Set(p.channels);
  const toggle = (c: Channel): void => set({ channels: on.has(c) ? p.channels.filter((x) => x !== c) : CHANNEL_ORDER.filter((x) => x === c || on.has(x)) });
  const compare = compareToOthers(r, p.low, p.high);
  const query = encodeURIComponent(p.name.trim());
  const m = markupText(p.markup);

  return (
    <section aria-labelledby="tool-price">
      <h2 id="tool-price" className="bk-tool-title">
        Price it right
      </h2>
      <p className="bk-tool-lede">Most makers price by gut and come in too low. Your numbers from Cost to make carry over here. See your break-even, the price to charge in each place you sell, and what to charge a shop.</p>
      {price === EXAMPLE_PRICE && (
        <ExampleRow what="Example: a soy candle" onBlank={() => setPrice({ ...EXAMPLE_PRICE, name: '', materials: '', time: '', extras: '', low: '', high: '', linked: false })} />
      )}

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">Your cost to make one</h3>
            <label className="bk-check bk-tool-link">
              <input type="checkbox" checked={p.linked} onChange={(e) => set({ linked: e.target.checked })} /> Fill these in from Cost to make
            </label>
            {!p.linked && <p className="bk-note bk-tool-help">These no longer follow Cost to make. Tick the box to bring its numbers back.</p>}
            <div className="bk-tool-grid">
              <TextField id="p-name" label="What you’re pricing" value={p.name} onChange={(v) => setOwn({ name: v })} wide />
              <NumberField id="p-mat" label="Materials for one" before="$" value={p.materials} onChange={(v) => setOwn({ materials: v })} />
              <NumberField id="p-time" label="Your time for one" before="$" value={p.time} onChange={(v) => setOwn({ time: v })} note="Blank if you didn’t add your time." />
              <NumberField id="p-extras" label="Other costs for one" before="$" value={p.extras} onChange={(v) => set({ extras: v })} wide note="Costs Cost to make doesn’t cover: a share of booth fees, card fees, gift bags. A dollar or two is a fair guess." />
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Mark it up</h3>
            <p className="bk-note bk-tool-help">Your costs only cover making it. The markup pays for everything else: hours at markets, photos and listings, supply runs, pieces that don’t sell, and growing the business. Most makers multiply their full cost by two to three.</p>
            <div className="bk-tool-picks" role="group" aria-label="How much to mark it up">
              {MARKUPS.map((k) => (
                <button key={k} type="button" className="bk-tool-pick" aria-pressed={p.markup === k} onClick={() => set({ markup: k })}>
                  <strong>{MARKUP_WORDS[k].label}</strong>
                  <span>{MARKUP_WORDS[k].note}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Where you sell</h3>
            <p className="bk-note bk-tool-help">Each place takes a different bite out of a sale, so each gets its own price. Pick all that apply.</p>
            <div className="bk-tool-wheres" role="group" aria-label="Where you sell">
              {CHANNEL_ORDER.map((c) => (
                <button key={c} type="button" className="bk-tool-where" aria-pressed={on.has(c)} onClick={() => toggle(c)}>
                  {CHANNEL_WORDS[c].pick}
                </button>
              ))}
            </div>
            {on.has('etsy') && (
              <div className="bk-tool-fee">
                <p className="bk-label">Etsy’s cut</p>
                <div className="bk-tool-grid">
                  <NumberField id="p-etsy-pct" label="Percent of each sale" after="%" value={p.etsyPct} onChange={(v) => set({ etsyPct: v })} />
                  <NumberField id="p-etsy-fix" label="Plus per sale" before="$" value={p.etsyFix} onChange={(v) => set({ etsyFix: v })} />
                </div>
                <p className="bk-note">Etsy’s sale fee, payment fee and listing fee for US shops. Ads and shipping cost extra. Change it if your Etsy bill says otherwise.</p>
              </div>
            )}
            {on.has('facebook') && (
              <div className="bk-tool-fee">
                <NumberField id="p-haggle" label="Room to haggle on Facebook" after="%" value={p.haggle} onChange={(v) => set({ haggle: v })} note="List a little high so you can come down and still get your price." />
              </div>
            )}
            {on.has('site') && (
              <div className="bk-tool-fee">
                <p className="bk-label">Card fees on your website</p>
                <div className="bk-tool-grid">
                  <NumberField id="p-site-pct" label="Percent of each sale" after="%" value={p.sitePct} onChange={(v) => set({ sitePct: v })} />
                  <NumberField id="p-site-fix" label="Plus per sale" before="$" value={p.siteFix} onChange={(v) => set({ siteFix: v })} />
                </div>
                <p className="bk-note">Check your Stripe or Square rate. Shipping is separate.</p>
              </div>
            )}
            {on.has('consign') && (
              <div className="bk-tool-fee">
                <p className="bk-label">The consignment shop’s terms</p>
                <div className="bk-tool-grid">
                  <NumberField id="p-con-pct" label="Their cut of each sale" after="%" value={p.consignPct} onChange={(v) => set({ consignPct: v })} />
                  <NumberField id="p-con-rent" label="Booth or shelf rent" before="$" after="/mo" value={p.consignRent} onChange={(v) => set({ consignRent: v })} />
                  <NumberField id="p-con-sold" label="About how many sell there a month" after="pieces" value={p.consignSold} onChange={(v) => set({ consignSold: v })} decimal={false} wide />
                </div>
                <p className="bk-note">Some shops take a cut, some charge rent, some do both. Put 0 for any they don’t charge.</p>
              </div>
            )}
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">What similar pieces sell for</h3>
            {query === '' ? (
              <p className="bk-note">Type what you’re pricing at the top and the search buttons appear here.</p>
            ) : (
              <div className="bk-tool-comps">
                <a className="bk-btn bk-btn-quiet" href={`https://www.etsy.com/search?q=${query}`} target="_blank" rel="noopener noreferrer">
                  Search Etsy
                </a>
                <a className="bk-btn bk-btn-quiet" href={`https://www.amazon.com/s?k=${query}&i=handmade`} target="_blank" rel="noopener noreferrer">
                  Amazon Handmade
                </a>
                {on.has('facebook') && (
                  <a className="bk-btn bk-btn-quiet" href={`https://www.facebook.com/marketplace/search/?query=${query}`} target="_blank" rel="noopener noreferrer">
                    Facebook Marketplace
                  </a>
                )}
              </div>
            )}
            <p className="bk-note bk-tool-help">On Etsy, look at shops with lots of sales, not the cheapest listing. At markets, walk the room at your next show and note what pieces like yours are marked.</p>
            <div className="bk-tool-grid">
              <NumberField id="p-low" label="Lowest you’ve seen" before="$" value={p.low} onChange={(v) => set({ low: v })} />
              <NumberField id="p-high" label="Highest you’ve seen" before="$" value={p.high} onChange={(v) => set({ high: v })} />
            </div>
          </section>
        </form>

        <div className="bk-tool-side">
          <HangTag label="Your price" title={p.name.trim() === '' ? 'Your piece' : p.name.trim()}>
            <p className="bk-hangtag-big">
              <span className="bk-hangtag-big-label">Price it at</span>
              <span className="bk-hangtag-big-value">{r.has ? dollars(r.fair) : '—'}</span>
            </p>
            {r.has ? (
              <>
                <p className="bk-hangtag-say">{`Your break-even × ${m}, rounded up. That leaves ${cents(r.fair - r.breakEven)} a piece for everything besides making it.`}</p>
                <dl className="bk-hangtag-lines">
                  <dt>Break-even</dt>
                  <dd>{cents(r.breakEven)}</dd>
                  <dd className="bk-hangtag-math">
                    {`Materials ${cents(r.materials)} + other costs ${cents(r.extras)}${r.time > 0 ? ` + your time ${cents(r.time)}` : ''}. Below ${cents(r.cash)} you lose money.`}
                    {r.time > 0 && ` Between ${cents(r.cash)} and ${cents(r.breakEven)} you’re working for less than your pay.`}
                  </dd>
                  {r.channels.map((c) => (
                    <div key={c.channel} className="bk-hangtag-pair">
                      <dt>{CHANNEL_WORDS[c.channel].line}</dt>
                      <dd>{dollars(c.price)}</dd>
                      {c.channel === 'markets' && <dd className="bk-hangtag-math">Booth and card fees are already in your costs.</dd>}
                      {(c.channel === 'etsy' || c.channel === 'site') && c.keeps !== undefined && <dd className="bk-hangtag-math">{`After the fees you keep about ${cents(c.keeps)}.`}</dd>}
                      {c.channel === 'facebook' && c.floor !== undefined && <dd className="bk-hangtag-math">{`Come down as far as ${dollars(c.floor)} if they haggle.`}</dd>}
                      {c.channel === 'consign' && c.keeps !== undefined && (
                        <dd className="bk-hangtag-math">
                          {r.consignNeedsSold
                            ? 'Add about how many pieces sell there a month so the rent can be counted.'
                            : `After their cut you get ${cents(c.keeps)}${(c.rentEach ?? 0) > 0 ? `, and ${cents(c.rentEach ?? 0)} of that covers this piece’s share of the rent` : ''}. Your other costs are left out because the shop does the selling.`}
                        </dd>
                      )}
                    </div>
                  ))}
                  <dt className="bk-hangtag-total">Selling to a shop, charge them</dt>
                  <dd className="bk-hangtag-total">{dollars(r.shop)}</dd>
                  <dd className="bk-hangtag-math">{`Materials${r.time > 0 ? ' + your time' : ''} = ${cents(r.shopCost)}, × ${m}, rounded up. You make ${cents(r.shop - r.shopCost)} on every piece.`}</dd>
                </dl>
              </>
            ) : (
              <p className="bk-hangtag-say">Add your materials and time to start.</p>
            )}

            {compare !== null && (
              <div className="bk-tool-compare">
                <p className="bk-hangtag-for">Next to other makers</p>
                <span className="bk-tool-track" role="img" aria-label={`Others charge ${dollars(compare.low)} to ${dollars(compare.high)}; your break-even ${cents(r.breakEven)}; your price ${dollars(r.fair)}`}>
                  <Placed className="bk-tool-band" at={compare.band.left} width={compare.band.width} />
                  <Placed className="bk-tool-mark" at={compare.breakEvenAt} title={`Break-even ${cents(r.breakEven)}`} />
                  <Placed className="bk-tool-mark bk-tool-mark-price" at={compare.fairAt} title={`Your price ${dollars(r.fair)}`} />
                </span>
                <span className="bk-tool-track-ends">
                  <span>{dollars(Math.floor(compare.min))}</span>
                  <span>{dollars(Math.ceil(compare.max))}</span>
                </span>
                <p className="bk-hangtag-say">{COMPARE_WORDS[compare.read](dollars(compare.low), cents(r.breakEven))}</p>
              </div>
            )}

            {canSaveProduct && r.has && (
              <Link className="bk-btn bk-hangtag-save" href={productLink(p.name, r.fair * 100) as Route}>
                Save as a product
              </Link>
            )}
          </HangTag>
        </div>
      </div>
    </section>
  );
}

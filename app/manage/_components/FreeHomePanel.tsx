import Link from 'next/link';
import type { Route } from 'next';
import { cents, dollars } from '@/lib/tools/maths';
import { PIECES_READY, type FreeHome } from '@/lib/tools/free-home';

/** Free's numbers on Home (Alex, 2026-10-24), on the same kraft tag the tools answer
 *  on: her pieces, any priced too low, her last market and her best. */
export function FreeNumbers({ view }: { view: FreeHome }): React.ReactElement {
  const below = view.belowCost;
  return (
    <aside className="bk-hangtag bk-free-tag" aria-label="Your numbers">
      <span className="bk-hangtag-hole" aria-hidden="true" />
      <p className="bk-hangtag-for">Your numbers</p>
      <p className="bk-hangtag-big">
        <span className="bk-hangtag-big-label">Pieces worked out</span>
        <span className="bk-hangtag-big-value">{`${view.products - view.noCosts} of ${view.products}`}</span>
      </p>
      <dl className="bk-hangtag-lines">
        <div className="bk-hangtag-pair">
          <dt>Priced too low</dt>
          <dd>
            {below.length === 0 ? (
              'None'
            ) : (
              <Link href="/manage/products">{below.length === 1 ? (below[0]?.name ?? '1 piece') : `${below.length} pieces`}</Link>
            )}
          </dd>
        </div>
        <div className="bk-hangtag-pair">
          <dt>Last market</dt>
          <dd>
            {view.lastMarket === null ? (
              'Not yet'
            ) : (
              <Link href={`/manage/markets/${view.lastMarket.id}?tab=after` as Route}>{`${dollars(view.lastMarket.profit)} home${view.lastMarket.hourly === null ? '' : `, ${cents(view.lastMarket.hourly)} an hour`}`}</Link>
            )}
          </dd>
          {view.lastMarket !== null && <dd className="bk-hangtag-math">{view.lastMarket.name}</dd>}
        </div>
        {view.bestMarket !== null && (
          <div className="bk-hangtag-pair">
            <dt className="bk-hangtag-total">Paid you best</dt>
            <dd className="bk-hangtag-total">
              <Link href={`/manage/markets/${view.bestMarket.id}?tab=after` as Route}>{`${cents(view.bestMarket.hourly)} an hour`}</Link>
            </dd>
            <dd className="bk-hangtag-math">{view.bestMarket.name}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}

/** Showcase's nudge, once she has a few pieces (the ladder, Alex 2026-10-24). */
export function ReadyToShow({ view, showcasePrice }: { view: FreeHome; showcasePrice: number }): React.ReactElement | null {
  if (view.products < PIECES_READY) return null;
  return (
    <section className="bk-next bk-ready" aria-labelledby="bk-ready">
      <h2 id="bk-ready" className="bk-band-title">
        Your pieces are ready to show
      </h2>
      <p className="bk-band-sub">{`Showcase puts them on a site of your own for $${showcasePrice} a month, with your gallery, your story and where to find you. Everything here comes with you.`}</p>
      <a className="bk-btn" href="https://makers.bohdiai.com" target="_blank" rel="noopener noreferrer">
        See the plans
      </a>
    </section>
  );
}

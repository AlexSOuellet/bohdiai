import Link from 'next/link';
import type { Route } from 'next';
import { cents, dollars } from '@/lib/tools/maths';
import { PIECES_READY, type FreeHome, type StepKey } from '@/lib/tools/free-home';

const STEP_WORDS: Readonly<Record<StepKey, { title: string; how: string }>> = {
  price: { title: 'Price your first piece', how: 'Work out what one costs you to make and what to charge, then save it as a product.' },
  pieces: { title: 'Add the rest of your pieces', how: `Do the same for what else you make. With ${PIECES_READY} or more, you’ll see which ones earn and which don’t.` },
  event: { title: 'Add your next market', how: 'The day, the market and the town, and what it costs to be there.' },
  after: { title: 'After the market, fill in Market day', how: 'What you sold and the hours you gave it, so you know if it paid.' },
};

/** Free's Home (Alex, 2026-10-24): the steps, the one to do next lit, then her numbers. */
export function FreeHomePanel({ view, showcasePrice }: { view: FreeHome; showcasePrice: number }): React.ReactElement {
  const allDone = view.next === null;
  return (
    <>
      {!allDone && (
        <section className="bk-section bk-steps" aria-labelledby="bk-steps">
          <h2 id="bk-steps" className="bk-section-title">
            Know your numbers
          </h2>
          <ol className="bk-steps-list">
            {view.steps.map((s) => {
              const words = STEP_WORDS[s.key];
              const now = view.next === s.key;
              return (
                <li key={s.key} className="bk-step" data-state={s.done ? 'done' : now ? 'now' : 'later'}>
                  <span className="bk-step-mark" aria-hidden="true" />
                  <span className="bk-step-text">
                    <strong>{words.title}</strong>
                    {s.done ? <span className="bk-note">Done</span> : <span className="bk-note">{words.how}</span>}
                  </span>
                  {now && (
                    <Link className="bk-btn bk-btn-small" href={s.href as Route}>
                      Start
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="bk-section bk-numbers" aria-labelledby="bk-numbers">
        <h2 id="bk-numbers" className="bk-section-title">
          Your numbers
        </h2>
        <ul className="bk-events-list">
          <li>
            {view.belowCost.length > 0 ? (
              <Link className="bk-events-row" data-today="true" href="/manage/products">
                <span className="bk-events-label">Priced too low</span>
                <span className="bk-events-text">
                  {view.belowCost.length === 1 ? (
                    <>
                      <strong>{view.belowCost[0]?.name}</strong> is priced below what it costs you to make.
                    </>
                  ) : (
                    <>
                      <strong>{view.belowCost.length} pieces</strong> are priced below what they cost you to make.
                    </>
                  )}
                </span>
              </Link>
            ) : (
              <Link className="bk-events-row" href="/manage/products">
                <span className="bk-events-label">Your pieces</span>
                <span className="bk-events-text">
                  {view.products === 0
                    ? 'No pieces yet. Price your first one in Cost to make.'
                    : view.noCosts > 0
                      ? `${view.noCosts} of your ${view.products} pieces have no costs worked out yet.`
                      : 'Every piece is priced above what it costs you.'}
                </span>
              </Link>
            )}
          </li>
          <li>
            {view.lastMarket === null ? (
              <Link className="bk-events-row" href="/manage/tools/market">
                <span className="bk-events-label">Last market</span>
                <span className="bk-events-text">Nothing filled in yet. After your next market, see what it paid you.</span>
              </Link>
            ) : (
              <Link className="bk-events-row" href={`/manage/markets/${view.lastMarket.id}?tab=after` as Route}>
                <span className="bk-events-label">Last market</span>
                <span className="bk-events-text">
                  <strong>{view.lastMarket.name}</strong>: you took home {dollars(view.lastMarket.profit)}
                  {view.lastMarket.hourly !== null && `, ${cents(view.lastMarket.hourly)} an hour`}.
                </span>
              </Link>
            )}
          </li>
          {view.bestMarket !== null && (
            <li>
              <Link className="bk-events-row" href={`/manage/markets/${view.bestMarket.id}?tab=after` as Route}>
                <span className="bk-events-label">Best market</span>
                <span className="bk-events-text">
                  <strong>{view.bestMarket.name}</strong> paid you the most: {cents(view.bestMarket.hourly)} an hour.
                </span>
              </Link>
            </li>
          )}
        </ul>
      </section>

      {view.products >= PIECES_READY && (
        <section className="bk-attention bk-next-plan" aria-labelledby="bk-next-plan">
          <h2 id="bk-next-plan" className="bk-section-title">
            Your pieces are ready to show
          </h2>
          <p className="bk-note">{`Showcase puts them on a site of your own for $${showcasePrice} a month, with your gallery, your story and where to find you. Everything here comes with you.`}</p>
          <a className="bk-btn" href="https://makers.bohdiai.com" target="_blank" rel="noopener noreferrer">
            See the plans
          </a>
        </section>
      )}
    </>
  );
}

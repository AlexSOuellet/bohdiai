import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { loadFreeHome, freeSteps, type FreeHome as FreeHomeView } from '@/lib/tools/free-home';
import { listProducts } from '@/lib/backend/catalog/queries';
import { homeWall, type HomeWall } from '@/lib/backend/home-wall';
import { planOf } from '@/lib/backend/plan/plan';
import { FirstSteps } from './FirstSteps';
import { WorkWall } from './WorkWall';
import { FreeNumbers, ReadyToShow } from './FreeHomePanel';

const WALL_MAX = 7;

function err(where: string, e: unknown): void {
  logger.error(where, { error: e instanceof Error ? e.message : String(e) });
}

const pieces = (n: number): string => (n === 1 ? 'One piece' : `${n} pieces`);

/** Free's Home (the ladder, Alex 2026-10-24; in the redesign, 2026-10-28). Free has
 *  no site, so the opening holds her numbers where the others show their site; then
 *  the steps to know her numbers, her work, and Showcase once she's ready. No events
 *  on Free (Alex, 2026-10-28). */
export async function FreeHome({ tenantId, name }: { tenantId: string; name: string }): Promise<React.ReactElement> {
  const own = await createSupabaseServerClient();
  const [view, wall] = await Promise.all([
    loadFreeHome(own, tenantId).catch((e: unknown): FreeHomeView | null => {
      err('backend free home failed', e);
      return null;
    }),
    listProducts(own, tenantId).then(
      (products): HomeWall => homeWall(products, false, WALL_MAX),
      (e: unknown): null => {
        err('backend home products failed', e);
        return null;
      },
    ),
  ]);
  const steps = view === null ? null : freeSteps(view);

  return (
    <>
      <header className="bk-hello">
        <div className="bk-hello-text">
          <p className="bk-hello-status">Know your numbers</p>
          <h1 className="bk-hello-name">{name}</h1>
          <div className="bk-hello-actions">
            <Link className="bk-btn" href="/manage/tools/cost">
              Price a piece
            </Link>
            <Link className="bk-btn bk-btn-quiet" href="/manage/tools/market">
              Is this market worth it?
            </Link>
          </div>
        </div>
        {view === null ? <p className="bk-window-empty">Your numbers couldn’t load. Refresh to try again.</p> : <FreeNumbers view={view} />}
      </header>

      <main id="main" className="bk-content bk-home">
        {steps !== null && <FirstSteps steps={steps} />}
        <WorkWall wall={wall} title="Your work" link="See all your products" {...(view === null ? {} : { sub: pieces(view.products) })} />
        {view !== null && <ReadyToShow view={view} showcasePrice={planOf('showcase').monthly} />}
      </main>
    </>
  );
}

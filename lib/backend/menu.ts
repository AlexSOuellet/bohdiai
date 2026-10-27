/** The backend menu for one site: the modules its features switch on, without the
 *  Scrolling line where the site's design shows none, and without Customers while
 *  her Customer accounts switch is off. The layout draws it; My site lists its own
 *  group's parts from it. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { BACKEND_MODULES, CUSTOMERS_PATH, navFor, withoutItem, type NavSection } from './modules';
import { customerAccountsOn } from './buyers/switch';
import { showsScrollingLine } from './site-kind';
import type { FeatureKey } from './features';

type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function backendMenu(tenantId: string, on: ReadonlySet<FeatureKey>): Promise<NavSection[]> {
  const db = await createSupabaseServerClient();
  const [line, customers] = await Promise.all([showsScrollingLine(db, tenantId), on.has('buyer_accounts') ? showsCustomers(db, tenantId) : false]);
  let nav = navFor(BACKEND_MODULES, on);
  if (!line) nav = withoutItem(nav, '/manage/marquee');
  if (!customers) nav = withoutItem(nav, CUSTOMERS_PATH);
  return nav;
}

/** If the switch can't be read, Customers stays on the menu (its own screen then says so). */
async function showsCustomers(db: Db, tenantId: string): Promise<boolean> {
  try {
    return await customerAccountsOn(db, tenantId);
  } catch (err) {
    logger.error('backend menu: customer accounts switch unreadable', { tenantId, error: err instanceof Error ? err.message : String(err) });
    return true;
  }
}

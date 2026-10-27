/** The backend menu for one site: the modules its features switch on, without the
 *  Scrolling line where the site's design shows none. The layout draws it; My site
 *  lists its own group's parts from it. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BACKEND_MODULES, navFor, withoutItem, type NavSection } from './modules';
import { showsScrollingLine } from './site-kind';
import type { FeatureKey } from './features';

export async function backendMenu(tenantId: string, on: ReadonlySet<FeatureKey>): Promise<NavSection[]> {
  const nav = navFor(BACKEND_MODULES, on);
  return (await showsScrollingLine(await createSupabaseServerClient(), tenantId)) ? nav : withoutItem(nav, '/manage/marquee');
}

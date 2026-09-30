/**
 * Who is signed in and which site they are acting on (spec §1). A person sees a
 * site's backend only through an active admin membership; the acting site comes
 * from a cookie set by the picker and is re-checked against their memberships on
 * every request — the browser never chooses a tenant id on its own authority.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth/session';
import { getUserShops, type ShopSummary } from '@/lib/auth/membership';

export const SITE_COOKIE = 'bohdi_site';

export function pickSite(shops: readonly ShopSummary[], cookieValue: string | null): ShopSummary | null {
  return shops.find((s) => s.tenantId === cookieValue) ?? shops[0] ?? null;
}

export type ActingSite = { user: User; site: ShopSummary; sites: ShopSummary[] };

/** The signed-in admin and their acting site; redirects to /signin, or to the
 *  no-site notice when they administer nothing. Call at the top of every
 *  backend page and every backend server action. */
export async function requireActingSite(): Promise<ActingSite> {
  const user = await requireUser();
  const sites = await getUserShops(user.id);
  const site = pickSite(sites, (await cookies()).get(SITE_COOKIE)?.value ?? null);
  if (site === null) redirect('/auth/error?reason=nosite');
  return { user, site, sites };
}

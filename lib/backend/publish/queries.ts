/**
 * Publish (Alex, 2026-10-16): a new site is built private, and its maker puts it
 * live from their backend. This reads whether the site is still private and makes
 * its "View my site" link. The link is made here, on the live site, with the live
 * site's own secret, so it always opens the draft.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { previewCode, previewLink, PREVIEW_PARAM } from '@/lib/storefront/draft-preview';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { FREE_PLAN } from '@/lib/backend/plan/plan';

/** A live site; a private one not yet published; or one its maker took offline (Session 119).
 *  Private and offline sites open only through their private link. */
export type PublishView = { draft: false; offline: false } | { draft: true; offline: false; previewUrl: string | null } | { draft: false; offline: true; previewUrl: string | null };

export async function getPublishView(db: SupabaseClient<Database>, tenantId: string, subdomain: string, secret: string | undefined): Promise<PublishView> {
  const { data, error } = await db.from('tenants').select('status').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s status: ${error.message}`);
  const status = data?.status;
  if (status !== 'draft' && status !== 'offline') return { draft: false, offline: false };
  const code = await previewCode(secret, subdomain);
  const previewUrl = code === null ? null : previewLink(subdomain, code);
  return status === 'draft' ? { draft: true, offline: false, previewUrl } : { draft: false, offline: true, previewUrl };
}

export type SiteOpen = {
  /** True while the site is private and can be published (Free has no site to publish). */
  canPublish: boolean;
  /** Where "Open my site" goes: the private link while it isn't live, so it opens. */
  openUrl: string;
};

/** For every screen that shows the site (Alex, Session 119: a publish link wherever
 *  the site is shown). The address follows the backend's own host, so it opens on
 *  the dev server as well as live. */
export async function getSiteOpen(db: SupabaseClient<Database>, tenantId: string, subdomain: string, secret: string | undefined, backendHost: string | null): Promise<SiteOpen> {
  const { data, error } = await db.from('tenants').select('status, plan').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s status: ${error.message}`);
  const site = { status: data?.status ?? null, plan: data?.plan ?? null };
  return { canPublish: canPublish(site), openUrl: await siteOpenUrl(site, subdomain, secret, backendHost) };
}

type SiteState = { status: string | null; plan: string | null };

const canPublish = (site: SiteState): boolean => site.status === 'draft' && site.plan !== FREE_PLAN;

/** Where a site opens, for a caller that already has its status and plan. */
export async function siteOpenUrl(site: SiteState, subdomain: string, secret: string | undefined, backendHost: string | null): Promise<string> {
  const origin = storefrontOrigin(subdomain, backendHost);
  // Private and offline sites open only through their private link.
  if (!canPublish(site) && site.status !== 'offline') return origin;
  const code = await previewCode(secret, subdomain);
  return code === null ? origin : `${origin}/?${PREVIEW_PARAM}=${code}`;
}

/**
 * Publish (Alex, 2026-10-16): a new site is built private, and its maker puts it
 * live from their backend. This reads whether the site is still private and makes
 * its "View my site" link. The link is made here, on the live site, with the live
 * site's own secret, so it always opens the draft.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { previewCode, previewLink } from '@/lib/storefront/draft-preview';

export type PublishView = { draft: false } | { draft: true; previewUrl: string | null };

export async function getPublishView(db: SupabaseClient<Database>, tenantId: string, subdomain: string, secret: string | undefined): Promise<PublishView> {
  const { data, error } = await db.from('tenants').select('status').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site’s status: ${error.message}`);
  if (data?.status !== 'draft') return { draft: false };
  const code = await previewCode(secret, subdomain);
  return { draft: true, previewUrl: code === null ? null : previewLink(subdomain, code) };
}

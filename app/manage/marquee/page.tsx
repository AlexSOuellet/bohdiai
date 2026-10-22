import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { showsScrollingLine } from '@/lib/backend/site-kind';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { MarqueeEditor } from './MarqueeEditor';

export const dynamic = 'force-dynamic';

export default async function MarqueePage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('profile')) notFound();
  const db = await createSupabaseServerClient();
  // A design with no scrolling line has no screen for it (Alex, 2026-10-22).
  if (!(await showsScrollingLine(db, site.tenantId))) notFound();
  const form = await getProfileForm(db, site.tenantId);
  return <MarqueeEditor initial={form.marqueePhrases} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}

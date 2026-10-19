import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { SocialsEditor } from './SocialsEditor';

export const dynamic = 'force-dynamic';

export default async function SocialsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('profile')) notFound();
  const form = await getProfileForm(await createSupabaseServerClient(), site.tenantId);
  return <SocialsEditor initial={{ facebookUrl: form.facebookUrl, instagramUrl: form.instagramUrl }} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}

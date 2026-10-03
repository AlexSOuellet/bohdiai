import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProfileEditor } from './ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ProfilePage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) notFound();
  const initial = await getProfileForm(await createSupabaseServerClient(), site.tenantId);
  return <ProfileEditor initial={initial} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}

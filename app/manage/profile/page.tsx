import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getPortraitUrl, getProfileForm } from '@/lib/backend/profile/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProfileEditor } from './ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ProfilePage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) notFound();
  const db = await createSupabaseServerClient();
  const [initial, portraitUrl] = await Promise.all([getProfileForm(db, site.tenantId), getPortraitUrl(db, site.tenantId)]);
  const about = { aboutTitle: initial.aboutTitle, bio: initial.bio, quote: initial.quote, quoteAttribution: initial.quoteAttribution };
  return <ProfileEditor initial={about} portraitUrl={portraitUrl} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}

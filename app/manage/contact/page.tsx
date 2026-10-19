import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ContactEditor } from './ContactEditor';

export const dynamic = 'force-dynamic';

export default async function ContactPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('profile')) notFound();
  const db = await createSupabaseServerClient();
  const [form, tenant] = await Promise.all([getProfileForm(db, site.tenantId), db.from('tenants').select('contact_email').eq('id', site.tenantId).maybeSingle()]);
  if (tenant.error !== null) throw new Error(`Could not load the contact email: ${tenant.error.message}`);
  return <ContactEditor initial={{ phone: form.phone, email: tenant.data?.contact_email ?? '' }} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}

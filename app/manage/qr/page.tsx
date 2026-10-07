import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { qrTargets } from '@/lib/backend/qr/qr';
import { QrMaker } from './QrMaker';

export const dynamic = 'force-dynamic';

export default async function QrPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('qr_codes')) notFound();
  const origin = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  let products: { slug: string; name: string }[] = [];
  if (on.has('catalog')) {
    const { data, error } = await (await createSupabaseServerClient())
      .from('listings')
      .select('slug, name')
      .eq('tenant_id', site.tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .in('listing_type', ['product', 'digital_product'])
      .order('name', { ascending: true });
    if (error !== null) throw new Error(`Could not load your products: ${error.message}`);
    products = data ?? [];
  }
  return <QrMaker targets={qrTargets(origin, { shop: on.has('catalog'), products })} subdomain={site.subdomain} />;
}

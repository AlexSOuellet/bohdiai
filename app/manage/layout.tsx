import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { BACKEND_MODULES, navFor } from '@/lib/backend/modules';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { Shell } from './_components/Shell';
import { plex } from './fonts';
import './backend.css';

export const metadata: Metadata = { title: 'Backend', robots: { index: false, follow: false } };

export default async function ManageLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const { user, site, sites } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  const siteUrl = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  return (
    <div className={`bk ${plex.variable}`}>
      <Shell
        siteName={site.businessName}
        siteUrl={siteUrl}
        email={user.email ?? ''}
        nav={navFor(BACKEND_MODULES, on)}
        sites={sites}
        currentTenantId={site.tenantId}
      >
        {children}
      </Shell>
    </div>
  );
}

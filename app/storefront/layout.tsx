import { headers } from 'next/headers';
import { storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantBusinessJsonLd } from '@/lib/storefront/seo';
import { sampleBannerFor } from '@/lib/storefront/sample-banner';
import { SampleBanner } from './_components/SampleBanner';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Identify the shop as ITSELF (LocalBusiness/Store) to search engines — replaces
  // the BohdiAI Organization schema that used to leak onto every page.
  const seoFacts = await storefrontSeoFacts();
  const businessJsonLd = seoFacts === null ? null : tenantBusinessJsonLd(seoFacts);
  // Sample sites carry a strip saying which plan they show, on every page.
  const banner = sampleBannerFor((await headers()).get('x-tenant-subdomain'));

  return (
    <>
      {businessJsonLd !== null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      )}
      {banner !== null && <SampleBanner banner={banner} />}
      {children}
    </>
  );
}

import { storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantBusinessJsonLd } from '@/lib/storefront/seo';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Identify the shop as ITSELF (LocalBusiness/Store) to search engines — replaces
  // the BohdiAI Organization schema that used to leak onto every page.
  const seoFacts = await storefrontSeoFacts();
  const businessJsonLd = seoFacts === null ? null : tenantBusinessJsonLd(seoFacts);

  return (
    <>
      {businessJsonLd !== null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      )}
      {children}
    </>
  );
}

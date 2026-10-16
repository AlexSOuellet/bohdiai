import { storefrontSeoFacts, storefrontShopWords } from '@/lib/storefront/metadata';
import { tenantBusinessJsonLd } from '@/lib/storefront/seo';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Identify the shop as ITSELF (LocalBusiness/Store) to search engines — replaces
  // the BohdiAI Organization schema that used to leak onto every page.
  const [seoFacts, words] = await Promise.all([storefrontSeoFacts(), storefrontShopWords()]);
  const businessJsonLd = seoFacts === null || words === null ? null : tenantBusinessJsonLd(seoFacts, words);

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

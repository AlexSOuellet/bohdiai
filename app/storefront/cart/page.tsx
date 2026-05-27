import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import { loadStorefrontChrome } from '../_components/storefront-chrome';

/**
 * Cart page stub. Renders an empty-cart state with nav + footer so the cart icon
 * in the nav has a real destination. Real cart functionality (line items,
 * quantities, checkout) ships with the commerce build.
 */
export default async function StorefrontCartPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const sectionsJson = JSON.stringify(sections);

  return (
    <>
      <NavSplit content={{ shopName, sections: sectionsJson }} />
      <main className="pt-32 pb-20 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4">
            Cart
          </p>
          <h1 className="font-s-heading text-4xl md:text-5xl text-s-text mb-5">
            Your cart is empty
          </h1>
          <p className="font-s-body text-lg text-s-text/70 leading-relaxed mb-10">
            Browse the shop and add a piece to get started.
          </p>
          <a
            href="/shop"
            className="inline-block px-8 py-3 bg-s-accent text-white font-s-body uppercase tracking-[0.15em] text-sm hover:opacity-90 transition-opacity"
          >
            Browse the Shop
          </a>
        </div>
      </main>
      <FooterClassic content={{ shopName, sections: sectionsJson }} />
    </>
  );
}

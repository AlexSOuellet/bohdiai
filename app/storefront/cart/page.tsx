import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderArchetypeShell } from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/cart', pageName: 'Cart', noindex: true });
}

/**
 * Cart page stub — the empty-cart state painted in the tenant's chrome so the
 * cart link in the nav has a real destination. Real cart functionality (line
 * items, quantities, checkout) ships with the commerce build.
 */
export default async function StorefrontCartPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const shell = await renderArchetypeShell(
    tenantId,
    <section className="ms-simple-page">
      <div className="ms-simple-inner">
        <span data-type="eyebrow" className="ms-simple-eyebrow">
          Cart
        </span>
        <h1 data-type="closeHead" className="ms-simple-head">
          Your cart is empty
        </h1>
        <p data-type="body" className="ms-simple-body">
          Browse the shop and add a piece to get started.
        </p>
        <a href="/shop" data-type="navLabel" className="ms-simple-cta">
          Browse the shop &rarr;
        </a>
      </div>
    </section>,
  );
  if (shell === null) notFound();
  return shell;
}

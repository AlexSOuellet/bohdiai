import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderArchetypeCart, renderArchetypeShell } from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { supabaseAdmin } from '@/lib/supabase';
import { CART_COOKIE, parseCart } from '@/lib/storefront/cart';
import { PROMO_COOKIE } from '@/lib/storefront/promotions';
import { loadCartView } from '@/lib/storefront/cart-view';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/cart', pageName: 'Cart', noindex: true });
}

/**
 * The cart. A design that paints its own cart (the boutique) gets the shopper's
 * pieces from the cart cookie, priced from the catalog. Every other shop keeps
 * the empty-cart stub painted in its chrome, so the cart link in its nav has a
 * real destination.
 */
export default async function StorefrontCartPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const jar = await cookies();
  const ids = parseCart(jar.get(CART_COOKIE)?.value);
  const code = jar.get(PROMO_COOKIE)?.value ?? null;
  const designed = await renderArchetypeCart(tenantId, () => loadCartView(supabaseAdmin(), tenantId, ids, code === null ? null : decodeURIComponent(code)));
  if (designed !== null) return designed;

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

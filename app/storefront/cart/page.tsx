import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderArchetypeCart, renderArchetypeShell } from '../_components/StorefrontPage';
import { loadShopWords, storefrontMetadata } from '@/lib/storefront/metadata';
import { supabaseAdmin } from '@/lib/supabase';
import { CART_COOKIE, parseCart } from '@/lib/storefront/cart';
import { PROMO_COOKIE } from '@/lib/storefront/promotions';
import { loadCartView } from '@/lib/storefront/cart-view';
import { squareReturn } from '@/lib/storefront/square-return';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/cart', titleSpot: 'cart', noindex: true });
}

/**
 * The cart. A design that paints its own cart (the boutique) gets the shopper's
 * pieces from the cart cookie, priced from the catalog. Every other shop keeps
 * the empty-cart stub, in the site's own words, painted in its chrome, so the cart link in its nav has a
 * real destination. Back from Square's checkout page (`?order=`), the cart says
 * what Square confirmed about that order, asked of Square by our server.
 */
export default async function StorefrontCartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const jar = await cookies();
  const ids = parseCart(jar.get(CART_COOKIE)?.value);
  const code = jar.get(PROMO_COOKIE)?.value ?? null;
  const back = (await searchParams)['order'];
  const designed = await renderArchetypeCart(tenantId, async () => {
    const [view, returned] = await Promise.all([
      loadCartView(supabaseAdmin(), tenantId, ids, code === null ? null : decodeURIComponent(code)),
      typeof back === 'string' ? squareReturn(supabaseAdmin(), tenantId, back) : Promise.resolve(null),
    ]);
    return returned === null ? view : { ...view, returned };
  });
  if (designed !== null) return designed;

  const words = (await loadShopWords(tenantId)).cart;
  const shell = await renderArchetypeShell(
    tenantId,
    <section className="ms-simple-page">
      <div className="ms-simple-inner">
        <span data-type="eyebrow" className="ms-simple-eyebrow">
          {words.eyebrow}
        </span>
        <h1 data-type="closeHead" className="ms-simple-head">
          {words.title}
        </h1>
        <p data-type="body" className="ms-simple-body">
          {words.body}
        </p>
        <a href="/shop" data-type="navLabel" className="ms-simple-cta">
          {words.cta}
        </a>
      </div>
    </section>,
  );
  if (shell === null) notFound();
  return shell;
}

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadStorefrontChromeBlocks } from '../_components/storefront-chrome';
import { renderArchetypeShell } from '../_components/StorefrontPage';

/**
 * Cart page stub. Renders an empty-cart state with the store's chrome so the cart
 * link in the nav has a real destination. Archetype tenants get it in their own
 * chrome; legacy tenants fall back below. Real cart functionality (line items,
 * quantities, checkout) ships with the commerce build.
 */
export default async function StorefrontCartPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  // Archetype tenants: the empty-cart state in Main Street chrome.
  const archetypeCart = await renderArchetypeShell(
    tenantId,
    <section style={{ padding: '120px 40px', textAlign: 'center' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <span data-type="eyebrow" style={{ color: 'var(--ms-accent)', display: 'block', marginBottom: 16, fontFamily: 'var(--ms-mono)', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 13 }}>
          Cart
        </span>
        <h1 data-type="closeHead" style={{ fontFamily: 'var(--ms-disp)', color: 'var(--ms-fg)', fontSize: 44, margin: '0 0 16px' }}>
          Your cart is empty
        </h1>
        <p data-type="body" style={{ color: 'var(--ms-fg-muted)', margin: '0 0 32px' }}>
          Browse the shop and add a piece to get started.
        </p>
        <a href="/shop" style={{ display: 'inline-block', background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '15px 28px', borderRadius: 2, fontFamily: 'var(--ms-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 13 }}>
          Browse the shop &rarr;
        </a>
      </div>
    </section>,
  );
  if (archetypeCart !== null) return archetypeCart;

  const { nav, footer } = await loadStorefrontChromeBlocks(tenantId);

  return (
    <>
      {nav}
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
      {footer}
    </>
  );
}

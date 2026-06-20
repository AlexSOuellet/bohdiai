import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadStorefrontChromeBlocks } from '../_components/storefront-chrome';
import { renderArchetypeShell } from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/collections', pageName: 'Collections' });
}

interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export default async function StorefrontCollectionsIndexPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  const { data: collectionsRaw } = await db
    .from('collections')
    .select('id, slug, name, description')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('position', { ascending: true });

  // 404 if the tenant has no collections — same pattern as /gallery + /subscriptions.
  if (collectionsRaw === null || collectionsRaw.length === 0) notFound();

  const items: Collection[] = collectionsRaw;

  // Archetype tenants: the collections index in Main Street chrome.
  const archetype = await renderArchetypeShell(
    tenantId,
    <section style={{ padding: '88px 40px 110px' }}>
      <div className="ms-wrap" style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{ color: 'var(--ms-accent)', display: 'block', marginBottom: 14, fontFamily: 'var(--ms-mono)', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 13 }}>Collections</span>
        <h1 style={{ fontFamily: 'var(--ms-disp)', color: 'var(--ms-fg)', fontSize: 44, margin: 0 }}>Browse by collection</h1>
      </div>
      <div className="ms-wrap ms-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {items.map((c) => (
          <a key={c.id} href={`/collections/${c.slug}`} style={{ display: 'block', padding: '32px', border: '1px solid var(--ms-rule)', borderRadius: 3, color: 'inherit' }}>
            <h2 style={{ fontFamily: 'var(--ms-disp)', color: 'var(--ms-fg)', fontSize: 26, margin: '0 0 10px' }}>{c.name}</h2>
            {c.description !== null && c.description !== '' && (
              <p style={{ color: 'var(--ms-fg-muted)', margin: '0 0 18px' }}>{c.description}</p>
            )}
            <span style={{ color: 'var(--ms-accent)', fontFamily: 'var(--ms-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>Explore &rarr;</span>
          </a>
        ))}
      </div>
    </section>,
  );
  if (archetype !== null) return archetype;

  const { nav, footer } = await loadStorefrontChromeBlocks(tenantId);

  return (
    <>
      {nav}
      <main className="bg-s-background">
        <section className="pt-28 pb-8 md:pt-32 md:pb-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4">
              Collections
            </p>
            <h1 className="font-s-heading text-4xl md:text-5xl lg:text-6xl text-s-text">
              Browse by collection
            </h1>
            <p className="mt-5 font-s-body text-lg text-s-text/70 leading-relaxed max-w-2xl mx-auto">
              Each grouping pulls together pieces that share a theme, a season, or a story.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-6">
            <ul className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((collection) => (
                <li key={collection.id}>
                  <a
                    href={`/collections/${collection.slug}`}
                    className="block group p-8 md:p-10 bg-s-surface border border-s-border hover:border-s-accent transition-colors h-full"
                  >
                    <h2 className="font-s-heading text-2xl md:text-3xl text-s-text mb-3 group-hover:text-s-accent transition-colors">
                      {collection.name}
                    </h2>
                    {collection.description !== null && collection.description !== '' && (
                      <p className="font-s-body text-s-text/70 leading-relaxed mb-6">
                        {collection.description}
                      </p>
                    )}
                    <span className="font-s-body text-xs uppercase tracking-[0.15em] text-s-accent border-b border-s-accent/40 pb-0.5 group-hover:border-s-text">
                      Explore →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      {footer}
    </>
  );
}

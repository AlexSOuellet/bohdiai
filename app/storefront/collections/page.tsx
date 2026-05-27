import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import { loadStorefrontChrome } from '../_components/storefront-chrome';

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
  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const sectionsJson = JSON.stringify(sections);

  return (
    <>
      <NavSplit content={{ shopName, sections: sectionsJson }} />
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
      <FooterClassic content={{ shopName, sections: sectionsJson }} />
    </>
  );
}

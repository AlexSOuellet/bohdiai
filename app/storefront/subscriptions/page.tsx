import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import NotifyForm from '../_components/NotifyForm';
import { loadStorefrontChrome } from '../_components/storefront-chrome';

interface Subscription {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  base_price_cents: number;
  subscription_interval: string | null;
  is_preview: boolean;
  metadata: { image_url?: string | null } | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalLabel(interval: string | null): string {
  if (interval === 'week') return '/wk';
  if (interval === 'quarter') return '/qtr';
  if (interval === 'year') return '/yr';
  return '/mo';
}

export default async function StorefrontSubscriptionsPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  const { data: subsRaw } = await db
    .from('listings')
    .select('id, slug, name, short_description, description, base_price_cents, subscription_interval, is_preview, metadata')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'subscription')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  // 404 if this tenant has no subscriptions — same pattern as /gallery.
  if (subsRaw === null || subsRaw.length === 0) notFound();

  const items: Subscription[] = subsRaw.map((s) => ({
    ...s,
    metadata: (s.metadata as { image_url?: string | null } | null) ?? null,
  }));

  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const navSections = JSON.stringify(sections);

  return (
    <>
      <NavSplit content={{ shopName, sections: navSections }} />
      <main className="bg-s-background">
        <section className="pt-28 pb-8 md:pt-32 md:pb-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4">
              Subscriptions
            </p>
            <h1 className="font-s-heading text-4xl md:text-5xl lg:text-6xl text-s-text">
              Coming soon
            </h1>
            <p className="mt-5 font-s-body text-lg text-s-text/70 leading-relaxed max-w-2xl mx-auto">
              Get on the list and we&apos;ll let you know the moment these subscriptions go live.
            </p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-4xl px-6">
            <ul className="grid gap-8 md:grid-cols-2">
              {items.map((sub) => (
                <li key={sub.id} className="sf-card overflow-hidden bg-s-surface">
                  <div className="relative aspect-[4/3] overflow-hidden bg-s-border">
                    {sub.metadata?.image_url != null ? (
                      <Image
                        src={sub.metadata.image_url}
                        alt={sub.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs font-s-body text-s-text/50">Photo coming soon</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-s-heading text-2xl text-s-text">{sub.name}</h2>
                      <span className="font-s-body text-sm text-s-text/60 whitespace-nowrap mt-1">
                        {formatPrice(sub.base_price_cents)}{intervalLabel(sub.subscription_interval)}
                      </span>
                    </div>
                    {sub.description !== null && (
                      <p className="font-s-body text-s-text/70 leading-relaxed text-sm mb-5">
                        {sub.description}
                      </p>
                    )}
                    <NotifyForm tenantId={tenantId} listingId={sub.id} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <FooterClassic
        content={{ shopName, sections: navSections }}
      />
    </>
  );
}

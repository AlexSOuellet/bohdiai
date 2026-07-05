import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NotifyForm from '../_components/NotifyForm';
import { renderArchetypeShell } from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/subscriptions', pageName: 'Subscriptions' });
}

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

  // 404 if this tenant has no subscriptions.
  if (subsRaw === null || subsRaw.length === 0) notFound();

  const items: Subscription[] = subsRaw.map((s) => ({
    ...s,
    metadata: (s.metadata as { image_url?: string | null } | null) ?? null,
  }));

  const shell = await renderArchetypeShell(
    tenantId,
    <section className="ms-subs-section">
      <div className="ms-wrap ms-subs-head">
        <span data-type="eyebrow" className="ms-subs-eyebrow">Subscriptions</span>
        <h1 data-type="closeHead" className="ms-subs-title">Join a subscription</h1>
      </div>
      <div className="ms-wrap ms-subs-grid">
        {items.map((sub) => (
          <div key={sub.id} className="ms-subs-card">
            <div className="ms-subs-media">
              {sub.metadata?.image_url != null && (
                <img src={sub.metadata.image_url} alt={sub.name} className="archetype-photo" />
              )}
            </div>
            <div className="ms-subs-body">
              <h2 data-type="title" className="ms-subs-name">{sub.name}</h2>
              <p data-type="price" className="ms-subs-price">
                {formatPrice(sub.base_price_cents)}<span className="ms-subs-interval">{intervalLabel(sub.subscription_interval)}</span>
              </p>
              {sub.short_description !== null && (
                <p data-type="body" className="ms-subs-desc">{sub.short_description}</p>
              )}
              {sub.is_preview ? <NotifyForm tenantId={tenantId} listingId={sub.id} /> : (
                <a href={`/listings/${sub.slug}`} data-type="navLabel" className="ms-subs-cue">View &rarr;</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>,
  );
  if (shell === null) notFound();
  return shell;
}

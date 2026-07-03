import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import StorefrontPage from '../../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) return {};
  const { data: collection } = await supabaseAdmin()
    .from('collections')
    .select('name, description')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  return storefrontMetadata({
    path: `/collections/${slug}`,
    pageName: collection?.name ?? 'Collection',
    ...(collection?.description ? { description: collection.description } : {}),
  });
}

export default async function StorefrontCollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  // Route through the archetype dispatch so the collection detail wears the
  // store's own goods treatment (harmonizes with /shop). Products get filtered
  // to this collection inside renderArchetypeStore.
  return <StorefrontPage slug={`/collections/${slug}`} />;
}

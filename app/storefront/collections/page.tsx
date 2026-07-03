import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/collections', pageName: 'Collections' });
}

export default async function StorefrontCollectionsIndexPage() {
  // Route through the archetype dispatch so the /collections page wears the
  // store's own collections treatment (representative of the home teaser).
  return <StorefrontPage slug="/collections" />;
}

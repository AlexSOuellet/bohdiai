import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/shop', pageName: 'Shop' });
}

export default async function StorefrontShopPage() {
  return <StorefrontPage slug="/shop" />;
}

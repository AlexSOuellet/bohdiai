import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/gallery', pageName: 'Gallery' });
}

export default async function StorefrontGalleryPage() {
  return <StorefrontPage slug="/gallery" />;
}

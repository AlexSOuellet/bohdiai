import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/contact', pageName: 'Contact' });
}

export default async function StorefrontContactPage() {
  return <StorefrontPage slug="/contact" />;
}

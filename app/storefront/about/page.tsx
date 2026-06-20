import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/about', pageName: 'About' });
}

export default async function StorefrontAboutPage() {
  return <StorefrontPage slug="/about" />;
}

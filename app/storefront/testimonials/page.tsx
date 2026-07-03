import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/testimonials', pageName: 'Testimonials' });
}

export default async function StorefrontTestimonialsPage() {
  // Route through the archetype dispatch so /testimonials wears the store's own
  // reviews treatment (representative of the home teaser).
  return <StorefrontPage slug="/testimonials" />;
}

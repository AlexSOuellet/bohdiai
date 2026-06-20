import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/events', pageName: 'Events' });
}

export default async function StorefrontEventsPage() {
  return <StorefrontPage slug="/events" />;
}

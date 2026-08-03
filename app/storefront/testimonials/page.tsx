import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { previewPropsFrom, type PreviewSearchParams } from '../_components/preview-params';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/testimonials', pageName: 'Testimonials' });
}

export default async function StorefrontTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<PreviewSearchParams>;
}) {
  const sp = await searchParams;
  // Route through the archetype dispatch so /testimonials wears the store's own
  // reviews treatment (representative of the home teaser).
  return <StorefrontPage slug="/testimonials" {...previewPropsFrom(sp)} />;
}

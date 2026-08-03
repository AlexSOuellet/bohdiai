import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { previewPropsFrom, type PreviewSearchParams } from '../_components/preview-params';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/contact', pageName: 'Contact' });
}

export default async function StorefrontContactPage({ searchParams }: { searchParams: Promise<PreviewSearchParams> }) {
  const sp = await searchParams;
  return <StorefrontPage slug="/contact" {...previewPropsFrom(sp)} />;
}

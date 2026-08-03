import type { Metadata } from 'next';
import StorefrontPage from '../_components/StorefrontPage';
import { previewPropsFrom, type PreviewSearchParams } from '../_components/preview-params';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/shop', pageName: 'Shop' });
}

export default async function StorefrontShopPage({ searchParams }: { searchParams: Promise<PreviewSearchParams> }) {
  const sp = await searchParams;
  return <StorefrontPage slug="/shop" {...previewPropsFrom(sp)} />;
}

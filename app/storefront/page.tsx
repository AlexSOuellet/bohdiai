import type { Metadata } from 'next';
import StorefrontPage from './_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/' });
}

export default async function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; previewLook?: string; hero?: string; goods?: string; about?: string; nav?: string }>;
}) {
  const sp = await searchParams;
  return <StorefrontPage slug="/" version={sp.v} previewLook={sp.previewLook} previewHero={sp.hero} previewGoods={sp.goods} previewFounder={sp.about} previewNav={sp.nav} />;
}

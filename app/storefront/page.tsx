import type { Metadata } from 'next';
import StorefrontPage from './_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/' });
}

export default async function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ previewToken?: string; previewStill?: string; previewLook?: string; previewMood?: string; previewTexture?: string; previewTextureOpacity?: string; previewSection?: string; hero?: string; goods?: string; about?: string; nav?: string; collections?: string; reviews?: string; findus?: string }>;
}) {
  const sp = await searchParams;
  const opacity = sp.previewTextureOpacity !== undefined ? Number.parseFloat(sp.previewTextureOpacity) : undefined;
  return <StorefrontPage slug="/" previewToken={sp.previewToken} previewStill={sp.previewStill === '1'} previewLook={sp.previewLook} previewMood={sp.previewMood} previewTexture={sp.previewTexture} previewTextureOpacity={opacity} previewSection={sp.previewSection} previewHero={sp.hero} previewGoods={sp.goods} previewFounder={sp.about} previewNav={sp.nav} previewCollections={sp.collections} previewReviews={sp.reviews} previewFindUs={sp.findus} />;
}

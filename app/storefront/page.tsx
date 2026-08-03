import type { Metadata } from 'next';
import StorefrontPage from './_components/StorefrontPage';
import { previewPropsFrom, type PreviewSearchParams } from './_components/preview-params';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/' });
}

/** The home route also carries the home-only spotlight + per-section preview overrides
 *  (previewSection + hero/goods/about/nav/…), which no sub-page needs. The draft/look
 *  params it shares with every route come from previewPropsFrom. */
export default async function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<
    PreviewSearchParams & {
      previewSection?: string;
      hero?: string;
      goods?: string;
      about?: string;
      nav?: string;
      collections?: string;
      reviews?: string;
      findus?: string;
    }
  >;
}) {
  const sp = await searchParams;
  return (
    <StorefrontPage
      slug="/"
      {...previewPropsFrom(sp)}
      previewSection={sp.previewSection}
      previewHero={sp.hero}
      previewGoods={sp.goods}
      previewFounder={sp.about}
      previewNav={sp.nav}
      previewCollections={sp.collections}
      previewReviews={sp.reviews}
      previewFindUs={sp.findus}
    />
  );
}

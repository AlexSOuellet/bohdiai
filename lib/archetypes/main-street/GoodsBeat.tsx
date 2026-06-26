/**
 * GOODS — the beat dispatcher.
 *
 * The goods beat has five bodies (marquee / procession / switcher / slideshow /
 * module). Which one renders is BOHDI's choice, authored as goods.treatment. This
 * component reads that (or an explicit override for previews), and falls back to
 * the legacy size-based pick only for content authored before the field existed.
 * Every body ends with a prominent "see the full catalog" CTA — the home is a
 * SAMPLING, the full catalog lives on the Products page. The marquee, switcher,
 * and slideshow arrive as a whole on a single scroll-reveal; the procession and
 * the module reveal their pieces one at a time, so they skip the outer wrapper.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { selectGoodsTreatment, sampleForTreatment, type GoodsTreatment } from './goods';
import { GoodsMarquee, GoodsViewAllCta, type GoodsViewAll } from './beats';
import { GoodsProcession } from './GoodsProcession';
import { GoodsModule } from './GoodsModule';
import { GoodsCarousel } from './GoodsCarousel';
import { GoodsSwitcher } from './GoodsSwitcher';
import { GoodsSlideshow } from './GoodsSlideshow';
import { Reveal } from './Reveal';

/** Neutral fallback when the maker hasn't authored a view-all cue. */
const DEFAULT_VIEW_ALL = 'See the full catalog';

export function GoodsBeat({
  goods,
  products,
  skin,
  treatment,
  catalogSize,
  shopHref = '/shop',
}: {
  goods: MainStreetContent['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  /** Force a treatment (previews/tests). When omitted it is selected. */
  treatment?: GoodsTreatment | undefined;
  /** The maker's TRUE catalog size. Treatment is chosen from this, even though
   *  the home shows only a sampling. Falls back to the shown count. */
  catalogSize?: number | undefined;
  /** Where the "see the full catalog" cue points — the Products page. */
  shopHref?: string | undefined;
}) {
  // Bohdi's authored treatment wins; an explicit prop overrides it (previews);
  // the size-based pick is only a fallback for pre-treatment content. The home
  // then shows only a SAMPLING (Main Street is a sales page, not a catalog).
  const chosen = treatment ?? goods.treatment ?? selectGoodsTreatment(catalogSize ?? products.length);
  const sample = sampleForTreatment(products, chosen);
  const viewAll: GoodsViewAll = { href: shopHref, label: goods.viewAllLabel ?? DEFAULT_VIEW_ALL };
  const cta = <GoodsViewAllCta viewAll={viewAll} skin={skin} />;

  if (chosen === 'procession') {
    return (
      <>
        <GoodsProcession goods={goods} products={sample} skin={skin} viewAll={viewAll} />
        {cta}
      </>
    );
  }

  // The module runs its own scroll-in staggered reveal (like the procession), so
  // it skips the outer one-shot Reveal wrapper.
  if (chosen === 'module') {
    return (
      <>
        <GoodsModule goods={goods} products={sample} skin={skin} viewAll={viewAll} />
        {cta}
      </>
    );
  }

  const body =
    chosen === 'switcher' ? (
      <GoodsSwitcher goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    ) : chosen === 'slideshow' ? (
      <GoodsSlideshow goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    ) : chosen === 'carousel' ? (
      <GoodsCarousel goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    ) : (
      <GoodsMarquee goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    );

  return (
    <>
      <Reveal>{body}</Reveal>
      {cta}
    </>
  );
}

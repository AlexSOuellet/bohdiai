/**
 * GOODS — the beat dispatcher.
 *
 * The goods beat has four bodies (marquee / procession / switcher / slideshow).
 * Which one renders is SELECTED from catalog size + mood — never authored, never
 * a maker choice. This component resolves the treatment (or takes an explicit
 * one for previews) and renders it. The marquee, switcher, and slideshow arrive
 * as a whole on a single scroll-reveal; the procession reveals its rows one at a
 * time, so it skips the outer wrapper.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { selectGoodsTreatment, sampleForTreatment, type GoodsTreatment } from './goods';
import { GoodsMarquee, type GoodsViewAll } from './beats';
import { GoodsProcession } from './GoodsProcession';
import { GoodsSwitcher } from './GoodsSwitcher';
import { GoodsSlideshow } from './GoodsSlideshow';
import { Reveal } from './Reveal';

/** Neutral fallback when the maker hasn't authored a view-all cue. */
const DEFAULT_VIEW_ALL = 'See the full catalog';

export function GoodsBeat({
  goods,
  products,
  skin,
  mood,
  treatment,
  shopHref = '/shop',
}: {
  goods: MainStreetContent['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  /** Mood lean — only breaks the small-catalog tie. Optional. */
  mood?: string | undefined;
  /** Force a treatment (previews/tests). When omitted it is selected. */
  treatment?: GoodsTreatment | undefined;
  /** Where the "see the full catalog" cue points — the Products page. */
  shopHref?: string | undefined;
}) {
  // Selection runs off the TRUE catalog size; the home page then shows only a
  // SAMPLING (Main Street is a sales page, not a catalog).
  const chosen = treatment ?? selectGoodsTreatment(products.length, mood);
  const sample = sampleForTreatment(products, chosen);
  const viewAll: GoodsViewAll = { href: shopHref, label: goods.viewAllLabel ?? DEFAULT_VIEW_ALL };

  if (chosen === 'procession') {
    return <GoodsProcession goods={goods} products={sample} skin={skin} viewAll={viewAll} />;
  }

  const body =
    chosen === 'switcher' ? (
      <GoodsSwitcher goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    ) : chosen === 'slideshow' ? (
      <GoodsSlideshow goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    ) : (
      <GoodsMarquee goods={goods} products={sample} skin={skin} viewAll={viewAll} />
    );

  return <Reveal>{body}</Reveal>;
}

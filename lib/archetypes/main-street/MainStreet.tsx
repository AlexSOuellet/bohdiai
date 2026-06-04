/**
 * Main Street — the four-beat sales page.
 *
 * One fixed composition (no arrangement dispatch): the MOMENT is the hero, then
 * GOODS in motion, the FOUNDER + a find-us calendar, and the CLOSE. Surfaces
 * alternate via the skin's two panels. Every color/font is the skin; structure
 * is the archetype's. Catalog rows are passed in — the archetype never authors
 * the catalog.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter } from './chrome';
import { MomentHero } from './MomentHero';
import { Close } from './beats';
import { GoodsBeat } from './GoodsBeat';
import { FounderBeat } from './FounderBeat';
import type { GoodsTreatment } from './goods';
import type { FounderTreatment } from './founder';
import { Reveal } from './Reveal';

export interface MainStreetProps {
  content: MainStreetContent;
  skin: ArchetypeTheme;
  products: ProductView[];
  /** Mood lean — feeds goods-treatment selection. Optional. */
  mood?: string | undefined;
  /** The maker's TRUE catalog size — drives goods-treatment selection even though
   *  the home shows only a sampling. Falls back to the shown product count. */
  catalogSize?: number | undefined;
  /** Force the goods treatment (previews/tests). Selected from catalog size when omitted. */
  goodsTreatment?: GoodsTreatment | undefined;
  /** Force the founder treatment (previews/tests). Selected from cadence + mood when omitted. */
  founderTreatment?: FounderTreatment | undefined;
  /** Where the goods "see the full catalog" cue points. Defaults to /shop. */
  shopHref?: string | undefined;
  /** Where the founder "about" cue points. Defaults to /about. */
  aboutHref?: string | undefined;
  /** Where the calendar's events cue points. Defaults to /events. */
  eventsHref?: string | undefined;
}

export function MainStreet({ content, skin, products, mood, catalogSize, goodsTreatment, founderTreatment, shopHref, aboutHref, eventsHref }: MainStreetProps) {
  return (
    <MainStreetRoot skin={skin}>
      <MomentHero identity={content.identity} moment={content.moment} skin={skin} />
      <GoodsBeat goods={content.goods} products={products} skin={skin} mood={mood} treatment={goodsTreatment} catalogSize={catalogSize} shopHref={shopHref} />
      <Reveal>
        <FounderBeat founder={content.founder} skin={skin} mood={mood} treatment={founderTreatment} aboutHref={aboutHref} eventsHref={eventsHref} />
      </Reveal>
      <Reveal>
        <Close close={content.close} skin={skin} />
      </Reveal>
      <MainStreetFooter shopName={content.shopName} skin={skin} />
    </MainStreetRoot>
  );
}

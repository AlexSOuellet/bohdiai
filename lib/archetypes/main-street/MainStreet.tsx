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
import { GoodsMarquee, FounderCalendar, Close } from './beats';
import { Reveal } from './Reveal';

export interface MainStreetProps {
  content: MainStreetContent;
  skin: ArchetypeTheme;
  products: ProductView[];
}

export function MainStreet({ content, skin, products }: MainStreetProps) {
  return (
    <MainStreetRoot skin={skin}>
      <MomentHero identity={content.identity} moment={content.moment} skin={skin} />
      <Reveal>
        <GoodsMarquee goods={content.goods} products={products} skin={skin} />
      </Reveal>
      <Reveal>
        <FounderCalendar founder={content.founder} skin={skin} />
      </Reveal>
      <Reveal>
        <Close close={content.close} skin={skin} />
      </Reveal>
      <MainStreetFooter shopName={content.shopName} skin={skin} />
    </MainStreetRoot>
  );
}

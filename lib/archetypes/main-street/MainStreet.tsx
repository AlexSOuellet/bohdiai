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
import { resolveHero } from './hero-catalog';
import { Close } from './beats';
import { GoodsBeat } from './GoodsBeat';
import { CollectionsBeat } from './CollectionsBeat';
import { FounderBeat } from './FounderBeat';
import { FindUsBeat } from './FindUsBeat';
import type { GoodsTreatment } from './goods';
import type { CollectionView, CollectionsTreatment } from './collections';
import type { FounderTreatment } from './founder';
import { Reveal } from './Reveal';

export interface MainStreetProps {
  content: MainStreetContent;
  skin: ArchetypeTheme;
  products: ProductView[];
  /** The maker's TRUE catalog size — drives the goods-treatment fallback even
   *  though the home shows only a sampling. Falls back to the shown product count. */
  catalogSize?: number | undefined;
  /** Force the goods treatment (previews/tests). Falls back to catalog size when omitted. */
  goodsTreatment?: GoodsTreatment | undefined;
  /** The shop's collections (loaded from the `collections` table, not authored).
   *  When present the Collections band renders — structure derived from what the
   *  store HAS, not an editorial pick. Empty/absent → no Collections beat. */
  collections?: CollectionView[] | undefined;
  /** Force the collections treatment (the ?collections= preview / tests). Falls
   *  back to the authored/default band when omitted. */
  collectionsTreatment?: CollectionsTreatment | undefined;
  /** Where the collections "see all" cue points. Defaults to /collections. */
  collectionsHref?: string | undefined;
  /** Force the founder treatment (previews/tests). Falls back to the quote when omitted. */
  founderTreatment?: FounderTreatment | undefined;
  /** Where the goods "see the full catalog" cue points. Defaults to /shop. */
  shopHref?: string | undefined;
  /** Where the founder "about" cue points. Defaults to /about. */
  aboutHref?: string | undefined;
  /** Where the calendar's events cue points. Defaults to /events. */
  eventsHref?: string | undefined;
  /** Per-shop key (tenant id) for the Moment's seen-cookie. Without it the
   *  hero plays no timeline and renders directly at rest — used in previews. */
  momentKey?: string | undefined;
  /** Which hero variant the recipe names (resolved through the hero catalog).
   *  Defaults to the Story hero — today's Main Street front door — so existing
   *  builds render unchanged. */
  heroVariant?: string | undefined;
}

export function MainStreet({ content, skin, products, catalogSize, goodsTreatment, collections, collectionsTreatment, collectionsHref, founderTreatment, shopHref, aboutHref, eventsHref, momentKey, heroVariant }: MainStreetProps) {
  // The Collections band appears whenever the shop HAS collections — the structure
  // follows what the store holds, not an editorial pick. The heading is the
  // authored section when present, a plain default otherwise.
  const collectionsSection = content.collections ?? { title: 'Collections' };
  return (
    <MainStreetRoot skin={skin}>
      {resolveHero(heroVariant)({ identity: content.identity, moment: content.moment, skin, momentKey })}
      <GoodsBeat goods={content.goods} products={products} skin={skin} treatment={goodsTreatment} catalogSize={catalogSize} shopHref={shopHref} />
      {collections && collections.length > 0 && (
        <Reveal>
          <CollectionsBeat
            section={collectionsSection}
            items={collections}
            skin={skin}
            treatment={collectionsTreatment}
            viewAll={{ href: collectionsHref ?? '/collections', label: collectionsSection.viewAllLabel ?? 'See all collections' }}
          />
        </Reveal>
      )}
      <Reveal>
        <FounderBeat founder={content.founder} skin={skin} treatment={founderTreatment} aboutHref={aboutHref} aboutPage={content.about} />
      </Reveal>
      {content.founder.findUs && content.founder.findUs.rows.length > 0 && (
        <Reveal>
          <FindUsBeat findUs={content.founder.findUs} skin={skin} eventsHref={eventsHref} />
        </Reveal>
      )}
      <Reveal>
        <Close close={content.close} skin={skin} />
      </Reveal>
      <MainStreetFooter shopName={content.shopName} />
    </MainStreetRoot>
  );
}

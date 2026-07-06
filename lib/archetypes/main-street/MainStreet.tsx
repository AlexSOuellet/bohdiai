/**
 * Main Street — the family-composed sales page.
 *
 * The composition is a WALK of the family's sectionStack — the order and on/off
 * state of each section are the FAMILY's call, not fixed here. Hero is always
 * first, Close always last, and every family ships with every content section
 * ON at onboarding (Contact is the only always-off, and only because its
 * home block isn't built yet). Surfaces alternate via the skin; every color and
 * font is the skin. Catalog rows are passed in — the archetype never authors
 * the catalog.
 */
import { Fragment } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter } from './chrome';
import { resolveHero } from './hero-catalog';
import { Close } from './beats';
import { GoodsBeat } from './GoodsBeat';
import { MarqueeBeat } from './MarqueeBeat';
import { buildMarqueeLines } from './marquee';
import { CollectionsBeat } from './CollectionsBeat';
import { ReviewsBeat } from './ReviewsBeat';
import { FounderBeat } from './FounderBeat';
import { FindUsBeat } from './FindUsBeat';
import type { GoodsTreatment } from './goods';
import type { CollectionView, CollectionsTreatment } from './collections';
import type { ReviewsTreatment } from './reviews';
import type { FindUsTreatment } from './findus';
import type { FounderTreatment } from './founder';
import { Reveal } from './Reveal';
import { FAMILIES, type FamilySectionStackEntry, type SectionKey } from './families';

export interface MainStreetProps {
  content: MainStreetContent;
  skin: ArchetypeTheme;
  products: ProductView[];
  /** The family's section stack — the order + on/off state for every section
   *  on the home page. Walked in order; on-entries render, off-entries skip.
   *  Optional — omitted callers fall back to the Cozy default (every section on)
   *  for backward compat, but real callers (the builder) always pass the family's
   *  own stack. */
  sectionStack?: readonly FamilySectionStackEntry[] | undefined;
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
  /** Where the reviews "see all" cue points. Defaults to /testimonials. */
  testimonialsHref?: string | undefined;
  /** Per-shop key (tenant id) for the Moment's seen-cookie. Without it the
   *  hero plays no timeline and renders directly at rest — used in previews. */
  momentKey?: string | undefined;
  /** Which hero variant the recipe names (resolved through the hero catalog).
   *  Defaults to the Story hero — today's Main Street front door — so existing
   *  builds render unchanged. */
  heroVariant?: string | undefined;
  /** Force the reviews treatment (the ?reviews= preview / tests). Falls back to the
   *  authored treatment, then the documented default. The testimonials themselves
   *  live in content.reviews (authored) — the beat renders only when it has items. */
  reviewsTreatment?: ReviewsTreatment | undefined;
  /** Force the find-us treatment (the ?findus= preview / tests). Falls back to the
   *  authored treatment, then the documented default. The dates themselves live in
   *  content.founder.findUs (authored); the beat renders only when it has rows. */
  findUsTreatment?: FindUsTreatment | undefined;
}

export function MainStreet({ content, skin, products, sectionStack, catalogSize, goodsTreatment, collections, collectionsTreatment, collectionsHref, founderTreatment, shopHref, aboutHref, eventsHref, testimonialsHref, momentKey, heroVariant, reviewsTreatment, findUsTreatment }: MainStreetProps) {
  const stack = sectionStack ?? FAMILIES.cozy.sectionStack;

  // The Collections band appears when BOTH the shop has collection rows AND the
  // copywriter authored the section (heading + treatment). No defensive fallback —
  // if the copywriter didn't author it, the band doesn't render (rule: no hardcoding).
  const collectionsSection = content.collections;
  // The reviews home band takes its "see all" cue from the authored label — no
  // hardcoded English fallback. Missing label → no cue rendered.
  const reviewsViewAll = content.reviews?.viewAllLabel
    ? { href: testimonialsHref ?? '/testimonials', label: content.reviews.viewAllLabel }
    : undefined;
  // The marquee band's content is assembled from THIS store's own copy + data
  // (never hardcoded, never injected). Every family ships marquee-on by default;
  // its POSITION in the stack varies per family (up top for Cheerful/Rustic, as
  // a divider for Modern, near the bottom for Cozy).
  const marqueeLines = buildMarqueeLines(content, collections);

  // Section renderers keyed by SectionKey. Each returns null if there's no data
  // to show (a family may have Reviews on, but if the store has none authored
  // yet the section stays hidden). Hero and Close are always rendered from the
  // stack in their fixed positions; Contact returns null everywhere because the
  // home block isn't built yet.
  const renderers: Record<SectionKey, () => React.ReactNode | null> = {
    hero: () => resolveHero(heroVariant)({ identity: content.identity, moment: content.moment, skin, momentKey }),
    founder: () => (
      <Reveal>
        <FounderBeat founder={content.founder} skin={skin} treatment={founderTreatment} aboutHref={aboutHref} aboutPage={content.about} />
      </Reveal>
    ),
    goods: () => (
      <GoodsBeat goods={content.goods} products={products} skin={skin} treatment={goodsTreatment} catalogSize={catalogSize} shopHref={shopHref} />
    ),
    collections: () => (collectionsSection && collections && collections.length > 0
      ? (
        <Reveal>
          <CollectionsBeat
            section={collectionsSection}
            items={collections}
            skin={skin}
            treatment={collectionsTreatment}
            viewAll={collectionsSection.viewAllLabel ? { href: collectionsHref ?? '/collections', label: collectionsSection.viewAllLabel } : undefined}
          />
        </Reveal>
      )
      : null),
    reviews: () => (content.reviews && content.reviews.items.length > 0
      ? (
        <Reveal>
          <ReviewsBeat section={content.reviews} skin={skin} treatment={reviewsTreatment} viewAll={reviewsViewAll} />
        </Reveal>
      )
      : null),
    findUs: () => (content.founder.findUs && content.founder.findUs.rows.length > 0
      ? (
        <Reveal>
          <FindUsBeat findUs={content.founder.findUs} skin={skin} treatment={findUsTreatment} eventsHref={eventsHref} />
        </Reveal>
      )
      : null),
    marquee: () => (marqueeLines.voice.length > 0 || marqueeLines.info.length > 0
      ? <MarqueeBeat lines={marqueeLines} skin={skin} />
      : null),
    contact: () => null,
    close: () => (
      <Reveal>
        <Close close={content.close} skin={skin} />
      </Reveal>
    ),
  };

  // Hero renders OUTSIDE <main> (its media/story treatment owns the front
  // frame). Everything else in the stack renders inside <main> in the order
  // the family declares.
  const heroEntry = stack.find((e) => e.section === 'hero');
  const bodyEntries = stack.filter((e) => e.section !== 'hero' && e.on);

  return (
    <MainStreetRoot skin={skin}>
      {heroEntry?.on ? renderers.hero() : null}
      <main>
        {bodyEntries.map((entry, i) => (
          <Fragment key={`${entry.section}-${i}`}>{renderers[entry.section]()}</Fragment>
        ))}
      </main>
      <MainStreetFooter shopName={content.shopName} />
    </MainStreetRoot>
  );
}

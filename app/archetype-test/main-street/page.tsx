/**
 * Archetype test route — renders Main Street with fixture content.
 *
 * PREVIEW-ONLY stand-ins: media slots hold PROMPTS, not generated assets, and
 * the goods read catalog rows that don't exist yet. To judge the composition
 * before spending on real assets, this route injects the demo bread video into
 * the hero and supplies stand-in products. This scaffolding lives in the route
 * ONLY — the archetype renderer never sees a stand-in and stays free of
 * hardcoded specifics.
 */
import { MainStreet, type MainStreetContent } from '@/lib/archetypes/main-street';
import { mainStreetArchetype, MAIN_STREET_SKINS } from '@/lib/archetypes/main-street';
import type { GoodsTreatment } from '@/lib/archetypes/main-street/goods';
import type { FounderTreatment } from '@/lib/archetypes/main-street/founder';
import juneFixture from '../main-street-fixture.june.json';
import bohdiFixture from '../main-street-fixture.bohdi.json';
import { PREVIEW_PRODUCTS } from './preview-products';

interface Fixture {
  content: MainStreetContent;
  skinKey: string;
}

const HERO_VIDEO = '/bread-kling.mp4';
const PORTRAIT = '/storefronts/seeded.webp';
const SHOP_HREF = '/archetype-test/main-street/shop';
const ABOUT_HREF = '/archetype-test/main-street/about';
const EVENTS_HREF = '/archetype-test/main-street/events';
const GOODS_TREATMENTS: GoodsTreatment[] = ['marquee', 'procession', 'switcher', 'slideshow'];
const FOUNDER_TREATMENTS: FounderTreatment[] = ['quote', 'portrait', 'letter', 'card'];

/** Inject the hero video + the founder portrait. Preview only. */
function withStandIns(content: MainStreetContent): MainStreetContent {
  return {
    ...content,
    moment: { ...content.moment, media: { ...content.moment.media, url: content.moment.media.url ?? HERO_VIDEO } },
    founder: { ...content.founder, photo: { ...content.founder.photo, url: content.founder.photo.url ?? PORTRAIT } },
  };
}

export default async function MainStreetTestPage({
  searchParams,
}: {
  searchParams: Promise<{ skin?: string; src?: string; goods?: string; founder?: string }>;
}) {
  const sp = await searchParams;
  // ?src=bohdi renders the HARNESS-AUTHORED fixture (the reproduction proof) with
  // NO hand-picked stand-in assets — placeholders show where Bohdi-prompted
  // generation / stock would fill in. The june fixture keeps its demo stand-ins
  // so the home preview reads true.
  const isBohdi = sp.src === 'bohdi';
  const f = (isBohdi ? bohdiFixture : juneFixture) as unknown as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  const content = isBohdi ? f.content : withStandIns(f.content);
  const products = isBohdi ? [] : PREVIEW_PRODUCTS;
  // ?goods=marquee|procession|switcher|slideshow forces a treatment for preview;
  // omitted, the system selects from catalog size.
  const goodsTreatment = GOODS_TREATMENTS.find((t) => t === sp.goods);
  const founderTreatment = FOUNDER_TREATMENTS.find((t) => t === sp.founder);
  return (
    <MainStreet
      content={content}
      skin={skin}
      products={products}
      goodsTreatment={goodsTreatment}
      founderTreatment={founderTreatment}
      shopHref={SHOP_HREF}
      aboutHref={ABOUT_HREF}
      eventsHref={EVENTS_HREF}
    />
  );
}

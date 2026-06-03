/**
 * Archetype test route — renders the Main Street archetype with hand-authored
 * (or Bohdi-authored) content from the fixture.
 *
 * PREVIEW-ONLY stand-ins: photo slots store PROMPTS, not generated images, and
 * the featured selection reads catalog rows that don't exist yet. To judge
 * composition before spending on real assets, this route fills empty photo
 * slots and supplies stand-in featured products with deterministic stock
 * photos. This scaffolding lives in the route ONLY — the archetype renderer
 * never sees a stand-in and stays free of hardcoded specifics.
 *
 * Flip `arrangement` in the fixture (classic / goods-first / story-led) and
 * `themeKey` (main-street-paper / -amber / -field / -cobalt) to review the family.
 */
import { MainStreet, type MainStreetContent, type ProductView } from '@/lib/archetypes/main-street';
import { mainStreetArchetype, MAIN_STREET_THEMES } from '@/lib/archetypes/main-street';
import fixture from '../main-street-fixture.june.json';

interface Fixture {
  content: MainStreetContent;
  themeKey: string;
  arrangement: string;
}

// Preview-only stand-ins point at the real demo bread assets so the live route
// reads true; the archetype itself never sees these — they're injected here.
const COUNTRY = '/storefronts/country.webp';
const SEEDED = '/storefronts/seeded.webp';
const CINNAMON = '/storefronts/cinnamon.webp';

/** Fill the hero + maker photo slots with stand-ins. Preview only. */
function withStandIns(content: MainStreetContent): MainStreetContent {
  return {
    ...content,
    hero: { ...content.hero, photo: { ...content.hero.photo, url: content.hero.photo.url ?? COUNTRY } },
    maker: { ...content.maker, photo: { ...content.maker.photo, url: content.maker.photo.url ?? SEEDED } },
  };
}

/** Stand-in featured catalog rows. Preview only — real rows come from the DB. */
const PREVIEW_PRODUCTS: ProductView[] = [
  { slug: 'country-loaf', name: 'Country', price: '$9', description: '', status: 'active', media: [{ kind: 'image', alt: 'Country loaf', url: COUNTRY }], variations: [] },
  { slug: 'seeded-loaf', name: 'Seeded', price: '$10', description: '', status: 'active', media: [{ kind: 'image', alt: 'Seeded loaf', url: SEEDED }], variations: [] },
  { slug: 'cinnamon-raisin', name: 'Cinnamon', price: '$11', description: '', status: 'active', media: [{ kind: 'image', alt: 'Cinnamon raisin loaf', url: CINNAMON }], variations: [] },
];

export default async function MainStreetTestPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; arrangement?: string }>;
}) {
  const sp = await searchParams;
  const f = fixture as Fixture;
  // Preview-only switches: ?theme=main-street-{hearth|linen|field|press} & ?arrangement={classic|goods-first|story-led}
  const themeKey = sp.theme && MAIN_STREET_THEMES[sp.theme] ? sp.theme : f.themeKey;
  const arrangement = sp.arrangement ?? f.arrangement;
  const theme = mainStreetArchetype.resolveTheme({ themeKey });
  return (
    <MainStreet content={withStandIns(f.content)} theme={theme} arrangement={arrangement} products={PREVIEW_PRODUCTS} />
  );
}

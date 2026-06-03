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
import { MainStreet, type MainStreetContent, type ProductView } from '@/lib/archetypes/main-street';
import { mainStreetArchetype, MAIN_STREET_SKINS } from '@/lib/archetypes/main-street';
import fixture from '../main-street-fixture.june.json';

interface Fixture {
  content: MainStreetContent;
  skinKey: string;
}

const HERO_VIDEO = '/bread-kling.mp4';
const COUNTRY = '/storefronts/country.webp';
const SEEDED = '/storefronts/seeded.webp';
const CINNAMON = '/storefronts/cinnamon.webp';

/** Inject the hero video + the founder portrait. Preview only. */
function withStandIns(content: MainStreetContent): MainStreetContent {
  return {
    ...content,
    moment: { ...content.moment, media: { ...content.moment.media, url: content.moment.media.url ?? HERO_VIDEO } },
    founder: { ...content.founder, photo: { ...content.founder.photo, url: content.founder.photo.url ?? SEEDED } },
  };
}

/** Stand-in catalog rows. Preview only — real rows come from the DB. */
const PREVIEW_PRODUCTS: ProductView[] = [
  { slug: 'country', name: 'Country sourdough', price: '$9', shortDescription: '48-hour cold ferment, cracked crust', description: '', status: 'active', media: [{ kind: 'image', url: COUNTRY, alt: 'Country sourdough' }], variations: [] },
  { slug: 'seeded', name: 'Seeded rye', price: '$8', shortDescription: 'Caraway, molasses, a dense honest loaf', description: '', status: 'active', media: [{ kind: 'image', url: SEEDED, alt: 'Seeded rye' }], variations: [] },
  { slug: 'cinnamon', name: 'Cinnamon morning bun', price: '$6', shortDescription: 'Saturdays only, gone by ten', description: '', status: 'active', media: [{ kind: 'image', url: CINNAMON, alt: 'Cinnamon morning bun' }], variations: [] },
];

export default async function MainStreetTestPage({ searchParams }: { searchParams: Promise<{ skin?: string }> }) {
  const sp = await searchParams;
  const f = fixture as unknown as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  return <MainStreet content={withStandIns(f.content)} skin={skin} products={PREVIEW_PRODUCTS} />;
}

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
import { mainStreetArchetype } from '@/lib/archetypes/main-street';
import fixture from '../main-street-fixture.june.json';

interface Fixture {
  content: MainStreetContent;
  themeKey: string;
  arrangement: string;
}

function standIn(seed: string, w: number, h: number): string {
  const safe = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `https://picsum.photos/seed/${safe}/${w}/${h}`;
}

/** Fill the hero + maker photo slots with deterministic stand-ins. Preview only. */
function withStandIns(content: MainStreetContent): MainStreetContent {
  return {
    ...content,
    hero: { ...content.hero, photo: { ...content.hero.photo, url: content.hero.photo.url ?? standIn('hero-loaf', 1000, 750) } },
    maker: { ...content.maker, photo: { ...content.maker.photo, url: content.maker.photo.url ?? standIn('maker-portrait', 800, 1000) } },
  };
}

/** Stand-in featured catalog rows. Preview only — real rows come from the DB. */
const PREVIEW_PRODUCTS: ProductView[] = [
  { slug: 'country-loaf', name: 'Country Loaf', price: '$9', description: '', status: 'active', media: [{ kind: 'image', alt: 'Country loaf', url: standIn('country-loaf', 800, 1000) }], variations: [] },
  { slug: 'seeded-loaf', name: 'Seeded', price: '$10', description: '', status: 'active', media: [{ kind: 'image', alt: 'Seeded loaf', url: standIn('seeded-loaf', 800, 1000) }], variations: [] },
  { slug: 'cinnamon-raisin', name: 'Cinnamon Raisin', price: '$11', description: '', status: 'active', media: [{ kind: 'image', alt: 'Cinnamon raisin loaf', url: standIn('cinnamon-raisin', 800, 1000) }], variations: [] },
  { slug: 'baguette', name: 'Baguette', price: '$5', description: '', status: 'active', media: [{ kind: 'image', alt: 'Baguette', url: standIn('baguette', 800, 1000) }], variations: [] },
  { slug: 'focaccia', name: 'Focaccia', price: '$8', description: '', status: 'active', media: [{ kind: 'image', alt: 'Focaccia', url: standIn('focaccia', 800, 1000) }], variations: [] },
  { slug: 'sandwich-tin', name: 'Sandwich Tin', price: '$7', description: '', status: 'active', media: [{ kind: 'image', alt: 'Sandwich tin loaf', url: standIn('sandwich-tin', 800, 1000) }], variations: [] },
];

export default function MainStreetTestPage() {
  const f = fixture as Fixture;
  const theme = mainStreetArchetype.resolveTheme({ themeKey: f.themeKey });
  return (
    <MainStreet
      content={withStandIns(f.content)}
      theme={theme}
      arrangement={f.arrangement}
      products={PREVIEW_PRODUCTS}
    />
  );
}

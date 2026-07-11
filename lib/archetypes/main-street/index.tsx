/**
 * Main Street archetype — the complete artifact.
 *
 * The everyday maker shop as a paced SALES PAGE: the brand's moment is the hero,
 * then goods in motion, the maker beside a real find-us calendar, and a big-type
 * close. One fixed composition. Niche-neutral by construction — any maker fills
 * the same slots in their own voice, dressed in a skin picked off the shelf.
 *
 * Composition, typography (scale), spacing, motion, and the content slots live
 * in this module's renderer; the skin supplies color + the three font voices +
 * grain + photo grade. Bohdi cannot author shape and cannot break the
 * color/type guarantees.
 */
import type { Archetype, ArchetypeMeta } from '../types';
import { MainStreet } from './MainStreet';
import { MainStreetContentSchema, MainStreetSkinSchema, type MainStreetSkinPick } from './schemas';
import { MAIN_STREET_SKINS } from './skins';

const META: ArchetypeMeta = {
  key: 'main-street',
  label: 'Main Street',
  description:
    "The everyday maker shop as a paced sales page: the brand's moment is the hero, then goods in motion, the maker beside a real find-us calendar, and a big-type close. Niche-neutral by construction — any maker fills the same slots in their own voice, dressed in a skin picked off the shelf.",
  suitableFor: {
    nicheKinds: ['bakery', 'candles', 'ceramics', 'soap', 'food', 'apparel', 'general'],
    moods: ['cozy', 'rustic', 'dark', 'luxury', 'cheerful', 'modern'],
  },
};

export const mainStreetArchetype: Archetype<typeof MainStreetContentSchema, typeof MainStreetSkinSchema> = {
  meta: META,
  contentSchema: MainStreetContentSchema,
  themeSchema: MainStreetSkinSchema,
  themes: MAIN_STREET_SKINS,
  resolveTheme(pick: MainStreetSkinPick) {
    const skin = MAIN_STREET_SKINS[pick.skinKey];
    if (!skin) {
      throw new Error(
        `Main Street: unknown skin "${pick.skinKey}". Valid: ${Object.keys(MAIN_STREET_SKINS).join(', ')}`,
      );
    }
    return skin;
  },
  // Contract render: catalog rows are wired by the engine at integration time.
  // Until then this renders with no goods; the test routes call <MainStreet>
  // directly with real ProductView fixtures.
  render: ({ content, theme }) => <MainStreet content={content} skin={theme} products={[]} />,
};

export { MAIN_STREET_SKINS } from './skins';
export {
  MainStreetContentSchema,
  MainStreetSkinSchema,
  type MainStreetContent,
  type MainStreetSkinPick,
} from './schemas';
export { MainStreet } from './MainStreet';
export { MainStreetProduct } from './MainStreetProduct';
export type { ProductView, CatalogMedia, CatalogVariation } from '../content';

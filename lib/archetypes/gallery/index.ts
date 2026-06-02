/**
 * Gallery archetype — the complete artifact.
 *
 * A maker's shop wall: a dense, browsable grid of work as the centerpiece,
 * with identity, collections, the maker's story, in-person appearances, and a
 * footer supporting it. The opposite of the broadsheet's buried inventory —
 * product and price are visible the instant you land.
 *
 * Composition, typography, color pairs, spacing, the unifying photo grade,
 * motion, content slots, and theme hooks are all defined here. A tenant
 * supplies content matching the schema and a theme pick from the curated set;
 * the renderer produces a finished page. Bohdi cannot author shape and cannot
 * break the color/type guarantees.
 */
import type { Archetype, ArchetypeMeta } from '../types';
import { Gallery } from './Gallery';
import {
  GalleryContentSchema,
  GalleryThemeSchema,
  type GalleryThemePick,
} from './schemas';
import { GALLERY_THEMES } from './themes';

const META: ArchetypeMeta = {
  key: 'gallery',
  label: 'Gallery',
  description:
    "A maker's shop wall. A dense, browsable masonry grid of work is the centerpiece, opened by an identity band and supported by featured collections, the maker's story and face, in-person appearances, and a footer. Inventory and price are visible the instant you land. Niche-neutral by construction — any visual maker fills the same slots in their own voice.",
  suitableFor: {
    nicheKinds: [
      'apparel',
      'ceramics',
      'jewelry',
      'leather',
      'prints',
      'vintage',
      'woodwork',
    ],
    moods: ['clean', 'elegant', 'modern', 'quiet'],
  },
};

export const galleryArchetype: Archetype<
  typeof GalleryContentSchema,
  typeof GalleryThemeSchema
> = {
  meta: META,
  contentSchema: GalleryContentSchema,
  themeSchema: GalleryThemeSchema,
  themes: GALLERY_THEMES,
  resolveTheme(pick: GalleryThemePick) {
    const theme = GALLERY_THEMES[pick.themeKey];
    if (!theme) {
      throw new Error(
        `Gallery archetype: unknown theme key "${pick.themeKey}". Valid keys: ${Object.keys(GALLERY_THEMES).join(', ')}`,
      );
    }
    return theme;
  },
  render: Gallery,
};

export { GALLERY_THEMES } from './themes';
export {
  GalleryContentSchema,
  GalleryThemeSchema,
  type GalleryContent,
  type GalleryThemePick,
} from './schemas';
export { Gallery } from './Gallery';
export { GalleryProduct } from './GalleryProduct';
export type { ProductView, CatalogMedia, CatalogVariation } from '../content';

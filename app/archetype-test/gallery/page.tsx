/**
 * Archetype test route — renders the Gallery archetype with content authored
 * by Bohdi via scripts/test-gallery-archetype.ts.
 *
 * The fixture at app/archetype-test/gallery-fixture.json is the harness output.
 * The route imports the archetype, hands it the fixture's content and theme
 * pick, and renders. No design decisions live here.
 *
 * PREVIEW-ONLY stand-ins: the harness stores image PROMPTS, not generated
 * images, so every photo slot's `url` is empty. To judge composition and flow
 * before spending on real asset generation, this route fills empty slots with
 * deterministic stand-in photographs. This scaffolding lives in the test route
 * ONLY — the archetype renderer never sees a stand-in and stays free of any
 * hardcoded specifics.
 */
import { galleryArchetype, type GalleryContent } from '@/lib/archetypes/gallery';
import fixture from '../gallery-fixture.json';

interface Fixture {
  content: GalleryContent;
  themeKey: string;
}

function standIn(seed: string, w: number, h: number): string {
  const safe = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `https://picsum.photos/seed/${safe}/${w}/${h}`;
}

/** Fill empty photo slots with deterministic stand-ins. Preview only. */
function withStandIns(content: GalleryContent): GalleryContent {
  return {
    ...content,
    wall: {
      products: content.wall.products.map((p, i) => ({
        ...p,
        photo: { ...p.photo, url: p.photo.url ?? standIn(`${p.name}-${i}`, 800, 1000) },
      })),
    },
    collections: content.collections
      ? {
          ...content.collections,
          items: content.collections.items.map((c, i) => ({
            ...c,
            photo: { ...c.photo, url: c.photo.url ?? standIn(`col-${c.name}-${i}`, 900, 700) },
          })),
        }
      : undefined,
    maker: {
      ...content.maker,
      photo: {
        ...content.maker.photo,
        url: content.maker.photo.url ?? standIn('maker-portrait', 800, 1000),
      },
    },
  };
}

export default function GalleryTestPage() {
  const f = fixture as Fixture;
  const theme = galleryArchetype.resolveTheme({ themeKey: f.themeKey });
  const Render = galleryArchetype.render;
  return <Render content={withStandIns(f.content)} theme={theme} />;
}

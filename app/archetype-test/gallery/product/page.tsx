/**
 * Archetype test route — the Gallery product page.
 *
 * Demonstrates the model: a product ROW (gallery-product-fixture.json, shaped
 * like the listings + variations tables) is poured into the Gallery's product
 * container. Site chrome (identity, footer) is reused from the home fixture —
 * that's site-level data, shared across pages — proving the chrome is one
 * source of truth, not duplicated.
 *
 * PREVIEW-ONLY stand-ins: media slots store no URL yet, so this route fills
 * them with deterministic stand-ins (images for photos, a poster for video).
 * Scaffolding lives here only; the renderer never sees a stand-in.
 */
import { galleryArchetype, GalleryProduct, type GalleryContent, type ProductView } from '@/lib/archetypes/gallery';
import homeFixture from '../../gallery-fixture.json';
import productFixture from '../../gallery-product-fixture.json';

interface HomeFixture {
  content: GalleryContent;
  themeKey: string;
}

function standIn(seed: string, w: number, h: number): string {
  const safe = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `https://picsum.photos/seed/${safe}/${w}/${h}`;
}

function withStandIns(p: ProductView): ProductView {
  return {
    ...p,
    media: p.media.map((m, i) =>
      m.kind === 'video'
        ? { ...m, poster: m.poster ?? standIn(`${p.slug}-vid-${i}`, 800, 1000) }
        : { ...m, url: m.url ?? standIn(`${p.slug}-${i}`, 800, 1000) },
    ),
  };
}

export default function GalleryProductTestPage() {
  const home = homeFixture as HomeFixture;
  const theme = galleryArchetype.resolveTheme({ themeKey: home.themeKey });
  const product = withStandIns(productFixture as ProductView);

  return (
    <GalleryProduct
      product={product}
      identity={home.content.identity}
      shopName={home.content.shopName}
      footer={home.content.footer}
      theme={theme}
    />
  );
}

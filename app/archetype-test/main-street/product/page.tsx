/**
 * Archetype test route — renders the Main Street product page from a ProductView
 * fixture, using the home fixture's content for the shared header/footer.
 *
 * PREVIEW-ONLY stand-ins: the product fixture's media have no URLs, so this
 * route fills them with deterministic stock photos (and a poster for the video).
 * Scaffolding lives here only; the renderer never sees a stand-in.
 */
import {
  MainStreetProduct,
  type MainStreetContent,
  type ProductView,
  type CatalogMedia,
} from '@/lib/archetypes/main-street';
import { mainStreetArchetype } from '@/lib/archetypes/main-street';
import homeFixture from '../../main-street-fixture.june.json';
import productFixture from '../../main-street-product-fixture.json';

function standIn(seed: string, w: number, h: number): string {
  const safe = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `https://picsum.photos/seed/${safe}/${w}/${h}`;
}

export default function MainStreetProductTestPage() {
  const home = homeFixture as unknown as { content: MainStreetContent; skinKey: string };
  const skin = mainStreetArchetype.resolveTheme({ skinKey: home.skinKey });
  const base = productFixture as ProductView;

  const media: CatalogMedia[] = base.media.map((m, i) =>
    m.kind === 'video'
      ? { ...m, poster: m.poster ?? standIn(`${base.slug}-poster-${i}`, 1000, 1250) }
      : { ...m, url: m.url ?? standIn(`${base.slug}-${i}`, 1000, 1250) },
  );

  const product: ProductView = { ...base, media };

  return <MainStreetProduct content={home.content} product={product} skin={skin} />;
}

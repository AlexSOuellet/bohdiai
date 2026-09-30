/**
 * Main Street — the full-catalog (Products) page. PLACEHOLDER.
 *
 * The home page is a sales page that shows only a SAMPLING of goods; this is
 * where the "see the full catalog" cue lands — every product, plainly. A
 * dedicated shop/catalog page is its OWN archetype design (the home-page card-grid
 * ban does not apply to a real shop page); this stub keeps the cue's link live
 * and skinned until that page is designed.
 */
import { mainStreetArchetype, MAIN_STREET_SKINS, type MainStreetContent } from '@/lib/archetypes/main-street';
import { MainStreetRoot, MainStreetFooter, Media, typeRoleCss, roles } from '@/lib/archetypes/main-street/chrome';
import juneFixture from '../../main-street-fixture.june.json';
import { PREVIEW_PRODUCTS } from '../preview-products';

interface Fixture {
  content: MainStreetContent;
  skinKey: string;
}

export default async function MainStreetShopPage({ searchParams }: { searchParams: Promise<{ skin?: string }> }) {
  const sp = await searchParams;
  const f = juneFixture as unknown as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  const r = roles(skin);

  return (
    <MainStreetRoot skin={skin}>
      <header className="ms-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '34px 40px' }}>
        <a href="/archetype-test/main-street" data-type="wordmark" style={{ ...typeRoleCss(r.wordmark), color: 'var(--ms-fg)' }}>
          {f.content.identity.wordmark}
        </a>
        <a href="/archetype-test/main-street" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'var(--ms-accent)' }}>
          &larr; Back to the shop
        </a>
      </header>

      <section className="ms-wrap" style={{ padding: '40px 40px 110px' }}>
        <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 16 }}>
          Everything we make
        </span>
        <h1 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', margin: '0 0 56px' }}>
          The full catalog
        </h1>

        <div className="ms-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          {PREVIEW_PRODUCTS.map((p) => (
            <article key={p.slug}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
                }}
              >
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 16 }}>
                <h2 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: 0 }}>
                  {p.name}
                </h2>
                <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg)' }}>
                  {p.price}
                </span>
              </div>
              {p.shortDescription && (
                <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: '4px 0 0' }}>
                  {p.shortDescription}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <MainStreetFooter shopName={f.content.shopName} />
    </MainStreetRoot>
  );
}

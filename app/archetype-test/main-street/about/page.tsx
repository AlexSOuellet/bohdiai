/**
 * Main Street — the About (full-bio) page. PLACEHOLDER.
 *
 * The home founder beat is a TEASER; the "about" cue lands here, where the full
 * bio lives. A proper About page is its OWN archetype design; this stub keeps the
 * cue's link live and skinned until that page is designed.
 */
import { mainStreetArchetype, MAIN_STREET_SKINS, type MainStreetContent } from '@/lib/archetypes/main-street';
import { MainStreetRoot, MainStreetFooter, Media, typeRoleCss, roles } from '@/lib/archetypes/main-street/chrome';
import juneFixture from '../../main-street-fixture.june.json';

interface Fixture {
  content: MainStreetContent;
  skinKey: string;
}

const PORTRAIT = '/storefronts/seeded.webp';

export default async function MainStreetAboutPage({ searchParams }: { searchParams: Promise<{ skin?: string }> }) {
  const sp = await searchParams;
  const f = juneFixture as unknown as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  const r = roles(skin);
  const founder = f.content.founder;

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

      <section className="ms-wrap" style={{ padding: '40px 40px 110px', maxWidth: 820 }}>
        <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 16 }}>
          About
        </span>
        <h1 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', margin: '0 0 40px' }}>
          {founder.attribution}
        </h1>
        <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 4, overflow: 'hidden', marginBottom: 44 }}>
          <Media media={{ ...founder.photo, url: PORTRAIT }} />
        </div>
        <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-fg)', margin: '0 0 32px' }}>
          {founder.quote}
        </p>
        <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', margin: 0 }}>
          The full bio lives here — the long version of the story the home page only teases. This is a
          placeholder; the real About page is its own design.
        </p>
      </section>

      <MainStreetFooter shopName={f.content.shopName} />
    </MainStreetRoot>
  );
}

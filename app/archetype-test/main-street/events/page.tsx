/**
 * Main Street — the Events page. PLACEHOLDER.
 *
 * The home founder beat shows only a few upcoming dates (a teaser); the
 * calendar's "see all dates" cue lands here, the full schedule. Only makers who
 * do markets/events ever link here — a maker with the calendar disabled has no
 * cue and no dead link. A proper Events page is its own design; this stub keeps
 * the link live and skinned.
 */
import { mainStreetArchetype, MAIN_STREET_SKINS, type MainStreetContent } from '@/lib/archetypes/main-street';
import { MainStreetRoot, MainStreetFooter, typeRoleCss, roles } from '@/lib/archetypes/main-street/chrome';
import juneFixture from '../../main-street-fixture.june.json';

interface Fixture {
  content: MainStreetContent;
  skinKey: string;
}

export default async function MainStreetEventsPage({ searchParams }: { searchParams: Promise<{ skin?: string }> }) {
  const sp = await searchParams;
  const f = juneFixture as unknown as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  const r = roles(skin);
  const rows = f.content.founder.findUs?.rows ?? [];
  const hair = 'color-mix(in srgb, var(--ms-fg) 14%, transparent)';

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
          Where to find us
        </span>
        <h1 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', margin: '0 0 48px' }}>
          Markets &amp; events
        </h1>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '20px 0', borderBottom: `1px solid ${hair}` }}>
            <span data-type="day" style={{ ...typeRoleCss(r.day), color: 'var(--ms-fg-muted)', flex: '0 0 110px' }}>{row.day}</span>
            <span data-type="title" style={{ ...typeRoleCss(r.title), color: 'var(--ms-fg)', flex: 1 }}>{row.where}</span>
            <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-fg-muted)' }}>{row.time}</span>
          </div>
        ))}
        <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', margin: '40px 0 0' }}>
          The full schedule lives here. This is a placeholder; the real Events page is its own design.
        </p>
      </section>

      <MainStreetFooter shopName={f.content.shopName} />
    </MainStreetRoot>
  );
}

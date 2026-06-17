/**
 * Main Street — the sub-pages (Shop, Events, …) and their shared shell.
 *
 * Every sub-page wears the same chrome as the home: the skin bridge (MainStreetRoot),
 * a solid nav header (not the hero's over-media nav), and the footer. Structure
 * only — colors are skin vars, fonts are named roles, nothing niche or hardcoded.
 */
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter, Media, typeRoleCss, roles, MAIN_STREET_NAV, WordmarkLink } from './chrome';
import { navContrast, relativeLuminance } from './logo-contrast';
import { FindUsList } from './FounderBeats';
import { MainStreetContactForm } from './MainStreetContactForm';

function SubHeader({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const backdrop = relativeLuminance(skin.palette.bg) > 0.5 ? 'light' : 'dark';
  const surface = navContrast(content.identity.logoTone ?? 'unknown', backdrop);
  return (
    <header
      data-ms-nav
      style={{
        // Fixed so the nav anchors as the page scrolls, matching the home
        // hero's pinned nav. Sticky read cleanly in theory but Lenis smooth-
        // scroll (mounted by the storefront layout) breaks sticky in this
        // setup — fixed sidesteps it the same way the home nav does. The
        // sub-page main content is padded down to compensate (MainStreetSubPage).
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
        padding: '14px 40px',
        borderBottom: '1px solid var(--ms-rule)',
        background: surface ? surface.bg : 'var(--ms-bg)',
        color: surface ? surface.fg : 'var(--ms-fg)',
        flexWrap: 'wrap',
      }}
    >
      <WordmarkLink wordmark={content.identity.wordmark} logoUrl={content.identity.logoUrl} logoContainsWordmark={content.identity.logoContainsWordmark} role={r.wordmark} />
      <nav style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
        {MAIN_STREET_NAV.map((item) => (
          <a key={item.href} href={item.href} data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
            {item.label}
          </a>
        ))}
        <a href="/cart" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
          Cart
        </a>
      </nav>
    </header>
  );
}

/** The shared shell every sub-page composes into.
 *  paddingTop on <main> clears the fixed SubHeader (~80px desktop, ~68px mobile)
 *  so content starts below the nav rather than under it. The home hero does not
 *  need this because its 100vh hero already sits under the fixed nav. */
export function MainStreetSubPage({ content, skin, children }: { content: MainStreetContent; skin: ArchetypeTheme; children: ReactNode }) {
  return (
    <MainStreetRoot skin={skin}>
      <SubHeader content={content} skin={skin} />
      <main className="ms-subpage-main">{children}</main>
      <MainStreetFooter shopName={content.shopName} skin={skin} />
    </MainStreetRoot>
  );
}

/** A simple page masthead — eyebrow + title — reused across sub-pages. */
function PageHead({ eyebrow, title, skin }: { eyebrow?: string | undefined; title: string; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <div className="ms-wrap" style={{ padding: '88px 40px 36px', textAlign: 'center' }}>
      {eyebrow && (
        <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 14 }}>
          {eyebrow}
        </span>
      )}
      <h1 data-type="closeHead" style={{ ...typeRoleCss(r.closeHead), color: 'var(--ms-fg)', margin: 0 }}>
        {title}
      </h1>
    </div>
  );
}

/** Minimal skin-driven styling for an HTML body (legal docs). Scoped to .ms-legal
 *  so headings/links read in the skin instead of browser defaults. */
function legalCss(): string {
  return `.arch-main-street .ms-legal h1{font-family:var(--ms-disp);font-size:34px;color:var(--ms-fg);margin:0 0 18px}
.arch-main-street .ms-legal h2{font-family:var(--ms-disp);font-size:22px;color:var(--ms-fg);margin:34px 0 12px}
.arch-main-street .ms-legal p{color:var(--ms-fg);margin:0 0 16px;max-width:66ch}
.arch-main-street .ms-legal a{color:var(--ms-accent)}`;
}

/** A plain content page in Main Street chrome. Pass `body` for authored paragraphs
 *  (maker-added pages) OR `html` for pre-rendered markup (legal docs, which carry
 *  their own headings). Used for Privacy/Terms and any maker-added page. */
export function ContentPage({ content, skin, title, body, html }: { content: MainStreetContent; skin: ArchetypeTheme; title?: string | undefined; body?: string[] | undefined; html?: string | undefined }) {
  const r = roles(skin);
  if (html !== undefined) {
    return (
      <MainStreetSubPage content={content} skin={skin}>
        <style dangerouslySetInnerHTML={{ __html: legalCss() }} />
        <article data-ms-content className="ms-wrap ms-legal" style={{ padding: '72px 40px 110px', maxWidth: 760 }} dangerouslySetInnerHTML={{ __html: html }} />
      </MainStreetSubPage>
    );
  }
  return (
    <MainStreetSubPage content={content} skin={skin}>
      {title && <PageHead title={title} skin={skin} />}
      <section data-ms-content className="ms-wrap" style={{ padding: '24px 40px 110px', maxWidth: 760 }}>
        {(body ?? []).map((para, i) => (
          <p key={i} data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg)', margin: '0 0 20px', maxWidth: '66ch' }}>
            {para}
          </p>
        ))}
      </section>
    </MainStreetSubPage>
  );
}

/** SHOP — the full catalog as a responsive grid (chrome defines .ms-catalog-grid
 *  breakpoints). The home shows a sampling; this shows everything. */
export function ShopPage({ content, skin, products }: { content: MainStreetContent; skin: ArchetypeTheme; products: ProductView[] }) {
  const r = roles(skin);
  return (
    <MainStreetSubPage content={content} skin={skin}>
      <PageHead eyebrow={content.goods.label} title={content.goods.title} skin={skin} />
      <section data-ms-shop className="ms-wrap" style={{ padding: '24px 40px 110px' }}>
        {products.length === 0 ? (
          <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', textAlign: 'center' }}>
            New pieces are on the way — check back soon.
          </p>
        ) : (
          <div className="ms-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
            {products.map((p) => (
              <a key={p.slug} href={`/listings/${p.slug}`} data-ms-card style={{ color: 'inherit' }}>
                <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden', background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))' }}>
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                  <span data-type="price" style={{ ...typeRoleCss(r.price), position: 'absolute', left: 12, bottom: 12, background: 'var(--ms-bg)', color: 'var(--ms-fg)', padding: '6px 10px', borderRadius: 2 }}>
                    {p.price}
                  </span>
                </div>
                <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: '16px 0 2px' }}>{p.name}</h3>
                {p.shortDescription && (
                  <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: 0 }}>{p.shortDescription}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** ABOUT — the maker's story at length. The full version of the home founder
 *  teaser: heading, portrait, and the multi-paragraph story. Falls back to the
 *  founder quote when no dedicated story was authored. */
export function AboutPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const about = content.about;
  const heading = about?.heading ?? 'Our story';
  const paragraphs = about?.story ?? [content.founder.quote];
  return (
    <MainStreetSubPage content={content} skin={skin}>
      <PageHead title={heading} skin={skin} />
      <section data-ms-about className="ms-wrap" style={{ padding: '24px 40px 110px', maxWidth: 820 }}>
        <div style={{ position: 'relative', aspectRatio: '16 / 10', borderRadius: 4, overflow: 'hidden', marginBottom: 44 }}>
          <Media media={content.founder.photo} />
        </div>
        {paragraphs.map((para, i) => (
          <p key={i} data-type="body" data-ms-story style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg)', margin: '0 0 22px', maxWidth: '64ch' }}>
            {para}
          </p>
        ))}
        <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-fg-muted)', marginTop: 14 }}>&mdash; {content.founder.attribution}</div>
      </section>
    </MainStreetSubPage>
  );
}

/** CONTACT — an authored invitation to get in touch. Real email/social are the
 *  maker's to add later; at onboarding this is voice, not contact details. */
export function ContactPage({ content, skin, tenantId }: { content: MainStreetContent; skin: ArchetypeTheme; tenantId?: string | undefined }) {
  const r = roles(skin);
  const heading = content.contact?.heading ?? 'Get in touch';
  const intro = content.contact?.intro ?? 'We would love to hear from you — questions, custom requests, or just to say hello.';
  return (
    <MainStreetSubPage content={content} skin={skin}>
      <PageHead title={heading} skin={skin} />
      <section data-ms-contact className="ms-wrap" style={{ padding: '24px 40px 120px', maxWidth: 680, textAlign: 'center' }}>
        <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg)', margin: '0 auto', maxWidth: '52ch' }}>
          {intro}
        </p>
        {tenantId !== undefined && (
          <div style={{ marginTop: 44 }}>
            <MainStreetContactForm skin={skin} tenantId={tenantId} />
          </div>
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** EVENTS — the full find-us calendar, or a friendly "check back" empty state
 *  when the maker has no upcoming dates (or has turned the calendar off). */
export function EventsPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const findUs = content.founder.findUs;
  const hasDates = !!findUs && findUs.rows.length > 0;
  return (
    <MainStreetSubPage content={content} skin={skin}>
      <PageHead eyebrow={hasDates ? findUs!.label : undefined} title="Where to find us" skin={skin} />
      <section data-ms-events className="ms-wrap" style={{ padding: '24px 40px 120px', maxWidth: 780 }}>
        {hasDates ? (
          <FindUsList findUs={findUs!} skin={skin} eventsHref="/events" heading="eyebrow" onContrast={false} />
        ) : (
          <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', textAlign: 'center' }}>
            No upcoming dates just yet — check back soon to see where we will be next.
          </p>
        )}
      </section>
    </MainStreetSubPage>
  );
}

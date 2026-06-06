/**
 * Main Street — the sub-pages (Shop, Events, …) and their shared shell.
 *
 * Every sub-page wears the same chrome as the home: the skin bridge (MainStreetRoot),
 * a solid nav header (not the hero's over-media nav), and the footer. Structure
 * only — colors are skin vars, fonts are named roles, nothing niche or hardcoded.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter, Media, typeRoleCss, roles } from './chrome';
import { FindUsList } from './FounderBeats';

/** The canonical sub-page nav — real routes (the home hero nav is separate). */
const SUB_NAV: Array<{ href: string; label: string }> = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/contact', label: 'Contact' },
];

function SubHeader({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
        padding: '22px 40px',
        borderBottom: '1px solid var(--ms-rule)',
        background: 'var(--ms-bg)',
        color: 'var(--ms-fg)',
        flexWrap: 'wrap',
      }}
    >
      <Link href="/" data-type="wordmark" style={{ ...typeRoleCss(r.wordmark), color: 'inherit' }}>
        {content.identity.wordmark}
      </Link>
      <nav style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
        {SUB_NAV.map((item) => (
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

/** The shared shell every sub-page composes into. */
export function MainStreetSubPage({ content, skin, children }: { content: MainStreetContent; skin: ArchetypeTheme; children: ReactNode }) {
  return (
    <MainStreetRoot skin={skin}>
      <SubHeader content={content} skin={skin} />
      <main>{children}</main>
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
              <a key={p.slug} href={`/${p.slug}`} data-ms-card style={{ color: 'inherit' }}>
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
export function ContactPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
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

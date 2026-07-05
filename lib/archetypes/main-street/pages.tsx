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
import { MainStreetRoot, MainStreetFooter, Nav } from './chrome';
import { Type } from './Type';
import { navContrast, relativeLuminance } from './logo-contrast';
import { FindUsBeat } from './FindUsBeat';
import { GoodsBeat } from './GoodsBeat';
import { FounderBeat } from './FounderBeat';
import { selectFounderTreatment } from './founder';
import { CollectionsBeat } from './CollectionsBeat';
import { ReviewsBeat } from './ReviewsBeat';
import type { CollectionView } from '../content';
import { MainStreetContactForm } from './MainStreetContactForm';
import { DEFAULT_STRINGS } from './defaults';

function SubHeader({ content, skin, current }: { content: MainStreetContent; skin: ArchetypeTheme; current?: string | undefined }) {
  // The header is fixed (matching the home hero's pinned nav — Lenis smooth-scroll
  // breaks `sticky` here). When the bare logo would wash out on the skin, it takes a
  // fixed contrasting chrome surface, expressed as a data attribute so the header
  // carries no inline style (the CSS lives in skinVarsCss under .ms-subheader).
  const backdrop = relativeLuminance(skin.palette.bg) > 0.5 ? 'light' : 'dark';
  const surface = navContrast(content.identity.logoTone ?? 'unknown', backdrop);
  const subheadTone = surface ? (relativeLuminance(surface.bg) > 0.5 ? 'light' : 'dark') : undefined;
  return (
    <header data-ms-nav data-ms-subhead={subheadTone} className="ms-subheader">
      <Nav identity={content.identity} currentHref={current} />
    </header>
  );
}

/** The shared shell every sub-page composes into.
 *  paddingTop on <main> clears the fixed SubHeader (~80px desktop, ~68px mobile)
 *  so content starts below the nav rather than under it. The home hero does not
 *  need this because its 100vh hero already sits under the fixed nav. */
export function MainStreetSubPage({ content, skin, children, current }: { content: MainStreetContent; skin: ArchetypeTheme; children: ReactNode; current?: string | undefined }) {
  return (
    <MainStreetRoot skin={skin}>
      <SubHeader content={content} skin={skin} current={current} />
      <main className="ms-subpage-main">{children}</main>
      <MainStreetFooter shopName={content.shopName} />
    </MainStreetRoot>
  );
}

/** A simple page masthead — eyebrow + title — reused across sub-pages. Class-only.
 *  Both fields optional: if the copywriter didn't author a value, the head renders
 *  without it rather than falling back to hardcoded English. */
function PageHead({ eyebrow, title }: { eyebrow?: string | undefined; title?: string | undefined }) {
  if (!eyebrow && !title) return null;
  return (
    <div className="ms-wrap ms-pagehead">
      {eyebrow && (
        <Type as="span" role="eyebrow" className="ms-pagehead-eyebrow">
          {eyebrow}
        </Type>
      )}
      {title && (
        <Type as="h1" role="closeHead" className="ms-pagehead-title">
          {title}
        </Type>
      )}
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
  if (html !== undefined) {
    return (
      <MainStreetSubPage content={content} skin={skin}>
        <style dangerouslySetInnerHTML={{ __html: legalCss() }} />
        <article data-ms-content className="ms-wrap ms-legal ms-page-legal" dangerouslySetInnerHTML={{ __html: html }} />
      </MainStreetSubPage>
    );
  }
  return (
    <MainStreetSubPage content={content} skin={skin}>
      {title && <PageHead title={title} />}
      <section data-ms-content className="ms-wrap ms-page ms-page-prose">
        {(body ?? []).map((para, i) => (
          <Type key={i} as="p" role="body">
            {para}
          </Type>
        ))}
      </section>
    </MainStreetSubPage>
  );
}

/** SHOP — the full catalog as a responsive grid (chrome defines .ms-catalog-grid
 *  breakpoints). The home shows a sampling; this shows everything. */
export function ShopPage({ content, skin, products }: { content: MainStreetContent; skin: ArchetypeTheme; products: ProductView[] }) {
  return (
    <MainStreetSubPage content={content} skin={skin} current="/shop">
      <PageHead eyebrow={content.goods.label} title={content.goods.title} />
      <section data-ms-shop className="ms-wrap ms-page">
        {products.length === 0 ? (
          <Type as="p" role="body" className="ms-page-empty">
            {DEFAULT_STRINGS.emptyShop}
          </Type>
        ) : (
          // The full Shop page wears the SAME treatment the home teaser sold — if
          // the home is Lookbook, /shop is a full lookbook; if it's Marquee, /shop
          // is the full marquee. The GoodsBeat's `full` mode drops the sampling and
          // the "see the full catalog" cue.
          <GoodsBeat goods={content.goods} products={products} skin={skin} catalogSize={products.length} shopHref="/shop" full />
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** ABOUT — the full "meet the maker" page, REPRESENTATIVE of the home teaser.
 *  The founder treatment renders at the top (same shape the home wears — Letter
 *  reads as a letter, Portrait as a portrait, Card as a card, etc.), so the page
 *  visually delivers what the teaser advertised. Below it, the authored About
 *  story runs in full prose — the reason the maker clicked "read the full story."
 *  Editorial already sets the full story in its columns, so we skip the extra
 *  prose block for that treatment (would double up). */
export function AboutPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const treatment = selectFounderTreatment(content.founder.treatment);
  const paragraphs = content.about?.story ?? [content.founder.quote];
  // Editorial is the one treatment that already renders the full story in its
  // own layout (columns + drop cap + pull-quote), so a story block below would
  // duplicate. Every other treatment is a teaser, so the story runs below it.
  const showStoryBlock = treatment !== 'editorial';
  return (
    <MainStreetSubPage content={content} skin={skin} current="/about">
      {/* The founder treatment as the page's HERO — no "about cue" (you're here). */}
      <FounderBeat founder={content.founder} skin={skin} aboutPage={content.about} showAboutCue={false} />
      {showStoryBlock && (
        <section data-ms-about className="ms-aboutstory">
          {paragraphs.map((para, i) => (
            <Type key={i} as="p" role="body" data-ms-story className="ms-aboutstory-para">
              {para}
            </Type>
          ))}
          <Type as="div" role="sig" className="ms-aboutstory-sig">&mdash; {content.founder.attribution}</Type>
        </section>
      )}
    </MainStreetSubPage>
  );
}

/** CONTACT — an authored invitation to get in touch. Real email/social are the
 *  maker's to add later; at onboarding this is voice, not contact details. */
export function ContactPage({ content, skin, tenantId }: { content: MainStreetContent; skin: ArchetypeTheme; tenantId?: string | undefined }) {
  const heading = content.contact?.heading;
  const intro = content.contact?.intro;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/contact">
      <PageHead title={heading} />
      <section data-ms-contact className="ms-wrap ms-page ms-contactpage">
        {intro && (
          <Type as="p" role="body" className="ms-contactpage-intro">
            {intro}
          </Type>
        )}
        {tenantId !== undefined && (
          <div className="ms-contactpage-form">
            <MainStreetContactForm tenantId={tenantId} />
          </div>
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** COLLECTIONS INDEX — the full collections band: the SAME treatment the home
 *  teaser wears (cupboard / crates / portals / chapters / lanes / cascade), now
 *  carrying every collection (not the home handful) and no "see all" cue. */
export function CollectionsPage({ content, skin, collections }: { content: MainStreetContent; skin: ArchetypeTheme; collections: CollectionView[] }) {
  const section = content.collections;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/collections">
      <PageHead eyebrow={section?.label} title={section?.title} />
      {collections.length === 0 ? (
        <section data-ms-collections className="ms-wrap ms-page ms-page-empty">
          <Type as="p" role="body">
            {DEFAULT_STRINGS.emptyCollections}
          </Type>
        </section>
      ) : (
        <CollectionsBeat section={section ?? { title: '' }} items={collections} skin={skin} full />
      )}
    </MainStreetSubPage>
  );
}

/** COLLECTION DETAIL — one collection's page: header (name + count) and the
 *  contents rendered in the store's SAME goods treatment (harmonizes with /shop).
 *  Everything class-only; nothing about the collection is hardcoded. */
export function CollectionPage({ content, skin, collection, products }: { content: MainStreetContent; skin: ArchetypeTheme; collection: CollectionView; products: ProductView[] }) {
  return (
    <MainStreetSubPage content={content} skin={skin} current="/collections">
      <PageHead eyebrow={`${collection.count} ${collection.count === 1 ? 'piece' : 'pieces'}`} title={collection.name} />
      <section data-ms-collection className="ms-wrap ms-page">
        {products.length === 0 ? (
          <Type as="p" role="body" className="ms-page-empty">
            {DEFAULT_STRINGS.emptyShop}
          </Type>
        ) : (
          // Reuse the store's goods treatment so a collection reads as a coherent
          // subset of the shop — same visual system, different slice of catalog.
          <GoodsBeat goods={content.goods} products={products} skin={skin} catalogSize={products.length} shopHref={`/collections/${collection.slug}`} full />
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** TESTIMONIALS — the full reviews section: the SAME treatment the home teaser
 *  wears (rating / pull-quote / guestbook / texts), now carrying every review
 *  (not the home handful) and no "see all" cue. */
export function TestimonialsPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const reviews = content.reviews;
  const hasReviews = !!reviews && reviews.items.length > 0;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/testimonials">
      <PageHead title={reviews?.title} />
      {hasReviews ? (
        <ReviewsBeat section={reviews!} skin={skin} full />
      ) : (
        <section data-ms-testimonials className="ms-wrap ms-page ms-page-empty">
          <Type as="p" role="body">
            {DEFAULT_STRINGS.emptyReviews}
          </Type>
        </section>
      )}
    </MainStreetSubPage>
  );
}

/** EVENTS — the full find-us section: the SAME treatment the home teaser wears,
 *  now carrying every date, or a friendly "check back" empty state when the maker
 *  has no upcoming dates (or turned the calendar off). Representative of its teaser. */
export function EventsPage({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const findUs = content.founder.findUs;
  const hasDates = !!findUs && findUs.rows.length > 0;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/events">
      <PageHead eyebrow={hasDates ? findUs!.label : undefined} title={findUs?.title} />
      {hasDates ? (
        <FindUsBeat findUs={findUs!} skin={skin} eventsHref="/events" full />
      ) : (
        <section data-ms-events className="ms-wrap ms-page ms-page-empty">
          <Type as="p" role="body">
            {DEFAULT_STRINGS.emptyEvents}
          </Type>
        </section>
      )}
    </MainStreetSubPage>
  );
}

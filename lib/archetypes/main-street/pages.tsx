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
import { MainStreetRoot, MainStreetFooter, Nav, Media } from './chrome';
import { Type } from './Type';
import { navContrast, relativeLuminance } from './logo-contrast';
import { parseFindUsDate, currentYearMonth } from './findus';
import { FindUsCalendar } from './FindUsCalendar';
import { GoodsBeat } from './GoodsBeat';
import { FounderBeat } from './FounderBeat';
import type { CollectionView } from '../content';
import { MainStreetContactForm } from './MainStreetContactForm';
import { DEFAULT_STRINGS, DEFAULT_COUNTS } from './defaults';
import type { MainStreetTreatments } from './builder';
import type { Family } from './families';

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
export function MainStreetSubPage({ content, skin, children, current, family }: { content: MainStreetContent; skin: ArchetypeTheme; children: ReactNode; current?: string | undefined; family?: Family | undefined }) {
  return (
    <MainStreetRoot skin={skin} family={family}>
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
export function ContentPage({ content, skin, title, body, html, family }: { content: MainStreetContent; skin: ArchetypeTheme; title?: string | undefined; body?: string[] | undefined; html?: string | undefined; family?: Family | undefined }) {
  if (html !== undefined) {
    return (
      <MainStreetSubPage content={content} skin={skin} family={family}>
        <style dangerouslySetInnerHTML={{ __html: legalCss() }} />
        <article data-ms-content className="ms-wrap ms-legal ms-page-legal" dangerouslySetInnerHTML={{ __html: html }} />
      </MainStreetSubPage>
    );
  }
  return (
    <MainStreetSubPage content={content} skin={skin} family={family}>
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

/** SHOP — the full catalog as a library-style grid. Every family wears the same
 *  browsing shape here: a dense scannable grid where the shopper's eye finds the
 *  product, name and price fast. The paint (colors, type, texture) is what varies
 *  per family via the skin CSS variables. No motion, no teasers — the home's
 *  goods treatment stays a teaser; this is where people browse. Grid + card
 *  styles live in chrome.tsx under .ms-catalog-*. */
export function ShopPage({ content, skin, products, family }: { content: MainStreetContent; skin: ArchetypeTheme; products: ProductView[]; family?: Family | undefined }) {
  return (
    <MainStreetSubPage content={content} skin={skin} current="/shop" family={family}>
      <PageHead eyebrow={content.goods.label} title={content.goods.title} />
      <section data-ms-shop className="ms-wrap ms-page">
        {products.length === 0 ? (
          <Type as="p" role="body" className="ms-page-empty">
            {DEFAULT_STRINGS.emptyShop}
          </Type>
        ) : (
          <div className="ms-catalog-grid">
            {products.map((p) => {
              const shot = p.media.find((m) => m.kind === 'image') ?? p.media[0];
              return (
                <a key={p.slug} href={`/listings/${p.slug}`} className="ms-catalog-card">
                  <div className="ms-catalog-media">
                    <Media media={shot ?? { kind: 'image', alt: p.name }} />
                    <Type as="span" role="price" className="ms-catalog-price">
                      {p.price}
                    </Type>
                  </div>
                  <Type as="h3" role="cardTitle" className="ms-catalog-name">
                    {p.name}
                  </Type>
                  {p.shortDescription && (
                    <Type as="p" role="body" className="ms-catalog-desc">
                      {p.shortDescription}
                    </Type>
                  )}
                </a>
              );
            })}
          </div>
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
export function AboutPage({ content, skin, treatments, family }: { content: MainStreetContent; skin: ArchetypeTheme; treatments: MainStreetTreatments; family?: Family | undefined }) {
  const paragraphs = content.about?.story ?? [content.founder.quote];
  // Editorial is the one treatment that already renders the full story in its
  // own layout (columns + drop cap + pull-quote), so a story block below would
  // duplicate. Every other treatment is a teaser, so the story runs below it.
  const showStoryBlock = treatments.founder !== 'editorial';
  // The About page owns its <h1> — the authored heading names the page so screen
  // readers and search engines see the same title a sighted visitor would read.
  // Visually hidden because the founder treatment IS the visual hero; the heading
  // is a structural landmark, not chrome.
  return (
    <MainStreetSubPage content={content} skin={skin} current="/about" family={family}>
      {content.about?.heading && (
        <Type as="h1" role="closeHead" className="ms-sr-only">
          {content.about.heading}
        </Type>
      )}
      {/* The founder treatment as the page's HERO — no "about cue" (you're here). */}
      <FounderBeat founder={content.founder} skin={skin} treatment={treatments.founder} aboutPage={content.about} showAboutCue={false} />
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
export function ContactPage({ content, skin, tenantId, family }: { content: MainStreetContent; skin: ArchetypeTheme; tenantId?: string | undefined; family?: Family | undefined }) {
  const heading = content.contact?.heading;
  const intro = content.contact?.intro;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/contact" family={family}>
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

/** COLLECTIONS INDEX — the editorial spread. One collection per band down the
 *  page, alternating image left / image right for rhythm. One shape across all
 *  six families; family paint (colors, type, texture) does the differentiation.
 *  The home band treatments (cupboard / crates / portals / chapters / lanes /
 *  cascade) stay as home-only teasers; the /collections page has this library
 *  shape here. CSS in chrome.tsx under .ms-cs-*. */
export function CollectionsPage({ content, skin, collections, family }: { content: MainStreetContent; skin: ArchetypeTheme; collections: CollectionView[]; family?: Family | undefined }) {
  const section = content.collections;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/collections" family={family}>
      <PageHead eyebrow={section?.label} title={section?.title} />
      {collections.length === 0 ? (
        <section data-ms-collections className="ms-wrap ms-page ms-page-empty">
          <Type as="p" role="body">
            {DEFAULT_STRINGS.emptyCollections}
          </Type>
        </section>
      ) : (
        <section data-ms-collections className="ms-wrap ms-page">
          <div className="ms-cs-list">
            {collections.map((c, i) => {
              const flipped = i % 2 === 1;
              return (
                <a
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  data-ms-coll-item=""
                  className={flipped ? 'ms-cs-spread right' : 'ms-cs-spread'}
                >
                  <div className="ms-cs-cover">
                    <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
                  </div>
                  <div className="ms-cs-body">
                    <Type as="span" role="legal" className="ms-cs-num">
                      {DEFAULT_COUNTS.items(c.count)}
                    </Type>
                    <Type as="h2" role="goodsHead" className="ms-cs-name">
                      {c.name}
                    </Type>
                    <Type as="span" role="sig" className="ms-cs-enter">
                      {DEFAULT_STRINGS.fallbackExploreCollection}
                    </Type>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </MainStreetSubPage>
  );
}

/** COLLECTION DETAIL — one collection's page: header (name + count) and the
 *  contents rendered in the store's SAME goods treatment (harmonizes with /shop).
 *  Everything class-only; nothing about the collection is hardcoded. */
export function CollectionPage({ content, skin, collection, products, treatments, family }: { content: MainStreetContent; skin: ArchetypeTheme; collection: CollectionView; products: ProductView[]; treatments: MainStreetTreatments; family?: Family | undefined }) {
  return (
    <MainStreetSubPage content={content} skin={skin} current="/collections" family={family}>
      <PageHead eyebrow={DEFAULT_COUNTS.pieces(collection.count)} title={collection.name} />
      <section data-ms-collection className="ms-wrap ms-page">
        {products.length === 0 ? (
          <Type as="p" role="body" className="ms-page-empty">
            {DEFAULT_STRINGS.emptyShop}
          </Type>
        ) : (
          // Reuse the store's goods treatment so a collection reads as a coherent
          // subset of the shop — same visual system, different slice of catalog.
          <GoodsBeat goods={content.goods} products={products} skin={skin} treatment={treatments.goods} catalogSize={products.length} shopHref={`/collections/${collection.slug}`} full />
        )}
      </section>
    </MainStreetSubPage>
  );
}

/** TESTIMONIALS — a wall of quote cards. Optional summary bar (score + count)
 *  above the grid; two-column responsive grid of cards below, each with a big
 *  opening mark, the quote, the author, an optional location. One shape across
 *  all six families; family paint does the differentiation. The home reviews
 *  treatments (rating / pull-quote / guestbook / texts) stay as home teasers.
 *  CSS in chrome.tsx under .ms-tw-*. */
export function TestimonialsPage({ content, skin, family }: { content: MainStreetContent; skin: ArchetypeTheme; family?: Family | undefined }) {
  const reviews = content.reviews;
  const hasReviews = !!reviews && reviews.items.length > 0;
  return (
    <MainStreetSubPage content={content} skin={skin} current="/testimonials" family={family}>
      <PageHead title={reviews?.title} />
      {hasReviews ? (
        <section data-ms-testimonials className="ms-wrap ms-page">
          {reviews!.summary && (
            <div className="ms-tw-summary">
              <Type as="span" role="goodsHead" className="ms-tw-score">
                {reviews!.summary.score}
              </Type>
              <Type as="span" role="caption" className="ms-tw-count">
                {reviews!.summary.count}
              </Type>
            </div>
          )}
          <div className="ms-tw-grid">
            {reviews!.items.map((r, i) => (
              <article key={i} data-ms-tw-card="" className="ms-tw-card">
                <Type as="span" role="goodsHead" className="ms-tw-mark" aria-hidden>
                  {'“'}
                </Type>
                <Type as="blockquote" role="quote" className="ms-tw-quote">
                  {r.quote}
                </Type>
                <div className="ms-tw-attribution">
                  <Type as="span" role="cardTitle" className="ms-tw-author">
                    {r.author}
                  </Type>
                  {r.location && (
                    <Type as="span" role="caption" className="ms-tw-loc">
                      {r.location}
                    </Type>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section data-ms-testimonials className="ms-wrap ms-page ms-page-empty">
          <Type as="p" role="body">
            {DEFAULT_STRINGS.emptyTestimonials}
          </Type>
        </section>
      )}
    </MainStreetSubPage>
  );
}

/** EVENTS — a real month calendar as the primary view, with a detailed list
 *  underneath so every event is clickable. Clicking a day or agenda entry
 *  anchor-scrolls to that event's full detail row below. One shape across all
 *  six families; family paint does the differentiation. The home find-us
 *  treatments (board / calendar / passes / next-stop / itinerary / poster)
 *  stay as home teasers; the /events page shows the whole season here. Each
 *  detail row also carries an external "Get directions" link to Google Maps
 *  for the venue — useful for shoppers who want to actually attend. CSS in
 *  chrome.tsx under .ms-fu-cal-* (calendar) and .ms-ev-* (detail list). */
export function EventsPage({ content, skin, family }: { content: MainStreetContent; skin: ArchetypeTheme; family?: Family | undefined }) {
  const findUs = content.founder.findUs;
  const hasDates = !!findUs && findUs.rows.length > 0;
  const { year, month } = currentYearMonth(new Date());
  return (
    <MainStreetSubPage content={content} skin={skin} current="/events" family={family}>
      <PageHead eyebrow={hasDates ? findUs!.label : undefined} title={findUs?.title} />
      {hasDates ? (
        <section data-ms-events className="ms-wrap ms-page">
          <FindUsCalendar
            section={findUs!}
            year={year}
            month={month}
            eventHrefs={findUs!.rows.map((_, i) => `#event-${i}`)}
          />
          <div className="ms-ev-list">
            {findUs!.rows.map((e, i) => {
              const parts = parseFindUsDate(e.date);
              const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.where)}`;
              return (
                <div key={i} id={`event-${i}`} data-ms-ev-row="" className="ms-ev-row">
                  <div className="ms-ev-date">
                    {parts ? (
                      <>
                        <Type as="span" role="day" className="ms-ev-dow">
                          {parts.weekdayShort}
                        </Type>
                        <Type as="span" role="title" className="ms-ev-num">
                          {parts.dayNum}
                        </Type>
                        <Type as="span" role="day" className="ms-ev-mon">
                          {parts.monthShort}
                        </Type>
                      </>
                    ) : (
                      <Type as="span" role="day" className="ms-ev-day">
                        {e.day}
                      </Type>
                    )}
                  </div>
                  <div className="ms-ev-info">
                    {e.kind && (
                      <Type as="span" role="eyebrow" className="ms-ev-kind">
                        {e.kind}
                      </Type>
                    )}
                    <Type as="h3" role="cardTitle" className="ms-ev-where">
                      {e.where}
                    </Type>
                    <Type as="a" role="navLabel" className="ms-ev-directions" href={directions} target="_blank" rel="noopener noreferrer">
                      {DEFAULT_STRINGS.getDirections}
                    </Type>
                  </div>
                  <Type as="span" role="price" className="ms-ev-time">
                    {e.time}
                  </Type>
                </div>
              );
            })}
          </div>
        </section>
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

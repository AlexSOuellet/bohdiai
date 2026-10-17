/**
 * Main Street — the Scenic family's own section styles (Session 107; from
 * Saltmarsh's Shoreline design). The bones: one photo locked behind the whole
 * page (the site's scene, painted by the family texture layer) and everything
 * floating over it. The opening is the name on the open sky; the pieces are
 * matted prints hung in the air; the about is a frosted pane; collections are
 * framed prints; markets are a tide table; reviews are paper notes. Saltmarsh's
 * own handmade touches (lace, the cottage-window frames) stay hers: here the
 * prints wear a plain mat.
 *
 * Every word is the site's own (the moment, section headings, About you, the
 * buttons and labels); the opening reads only the moment, never About you.
 * Class-only (`.ms-sc-*`, scenic-styles.ts).
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';
import { priceLabel } from './price-label';
import { itemsLabel, type CollectionView, type CollectionsSection } from './collections';
import type { FindUsEvent, FindUsSection } from './findus';
import type { ReviewsSection, Testimonial } from './reviews';
import type { FamilyWords } from './words';

type Founder = MainStreetView['founder'];

/** opening — the name on the open sky over the scene, the moment's lines beneath, its buttons. */
export function HorizonHero({
  identity,
  moment,
  words,
}: {
  identity: MainStreetView['identity'];
  moment: MainStreetView['moment'];
  words: FamilyWords;
}) {
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  return (
    <header data-ms-hero="horizon" className="ms-sc-hero">
      <nav data-ms-hero-nav className="ms-sc-nav">
        <Nav identity={identity} words={words} />
      </nav>
      <div className="ms-wrap ms-sc-sky">
        <Type as="h1" role="brand" className="ms-sc-brand">
          {moment.brand}
        </Type>
        {moment.eyebrow && (
          <Type as="p" role="storyline" className="ms-sc-line">
            {moment.eyebrow}
          </Type>
        )}
        {moment.sub && (
          <Type as="p" role="body" data-ms-hero-sub className="ms-sc-sub">
            {moment.sub}
          </Type>
        )}
        <div className="ms-sc-actions">
          <Type as="a" role="navLabel" href={ctaHref} className="ms-sc-cta">
            {moment.ctaLabel}
          </Type>
          {moment.secondaryCtaLabel && (
            <Type as="a" role="navLabel" href={secondaryHref} className="ms-sc-cta2">
              {moment.secondaryCtaLabel}
            </Type>
          )}
        </div>
      </div>
    </header>
  );
}

/** pieces — matted prints hung in the air over the scene, a paper label under each. */
export function GoodsPrints({
  goods,
  products,
  skin,
  words,
  viewAll,
}: {
  goods: MainStreetView['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  words: FamilyWords;
  viewAll?: GoodsViewAll | undefined;
}) {
  return (
    <section id="goods" className="ms-sc-prints-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <ul className="ms-sc-prints">
          {products.map((p) => (
            <li key={p.slug} className="ms-sc-print-item">
              <a href={`/listings/${p.slug}`} className="ms-sc-print">
                <span className="ms-sc-mat">
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
                </span>
                <span className="ms-sc-label">
                  <Type as="span" role="cardTitle" className="ms-sc-label-name">
                    {p.name}
                  </Type>
                  <Type as="span" role="price" className="ms-sc-label-price">
                    {priceLabel(p, words)}
                  </Type>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** about — a frosted pane over the scene: the heading, the maker's portrait as a
 *  matted print, their quote, signed. */
export function FounderPane({ founder, about }: { founder: Founder; skin: ArchetypeTheme; about?: { href: string; label: string } | undefined }) {
  const hasPhoto = founder.photo.url !== undefined && founder.photo.url !== '';
  return (
    <section data-ms-founder className="ms-sc-pane-section">
      <div className="ms-wrap">
        <div className={hasPhoto ? 'ms-sc-pane' : 'ms-sc-pane ms-sc-pane--words'}>
          {hasPhoto && (
            <figure className="ms-sc-pane-photo">
              <span className="ms-sc-mat">
                <Media media={founder.photo} />
              </span>
            </figure>
          )}
          <div className="ms-sc-pane-words">
            {founder.eyebrow && (
              <Type as="span" role="eyebrow" className="ms-sc-eyebrow">
                {founder.eyebrow}
              </Type>
            )}
            {founder.heading && (
              <Type as="h2" role="goodsHead" className="ms-sc-pane-title">
                {founder.heading}
              </Type>
            )}
            {founder.quote !== '' && (
              <Type as="p" role="quote" className="ms-sc-pane-quote">
                {founder.quote}
              </Type>
            )}
            {founder.attribution !== '' && (
              <Type as="div" role="sig" className="ms-sc-pane-sig">
                {founder.attribution}
              </Type>
            )}
            {about && (
              <Type as="a" role="navLabel" href={about.href} className="ms-sc-cue ms-aboutcue">
                {about.label}
              </Type>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** collections — each one a framed print floating over the scene, its name and count on a label. */
export function CollectionsFrames({
  section,
  items,
  words,
  viewAll,
}: {
  section: CollectionsSection;
  items: CollectionView[];
  skin: ArchetypeTheme;
  words: FamilyWords;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="collections" className="ms-coll-section ms-sc-frames">
      <div className="ms-wrap">
        <SectionHead label={section.label} title={section.title} />
        <div className="ms-sc-frames-row">
          {items.map((c) => (
            <a key={c.slug} href={`/collections/${c.slug}`} data-ms-coll-item="" className="ms-sc-frame">
              <span className="ms-sc-mat">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-sc-label">
                <Type as="span" role="cardTitle" className="ms-sc-label-name">
                  {c.name}
                </Type>
                <Type as="span" role="legal" className="ms-sc-label-price">
                  {itemsLabel(c.count, words)}
                </Type>
              </span>
            </a>
          ))}
        </div>
        {viewAll && <Cue href={viewAll.href} label={viewAll.label} />}
      </div>
    </section>
  );
}

/** markets — a tide table on a frosted card: the day, then where, then the hours. */
export function FindUsTide({
  section,
  events,
  viewAll,
}: {
  section: FindUsSection;
  events: FindUsEvent[];
  skin: ArchetypeTheme;
  words: FamilyWords;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="find-us" className="ms-fu-section ms-sc-tide-section">
      <div className="ms-wrap">
        <div className="ms-sc-tide">
          <Type as="h2" role="goodsHead" className="ms-sc-tide-title">
            {section.label}
          </Type>
          <ul className="ms-sc-tide-rows">
            {events.map((e, i) => (
              <li key={`${i}-${e.day}`} data-ms-fu-item="" className="ms-sc-tide-row">
                <Type as="span" role="day" className="ms-sc-tide-day">
                  {e.day}
                </Type>
                <Type as="span" role="where" className="ms-sc-tide-where">
                  {e.where}
                </Type>
                {e.time !== '' && (
                  <Type as="span" role="legal" className="ms-sc-tide-time">
                    {e.time}
                  </Type>
                )}
              </li>
            ))}
          </ul>
          {viewAll && <Cue href={viewAll.href} label={viewAll.label} fu />}
        </div>
      </div>
    </section>
  );
}

/** reviews — small paper notes floating over the scene, each a little turned, signed at the foot. */
export function ReviewsNotes({
  section,
  items,
  viewAll,
}: {
  section: ReviewsSection;
  items: Testimonial[];
  skin: ArchetypeTheme;
  words: FamilyWords;
  viewAll?: { href: string; label: string } | undefined;
}) {
  return (
    <section id="reviews" className="ms-rev-section ms-sc-notes">
      <div className="ms-wrap">
        <SectionHead label={section.label} title={section.title} />
        <div className="ms-sc-notes-row">
          {items.map((t, i) => (
            <figure key={`${t.author}-${i}`} data-ms-rev-item="" className="ms-sc-note">
              <blockquote>
                <Type as="p" role="body" className="ms-sc-note-quote">
                  {t.quote}
                </Type>
              </blockquote>
              <figcaption>
                <Type as="span" role="sig" className="ms-sc-note-who">
                  {t.author}
                </Type>
                {t.location && (
                  <Type as="span" role="legal" className="ms-sc-note-from">
                    {t.location}
                  </Type>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        {viewAll && <Cue href={viewAll.href} label={viewAll.label} />}
      </div>
    </section>
  );
}

/** A section's heading on a frosted strip, so it reads over any scene. */
function SectionHead({ label, title }: { label?: string | undefined; title: string }) {
  return (
    <div className="ms-sc-head">
      {label && (
        <Type as="span" role="eyebrow" className="ms-sc-eyebrow">
          {label}
        </Type>
      )}
      <Type as="h2" role="goodsHead" className="ms-sc-head-title">
        {title}
      </Type>
    </div>
  );
}

function Cue({ href, label, fu = false }: { href: string; label: string; fu?: boolean }) {
  return (
    <Type as="a" role="navLabel" href={href} className="ms-sc-cue ms-viewall" {...(fu ? { 'data-ms-fu-viewall': '' } : {})}>
      {label}
    </Type>
  );
}

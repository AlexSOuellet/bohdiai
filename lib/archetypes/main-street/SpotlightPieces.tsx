/**
 * Main Street — the Spotlight family's own section styles (Session 107; from
 * Paper & Patina's Show reel design). A show reel for the shop: the name slammed
 * letter by letter over the opening photo; the work big, two to a row, with quiet
 * captions; bold color panels for the about and the reviews; each collection a
 * full-width billboard; the market dates scrolling past on a ticker band.
 *
 * Every word is the site's own (the moment, section headings, About you, the
 * buttons and labels). Class-only (`.ms-sp-*`, spotlight-styles.ts); the slam's
 * letter timing is nth-child rules, and nothing waits on script to be visible.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';
import { type GoodsViewAll } from './beats';
import { priceLabel } from './price-label';
import { itemsLabel, type CollectionView, type CollectionsSection } from './collections';
import type { FindUsEvent, FindUsSection } from './findus';
import type { ReviewsSection, Testimonial } from './reviews';
import type { FamilyWords } from './words';

type Founder = MainStreetView['founder'];

/** How long the name is, so the stylesheet sets a longer one smaller. */
export function slamSize(name: string): 's' | 'm' | 'l' {
  const longest = Math.max(0, ...name.split(/\s+/).map((w) => w.length));
  if (name.length > 22 || longest > 11) return 's';
  if (name.length > 12 || longest > 8) return 'm';
  return 'l';
}

/** The name as words of letters, numbered across the whole name for the slam's timing. */
export function slamLetters(name: string): { word: string; letters: { ch: string; n: number }[] }[] {
  let n = 0;
  return name
    .split(/\s+/)
    .filter((w) => w !== '')
    .map((word) => ({ word, letters: [...word].map((ch) => ({ ch, n: n++ })) }));
}

/** opening — the moment's photo full bleed, the name slammed over it letter by letter. */
export function SlamHero({
  identity,
  moment,
  words,
}: {
  identity: MainStreetView['identity'];
  moment: MainStreetView['moment'];
  words: FamilyWords;
}) {
  // No target, no button: never a guessed page (a Showcase site has no shop).
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : undefined;
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : undefined;
  const hasPhoto = moment.media.url !== undefined && moment.media.url !== '';
  return (
    <header data-ms-hero="slam" className={hasPhoto ? 'ms-sp-hero' : 'ms-sp-hero ms-sp-hero--bare'}>
      {hasPhoto && (
        <div className="ms-sp-hero-media" data-ms-hero-media>
          <Media media={moment.media} />
        </div>
      )}
      <nav data-ms-hero-nav className="ms-sp-nav">
        <Nav identity={identity} words={words} />
      </nav>
      <div className="ms-sp-hero-txt">
        {moment.eyebrow && (
          <Type as="p" role="eyebrow" className="ms-sp-kick">
            {moment.eyebrow}
          </Type>
        )}
        <Type as="h1" role="brand" className="ms-sp-slam" data-size={slamSize(moment.brand)} aria-label={moment.brand}>
          {slamLetters(moment.brand).map((w) => (
            <span key={`${w.word}-${w.letters[0]?.n ?? 0}`} className="ms-sp-word" aria-hidden="true">
              {w.letters.map((l) => (
                <i key={l.n} className="ms-sp-l" data-n={Math.min(l.n, 23)}>
                  {l.ch}
                </i>
              ))}
            </span>
          ))}
        </Type>
        {moment.sub && (
          <Type as="p" role="storyline" data-ms-hero-sub className="ms-sp-sub">
            {moment.sub}
          </Type>
        )}
        <div className="ms-sp-actions">
          {ctaHref !== undefined && (
            <Type as="a" role="navLabel" href={ctaHref} className="ms-sp-go">
              {moment.ctaLabel}
            </Type>
          )}
          {moment.secondaryCtaLabel && secondaryHref !== undefined && (
            <Type as="a" role="navLabel" href={secondaryHref} className="ms-sp-go ms-sp-go--quiet">
              {moment.secondaryCtaLabel}
            </Type>
          )}
        </div>
      </div>
    </header>
  );
}

/** pieces — the work big, two to a row, a quiet caption under each. The way on to the
 *  shop is the goods beat's own button below, as on every family. */
export function GoodsReel({
  goods,
  products,
  words,
}: {
  goods: MainStreetView['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  words: FamilyWords;
  viewAll?: GoodsViewAll | undefined;
}) {
  return (
    <section id="goods" className="ms-sp-reel-section">
      <div className="ms-sp-head">
        {goods.label && (
          <Type as="span" role="eyebrow" className="ms-sp-eyebrow">
            {goods.label}
          </Type>
        )}
        <Type as="h2" role="goodsHead" className="ms-sp-head-title">
          {goods.title}
        </Type>
      </div>
      <ul className="ms-sp-reel">
        {products.map((p) => (
          <li key={p.slug} className="ms-sp-tile">
            <a href={`/listings/${p.slug}`}>
              <span className="ms-sp-tile-img">
                <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              </span>
              <span className="ms-sp-cap">
                <Type as="span" role="cardTitle" className="ms-sp-cap-name">
                  {p.name}
                </Type>
                <Type as="span" role="price" className="ms-sp-cap-price">
                  {priceLabel(p, words)}
                </Type>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** about — a bold color panel: the heading big, the maker's quote, signed; their portrait beside it when there is one. */
export function FounderPanel({ founder, about }: { founder: Founder; skin: ArchetypeTheme; about?: { href: string; label: string } | undefined }) {
  const hasPhoto = founder.photo.url !== undefined && founder.photo.url !== '';
  return (
    <section data-ms-founder className={hasPhoto ? 'ms-sp-panel' : 'ms-sp-panel ms-sp-panel--words'}>
      <div className="ms-sp-panel-in">
        {hasPhoto && (
          <figure className="ms-sp-panel-photo">
            <Media media={founder.photo} />
          </figure>
        )}
        <div className="ms-sp-panel-words">
          {founder.eyebrow && (
            <Type as="span" role="eyebrow" className="ms-sp-eyebrow">
              {founder.eyebrow}
            </Type>
          )}
          {founder.heading && (
            <Type as="h2" role="closeHead" className="ms-sp-panel-title">
              {founder.heading}
            </Type>
          )}
          {founder.quote !== '' && (
            <Type as="p" role="quote" className="ms-sp-panel-quote">
              {founder.quote}
            </Type>
          )}
          {founder.attribution !== '' && (
            <Type as="div" role="sig" className="ms-sp-panel-sig">
              {founder.attribution}
            </Type>
          )}
          {about && (
            <Type as="a" role="navLabel" href={about.href} className="ms-sp-go ms-sp-go--on-panel ms-aboutcue">
              {about.label}
            </Type>
          )}
        </div>
      </div>
    </section>
  );
}

/** collections — each one a full-width billboard, its cover edge to edge and its name set huge across it. */
export function CollectionsBillboards({
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
    <section id="collections" className="ms-coll-section ms-sp-boards">
      <div className="ms-sp-head">
        {section.label && (
          <Type as="span" role="eyebrow" className="ms-sp-eyebrow">
            {section.label}
          </Type>
        )}
        <Type as="h2" role="goodsHead" className="ms-sp-head-title">
          {section.title}
        </Type>
      </div>
      {items.map((c) => (
        <a key={c.slug} href={`/collections/${c.slug}`} data-ms-coll-item="" className="ms-sp-board">
          <span className="ms-sp-board-img">
            <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
          </span>
          <span className="ms-sp-board-txt">
            <Type as="span" role="closeHead" className="ms-sp-board-name">
              {c.name}
            </Type>
            <Type as="span" role="legal" className="ms-sp-board-count">
              {itemsLabel(c.count, words)}
            </Type>
          </span>
        </a>
      ))}
      {viewAll && (
        <div className="ms-sp-more">
          <Type as="a" role="navLabel" href={viewAll.href} className="ms-sp-go ms-viewall">
            {viewAll.label}
          </Type>
        </div>
      )}
    </section>
  );
}

/** reviews — the customers' words huge on a strong color panel, one after another, each signed. */
export function ReviewsSpotlight({
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
    <section id="reviews" className="ms-rev-section ms-sp-says">
      <div className="ms-sp-head">
        {section.label && (
          <Type as="span" role="eyebrow" className="ms-sp-eyebrow">
            {section.label}
          </Type>
        )}
        <Type as="h2" role="goodsHead" className="ms-sp-head-title">
          {section.title}
        </Type>
      </div>
      <div className="ms-sp-says-list">
        {items.map((t, i) => (
          <figure key={`${t.author}-${i}`} data-ms-rev-item="" className="ms-sp-say">
            <blockquote>
              <Type as="p" role="quote" className="ms-sp-say-quote">
                {t.quote}
              </Type>
            </blockquote>
            <figcaption>
              <Type as="span" role="sig" className="ms-sp-say-who">
                {t.author}
              </Type>
              {t.location && (
                <Type as="span" role="legal" className="ms-sp-say-from">
                  {t.location}
                </Type>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
      {viewAll && (
        <div className="ms-sp-more">
          <Type as="a" role="navLabel" href={viewAll.href} className="ms-sp-go ms-viewall">
            {viewAll.label}
          </Type>
        </div>
      )}
    </section>
  );
}

/** markets — the dates scrolling past on a bold color band, the section's name leading each run.
 *  The run is printed twice so the loop is seamless; the second copy is hidden from screen readers. */
export function FindUsTicker({
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
  const run = (hidden: boolean) => (
    <ul className="ms-sp-tick-run" aria-hidden={hidden ? 'true' : undefined}>
      <li className="ms-sp-tick-lead">
        <Type as={hidden ? 'span' : 'h2'} role="title" className="ms-sp-tick-title">
          {section.label}
        </Type>
      </li>
      {events.map((e, i) => (
        <li key={`${i}-${e.day}`} data-ms-fu-item={hidden ? undefined : ''} className="ms-sp-tick-item">
          <Type as="span" role="day" className="ms-sp-tick-day">
            {e.day}
          </Type>
          <Type as="span" role="where" className="ms-sp-tick-where">
            {e.where}
          </Type>
          {e.time !== '' && (
            <Type as="span" role="legal" className="ms-sp-tick-time">
              {e.time}
            </Type>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <section id="find-us" className="ms-fu-section ms-sp-ticker-section">
      <div className="ms-sp-ticker">
        <div className="ms-sp-tick-track">
          {run(false)}
          {run(true)}
        </div>
      </div>
      {viewAll && (
        <div className="ms-sp-more">
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-sp-go ms-viewall">
            {viewAll.label}
          </Type>
        </div>
      )}
    </section>
  );
}

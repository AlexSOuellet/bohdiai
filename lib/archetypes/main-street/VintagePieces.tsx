/**
 * Main Street — the Vintage family's own section styles beyond the opening and
 * the pieces: the cabinet card (about), the specimen drawers (collections), the
 * ticket stubs (markets) and the postcards (reviews). Each is a thing you'd find
 * pasted in a Victorian scrapbook. Every word is the site's own; ornaments are
 * drawn in CSS or SVG in the skin's colors. Class-only (vintage-styles.ts).
 */
import { MarketName } from './MarketName';
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { Flourish } from './Ornament';
import { hasFounderPhoto } from './FounderBeats';
import { itemsLabel, type CollectionView, type CollectionsSection } from './collections';
import type { FindUsEvent, FindUsSection } from './findus';
import type { ReviewsSection, Testimonial } from './reviews';
import type { FamilyWords } from './words';

type Founder = MainStreetView['founder'];

/** about — a cabinet card: the maker's portrait in a thick card mount with an
 *  arched window, and beside it their words in their own hand, signed. */
export function FounderCabinet({ founder, about }: { founder: Founder; skin: ArchetypeTheme; about?: { href: string; label: string } | undefined }) {
  return (
    <section data-ms-founder className="ms-cab-section">
      <div className={hasFounderPhoto(founder) ? 'ms-wrap ms-cab-grid' : 'ms-wrap ms-cab-grid ms-cab-grid--words'}>
        {hasFounderPhoto(founder) && (
          <figure className="ms-cab-card">
            <span className="ms-cab-window">
              <Media media={founder.photo} />
            </span>
            {founder.attribution !== '' && (
              <figcaption className="ms-cab-imprint">
                <Type as="span" role="legal">
                  {founder.attribution}
                </Type>
              </figcaption>
            )}
          </figure>
        )}
        <div className="ms-cab-words">
          {founder.quote !== '' && (
            <>
              <Type as="p" role="quote" className="ms-cab-quote">
                {founder.quote}
              </Type>
              <Flourish className="ms-cab-flourish" />
            </>
          )}
          {founder.attribution !== '' && (
            <Type as="div" role="sig" className="ms-cab-sig">
              {founder.attribution}
            </Type>
          )}
          {about && (
            <Type as="a" role="navLabel" href={about.href} className="ms-cab-cue ms-aboutcue">
              {about.label}
            </Type>
          )}
        </div>
      </div>
    </section>
  );
}

/** collections — a specimen cabinet: each collection's cover shown whole above
 *  its drawer front, with a brass label holder (its name and how many pieces) and a knob. */
export function CollectionsDrawers({
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
    <section id="collections" className="ms-coll-section ms-drawers">
      <div className="ms-wrap">
        <div className="ms-drawers-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-drawers-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-drawers-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-drawers-cabinet">
          {items.map((c) => (
            <a key={c.slug} href={`/collections/${c.slug}`} data-ms-coll-item="" className="ms-drawer">
              <span className="ms-drawer-peek">
                <Media media={c.cover ?? { kind: 'image', alt: c.name }} />
              </span>
              <span className="ms-drawer-face">
                <span className="ms-drawer-plate">
                  <Type as="span" role="cardTitle" className="ms-drawer-name">
                    {c.name}
                  </Type>
                  <Type as="span" role="legal" className="ms-drawer-count">
                    {itemsLabel(c.count, words)}
                  </Type>
                </span>
                <span className="ms-drawer-knob" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} className="ms-drawers-all ms-viewall">
            {viewAll.label}
          </Type>
        )}
      </div>
    </section>
  );
}

/** markets — ticket stubs: one per market, a perforated edge and punched notches,
 *  the day set large, the market and where beneath. */
export function FindUsTickets({
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
    <section id="find-us" className="ms-fu-section ms-tix">
      <div className="ms-wrap">
        <Type as="h2" role="goodsHead" className="ms-tix-title">
          {section.label}
        </Type>
        <ul className="ms-tix-row">
          {events.map((e, i) => (
            <li key={`${i}-${e.day}`} data-ms-fu-item="" className="ms-tix-stub">
              <span className="ms-tix-perf" aria-hidden="true" />
              <span className="ms-tix-body">
                <Type as="span" role="day" className="ms-tix-day">
                  {e.day}
                </Type>
                <Type as="span" role="cardTitle" className="ms-tix-where">
                  <MarketName e={e} />
                </Type>
                {e.time !== '' && (
                  <Type as="span" role="legal" className="ms-tix-time">
                    {e.time}
                  </Type>
                )}
              </span>
            </li>
          ))}
        </ul>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} data-ms-fu-viewall="" className="ms-tix-all ms-viewall">
            {viewAll.label}
          </Type>
        )}
      </div>
    </section>
  );
}

/** reviews — old postcards: the customer's words on the message side, a stamp
 *  and a postmark in the corner, signed where the address would go. */
export function ReviewsPostcards({
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
    <section id="reviews" className="ms-rev-section ms-post">
      <div className="ms-wrap">
        <div className="ms-post-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-post-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-post-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-post-row">
          {items.map((t, i) => (
            <figure key={`${t.author}-${i}`} data-ms-rev-item="" className="ms-post-card">
              <span className="ms-post-stamp" aria-hidden="true">
                <span className="ms-post-stamp-art" />
              </span>
              <span className="ms-post-mark" aria-hidden="true" />
              <blockquote className="ms-post-msg">
                <Type as="p" role="body" className="ms-post-quote">
                  {t.quote}
                </Type>
              </blockquote>
              <figcaption className="ms-post-addr">
                <Type as="span" role="sig" className="ms-post-who">
                  {t.author}
                </Type>
                {t.location && (
                  <Type as="span" role="legal" className="ms-post-from">
                    {t.location}
                  </Type>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        {viewAll && (
          <Type as="a" role="navLabel" href={viewAll.href} className="ms-post-all ms-viewall">
            {viewAll.label}
          </Type>
        )}
      </div>
    </section>
  );
}

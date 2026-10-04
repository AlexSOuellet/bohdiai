/**
 * Business site (exposure tier) — the one page, built from our families: a top
 * bar; the opening (hand-lettered overline, the name in woodtype, underline,
 * headline, buttons) beside the best three photos pinned up with the maker's
 * stamp; the family's loud marquee band of the owner's own words; About on a
 * pinned note; the work as taped prints; Get in touch; the footer. Every sentence the maker wrote comes
 * from `data`; the renderer adds only CARD_STRINGS. Sections with nothing to show
 * are left out rather than painted empty.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { cardCss } from './styles';
import { CARD_STRINGS as S } from './strings';
import { CardGallery } from './CardGallery';
import { CardContactForm } from './CardContactForm';
import { CardMarquee } from './CardMarquee';
import { bioParagraphs, initials, marqueeDateLine, marqueeFill, marqueeWords, ringText, type CardData } from './data';
import { marqueeDatesCss, marqueeDatesSeconds } from './marquee';
import type { CardPaint } from './paint';

const ABOUT_ID = 'about';
const WORK_ID = 'work';
const TOUCH_ID = 'touch';

function PhoneIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function FacebookIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.5V1.6L14 1.5c-3.8 0-4.6 2.8-4.6 4.6v2.4H7v4h2.4V22.5H14V12.5h3.1l.4-4z" />
    </svg>
  );
}

function InstagramIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** The maker's round stamp: initials inside a ring of words, pressed into the opening. */
function Mark({ name, kicker }: { name: string; kicker: string }): ReactElement {
  return (
    <span className="bc-mark" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id="bc-ring" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text>
          <textPath href="#bc-ring">{ringText(name, kicker)}</textPath>
        </text>
      </svg>
      <b>{initials(name)}</b>
    </span>
  );
}

/** Footer around every page. `platformCredit`: the "Empowered by BohdiAI" line on
 *  a bohdiai.com address; off on a custom domain (wired with custom domains). */
function Footer({ name, platformCredit }: { name: string; platformCredit: boolean }): ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="bc-foot">
      <span className="bc-foot__name" aria-hidden="true">
        {name}
      </span>
      <div className="bc-foot__row">
      <span>
        © {year} {name}
      </span>
      <nav aria-label={S.footer.label}>
        <a href="/privacy">{S.footer.privacy}</a>
        <a href="/terms">{S.footer.terms}</a>
        {platformCredit && (
          <a href={PLATFORM_URL}>
            {S.footer.creditPrefix} {S.footer.creditBrand}
          </a>
        )}
      </nav>
      </div>
    </footer>
  );
}

function Frame({ paint, children }: { paint: CardPaint; children: ReactNode }): ReactElement {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={paint.family.fontHref} />
      <style dangerouslySetInnerHTML={{ __html: cardCss(paint.palette, paint.family) }} />
      <div className="bc" data-family={paint.family.key}>
        {children}
      </div>
    </>
  );
}

function TopBar({ name, links }: { name: string; links: { id: string; label: string }[] }): ReactElement {
  return (
    <div className="bc-bar">
      <Link className="bc-brand" href="/">
        {name}
      </Link>
      {links.length > 0 && (
        <nav aria-label={S.nav.label}>
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`}>
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

export function CardLanding({
  data,
  paint,
  tenantId,
  platformCredit = true,
}: {
  data: CardData;
  paint: CardPaint;
  tenantId: string | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos } = data;
  const wall = photos.slice(0, 3);
  const words = marqueeWords(p.kicker, photos.map((x) => x.caption));
  const dateLines = data.dates.map(marqueeDateLine);
  // The quiet row carries the owner's market dates; with none, the business name.
  const quietFill = marqueeFill(dateLines.length > 0 ? dateLines : [name]);
  const hasDates = dateLines.length > 0;
  const quietClass = hasDates ? 'bc-marquee__row bc-marquee__row--quiet bc-marquee__row--dates' : 'bc-marquee__row bc-marquee__row--quiet';
  // The dates row loops at the big words' speed, timed from both rows' contents.
  const datesSeconds = hasDates ? marqueeDatesSeconds(words, quietFill.slice(0, quietFill.length / 2)) : null;
  const bio = bioParagraphs(p.bio);
  const hasAbout = p.aboutTitle !== '' || bio.length > 0;
  const hasWork = photos.length > 0;
  const canWrite = tenantId !== undefined;
  const hasWays = p.phone !== '' || p.facebookUrl !== '' || p.instagramUrl !== '';
  const hasTouch = canWrite || hasWays;
  const links = [
    ...(hasAbout ? [{ id: ABOUT_ID, label: S.nav.about }] : []),
    ...(hasWork ? [{ id: WORK_ID, label: S.nav.work }] : []),
    ...(hasTouch ? [{ id: TOUCH_ID, label: S.nav.touch }] : []),
  ];

  return (
    <Frame paint={paint}>
      {canWrite && (
        <a className="bc-skip" href={`#${TOUCH_ID}`}>
          {S.skip}
        </a>
      )}
      <header>
        <TopBar name={name} links={links} />
        <div className="bc-open">
          <div>
            {p.kicker !== '' && <span className="bc-over bc-hand">{p.kicker}</span>}
            <h1 className="bc-name">{name}</h1>
            <span className="bc-swash" aria-hidden="true" />
            {p.headline !== '' && <p className="bc-headline">{p.headline}</p>}
            {(hasWork || hasTouch) && (
              <div className="bc-actions">
                {hasWork && (
                  <a className="bc-btn bc-btn--solid" href={`#${WORK_ID}`}>
                    {S.seeWork}
                  </a>
                )}
                {hasTouch && (
                  <a className="bc-btn" href={`#${TOUCH_ID}`}>
                    {S.askAbout}
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="bc-wall">
            {wall.map((photo, i) => (
              <span key={photo.id} className="bc-print">
                {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption} fetchPriority={i === 0 ? 'high' : 'auto'} />
              </span>
            ))}
            <Mark name={name} kicker={p.kicker} />
          </div>
        </div>
      </header>

      {words.length > 0 && (
        <CardMarquee>
          {datesSeconds !== null && <style dangerouslySetInnerHTML={{ __html: marqueeDatesCss(datesSeconds) }} />}
          <div className="bc-marquee__row">
            {[...words, ...words].map((w, i) => (
              <span key={`${i}-${w}`}>{w}</span>
            ))}
          </div>
          <div className={quietClass}>
            {quietFill.map((w, i) => (
              <span key={`${i}-${w}`}>{w}</span>
            ))}
          </div>
        </CardMarquee>
      )}
      {hasDates && (
        <ul className="bc-sr" aria-label={S.dates.label}>
          {dateLines.map((line, i) => (
            <li key={`${i}-${line}`}>{line}</li>
          ))}
        </ul>
      )}

      <main id="main" className="bc-main">
        {hasAbout && (
          <section className="bc-about" id={ABOUT_ID}>
            <div className="bc-wrap bc-about__in">
              <div className="bc-about__head">
                <span className="bc-hand">{S.about.hand}</span>
                <h2 className="bc-shout">{p.aboutTitle !== '' ? p.aboutTitle : S.about.eyebrow}</h2>
              </div>
              <div className="bc-note">
                {bio.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
                {p.signature !== '' && <span className="bc-sig">{p.signature}</span>}
              </div>
            </div>
          </section>
        )}

        {hasWork && (
          <section className="bc-work" id={WORK_ID}>
            <div className="bc-wrap">
              <div className="bc-work__head">
                <div>
                  <span className="bc-hand">{S.work.hand}</span>
                  <h2 className="bc-shout">{S.work.title}</h2>
                </div>
                <p>{S.work.lede}</p>
              </div>
              <CardGallery photos={photos} />
            </div>
          </section>
        )}

        {hasTouch && (
          <section className="bc-touch" id={TOUCH_ID}>
            <div className="bc-wrap bc-touch__in">
              <div className="bc-touch__head">
                <span className="bc-hand">{S.touch.hand}</span>
                <h2 className="bc-shout">{S.touch.title}</h2>
                <p className="bc-touch__lede">{S.touch.lede}</p>
                {hasWays && (
                  <div className="bc-ways">
                    {p.phone !== '' && (
                      <a className="bc-way" href={`tel:${dialable(p.phone)}`}>
                        <PhoneIcon />
                        <span>
                          <small>{S.touch.callOrText}</small>
                          {p.phone}
                        </span>
                      </a>
                    )}
                    {p.facebookUrl !== '' && (
                      <a className="bc-way" href={p.facebookUrl} rel="noopener">
                        <FacebookIcon />
                        <span>
                          <small>{S.touch.facebook}</small>
                          {S.touch.followOn}
                        </span>
                      </a>
                    )}
                    {p.instagramUrl !== '' && (
                      <a className="bc-way" href={p.instagramUrl} rel="noopener">
                        <InstagramIcon />
                        <span>
                          <small>{S.touch.instagram}</small>
                          {S.touch.followOn}
                        </span>
                      </a>
                    )}
                  </div>
                )}
              </div>
              {canWrite && (
                <div className="bc-slip">
                  <CardContactForm tenantId={tenantId} />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}

/** A plain content page (privacy, terms) in the card's chrome. The html is
 *  pre-rendered from the platform's legal templates (escaped markdown). */
export function CardContentPage({
  name,
  paint,
  html,
  title,
  body,
  platformCredit = true,
}: {
  name: string;
  paint: CardPaint;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
  platformCredit?: boolean;
}): ReactElement {
  return (
    <Frame paint={paint}>
      <header>
        <TopBar name={name} links={[]} />
      </header>
      <main id="main">
        {html !== undefined ? (
          <div className="bc-prose" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="bc-prose">
            {title !== undefined && <h1>{title}</h1>}
            {(body ?? []).map((para) => (
              <p key={para.slice(0, 32)}>{para}</p>
            ))}
          </div>
        )}
      </main>
      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}

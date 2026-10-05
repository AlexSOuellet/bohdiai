/**
 * Business card, show reel design (show reel and torch spec): the work full
 * screen, one piece at a time. The opening is the first photo with the name
 * slammed over it; every other photo gets its own screen with its number and
 * caption; a red panel carries the about heading and bio; the end panel is the
 * contact form; a red ticker scrolls the market dates. Every word the maker
 * wrote comes from `data`; the renderer adds only CARD_STRINGS.
 */
import { Fragment, type ReactElement, type ReactNode } from 'react';
import Link from 'next/link';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { CARD_STRINGS as S } from './strings';
import { CardContactForm } from './CardContactForm';
import { ShowreelMotion } from './ShowreelMotion';
import { SHOWREEL_FONTS_HREF, SLAM_LETTERS, showreelCss } from './showreel-styles';
import { halves, torchLines } from './bulletin';
import { bioParagraphs, marqueeDateLine, marqueeFill, type CardData } from './data';

const ROOT_ID = 'sr-root';
const TOUCH_ID = 'touch';
/** The red panel comes after this many pieces (or after the last, if fewer). */
const SAY_AFTER = 4;

function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={SHOWREEL_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: showreelCss() }} />
      <div className="sr" id={ROOT_ID} data-design="showreel">
        {children}
      </div>
    </>
  );
}

function FooterLinks({ name, platformCredit }: { name: string; platformCredit: boolean }): ReactElement {
  return (
    <>
      <span>
        © {new Date().getFullYear()} {name}
      </span>
      <a href="/privacy">{S.footer.privacy}</a>
      <a href="/terms">{S.footer.terms}</a>
      {platformCredit && (
        <a href={PLATFORM_URL}>
          {S.footer.creditPrefix} {S.footer.creditBrand}
        </a>
      )}
    </>
  );
}

/** The name slammed in letter by letter, one word per line (short words like “&”
 *  ride with the next), the first line heavy and the rest in a soft italic;
 *  screen readers get it whole. */
function Slam({ name }: { name: string }): ReactElement {
  let n = 0;
  const lines = torchLines(name);
  const longest = Math.max(0, ...lines.map((l) => l.length));
  const size = longest <= 6 ? '' : longest <= 9 ? ' sr-slam--m' : ' sr-slam--s';
  return (
    <h1 className={`sr-slam${size}`} aria-label={name}>
      {lines.map((word, w) => (
        <span key={`${w}-${word}`} className={w === 0 ? 'sr-word' : 'sr-word sr-word--soft'} aria-hidden="true">
          {[...word].map((ch, i) => {
            if (ch === ' ') return ' ';
            const cls = `sr-l${Math.min(n++, SLAM_LETTERS - 1)}`;
            return (
              <i key={i} className={cls}>
                {ch}
              </i>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function Piece({ photo, n }: { photo: GalleryItem; n: number }): ReactElement {
  return (
    <section className="sr-slide sr-shade" data-piece={n} aria-label={photo.caption === '' ? S.showreel.piece(n) : photo.caption}>
      {/* The owner's own uploads, already shrunk at upload — plain imgs like the other maker-photo spots. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sr-bg" src={photo.url} alt="" aria-hidden="true" loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sr-main" src={photo.url} alt={photo.caption} loading="lazy" />
      <div className="sr-txt">
        {photo.caption !== '' && (
          <div className="sr-name" aria-hidden="true">
            {photo.caption.split(/\s+/).map((w, i) => (
              <Fragment key={`${i}-${w}`}>
                {i > 0 && ' '}
                <span className={i === 0 ? undefined : 'sr-soft'}>{w}</span>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ShowreelLanding({
  data,
  tenantId,
  platformCredit = true,
}: {
  data: CardData;
  tenantId: string | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos, dates } = data;
  const [opener, ...pieces] = photos;
  const bio = bioParagraphs(p.bio);
  const [sayA, sayB] = halves(p.aboutTitle);
  const hasSay = p.aboutTitle !== '' || bio.length > 0;
  const sayAt = Math.min(SAY_AFTER, pieces.length);
  const canWrite = tenantId !== undefined;
  const hasWays = p.phone !== '' || p.facebookUrl !== '' || p.instagramUrl !== '';
  const dateLines = dates.map(marqueeDateLine);
  const tickerFill = marqueeFill(dateLines, 6);

  const say = hasSay && (
    <section className="sr-slide sr-say" id="about" key="say">
      <div>
        {p.aboutTitle !== '' && (
          <h2>
            <span>{sayA}</span>
            {sayB !== '' && <span>{sayB}</span>}
          </h2>
        )}
        {bio.map((para) => (
          <p key={para.slice(0, 40)}>{para}</p>
        ))}
        {p.signature !== '' && <span className="sr-sig">— {p.signature}</span>}
      </div>
    </section>
  );

  return (
    <Frame>
      {canWrite && (
        <a className="sr-skip" href={`#${TOUCH_ID}`}>
          {S.skip}
        </a>
      )}
      <header className="sr-bar">
        <Link href="/">{name}</Link>
        <ShowreelMotion rootId={ROOT_ID} />
      </header>

      <main id="main">
        <section className="sr-slide sr-open sr-on">
          {opener !== undefined && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="sr-main" src={opener.url} alt={opener.caption} fetchPriority="high" />
          )}
          <div className="sr-txt">
            {p.kicker !== '' && <div className="sr-kick">{p.kicker}</div>}
            <Slam name={name} />
            {p.headline !== '' && <p className="sr-head">{p.headline}</p>}
            {pieces.length > 0 && (
              <a className="sr-go" href="#piece-1">
                {S.showreel.seeWork}
              </a>
            )}
          </div>
        </section>

        {pieces.map((photo, i) => (
          <div key={photo.id} id={`piece-${i + 1}`} className="sr-anchor">
            <Piece photo={photo} n={i + 1} />
            {i + 1 === sayAt && say}
          </div>
        ))}
        {pieces.length === 0 && say}

        <section className="sr-slide sr-end" id={TOUCH_ID}>
          <div className="sr-wrap">
            <div>
              <h2>{S.showreel.touch}</h2>
              <p>{S.showreel.lede}</p>
              {hasWays && (
                <div className="sr-ways">
                  {p.phone !== '' && <a href={`tel:${dialable(p.phone)}`}>{p.phone}</a>}
                  {p.facebookUrl !== '' && (
                    <a href={p.facebookUrl} rel="noopener">
                      {S.touch.facebook}
                    </a>
                  )}
                  {p.instagramUrl !== '' && (
                    <a href={p.instagramUrl} rel="noopener">
                      {S.touch.instagram}
                    </a>
                  )}
                </div>
              )}
            </div>
            {canWrite && <CardContactForm tenantId={tenantId} />}
            <footer className="sr-foot">
              <FooterLinks name={name} platformCredit={platformCredit} />
            </footer>
          </div>
        </section>
      </main>

      {dateLines.length > 0 && (
        <>
          <div className="sr-ticker" aria-hidden="true">
            <div>
              {tickerFill.map((line, i) => (
                <span key={`${i}-${line}`}>
                  {i % dateLines.length === 0 && <b>{S.showreel.findMe}</b>}
                  {line}
                </span>
              ))}
            </div>
          </div>
          <ul className="sr-sr" aria-label={S.showreel.datesLabel}>
            {dateLines.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </>
      )}
    </Frame>
  );
}

/** Privacy and terms on the bone panel, with the top bar. */
export function ShowreelContentPage({
  name,
  html,
  title,
  body,
  platformCredit = true,
}: {
  name: string;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
  platformCredit?: boolean;
}): ReactElement {
  return (
    <Frame>
      <main id="main" className="sr-prose">
        <header className="sr-bar">
          <Link href="/">{name}</Link>
        </header>
        {html !== undefined ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div>
            {title !== undefined && <h1>{title}</h1>}
            {(body ?? []).map((para) => (
              <p key={para.slice(0, 32)}>{para}</p>
            ))}
          </div>
        )}
        <footer className="sr-prose-foot">
          <FooterLinks name={name} platformCredit={platformCredit} />
        </footer>
      </main>
    </Frame>
  );
}

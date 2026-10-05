/**
 * Business card, bulletin board design (bulletin board spec): a kraft flyer
 * tacked to the barn wall. The stamp is the owner's tag line; the name stamps in
 * one word per line; the strip is What I make; the headline; the first three
 * photos pinned on; Find me at with the market days circled; tear-off tabs.
 * Then the rest of the photos pinned on the wall, and two cards: the about
 * note and the contact form. Every word the maker wrote comes from `data`; the
 * renderer adds only CARD_STRINGS. Anything with nothing to show is left out.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { CARD_STRINGS as S } from './strings';
import { CardContactForm } from './CardContactForm';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';
import { BulletinTabs } from './BulletinTabs';
import { BULLETIN_FONTS_HREF, bulletinCss } from './bulletin-styles';
import { datePieces, nameLines, tabTarget, TOUCH_ID } from './bulletin';
import { bioParagraphs, type CardData } from './data';

const PINNED = 3;

function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={BULLETIN_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: bulletinCss() }} />
      <div className="bb" data-design="bulletin">
        {children}
      </div>
    </>
  );
}

function Footer({ name, platformCredit }: { name: string; platformCredit: boolean }): ReactElement {
  return (
    <footer className="bb-foot">
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
    </footer>
  );
}

function Photo({ photo, index, eager }: { photo: GalleryItem; index: number; eager: boolean }): ReactElement {
  return (
    <Snapshot index={index} className="bb-photo" label={S.work.open(photo.caption, index + 1)}>
      {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.caption} loading={eager ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} />
      {photo.caption !== '' && <span className="bb-photo__cap">{photo.caption}</span>}
    </Snapshot>
  );
}

export function BulletinLanding({
  data,
  tenantId,
  platformCredit = true,
}: {
  data: CardData;
  tenantId: string | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos, dates } = data;
  const title = nameLines(name);
  const pinned = photos.slice(0, PINNED);
  const wall = photos.slice(PINNED);
  const bio = bioParagraphs(p.bio);
  const canWrite = tenantId !== undefined;
  const hasWays = p.facebookUrl !== '' || p.instagramUrl !== '';
  const hasAbout = bio.length > 0 || p.aboutTitle !== '' || hasWays;
  // With no phone the tabs lead to the form, so they only show when there is one to reach.
  const target = tabTarget(p);
  const hasTabs = target.kind === 'call' || canWrite;

  return (
    <Frame>
      {canWrite && (
        <a className="bb-skip" href={`#${TOUCH_ID}`}>
          {S.skip}
        </a>
      )}
      <PhotoViewerProvider photos={photos}>
        <div className="bb-wall">
          <header className="bb-flyer">
            <span className="bb-tack bb-tack--l" aria-hidden="true" />
            <span className="bb-tack bb-tack--r" aria-hidden="true" />
            {p.kicker !== '' && <span className="bb-stamp">{p.kicker}</span>}
            <h1 className={`bb-big bb-big--${title.size}`}>
              {title.lines.map((word, i) => (
                <span key={`${i}-${word}`}>{word}</span>
              ))}
            </h1>
            {p.makes.length > 0 && (
              <ul className="bb-strip">
                {p.makes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
            {p.headline !== '' && <p className="bb-lede">{p.headline}</p>}
            {pinned.length > 0 && (
              <ul className="bb-pins">
                {pinned.map((photo, i) => (
                  <li key={photo.id}>
                    <Photo photo={photo} index={i} eager />
                  </li>
                ))}
              </ul>
            )}
            {dates.length > 0 && (
              <section className="bb-find">
                <h2>{S.bulletin.findMe}</h2>
                <ul>
                  {dates.map((d) => {
                    const piece = datePieces(d);
                    return (
                      <li key={d.id}>
                        <b>{piece.day}</b> {piece.market}
                        {piece.town !== '' && <span> · {piece.town}</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {hasTabs && <BulletinTabs target={target} />}
          </header>

          <main id="main" className="bb-wall bb-wall--inner">
            {wall.length > 0 && (
              <section className="bb-more">
                <h2 className="bb-board-h">{S.bulletin.more}</h2>
                <ul className="bb-scatter">
                  {wall.map((photo, i) => (
                    <li key={photo.id}>
                      <Photo photo={photo} index={PINNED + i} eager={false} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(hasAbout || canWrite) && (
              <div className="bb-cards">
                {hasAbout && (
                  <section className="bb-card bb-card--about" id="about">
                    <h2>{p.aboutTitle !== '' ? p.aboutTitle : S.bulletin.aboutFallback}</h2>
                    {bio.map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                    {p.signature !== '' && <span className="bb-sig">— {p.signature}</span>}
                    {hasWays && (
                      <div className="bb-ways">
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
                  </section>
                )}
                {canWrite && (
                  <section className="bb-card bb-card--touch" id={TOUCH_ID}>
                    <h2>{S.bulletin.touch}</h2>
                    <CardContactForm tenantId={tenantId} />
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </PhotoViewerProvider>
      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}

/** Privacy and terms on a plain kraft sheet on the same wall. The html is
 *  pre-rendered from the platform's legal templates (escaped markdown). */
export function BulletinContentPage({
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
      <main id="main" className="bb-wall">
        <article className="bb-flyer bb-flyer--prose">
          <span className="bb-tack bb-tack--l" aria-hidden="true" />
          <span className="bb-tack bb-tack--r" aria-hidden="true" />
          <Link className="bb-home" href="/">
            {name}
          </Link>
          {html !== undefined ? (
            <div className="bb-prose" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="bb-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}

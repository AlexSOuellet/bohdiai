/**
 * Business card, shoreline design (Saltmarsh & Lace demo spec): a bay at dusk
 * locked behind the page while it scrolls. The name and tag line sit on the
 * open sky with What I make under them; the pieces float over the water as
 * matted prints with their captions; then the lace-edged card holds the story
 * and the tide table holds the market days; then the letter (contact form).
 * Every word the maker wrote comes from `data`; the renderer adds only
 * the site's own words (`data.words`). Anything with nothing to show is left out.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { fill } from '@/lib/site-words/words';
import type { CardWords } from './words';
import { CardContactForm } from './CardContactForm';
import { SocialIcons } from './SocialIcons';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';
import { SHORELINE_FONTS_HREF, shorelineCss } from './shoreline-styles';
import { bioParagraphs, initials, marketDay, marketName, photoLabel, type CardData, type Portrait } from './data';

const TOUCH_ID = 'write';

/** The name with each ampersand set apart in italic, the way a sign painter would letter it. */
export function nameParts(name: string): { text: string; amp: boolean }[] {
  return name
    .split(/(&)/)
    .filter((t) => t !== '')
    .map((text) => ({ text, amp: text === '&' }));
}

export function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={SHORELINE_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: shorelineCss() }} />
      <div className="sl" data-design="shoreline">
        <div className="sl-sea" aria-hidden="true" />
        {children}
      </div>
    </>
  );
}

export type Social = { facebookUrl: string; instagramUrl: string };
const NO_SOCIAL: Social = { facebookUrl: '', instagramUrl: '' };

export function Footer({
  name,
  platformCredit,
  social = NO_SOCIAL,
  w,
}: {
  name: string;
  platformCredit: boolean;
  social?: Social;
  w: CardWords;
}): ReactElement {
  return (
    <footer className="sl-foot" aria-label={w.footer.label}>
      <SocialIcons facebookUrl={social.facebookUrl} instagramUrl={social.instagramUrl} className="sl-social" labels={w.touch} showNames />
      <span>
        © {new Date().getFullYear()} {name}
      </span>
      <a href="/privacy">{w.footer.privacy}</a>
      <a href="/terms">{w.footer.terms}</a>
      <a href="/admin" rel="nofollow">
        {w.footer.ownerLogin}
      </a>
      {platformCredit && (
        <a href={PLATFORM_URL}>
          {w.footer.creditPrefix} {w.footer.creditBrand}
        </a>
      )}
    </footer>
  );
}

/** The maker's own photo, pinned to her story card in the same weathered frame as her pieces. */
export function PortraitPrint({ portrait }: { portrait: Portrait | null }): ReactElement | null {
  if (portrait === null) return null;
  return (
    <figure className="sl-portrait">
      {/* The owner's own upload, already shrunk at upload. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={portrait.url} alt={portrait.alt} />
    </figure>
  );
}

export function Print({ photo, index, w }: { photo: GalleryItem; index: number; w: CardWords['work'] }): ReactElement {
  return (
    <li>
      <Snapshot index={index} className="sl-print" label={photoLabel(photo.caption, index + 1, w)}>
        {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption} loading={index < 3 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} />
        {photo.caption !== '' && <span aria-hidden="true">{photo.caption}</span>}
      </Snapshot>
    </li>
  );
}

export function ShorelineLanding({
  data,
  tenantId,
  platformCredit = true,
}: {
  data: CardData;
  tenantId: string | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos, dates, words: w } = data;
  const bio = bioParagraphs(p.bio);
  const canWrite = tenantId !== undefined;
  // Her Facebook and Instagram live in the footer, as icons on every page.
  const hasAbout = bio.length > 0 || p.aboutTitle !== '' || p.headline !== '';
  const hasDates = dates.length > 0;

  return (
    <Frame>
      {canWrite && (
        <a className="sl-skip" href={`#${TOUCH_ID}`}>
          {w.skip}
        </a>
      )}
      <PhotoViewerProvider photos={photos} w={w.lightbox}>
        <header className="sl-sky sl-sky--home">
          <h1 className="sl-name">
            {nameParts(name).map((part, i) => (part.amp ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>))}
          </h1>
          {p.kicker !== '' && <p className="sl-kicker">{p.kicker}</p>}
          {p.makes.length > 0 && (
            <ul className="sl-makes" aria-label={w.shoreline.makesLabel}>
              {p.makes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </header>

        <main id="main">
          {photos.length > 0 && (
            <section className="sl-water" aria-labelledby="sl-work">
              <h2 className="sl-water-h" id="sl-work">
                {w.shoreline.work}
              </h2>
              <ul className="sl-prints">
                {photos.map((photo, i) => (
                  <Print key={photo.id} photo={photo} index={i} w={w.work} />
                ))}
              </ul>
            </section>
          )}

          {(hasAbout || hasDates) && (
            <div className={hasAbout && hasDates ? 'sl-below' : 'sl-below sl-below--one'}>
              {hasAbout && (
                <section className="sl-card" id="about">
                  <div className="sl-card__in">
                    <PortraitPrint portrait={data.portrait} />
                    <h2>{p.aboutTitle !== '' ? p.aboutTitle : w.shoreline.aboutFallback}</h2>
                    {p.headline !== '' && <p className="sl-lead">{p.headline}</p>}
                    {bio.map((para, i) => (
                      <p key={para.slice(0, 40)} className={i === 0 ? 'sl-first' : undefined}>
                        {para}
                      </p>
                    ))}
                    {p.signature !== '' && <span className="sl-sig">— {p.signature}</span>}
                  </div>
                </section>
              )}
              {hasDates && (
                <section className="sl-tide">
                  <table>
                    <caption>{w.shoreline.find}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{w.shoreline.findCols.day}</th>
                        <th scope="col">{w.shoreline.findCols.market}</th>
                        <th scope="col">{w.shoreline.findCols.town}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dates.map((d) => (
                        <tr key={d.id} className={d.canceled ? 'sl-gone' : undefined}>
                          <td>{marketDay(d, w.dates)}</td>
                          <td>{marketName(d, w.dates)}</td>
                          <td>{d.town}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </div>
          )}

          {canWrite && (
            <section className="sl-letter" id={TOUCH_ID}>
              <span className="sl-seal" aria-hidden="true">
                {initials(name)}
              </span>
              <h2>{p.signature === '' ? w.shoreline.touchNoName : fill(w.shoreline.touch, { name: p.signature })}</h2>
              <p>{w.shoreline.lede}</p>
              <CardContactForm tenantId={tenantId} w={w.form} />
            </section>
          )}
        </main>
      </PhotoViewerProvider>
      <Footer name={name} platformCredit={platformCredit} social={p} w={w} />
    </Frame>
  );
}

/** Privacy and terms on a sheet of paper over the same bay. The html is
 *  pre-rendered from the platform's legal templates (escaped markdown). */
export function ShorelineContentPage({
  name,
  social,
  words: w,
  html,
  title,
  body,
  platformCredit = true,
}: {
  name: string;
  social?: Social | undefined;
  words: CardWords;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
  platformCredit?: boolean;
}): ReactElement {
  return (
    <Frame>
      <main id="main" className="sl-page">
        <article className="sl-sheet">
          <Link className="sl-home" href="/" aria-label={w.shoreline.home}>
            {name}
          </Link>
          {html !== undefined ? (
            <div className="sl-prose" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="sl-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer name={name} platformCredit={platformCredit} w={w} {...(social !== undefined ? { social } : {})} />
    </Frame>
  );
}

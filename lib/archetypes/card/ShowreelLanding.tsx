/**
 * Business card, show reel design (show reel and torch spec; Spotlight trial,
 * Alex 2026-10-15). The opening is the first photo with the name slammed over
 * it; then the work, big, two to a row with quiet captions; a red panel carries
 * the about heading and bio; the end panel is the contact form; a red ticker
 * scrolls the market dates on every page. On Showcase the work is the gallery;
 * when the catalog is on it is her pieces (those marked for the home page), with
 * a shop page and a page for each piece. Every word the maker wrote comes from
 * `data`; the site's own words (`data.words`) fill everything else.
 */
import { Fragment, type ReactElement, type ReactNode } from 'react';
import Link from 'next/link';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import type { ProductView } from '@/lib/archetypes/content';
import { fill } from '@/lib/site-words/words';
import type { CardWords } from './words';
import { CardContactForm } from './CardContactForm';
import { ShowreelMotion } from './ShowreelMotion';
import { SHOWREEL_FONTS_HREF, SLAM_LETTERS, showreelCss } from './showreel-styles';
import { halves, torchLines } from './bulletin';
import { bioParagraphs, marqueeDateLine, marqueeFill, type CardData } from './data';

const ROOT_ID = 'sr-root';
const TOUCH_ID = 'touch';
const WORK_ID = 'work';
const ASK_ID = 'ask';

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

function FooterLinks({ name, platformCredit, w }: { name: string; platformCredit: boolean; w: CardWords['footer'] }): ReactElement {
  return (
    <>
      <span>
        © {new Date().getFullYear()} {name}
      </span>
      <a href="/privacy">{w.privacy}</a>
      <a href="/terms">{w.terms}</a>
      {platformCredit && (
        <a href={PLATFORM_URL}>
          {w.creditPrefix} {w.creditBrand}
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

/** A caption whose first word stands and the rest lean (the show reel's voice). */
function Caption({ text }: { text: string }): ReactElement {
  return (
    <>
      {text.split(/\s+/).map((word, i) => (
        <Fragment key={`${i}-${word}`}>
          {i > 0 && ' '}
          <span className={i === 0 ? undefined : 'sr-soft'}>{word}</span>
        </Fragment>
      ))}
    </>
  );
}

/** The piece's price as the shop shows it: the sale price beside the struck full one, or "Ask for price". */
function Price({ product, w }: { product: ProductView; w: CardWords['shoreline'] }): ReactElement {
  if (product.askForPrice === true) return <span className="sr-price sr-price--ask">{w.askForPrice}</span>;
  if (product.salePrice !== undefined) {
    return (
      <span className="sr-price">
        <s>
          <span className="sr-sr">{w.was} </span>
          {product.price}
        </s>{' '}
        {product.salePrice}
      </span>
    );
  }
  return <span className="sr-price">{product.price}</span>;
}

/** The piece's first photo, when it has one. */
function firstPhoto(product: ProductView): { url: string; alt: string } | null {
  const m = product.media.find((x) => x.kind === 'image' && x.url !== undefined);
  return m?.url === undefined ? null : { url: m.url, alt: m.alt === '' ? product.name : m.alt };
}

/** The work, big, two to a row: gallery photos (Showcase) or her pieces, each opening its own page. */
function Work({ items, label }: { items: ReactElement[]; label: string }): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <section className="sr-work" id={WORK_ID} aria-label={label}>
      <ul className="sr-grid">{items}</ul>
    </section>
  );
}

function PhotoTile({ url, caption }: { url: string; caption: string }): ReactElement {
  return (
    <li className="sr-tile">
      <figure>
        <div className="sr-tile-img">
          {/* The owner's own uploads, already shrunk at upload — plain imgs like the other maker-photo spots. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} loading="lazy" />
        </div>
        {caption !== '' && (
          <figcaption className="sr-cap">
            <span className="sr-cap-name">
              <Caption text={caption} />
            </span>
          </figcaption>
        )}
      </figure>
    </li>
  );
}

function ProductTile({ product, w }: { product: ProductView; w: CardWords['shoreline'] }): ReactElement {
  const photo = firstPhoto(product);
  return (
    <li className="sr-tile">
      <a href={`/listings/${product.slug}`}>
        <div className="sr-tile-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo !== null && <img src={photo.url} alt={photo.alt} loading="lazy" />}
        </div>
        <span className="sr-cap">
          <span className="sr-cap-name">
            <Caption text={product.name} />
          </span>
          <Price product={product} w={w} />
        </span>
      </a>
    </li>
  );
}

/** The top bar: her name home, and the shop when the site has one. */
function Bar({ name, shop, w, motion }: { name: string; shop: boolean; w: CardWords['shoreline']; motion: boolean }): ReactElement {
  return (
    <header className="sr-bar">
      <Link href="/">{name}</Link>
      {shop && (
        <nav aria-label={w.nav.label}>
          <Link href="/shop">{w.nav.shop}</Link>
        </nav>
      )}
      {motion && <ShowreelMotion rootId={ROOT_ID} />}
    </header>
  );
}

/** The red ticker of market dates, fixed at the foot of every page, and the same dates for screen readers. */
function Ticker({ data }: { data: CardData }): ReactElement | null {
  const w = data.words;
  const dateLines = data.dates.map((d) => marqueeDateLine(d, w.dates));
  if (dateLines.length === 0) return null;
  const tickerFill = marqueeFill(dateLines, 6);
  return (
    <>
      <div className="sr-ticker" aria-hidden="true">
        <div>
          {tickerFill.map((line, i) => (
            <span key={`${i}-${line}`}>
              {i % dateLines.length === 0 && <b>{w.showreel.findMe}</b>}
              {line}
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-sr" aria-label={w.showreel.datesLabel}>
        {dateLines.map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
      </ul>
    </>
  );
}

export function ShowreelLanding({
  data,
  tenantId,
  products,
  platformCredit = true,
}: {
  data: CardData;
  tenantId: string | undefined;
  /** Her pieces for the home page when the catalog is on; left out on Showcase, where the gallery is the work. */
  products?: ProductView[] | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos, words: w } = data;
  const shop = products !== undefined;
  const [opener, ...rest] = photos;
  const tiles = shop
    ? products.map((product) => <ProductTile key={product.slug} product={product} w={w.shoreline} />)
    : rest.map((photo) => <PhotoTile key={photo.id} url={photo.url} caption={photo.caption} />);
  const bio = bioParagraphs(p.bio);
  const [sayA, sayB] = halves(p.aboutTitle);
  const hasSay = p.aboutTitle !== '' || bio.length > 0;
  const canWrite = tenantId !== undefined;
  const hasWays = p.phone !== '' || p.facebookUrl !== '' || p.instagramUrl !== '';

  return (
    <Frame>
      {canWrite && (
        <a className="sr-skip" href={`#${TOUCH_ID}`}>
          {w.skip}
        </a>
      )}
      <Bar name={name} shop={shop} w={w.shoreline} motion />

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
            {tiles.length > 0 && (
              <a className="sr-go" href={`#${WORK_ID}`}>
                {w.showreel.seeWork}
              </a>
            )}
          </div>
        </section>

        <Work items={tiles} label={w.shoreline.work} />
        {shop && (
          <p className="sr-more">
            <Link href="/shop">{w.shoreline.seeShop}</Link>
          </p>
        )}

        {hasSay && (
          <section className="sr-slide sr-say" id="about">
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
        )}

        <section className="sr-slide sr-end" id={TOUCH_ID}>
          <div className="sr-wrap">
            <div>
              <h2>{w.showreel.touch}</h2>
              <p>{w.showreel.lede}</p>
              {hasWays && (
                <div className="sr-ways">
                  {p.phone !== '' && <a href={`tel:${dialable(p.phone)}`}>{p.phone}</a>}
                  {p.facebookUrl !== '' && (
                    <a href={p.facebookUrl} rel="noopener">
                      {w.touch.facebook}
                    </a>
                  )}
                  {p.instagramUrl !== '' && (
                    <a href={p.instagramUrl} rel="noopener">
                      {w.touch.instagram}
                    </a>
                  )}
                </div>
              )}
            </div>
            {canWrite && <CardContactForm tenantId={tenantId} w={w.form} />}
            <footer className="sr-foot">
              <FooterLinks name={name} platformCredit={platformCredit} w={w.footer} />
            </footer>
          </div>
        </section>
      </main>

      <Ticker data={data} />
    </Frame>
  );
}

/** The shop (catalog on): every live piece, two to a row, each opening its own page. */
export function ShowreelShop({
  data,
  products,
  platformCredit = true,
}: {
  data: CardData;
  products: ProductView[];
  platformCredit?: boolean;
}): ReactElement {
  const w = data.words;
  return (
    <Frame>
      <Bar name={data.name} shop w={w.shoreline} motion={false} />
      <main id="main" className="sr-page">
        <h1 className="sr-page-title">{w.shoreline.work}</h1>
        {products.length === 0 ? (
          <p className="sr-empty">{w.shoreline.emptyShop}</p>
        ) : (
          <ul className="sr-grid">
            {products.map((product) => (
              <ProductTile key={product.slug} product={product} w={w.shoreline} />
            ))}
          </ul>
        )}
        <footer className="sr-page-foot">
          <FooterLinks name={data.name} platformCredit={platformCredit} w={w.footer} />
        </footer>
      </main>
      <Ticker data={data} />
    </Frame>
  );
}

/** One piece: its photos large, its name, price and story, and a note to ask about it. */
export function ShowreelProduct({
  data,
  product,
  tenantId,
  allPhotos,
  platformCredit = true,
}: {
  data: CardData;
  product: ProductView;
  tenantId: string;
  /** Every photo on the piece (Full); otherwise its first only. */
  allPhotos: boolean;
  platformCredit?: boolean;
}): ReactElement {
  const w = data.words;
  const W = w.shoreline;
  const photos = (allPhotos ? product.media : product.media.slice(0, 1)).flatMap((m) =>
    m.kind === 'image' && m.url !== undefined ? [{ url: m.url, alt: m.alt === '' ? product.name : m.alt }] : [],
  );
  return (
    <Frame>
      <Bar name={data.name} shop w={W} motion={false} />
      <main id="main" className="sr-page">
        <p className="sr-back">
          <Link href="/shop">{W.backToShop}</Link>
        </p>
        <article className="sr-piece">
          <div className="sr-piece-photos">
            {photos.map((ph, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={`${i}-${ph.url}`} src={ph.url} alt={ph.alt} loading={i === 0 ? 'eager' : 'lazy'} />
            ))}
          </div>
          <div className="sr-piece-sheet">
            <h1>
              <Caption text={product.name} />
            </h1>
            <p className="sr-piece-price">
              <Price product={product} w={W} />
            </p>
            {product.shortDescription !== undefined && product.shortDescription !== '' && <p className="sr-piece-short">{product.shortDescription}</p>}
            {bioParagraphs(product.description).map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
            <a className="sr-go sr-go--dark" href={`#${ASK_ID}`}>
              {W.askAbout}
            </a>
          </div>
        </article>
        <section className="sr-ask" id={ASK_ID} aria-label={W.askAbout}>
          <CardContactForm tenantId={tenantId} w={w.form} initialMessage={fill(W.askMessage, { name: product.name })} />
        </section>
        <footer className="sr-page-foot">
          <FooterLinks name={data.name} platformCredit={platformCredit} w={w.footer} />
        </footer>
      </main>
      <Ticker data={data} />
    </Frame>
  );
}

/** Privacy and terms on the bone panel, with the top bar. */
export function ShowreelContentPage({
  name,
  words: w,
  html,
  title,
  body,
  platformCredit = true,
}: {
  name: string;
  words: CardWords;
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
          <FooterLinks name={name} platformCredit={platformCredit} w={w.footer} />
        </footer>
      </main>
    </Frame>
  );
}

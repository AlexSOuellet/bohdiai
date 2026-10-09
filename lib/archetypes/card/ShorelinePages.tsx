/**
 * Business card, shoreline design — the multi-page site on Lite and Full (Saltmarsh
 * & Lace demo spec, stage two). Same bay locked behind every page; the home gets
 * the tall sky, the other pages a short title over the same sky. Pages: Home, Shop,
 * a page per product, About, Markets, Contact. Every word the maker wrote comes
 * from her data; the renderer adds only CARD_STRINGS.
 */
import type { ReactElement } from 'react';
import Link from 'next/link';
import type { ProductView } from '@/lib/archetypes/content';
import { CARD_STRINGS as S } from './strings';
import { CardContactForm } from './CardContactForm';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';
import { Frame, Footer, nameParts } from './ShorelineLanding';
import { bioParagraphs, initials, marketDay, type CardData } from './data';
import { featuredProducts, type ShorelineData } from './shoreline-data';
import type { MarketDate } from '@/lib/backend/dates/dates-form';

const W = S.shoreline;

export type ShorelinePage = 'home' | 'shop' | 'about' | 'events' | 'contact';

const NAV: readonly { page: ShorelinePage; href: string; label: string }[] = [
  { page: 'home', href: '/', label: W.nav.home },
  { page: 'shop', href: '/shop', label: W.nav.shop },
  { page: 'about', href: '/about', label: W.nav.about },
  { page: 'events', href: '/events', label: W.nav.markets },
  { page: 'contact', href: '/contact', label: W.nav.contact },
];

function Name({ name }: { name: string }): ReactElement {
  return (
    <>
      {nameParts(name).map((part, i) => (part.amp ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>))}
    </>
  );
}

function Bar({ name, current }: { name: string; current: ShorelinePage | null }): ReactElement {
  return (
    <header className="sl-bar">
      <Link className="sl-bar-name" href="/">
        <Name name={name} />
      </Link>
      <nav aria-label={W.nav.label}>
        <ul className="sl-nav">
          {NAV.map((n) => (
            <li key={n.page}>
              <a href={n.href} aria-current={n.page === current ? 'page' : undefined}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function PageHead({ title }: { title: string }): ReactElement {
  return (
    <div className="sl-head">
      <h1>{title}</h1>
    </div>
  );
}

/** One product as a print over the water, linking to its page, with its price or "Ask for price". */
function ProductPrint({ product, eager }: { product: ProductView; eager: boolean }): ReactElement {
  const photo = product.media.find((m) => m.kind === 'image' && m.url !== undefined);
  return (
    <li>
      <a className="sl-print" href={`/listings/${product.slug}`}>
        {photo?.url !== undefined && (
          // The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={photo.alt === '' ? product.name : photo.alt} loading={eager ? 'eager' : 'lazy'} />
        )}
        <span>{product.name}</span>
        <Price product={product} />
      </a>
    </li>
  );
}

function Price({ product }: { product: ProductView }): ReactElement {
  return product.askForPrice === true ? <em className="sl-price sl-price--ask">{W.askForPrice}</em> : <strong className="sl-price">{product.price}</strong>;
}

function Prints({ products }: { products: readonly ProductView[] }): ReactElement {
  return (
    <ul className="sl-prints">
      {products.map((p, i) => (
        <ProductPrint key={p.slug} product={p} eager={i < 3} />
      ))}
    </ul>
  );
}

function Ways({ card }: { card: CardData }): ReactElement | null {
  const p = card.profile;
  if (p.facebookUrl === '' && p.instagramUrl === '') return null;
  return (
    <div className="sl-ways">
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
  );
}

function TideTable({ dates }: { dates: readonly MarketDate[] }): ReactElement {
  return (
    <table>
      <caption>{W.find}</caption>
      <thead>
        <tr>
          <th scope="col">{W.findCols.day}</th>
          <th scope="col">{W.findCols.market}</th>
          <th scope="col">{W.findCols.town}</th>
        </tr>
      </thead>
      <tbody>
        {dates.map((d) => (
          <tr key={d.id} className={d.canceled ? 'sl-gone' : undefined}>
            <td>{marketDay(d)}</td>
            <td>{d.canceled ? S.dates.canceled(d.name) : d.name}</td>
            <td>{d.town}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Home({ site }: { site: ShorelineData }): ReactElement {
  const { card } = site;
  const p = card.profile;
  const bio = bioParagraphs(p.bio);
  const featured = featuredProducts(site.products);
  const soon = card.dates.slice(0, 3);
  return (
    <>
      <div className="sl-sky">
        <h1 className="sl-name">
          <Name name={card.name} />
        </h1>
        {p.kicker !== '' && <p className="sl-kicker">{p.kicker}</p>}
        {p.makes.length > 0 && (
          <ul className="sl-makes" aria-label={W.makesLabel}>
            {p.makes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
      <main id="main">
        {featured.length > 0 && (
          <section className="sl-water" aria-labelledby="sl-featured">
            <h2 className="sl-section-h" id="sl-featured">
              {W.featured}
            </h2>
            <Prints products={featured} />
            <div className="sl-more">
              <a href="/shop">{W.seeShop}</a>
            </div>
          </section>
        )}
        {(bio.length > 0 || p.headline !== '' || soon.length > 0) && (
          <div className={bio.length > 0 && soon.length > 0 ? 'sl-below' : 'sl-below sl-below--one'}>
            {(bio.length > 0 || p.headline !== '') && (
              <section className="sl-card">
                <div className="sl-card__in">
                  <h2>{p.aboutTitle !== '' ? p.aboutTitle : W.aboutFallback}</h2>
                  {p.headline !== '' && <p className="sl-lead">{p.headline}</p>}
                  {bio[0] !== undefined && <p className="sl-first">{bio[0]}</p>}
                  <div className="sl-more">
                    <a href="/about">{W.readStory}</a>
                  </div>
                </div>
              </section>
            )}
            {soon.length > 0 && (
              <section className="sl-tide">
                <TideTable dates={soon} />
                <div className="sl-more">
                  <a href="/events">{W.allMarkets}</a>
                </div>
              </section>
            )}
          </div>
        )}
        <div className="sl-more">
          <a href="/contact">{W.writeCta(p.signature)}</a>
        </div>
      </main>
    </>
  );
}

function Shop({ site }: { site: ShorelineData }): ReactElement {
  return (
    <>
      <PageHead title={W.pageTitles.shop} />
      <main id="main" className="sl-water">
        {site.products.length > 0 ? <Prints products={site.products} /> : <p className="sl-empty">{W.emptyShop}</p>}
      </main>
    </>
  );
}

function About({ site }: { site: ShorelineData }): ReactElement {
  const p = site.card.profile;
  return (
    <>
      <PageHead title={W.pageTitles.about} />
      <main id="main" className="sl-about">
        <section className="sl-card">
          <div className="sl-card__in">
            <h2>{p.aboutTitle !== '' ? p.aboutTitle : W.aboutFallback}</h2>
            {p.headline !== '' && <p className="sl-lead">{p.headline}</p>}
            {bioParagraphs(p.bio).map((para, i) => (
              <p key={para.slice(0, 40)} className={i === 0 ? 'sl-first' : undefined}>
                {para}
              </p>
            ))}
            {p.signature !== '' && <span className="sl-sig">— {p.signature}</span>}
            <Ways card={site.card} />
          </div>
        </section>
      </main>
    </>
  );
}

function directionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function Markets({ site }: { site: ShorelineData }): ReactElement {
  return (
    <>
      <PageHead title={W.pageTitles.markets} />
      <main id="main">
        {site.card.dates.length === 0 ? (
          <p className="sl-empty">{W.emptyMarkets}</p>
        ) : (
          <ul className="sl-markets">
            {site.card.dates.map((d) => {
              const showDetails = site.marketDetails;
              const facts = [d.town, showDetails ? d.hours : '', showDetails && d.booth !== '' ? `${W.marketCols.booth} ${d.booth}` : ''].filter((f) => f !== '');
              return (
                <li key={d.id} className={d.canceled ? 'sl-market sl-market--gone' : 'sl-market'}>
                  <span className="sl-market-day">{marketDay(d)}</span>
                  <h2>{d.canceled ? S.dates.canceled(d.name) : d.name}</h2>
                  {facts.length > 0 && (
                    <p className="sl-market-facts">
                      {facts.map((f) => (
                        <span key={f}>{f}</span>
                      ))}
                    </p>
                  )}
                  {showDetails && (d.address !== '' || d.url !== '') && (
                    <div className="sl-market-links">
                      {d.address !== '' && (
                        <a href={directionsUrl(d.address)} rel="noopener">
                          {W.directions}
                        </a>
                      )}
                      {d.url !== '' && (
                        <a href={d.url} rel="noopener">
                          {W.marketLink}
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function Letter({ card, tenantId, initialMessage }: { card: CardData; tenantId: string; initialMessage?: string }): ReactElement {
  return (
    <section className="sl-letter" id="write">
      <span className="sl-seal" aria-hidden="true">
        {initials(card.name)}
      </span>
      <h2>{W.touch(card.profile.signature)}</h2>
      <p>{W.lede}</p>
      <CardContactForm tenantId={tenantId} {...(initialMessage !== undefined ? { initialMessage } : {})} />
    </section>
  );
}

function Contact({ site, tenantId }: { site: ShorelineData; tenantId: string }): ReactElement {
  return (
    <>
      <PageHead title={W.pageTitles.contact} />
      <main id="main" className="sl-contact">
        <Letter card={site.card} tenantId={tenantId} />
      </main>
    </>
  );
}

/** A Lite or Full page of the shoreline site. */
export function ShorelineSite({ site, page, tenantId, platformCredit = true }: { site: ShorelineData; page: ShorelinePage; tenantId: string; platformCredit?: boolean }): ReactElement {
  return (
    <Frame>
      <Bar name={site.card.name} current={page} />
      {page === 'home' && <Home site={site} />}
      {page === 'shop' && <Shop site={site} />}
      {page === 'about' && <About site={site} />}
      {page === 'events' && <Markets site={site} />}
      {page === 'contact' && <Contact site={site} tenantId={tenantId} />}
      <Footer name={site.card.name} platformCredit={platformCredit} />
    </Frame>
  );
}

/** One product's page: its photo (tap for full size), price or "Ask for price", the
 *  story, and "Ask about this" — the letter, started with the product's name. */
export function ShorelineProduct({ site, product, tenantId, platformCredit = true }: { site: ShorelineData; product: ProductView; tenantId: string; platformCredit?: boolean }): ReactElement {
  const photos = product.media.flatMap((m, i) => (m.kind === 'image' && m.url !== undefined ? [{ id: `${product.slug}-${i}`, url: m.url, caption: m.alt === '' ? product.name : m.alt }] : []));
  return (
    <Frame>
      <Bar name={site.card.name} current="shop" />
      <div className="sl-head">
        <a className="sl-back" href="/shop">
          ← {W.backToShop}
        </a>
      </div>
      <main id="main">
        <PhotoViewerProvider photos={photos}>
          <article className="sl-product">
            {photos.length > 0 && (
              <div className="sl-product-photos">
                {photos.map((ph, i) => (
                  <Snapshot key={ph.id} index={i} className="sl-print" label={S.work.open(ph.caption, i + 1)}>
                    {/* The owner's own upload, already shrunk at upload. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt={ph.caption} loading={i === 0 ? 'eager' : 'lazy'} />
                  </Snapshot>
                ))}
              </div>
            )}
            <div>
              <div className="sl-product-sheet">
                <h2>{product.name}</h2>
                {product.askForPrice === true ? (
                  <p className="sl-product-price sl-product-price--ask">{W.askForPrice}</p>
                ) : (
                  <p className="sl-product-price">{product.price}</p>
                )}
                {product.shortDescription !== undefined && product.shortDescription !== '' && <p className="sl-product-short">{product.shortDescription}</p>}
                {bioParagraphs(product.description).map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
                <a className="sl-btn" href="#write">
                  {W.askAbout}
                </a>
              </div>
              <Letter card={site.card} tenantId={tenantId} initialMessage={W.askMessage(product.name)} />
            </div>
          </article>
        </PhotoViewerProvider>
      </main>
      <Footer name={site.card.name} platformCredit={platformCredit} />
    </Frame>
  );
}

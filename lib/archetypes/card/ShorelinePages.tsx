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
import { AddToCartButton, PromoCodeForm, RemoveFromCartButton, SyncCart } from '@/lib/storefront/CartControls';
import { ShorelineCartLink } from './ShorelineCartLink';
import type { CartView, MarketShopView } from '@/lib/archetypes/content';
import { ShorelineMarketBuyer } from './ShorelineMarketBuyer';
import { ShorelineOrderForm } from './ShorelineOrderForm';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';
import { Frame, Footer, nameParts } from './ShorelineLanding';
import { bioParagraphs, initials, marketDay, type CardData } from './data';
import { featuredProducts, type ShorelineData } from './shoreline-data';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import type { Testimonial } from '@/lib/backend/testimonials/testimonial-form';

const W = S.shoreline;

export type ShorelinePage = 'home' | 'shop' | 'about' | 'events' | 'contact' | 'testimonials' | 'collection';

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
      {nameParts(name).map((part, i) =>
        part.amp ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}

function SaleBanner({ sale }: { sale: ShorelineData['sale'] }): ReactElement | null {
  if (sale === null) return null;
  return <p className="sl-sale">{W.saleBanner(sale.name, sale.off)}</p>;
}

function Bar({ name, current, cart = false }: { name: string; current: ShorelinePage | 'cart' | null; cart?: boolean }): ReactElement {
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
          {cart && (
            <li>
              <ShorelineCartLink />
            </li>
          )}
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
function ProductPrint({ product, eager, newTag }: { product: ProductView; eager: boolean; newTag: boolean }): ReactElement {
  const photo = product.media.find((m) => m.kind === 'image' && m.url !== undefined);
  return (
    <li>
      <a className="sl-print" href={`/listings/${product.slug}`}>
        {photo?.url !== undefined && (
          // The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={photo.alt === '' ? product.name : photo.alt}
            loading={eager ? 'eager' : 'lazy'}
          />
        )}
        <span className="sl-label">
          {newTag && product.isNew === true && <em className="sl-new">{W.newTag}</em>}
          <span>{product.name}</span>
          <Price product={product} />
        </span>
      </a>
    </li>
  );
}

function Price({ product }: { product: ProductView }): ReactElement {
  if (product.askForPrice === true) return <em className="sl-price sl-price--ask">{W.askForPrice}</em>;
  if (product.salePrice !== undefined) {
    return (
      <strong className="sl-price">
        <s>
          <span className="sl-sr">{W.was} </span>
          {product.price}
        </s>{' '}
        {product.salePrice}
      </strong>
    );
  }
  return <strong className="sl-price">{product.price}</strong>;
}

function Prints({ products, newTag = false }: { products: readonly ProductView[]; newTag?: boolean }): ReactElement {
  return (
    <ul className="sl-prints">
      {products.map((p, i) => (
        <ProductPrint key={p.slug} product={p} eager={i < 3} newTag={newTag} />
      ))}
    </ul>
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

function Quotes({ items }: { items: readonly Testimonial[] }): ReactElement {
  return (
    <ul className="sl-quotes">
      {items.map((t) => (
        <li key={t.id}>
          <blockquote className="sl-quote">
            <p>{t.quote}</p>
            <footer>
              {t.name}
              {t.detail !== '' && <span>{t.detail}</span>}
            </footer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

const HOME_QUOTES = 3;

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
          <section className="sl-water sl-featured" aria-labelledby="sl-featured">
            <h2 className="sl-section-h" id="sl-featured">
              {W.featured}
            </h2>
            <Prints products={featured} newTag={site.newArrivals} />
            <div className="sl-more">
              <a href="/shop">{W.seeShop}</a>
            </div>
          </section>
        )}
        {site.testimonials.length > 0 && (
          <section className="sl-water sl-featured" aria-labelledby="sl-kind">
            <h2 className="sl-section-h" id="sl-kind">
              {W.kindWords}
            </h2>
            <Quotes items={site.testimonials.slice(0, HOME_QUOTES)} />
            {site.testimonials.length > HOME_QUOTES && (
              <div className="sl-more">
                <a href="/testimonials">{W.seeMoreWords}</a>
              </div>
            )}
          </section>
        )}
        {(bio.length > 0 || p.headline !== '' || soon.length > 0) && (
          <div
            className={bio.length > 0 && soon.length > 0 ? 'sl-below' : 'sl-below sl-below--one'}
          >
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

/** Her collections as a row of links over the shelf: All, then each one. */
function CollectionLinks({ site, current }: { site: ShorelineData; current: string | null }): ReactElement | null {
  if (site.collections.length === 0) return null;
  return (
    <nav className="sl-cols" aria-label={W.collectionsLabel}>
      <a href="/shop" aria-current={current === null ? 'page' : undefined}>
        {W.allPieces}
      </a>
      {site.collections.map((c) => (
        <a key={c.slug} href={`/collections/${c.slug}`} aria-current={current === c.slug ? 'page' : undefined}>
          {c.name}
        </a>
      ))}
    </nav>
  );
}

/** The shop opens like the home page's pieces: the dusk band, "From the shelf", then
 *  everything, or one collection when she's browsing by collection. */
function Shop({ site, collection = null }: { site: ShorelineData; collection?: string | null }): ReactElement {
  const chosen = collection === null ? null : (site.collections.find((c) => c.slug === collection) ?? null);
  const products = chosen === null ? site.products : chosen.products;
  return (
    <main id="main" className="sl-water sl-featured sl-featured--page">
      <h1 className="sl-section-h">{chosen === null ? W.featured : chosen.name}</h1>
      <CollectionLinks site={site} current={chosen?.slug ?? null} />
      {products.length > 0 ? <Prints products={products} newTag={site.newArrivals} /> : <p className="sl-empty">{W.emptyShop}</p>}
    </main>
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
              const facts = [
                d.town,
                showDetails ? d.hours : '',
                showDetails && d.booth !== '' ? `${W.marketCols.booth} ${d.booth}` : '',
              ].filter((f) => f !== '');
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

function Letter({
  card,
  tenantId,
  initialMessage,
}: {
  card: CardData;
  tenantId: string;
  initialMessage?: string;
}): ReactElement {
  return (
    <section className="sl-letter" id="write">
      <span className="sl-seal" aria-hidden="true">
        {initials(card.name)}
      </span>
      <h2>{W.touch(card.profile.signature)}</h2>
      <p>{W.lede}</p>
      <CardContactForm
        tenantId={tenantId}
        {...(initialMessage !== undefined ? { initialMessage } : {})}
      />
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

function Testimonials({ site }: { site: ShorelineData }): ReactElement {
  return (
    <main id="main" className="sl-water sl-featured sl-featured--page">
      <h1 className="sl-section-h">{W.kindWords}</h1>
      <Quotes items={site.testimonials} />
    </main>
  );
}

/** A Lite or Full page of the shoreline site. */
export function ShorelineSite({
  site,
  page,
  tenantId,
  collection = null,
  platformCredit = true,
}: {
  site: ShorelineData;
  page: ShorelinePage;
  tenantId: string;
  collection?: string | null;
  platformCredit?: boolean;
}): ReactElement {
  return (
    <Frame>
      <Bar name={site.card.name} current={page} cart={site.cart} />
      <SaleBanner sale={site.sale} />
      {page === 'home' && <Home site={site} />}
      {page === 'shop' && <Shop site={site} />}
      {page === 'collection' && <Shop site={site} collection={collection} />}
      {page === 'about' && <About site={site} />}
      {page === 'events' && <Markets site={site} />}
      {page === 'contact' && <Contact site={site} tenantId={tenantId} />}
      {page === 'testimonials' && <Testimonials site={site} />}
      <Footer name={site.card.name} platformCredit={platformCredit} social={site.card.profile} />
    </Frame>
  );
}

/** One product's page: its photo (tap for full size), price or "Ask for price", the
 *  story, and "Ask about this" — the letter, started with the product's name. */
export function ShorelineProduct({
  site,
  product,
  tenantId,
  platformCredit = true,
}: {
  site: ShorelineData;
  product: ProductView;
  tenantId: string;
  platformCredit?: boolean;
}): ReactElement {
  const media = site.allPhotos ? product.media : product.media.slice(0, 1);
  const photos = media.flatMap((m, i) =>
    m.kind === 'image' && m.url !== undefined
      ? [{ id: `${product.slug}-${i}`, url: m.url, caption: m.alt === '' ? product.name : m.alt }]
      : [],
  );
  return (
    <Frame>
      <Bar name={site.card.name} current="shop" cart={site.cart} />
      <SaleBanner sale={site.sale} />
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
                  <Snapshot
                    key={ph.id}
                    index={i}
                    className="sl-print"
                    label={S.work.open(ph.caption, i + 1)}
                  >
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
                  <p className="sl-product-price">
                    <Price product={product} />
                  </p>
                )}
                {product.shortDescription !== undefined && product.shortDescription !== '' && (
                  <p className="sl-product-short">{product.shortDescription}</p>
                )}
                {bioParagraphs(product.description).map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
                {site.cart && product.askForPrice !== true && product.variations.length === 0 && product.status === 'active' && product.id !== undefined && (
                  <AddToCartButton listingId={product.id} className="sl-btn sl-btn--cart" addLabel={W.cart.add} inCartLabel={W.cart.inCart} fullLabel={W.cart.full} />
                )}
                <a className="sl-btn sl-btn--quiet" href="#write">
                  {W.askAbout}
                </a>
              </div>
              <Letter
                card={site.card}
                tenantId={tenantId}
                initialMessage={W.askMessage(product.name)}
              />
            </div>
          </article>
        </PhotoViewerProvider>
      </main>
      <Footer name={site.card.name} platformCredit={platformCredit} social={site.card.profile} />
    </Frame>
  );
}

/** The cart (Full): her pieces priced from the catalog, a discount code when promotions
 *  are on, the sums, and the letter that sends the order. Nothing is charged. */
export function ShorelineCart({ site, cart, platformCredit = true }: { site: ShorelineData; cart: CartView; platformCredit?: boolean }): ReactElement {
  const C = W.cart;
  const ready = cart.lines.filter((l) => l.available);
  const blocked = ready.length !== cart.lines.length;
  return (
    <Frame>
      <Bar name={site.card.name} current="cart" cart />
      <SaleBanner sale={site.sale} />
      <SyncCart ids={cart.lines.map((l) => l.id)} />
      <PageHead title={C.title} />
      <main id="main" className="sl-cart">
        {cart.lines.length === 0 ? (
          <div className="sl-empty">
            <p>{C.empty}</p>
            <a className="sl-btn" href="/shop">
              {C.browse}
            </a>
          </div>
        ) : (
          <div className="sl-cart-grid">
            <section className="sl-sheet sl-cart-sheet" aria-label={C.title}>
              <ul className="sl-cart-lines">
                {cart.lines.map((l) => (
                  <li key={l.id} className={l.available ? 'sl-cart-line' : 'sl-cart-line sl-cart-line--gone'}>
                    {l.photo?.url !== undefined && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photo.url} alt="" loading="lazy" />
                    )}
                    <div>
                      <a href={`/listings/${l.slug}`}>{l.name}</a>
                      {!l.available && <span className="sl-cart-gone">{C.gone}</span>}
                    </div>
                    <span className="sl-cart-price">
                      {l.salePrice === undefined ? (
                        l.price
                      ) : (
                        <>
                          <s>{l.price}</s> {l.salePrice}
                        </>
                      )}
                    </span>
                    <RemoveFromCartButton listingId={l.id} className="sl-cart-out" label={C.remove} ariaLabel={C.removeLabel(l.name)} />
                  </li>
                ))}
              </ul>
              {cart.codes && (
                <div className="sl-cart-code">
                  <PromoCodeForm current={cart.code?.value ?? null} className="sl-code" labels={{ field: C.codeField, apply: C.codeApply, applying: C.codeApplying, remove: C.codeRemove }} />
                  {cart.code !== undefined && (
                    <p role={cart.code.applied ? 'status' : 'alert'}>{cart.code.applied ? C.codeApplied(cart.code.value) : (cart.code.message ?? '')}</p>
                  )}
                </div>
              )}
              <dl className="sl-cart-sum">
                {cart.discount !== undefined && (
                  <>
                    <div>
                      <dt>{C.subtotal}</dt>
                      <dd>{cart.subtotal}</dd>
                    </div>
                    <div>
                      <dt>{C.discount(cart.discount.label)}</dt>
                      <dd>−{cart.discount.amount}</dd>
                    </div>
                  </>
                )}
                <div className="sl-cart-total">
                  <dt>{C.total}</dt>
                  <dd>{cart.total}</dd>
                </div>
              </dl>
            </section>
            <section className="sl-letter sl-cart-letter" aria-labelledby="sl-send">
              <h2 id="sl-send">{C.sendTitle}</h2>
              <p>{C.sendLede}</p>
              {blocked ? (
                <p className="bc-form__status" role="alert">
                  {C.fix}
                </p>
              ) : (
                <ShorelineOrderForm listingIds={ready.map((l) => l.id)} code={cart.code?.applied === true ? cart.code.value : null} />
              )}
            </section>
          </div>
        )}
      </main>
      <Footer name={site.card.name} platformCredit={platformCredit} social={site.card.profile} />
    </Frame>
  );
}

/** A market's own page (Market POS): the buyer scans the code at her table and buys
 *  one of the pieces she brought. No menu and no footer: nothing leads away while
 *  they're buying (Alex, 2026-10-12). One "Visit the shop" link shows only when
 *  there's nothing to buy (before, after, canceled) or once they're done. */
export function ShorelineMarket({
  site,
  market,
}: {
  site: ShorelineData;
  market: MarketShopView;
  /** Accepted like every page, but unused: the market page has no footer. */
  platformCredit?: boolean;
}): ReactElement {
  const M = W.market;
  const day = marketDay({
    id: market.marketId,
    date: market.date,
    endDate: market.endDate,
    name: market.name,
    town: market.town,
    hours: '',
    address: '',
    booth: market.booth,
    url: '',
    canceled: market.state === 'canceled',
    kind: '',
  });
  const where = M.where(market.town, market.booth);
  return (
    <Frame>
      <header className="sl-bar">
        <span className="sl-bar-name">
          <Name name={site.card.name} />
        </span>
      </header>
      <SaleBanner sale={site.sale} />
      <PageHead title={market.name} />
      <main id="main" className="sl-mk">
        <p className="sl-mk-when">
          {day}
          {where !== '' && ` · ${where}`}
        </p>
        {market.state === 'open' &&
          (market.methods.length === 0 ? (
            <p className="sl-empty">{M.noPay}</p>
          ) : (
            <div className="sl-mk-buy">
              <ShorelineMarketBuyer
                marketId={market.marketId}
                pieces={market.pieces}
                methods={market.methods}
              />
            </div>
          ))}
        {market.state === 'before' && (
          <>
            <p className="sl-mk-lede">{M.before}</p>
            {market.pieces.length > 0 ? <Prints products={market.pieces} /> : <p className="sl-empty">{M.none}</p>}
            <p className="sl-empty">
              <a className="sl-btn" href="/shop">
                {M.toShop}
              </a>
            </p>
          </>
        )}
        {(market.state === 'after' || market.state === 'canceled') && (
          <div className="sl-empty">
            <p>{market.state === 'after' ? M.after : M.canceled}</p>
            <a className="sl-btn" href="/shop">
              {M.toShop}
            </a>
          </div>
        )}
      </main>
    </Frame>
  );
}

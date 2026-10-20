/**
 * Boutique, nursery design — a hand-built maker shop laid out as a hospital
 * nursery (see nursery-styles.ts). The home: the opening with the first baby in
 * an arched window and her bassinet card swinging beside it, the letter-bead
 * bracelet, the nursery window, the artist's letter, visiting hours (market
 * dates) and the gift-tag contact card. The nursery page shows every baby; each
 * baby's own page is a certificate of birth.
 *
 * Every word the owner wrote comes from `data` (About you, Market dates) or the
 * catalog, and so does every other word: the site's own words (`data.words`).
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { CartView, MarketShopView, ProductView } from '@/lib/archetypes/content';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { CardContactForm } from '@/lib/archetypes/card/CardContactForm';
import { fill } from '@/lib/site-words/words';
import type { NurseryWords } from './words';
import { NURSERY_FONTS_HREF, nurseryCss } from './nursery-styles';
import { NurseryPhotos } from './NurseryPhotos';
import { NurseryMenu } from './NurseryMenu';
import { AddToCartButton, PromoCodeForm, RemoveFromCartButton, SyncCart } from '@/lib/storefront/CartControls';
import { NurseryOrderForm } from './NurseryOrderForm';
import { NurseryMarketBuyer } from './NurseryMarketBuyer';
import { PhotoViewerProvider, Snapshot } from '@/lib/archetypes/card/PhotoViewer';
import {
  bioParagraphs,
  cardTint,
  clotheslines,
  homeBabies,
  lowestPrice,
  photoLabel,
  visitDay,
  waitingCount,
  type BoutiqueData,
} from './data';

const NURSERY_ID = 'nursery';
const GONE_ID = 'gone';
const ARTIST_ID = 'artist';
const VISIT_ID = 'visit';
const TOUCH_ID = 'touch';
const BORN_ID = 'just-born';
const MAIN_ID = 'nn-main';
const BABY_CLASS = 'nn-baby';
const VISIT_CANCELED_CLASS = 'nn-visits__canceled';

/** A maps search for the market's address, which every phone opens in its maps app. */
function mapsLink(address: string, town: string): string {
  const q = town === '' || address.toLowerCase().includes(town.toLowerCase()) ? address : `${address}, ${town}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

const ADOPTED_CLASS = ['nn-baby', 'nn-baby--adopted'].join(' ');
const BEAD_CLASS = 'nn-bead';
const HEART_CLASS = ['nn-bead', 'nn-bead--heart'].join(' ');

type Chrome = { data: BoutiqueData; logoUrl?: string | undefined };

export function Frame({
  chrome,
  children,
  onHome,
}: {
  chrome: Chrome;
  children: ReactNode;
  onHome: boolean;
}): ReactElement {
  const { data, logoUrl } = chrome;
  const w = data.words;
  const at = (id: string): string => (onHome ? `#${id}` : `/#${id}`);
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={NURSERY_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: nurseryCss() }} />
      <div className="nn" data-design="nursery">
        <a className="nn-skip" href={`#${MAIN_ID}`}>
          {w.nav.nursery}
        </a>
        <header className="nn-top">
          <div className="nn-wrap nn-top__in">
            <Link className="nn-brand" href="/" aria-label={fill(w.nav.home, { name: data.name })}>
              {logoUrl !== undefined ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="nn-brand__logo" src={logoUrl} alt={data.name} />
              ) : (
                <span className="nn-brand__name">{data.name}</span>
              )}
            </Link>
            <NurseryMenu
              links={[
                { href: '/shop', label: w.nav.nursery },
                ...(data.gone.length > 0 ? [{ href: at(GONE_ID), label: w.nav.gone }] : []),
                { href: at(ARTIST_ID), label: w.nav.artist },
                ...(data.dates.length > 0 ? [{ href: at(VISIT_ID), label: w.nav.visit }] : []),
                { href: at(TOUCH_ID), label: w.nav.touch, cta: true },
              ]}
              w={w.nav}
              cartWords={w.cart}
              cart={data.cart}
            />
          </div>
        </header>
        <main id={MAIN_ID}>
          {data.sale !== null && (
            <p className="nn-salebar">
              {fill(w.sale.banner, { name: data.sale.name, percent: data.sale.percentOff })}
              {data.sale.endsOn !== null && (
                <span>
                  {w.separator}
                  {fill(w.sale.until, { day: saleDay(data.sale.endsOn, w.visit) })}
                </span>
              )}
            </p>
          )}
          {children}
        </main>
        <footer className="nn-foot">
          <div className="nn-wrap nn-foot__in">
            <span>{fill(w.footer.year, { year: new Date().getFullYear(), name: data.name })}</span>
            <span className="nn-foot__legal">
              <Link href="/terms">{w.footer.terms}</Link>
              <Link href="/privacy">{w.footer.privacy}</Link>
            </span>
            <a href={PLATFORM_URL}>{w.footer.empowered}</a>
          </div>
        </footer>
      </div>
    </>
  );
}

/** A price, or the full price struck through beside the sale price. */
/** "Oct 31" for the sale banner, read on the day itself. */
function saleDay(date: string, w: NurseryWords['visit']): string {
  return new Intl.DateTimeFormat(w.locale === '' ? undefined : w.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function Fee({ baby, was }: { baby: ProductView; was: string }): ReactElement {
  if (baby.salePrice === undefined) return <>{baby.price}</>;
  return (
    <>
      <s className="nn-was">
        <span className="nn-sr">{was} </span>
        {baby.price}
      </s>{' '}
      {baby.salePrice}
    </>
  );
}

function BassinetCard({ baby, tint, w }: { baby: ProductView; tint: string; w: NurseryWords }): ReactElement {
  return (
    <div className={`nn-card nn-card--${tint}`}>
      <div className="nn-card__top" aria-hidden="true" />
      <p className="nn-card__hello">{w.card.hello}</p>
      <p className="nn-card__name">{baby.name}</p>
      {baby.shortDescription !== undefined && baby.shortDescription !== '' && (
        <p className="nn-card__desc">{baby.shortDescription}</p>
      )}
      <span className="nn-card__fee">
        {w.card.fee}
        <b>
          <Fee baby={baby} was={w.sale.was} />
        </b>
      </span>
    </div>
  );
}

function Nursery({ babies, ribbons, w }: { babies: ProductView[]; ribbons: boolean; w: NurseryWords }): ReactElement {
  if (babies.length === 0) return <p className="nn-empty">{w.nursery.empty}</p>;
  return (
    <div className="nn-glass">
      <ul className="nn-grid" role="list">
        {babies.map((b, i) => {
          const adopted = b.status === 'sold_out';
          const photo = b.media.find((m) => m.kind === 'image' && m.url !== undefined);
          return (
            <li key={b.slug} className="nn-grid__item">
              <a
                className={adopted ? ADOPTED_CLASS : BABY_CLASS}
                href={`/listings/${b.slug}`}
                aria-label={fill(w.card.open, { name: b.name })}
              >
                <div className="nn-baby__crib">
                  {photo !== undefined && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.alt} loading="lazy" />
                  )}
                </div>
                {adopted && <span className="nn-stamp">{w.card.adopted}</span>}
                {ribbons && b.isNew === true && <span className="nn-newborn">{w.born.ribbon}</span>}
                <BassinetCard baby={b} tint={cardTint(i)} w={w} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Just born: the babies the owner ticked new, each as a birth announcement. */
function JustBorn({ data, babies }: { data: BoutiqueData; babies: ProductView[] }): ReactElement | null {
  const born = data.newArrivals ? babies.filter((b) => b.isNew === true) : [];
  if (born.length === 0) return null;
  const w = data.words;
  return (
    <section className="nn-sec nn-born" id={BORN_ID} aria-labelledby="nn-born-h">
      <div className="nn-wrap">
        <span className="nn-script-tag">{w.born.tag}</span>
        <h2 className="nn-h2" id="nn-born-h">
          {w.born.title}
        </h2>
        <ul className="nn-announce" role="list">
          {born.map((b, i) => {
            const photo = b.media.find((m) => m.kind === 'image' && m.url !== undefined);
            return (
              <li key={b.slug}>
                <a className="nn-ann" data-tint={cardTint(i)} href={`/listings/${b.slug}`} aria-label={fill(w.card.open, { name: b.name })}>
                  <span className="nn-ann__welcome">{w.born.welcome}</span>
                  <span className="nn-ann__photo">
                    {photo !== undefined && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt={photo.alt} loading="lazy" />
                    )}
                  </span>
                  <span className="nn-ann__name">{b.name}</span>
                  <span className="nn-ann__born">{fill(w.born.bornAt, { shop: data.name })}</span>
                  {b.status === 'sold_out' ? (
                    <span className="nn-ann__fee">{w.card.adopted}</span>
                  ) : (
                    <span className="nn-ann__fee">
                      <Fee baby={b} was={w.sale.was} />
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** The bracelet's beads: each word of the owner's "what I make", hearts between. */
function Beads({ words, w }: { words: string[]; w: NurseryWords }): ReactElement | null {
  if (words.length === 0) return null;
  const beads = words.flatMap((word, wi) => [
    ...[...word].map((ch, ci) =>
      ch === ' '
        ? { k: `${wi}-${ci}`, kind: 'gap' as const, ch: '' }
        : { k: `${wi}-${ci}`, kind: 'letter' as const, ch: ch.toUpperCase() },
    ),
    { k: `${wi}-h`, kind: 'heart' as const, ch: w.beads.heart },
  ]);
  const run = [...beads, ...beads];
  return (
    <div className="nn-beads">
      <p className="nn-sr">{words.join(w.separator)}</p>
      <div className="nn-beads__track" aria-hidden="true">
        {run.map((b, i) =>
          b.kind === 'gap' ? (
            <span key={`${b.k}-${i}`} className="nn-bead nn-bead--gap" />
          ) : (
            <span
              key={`${b.k}-${i}`}
              className={b.kind === 'heart' ? HEART_CLASS : BEAD_CLASS}
              data-tint={cardTint(i)}
            >
              {b.ch}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/** Past babies on a clothesline: each photo pegged up with its caption, the line
 *  sagging in short runs. A photo opens full size in the shared viewer. */
function GoneHome({ photos, w }: { photos: BoutiqueData['gone']; w: NurseryWords }): ReactElement | null {
  if (photos.length === 0) return null;
  return (
    <section className="nn-sec nn-gone" id={GONE_ID} aria-labelledby="nn-gone-h">
      <div className="nn-wrap">
        <span className="nn-script-tag">{w.gone.tag}</span>
        <h2 className="nn-h2" id="nn-gone-h">
          {w.gone.title}
        </h2>
        <PhotoViewerProvider photos={photos} w={w.lightbox}>
          {clotheslines(photos).map((line, li) => (
            <ul key={li} className="nn-line" role="list">
              {line.map((p, i) => {
                const n = li * 4 + i;
                return (
                  <li key={p.id} className="nn-peg">
                    <Snapshot index={n} className="nn-print" label={photoLabel(p.caption, n + 1, w.gone)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" loading="lazy" />
                      {p.caption !== '' && <span className="nn-print__cap">{p.caption}</span>}
                    </Snapshot>
                  </li>
                );
              })}
            </ul>
          ))}
        </PhotoViewerProvider>
      </div>
    </section>
  );
}

function Touch({ data, tenantId }: { data: BoutiqueData; tenantId: string }): ReactElement {
  const { profile, words: w } = data;
  return (
    <section className="nn-sec" id={TOUCH_ID} aria-labelledby="nn-touch-h">
      <div className="nn-wrap">
        <div className="nn-gift">
          <div className="nn-gift__side">
            <span className="nn-script-tag">{w.touch.tag}</span>
            <h2 className="nn-h2" id="nn-touch-h">
              {w.touch.title}
            </h2>
            <p>{w.touch.lede}</p>
            <ul className="nn-reach">
              {profile.phone !== '' && (
                <li>
                  <small>{w.touch.call}</small>
                  <a href={`tel:${dialable(profile.phone)}`}>{profile.phone}</a>
                </li>
              )}
              {profile.facebookUrl !== '' && (
                <li>
                  <a href={profile.facebookUrl} rel="noopener">
                    {w.touch.facebook}
                  </a>
                </li>
              )}
              {profile.instagramUrl !== '' && (
                <li>
                  <a href={profile.instagramUrl} rel="noopener">
                    {w.touch.instagram}
                  </a>
                </li>
              )}
            </ul>
            <span className="nn-gift__hole" aria-hidden="true" />
          </div>
          <div className="nn-gift__form">
            <CardContactForm tenantId={tenantId} w={w.form} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function NurseryHome({
  data,
  products,
  tenantId,
  logoUrl,
}: {
  data: BoutiqueData;
  products: ProductView[];
  tenantId: string;
  logoUrl?: string | undefined;
}): ReactElement {
  const { profile, words: w } = data;
  const babies = homeBabies(products);
  const first = babies[0];
  const firstPhoto = first?.media.find((m) => m.kind === 'image' && m.url !== undefined);
  const from = lowestPrice(products);
  const words = profile.makes.length > 0 ? profile.makes : [data.name];
  const bio = bioParagraphs(profile.bio);
  return (
    <Frame chrome={{ data, logoUrl }} onHome>
      <section className="nn-hero" aria-labelledby="nn-hero-h">
        <div className="nn-wrap nn-hero__grid">
          <div>
            {profile.kicker !== '' && <span className="nn-band nn-rise">{profile.kicker}</span>}
            <h1 className="nn-hero__name nn-rise nn-rise--1" id="nn-hero-h">
              {data.name}
            </h1>
            {profile.headline !== '' && (
              <p className="nn-hero__head nn-rise nn-rise--2">{profile.headline}</p>
            )}
            <div className="nn-hero__ctas nn-rise nn-rise--3">
              <a className="nn-btn" href={`#${NURSERY_ID}`}>
                {w.hero.meet}
              </a>
              {from !== null && <span className="nn-tag">{fill(w.hero.from, { price: from })}</span>}
            </div>
          </div>
          {first !== undefined && firstPhoto !== undefined && (
            <div className="nn-window nn-rise nn-rise--4">
              <div className="nn-window__arch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={firstPhoto.url} alt={firstPhoto.alt} />
              </div>
              <a
                className="nn-hang"
                href={`/listings/${first.slug}`}
                aria-label={fill(w.card.open, { name: first.name })}
              >
                <BassinetCard baby={first} tint="blush" w={w} />
              </a>
            </div>
          )}
        </div>
      </section>

      <Beads words={words} w={w} />

      <JustBorn data={data} babies={products} />

      <section className="nn-sec" id={NURSERY_ID} aria-labelledby="nn-nursery-h">
        <div className="nn-wrap">
          <div className="nn-nursery__head">
            <div>
              <span className="nn-script-tag">{w.nursery.tag}</span>
              <h2 className="nn-h2" id="nn-nursery-h">
                {w.nursery.title}
              </h2>
            </div>
            {products.length > 0 && (
              <span className="nn-count">
                {waitingCount(products.filter((p) => p.status !== 'sold_out').length, w.nursery)}
              </span>
            )}
          </div>
          <Nursery ribbons={data.newArrivals} babies={babies} w={w} />
          {products.length > babies.length && (
            <div className="nn-more">
              <a className="nn-btn" href="/shop">
                {fill(w.nursery.all, { n: products.length })}
              </a>
            </div>
          )}
        </div>
      </section>

      <GoneHome photos={data.gone} w={w} />

      {(bio.length > 0 || profile.aboutTitle !== '') && (
        <section className="nn-sec" id={ARTIST_ID} aria-labelledby="nn-artist-h">
          <div className="nn-wrap">
            <article className="nn-letter">
              {logoUrl !== undefined && (
                <span className="nn-postmark" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="" />
                </span>
              )}
              <span className="nn-script-tag">{w.artist.tag}</span>
              <h2 className="nn-h2" id="nn-artist-h">
                {profile.aboutTitle !== '' ? profile.aboutTitle : data.name}
              </h2>
              {bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {profile.signature !== '' && <p className="nn-sign">{profile.signature}</p>}
              {profile.makes.length > 0 && (
                <div className="nn-makes">
                  {profile.makes.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      {data.dates.length > 0 && (
        <section className="nn-sec" id={VISIT_ID} aria-labelledby="nn-visit-h">
          <div className="nn-wrap">
            <div className="nn-sign-board">
              <div className="nn-sign-board__in">
                <span className="nn-script-tag">{w.visit.tag}</span>
                <h2 className="nn-sign-board__title" id="nn-visit-h">
                  {w.visit.title}
                </h2>
                <ul className="nn-visits" role="list">
                  {data.dates.map((d) => {
                    const { weekday, day } = visitDay(d, w.visit);
                    const details = [d.hours, d.booth].filter((s) => s !== '');
                    return (
                      <li key={d.id} className={d.canceled ? VISIT_CANCELED_CLASS : undefined}>
                        <span className="nn-visits__when">
                          {weekday}
                          <b>{day}</b>
                        </span>
                        <span className="nn-visits__what">
                          {d.name}
                          {d.canceled && <span className="nn-visits__off">{w.visit.canceled}</span>}
                          {!d.canceled && details.length > 0 && <small>{details.join(w.separator)}</small>}
                          {!d.canceled && (d.address !== '' || d.url !== '') && (
                            <span className="nn-visits__links">
                              {d.address !== '' && (
                                <a href={mapsLink(d.address, d.town)} rel="noopener" target="_blank" aria-label={fill(w.visit.directionsLabel, { market: d.name })}>
                                  {w.visit.directions}
                                </a>
                              )}
                              {d.url !== '' && (
                                <a href={d.url} rel="noopener" target="_blank" aria-label={fill(w.visit.websiteLabel, { market: d.name })}>
                                  {w.visit.website}
                                </a>
                              )}
                            </span>
                          )}
                        </span>
                        {d.town !== '' && <span className="nn-visits__where">{d.town}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <Touch data={data} tenantId={tenantId} />
    </Frame>
  );
}

export function NurseryShop({
  data,
  products,
  logoUrl,
}: {
  data: BoutiqueData;
  products: ProductView[];
  logoUrl?: string | undefined;
}): ReactElement {
  const w = data.words;
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <section className="nn-sec" aria-labelledby="nn-shop-h">
        <div className="nn-wrap">
          <div className="nn-nursery__head">
            <div>
              <span className="nn-script-tag">{w.nursery.tag}</span>
              <h1 className="nn-h2" id="nn-shop-h">
                {w.shop.title}
              </h1>
            </div>
            {products.length > 0 && (
              <span className="nn-count">
                {waitingCount(products.filter((p) => p.status !== 'sold_out').length, w.nursery)}
              </span>
            )}
          </div>
          <Nursery ribbons={data.newArrivals} babies={products} w={w} />
        </div>
      </section>
    </Frame>
  );
}

/** A baby the cart can take: the cart is on and there are no options to choose. */
function canCart(data: BoutiqueData, product: ProductView): boolean {
  return data.cart && product.variations.length === 0;
}

export function NurseryCertificate({
  data,
  product,
  logoUrl,
}: {
  data: BoutiqueData;
  product: ProductView;
  logoUrl?: string | undefined;
}): ReactElement {
  const adopted = product.status === 'sold_out';
  const paragraphs = bioParagraphs(product.description);
  const w = data.words;
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <section className="nn-cert-page">
        <div className="nn-wrap">
          <a className="nn-back" href="/shop">
            {w.certificate.back}
          </a>
          <div className="nn-cert-grid">
            <NurseryPhotos name={product.name} media={product.media} w={w.certificate} />
            <article className="nn-cert" aria-labelledby="nn-cert-h">
              <div className="nn-cert__in">
                <p className="nn-cert__title">{w.certificate.title}</p>
                <p className="nn-cert__hello">{w.card.hello}</p>
                <h1 className="nn-cert__name" id="nn-cert-h">
                  {product.name}
                </h1>
                {product.shortDescription !== undefined && product.shortDescription !== '' && (
                  <p className="nn-cert__short">{product.shortDescription}</p>
                )}
                <dl className="nn-fields">
                  <div>
                    <dt>{w.certificate.born}</dt>
                    <dd>{data.name}</dd>
                  </div>
                  {data.profile.signature !== '' && (
                    <div>
                      <dt>{w.certificate.artist}</dt>
                      <dd>{data.profile.signature}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{w.certificate.status}</dt>
                    <dd>{adopted ? w.card.adopted : w.card.ready}</dd>
                  </div>
                  <div>
                    <dt>{w.certificate.fee}</dt>
                    <dd className="nn-fee">
                      <Fee baby={product} was={w.sale.was} />
                    </dd>
                  </div>
                </dl>
                {paragraphs.length > 0 && (
                  <div className="nn-cert__desc">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
                {!adopted && canCart(data, product) && product.id !== undefined && (
                  <div className="nn-cert__buy">
                    <AddToCartButton
                      listingId={product.id}
                      className="nn-btn"
                      addLabel={w.cart.add}
                      inCartLabel={w.cart.inCart}
                      fullLabel={w.cart.full}
                    />
                    <a className="nn-cert__ask" href={`/#${TOUCH_ID}`}>
                      {fill(w.cart.ask, { name: product.name })}
                    </a>
                  </div>
                )}
                {!adopted && !canCart(data, product) && (
                  <a className="nn-btn" href={`/#${TOUCH_ID}`}>
                    {fill(w.certificate.adopt, { name: product.name })}
                  </a>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>
    </Frame>
  );
}

export function NurseryContentPage({
  data,
  logoUrl,
  html,
  title,
  body,
}: {
  data: BoutiqueData;
  logoUrl?: string | undefined;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
}): ReactElement {
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <article className="nn-plain">
        {title !== undefined && <h1>{title}</h1>}
        {html !== undefined ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          (body ?? []).map((p, i) => <p key={i}>{p}</p>)
        )}
      </article>
    </Frame>
  );
}

/** The cart: the babies going home, each with a way to take it out, the total,
 *  and the gift-tag form that sends the order. */
export function NurseryCart({
  data,
  cart,
  logoUrl,
}: {
  data: BoutiqueData;
  cart: CartView;
  logoUrl?: string | undefined;
}): ReactElement {
  const ready = cart.lines.filter((l) => l.available);
  const blocked = ready.length !== cart.lines.length;
  const w = data.words;
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <SyncCart ids={cart.lines.map((l) => l.id)} />
      <section className="nn-cart-page" aria-labelledby="nn-cart-h">
        <div className="nn-wrap">
          <a className="nn-back" href="/shop">
            {w.certificate.back}
          </a>
          <p className="nn-tag nn-cart__tag">{w.cart.tag}</p>
          <h1 className="nn-h2" id="nn-cart-h">
            {w.cart.title}
          </h1>
          {cart.lines.length === 0 ? (
            <div className="nn-cart__empty">
              <p>{w.cart.empty}</p>
              <a className="nn-btn" href="/shop">
                {w.cart.browse}
              </a>
            </div>
          ) : (
            <div className="nn-cart">
              <ul className="nn-cart__list">
                {cart.lines.map((l, i) => (
                  <li key={l.id} className={l.available ? LINE_CLASS : LINE_GONE_CLASS} data-tint={cardTint(i)}>
                    <a className="nn-cart__photo" href={`/listings/${l.slug}`} aria-hidden="true" tabIndex={-1}>
                      {l.photo?.url !== undefined && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.photo.url} alt={l.photo.alt} loading="lazy" />
                      )}
                    </a>
                    <div className="nn-cart__who">
                      <span className="nn-cart__hello">{w.card.hello}</span>
                      <a className="nn-cart__name" href={`/listings/${l.slug}`}>
                        {l.name}
                      </a>
                      {!l.available && <span className="nn-cart__gone">{w.cart.gone}</span>}
                    </div>
                    <span className="nn-cart__fee">
                      {l.salePrice === undefined ? (
                        l.price
                      ) : (
                        <>
                          <s className="nn-was">
                            <span className="nn-sr">{w.sale.was} </span>
                            {l.price}
                          </s>{' '}
                          {l.salePrice}
                        </>
                      )}
                    </span>
                    <RemoveFromCartButton listingId={l.id} className="nn-cart__out" label={w.cart.remove} ariaLabel={fill(w.cart.removeLabel, { name: l.name })} />
                  </li>
                ))}
              </ul>
              <div className="nn-cart__sums">
                {cart.codes && (
                  <div className="nn-cart__code">
                    <PromoCodeForm
                      current={cart.code?.value ?? null}
                      className="nn-code"
                      labels={{ field: w.cart.codeField, apply: w.cart.codeApply, applying: w.cart.codeApplying, remove: w.cart.codeRemove }}
                    />
                    {cart.code !== undefined && (
                      <p className="nn-code__msg" role={cart.code.applied ? 'status' : 'alert'}>
                        {cart.code.applied ? fill(w.cart.codeApplied, { code: cart.code.value }) : (cart.code.message ?? '')}
                      </p>
                    )}
                  </div>
                )}
                <dl className="nn-cart__sum">
                  {cart.discount !== undefined && (
                    <>
                      <div>
                        <dt>{w.cart.subtotal}</dt>
                        <dd>{cart.subtotal}</dd>
                      </div>
                      <div className="nn-cart__off">
                        <dt>{fill(w.cart.discount, { label: cart.discount.label })}</dt>
                        <dd>{fill(w.cart.off, { amount: cart.discount.amount })}</dd>
                      </div>
                    </>
                  )}
                  <div className="nn-cart__total">
                    <dt>{w.cart.total}</dt>
                    <dd>{cart.total}</dd>
                  </div>
                </dl>
              </div>
              <div className="nn-gift nn-cart__send">
                <div className="nn-gift__side">
                  <h2 className="nn-h2">{w.cart.sendTitle}</h2>
                  <p>{w.cart.sendLede}</p>
                </div>
                <div className="nn-gift__form">
                  {blocked ? (
                    <p className="bc-form__status" role="alert">
                      {w.cart.fix}
                    </p>
                  ) : (
                    <NurseryOrderForm listingIds={ready.map((l) => l.id)} w={w.cart} code={cart.code?.applied === true ? cart.code.value : null} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Frame>
  );
}

const LINE_CLASS = 'nn-cart__line';
const LINE_GONE_CLASS = ['nn-cart__line', 'nn-cart__line--gone'].join(' ');

/** A market's own page, reached from the code at her table: the market's name and
 *  where to find her, then the buyer's steps while it's on, or what's coming /
 *  what happened otherwise. */
export function NurseryMarket({
  data,
  market,
  logoUrl,
}: {
  data: BoutiqueData;
  market: MarketShopView;
  logoUrl?: string | undefined;
}): ReactElement {
  const w = data.words;
  const { weekday, day } = visitDay({
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
  }, w.visit);
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <section className="nn-mk" aria-labelledby="nn-mk-h">
        <div className="nn-wrap">
          <span className="nn-script-tag">{w.market.tag}</span>
          <h1 className="nn-h2" id="nn-mk-h">
            {market.name}
          </h1>
          <p className="nn-mk-when">
            {[weekday, day, market.town, market.booth].filter((s) => s !== '').join(w.separator)}
          </p>
          {market.state === 'open' &&
            (market.methods.length === 0 ? (
              <p className="nn-mk-note">{w.market.noPay}</p>
            ) : (
              <NurseryMarketBuyer marketId={market.marketId} pieces={market.pieces} stock={market.stock} methods={market.methods} w={w.market} />
            ))}
          {market.state === 'before' && (
            <>
              <p className="nn-mk-note">{w.market.before}</p>
              <Nursery ribbons={data.newArrivals} babies={market.pieces} w={w} />
            </>
          )}
          {(market.state === 'after' || market.state === 'canceled') && (
            <div className="nn-mk-card">
              <p>{market.state === 'after' ? w.market.after : w.market.canceled}</p>
              <a className="nn-btn" href="/shop">
                {w.market.toSite}
              </a>
            </div>
          )}
        </div>
      </section>
    </Frame>
  );
}

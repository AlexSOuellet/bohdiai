/**
 * Boutique, nursery design — a hand-built maker shop laid out as a hospital
 * nursery (see nursery-styles.ts). The home: the opening with the first baby in
 * an arched window and her bassinet card swinging beside it, the letter-bead
 * bracelet, the nursery window, the artist's letter, visiting hours (market
 * dates) and the gift-tag contact card. The nursery page shows every baby; each
 * baby's own page is a certificate of birth.
 *
 * Every word the owner wrote comes from `data` (About you, Market dates) or the
 * catalog; the renderer adds only NURSERY_STRINGS.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { ProductView } from '@/lib/archetypes/content';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { CardContactForm } from '@/lib/archetypes/card/CardContactForm';
import { NURSERY_STRINGS as S } from './strings';
import { NURSERY_FONTS_HREF, nurseryCss } from './nursery-styles';
import { NurseryPhotos } from './NurseryPhotos';
import { NurseryMenu } from './NurseryMenu';
import { PhotoViewerProvider, Snapshot } from '@/lib/archetypes/card/PhotoViewer';
import {
  bioParagraphs,
  cardTint,
  clotheslines,
  homeBabies,
  lowestPrice,
  visitDay,
  type BoutiqueData,
} from './data';

const NURSERY_ID = 'nursery';
const GONE_ID = 'gone';
const ARTIST_ID = 'artist';
const VISIT_ID = 'visit';
const TOUCH_ID = 'touch';
const MAIN_ID = 'nn-main';
const BABY_CLASS = 'nn-baby';
const ADOPTED_CLASS = ['nn-baby', 'nn-baby--adopted'].join(' ');
const BEAD_CLASS = 'nn-bead';
const HEART_CLASS = ['nn-bead', 'nn-bead--heart'].join(' ');

type Chrome = { data: BoutiqueData; logoUrl?: string | undefined };

function Frame({
  chrome,
  children,
  onHome,
}: {
  chrome: Chrome;
  children: ReactNode;
  onHome: boolean;
}): ReactElement {
  const { data, logoUrl } = chrome;
  const at = (id: string): string => (onHome ? `#${id}` : `/#${id}`);
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={NURSERY_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: nurseryCss() }} />
      <div className="nn" data-design="nursery">
        <a className="nn-skip" href={`#${MAIN_ID}`}>
          {S.nav.nursery}
        </a>
        <header className="nn-top">
          <div className="nn-wrap nn-top__in">
            <Link className="nn-brand" href="/" aria-label={`${data.name} — ${S.nav.home}`}>
              {logoUrl !== undefined ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="nn-brand__logo" src={logoUrl} alt={data.name} />
              ) : (
                <span className="nn-brand__name">{data.name}</span>
              )}
            </Link>
            <NurseryMenu
              links={[
                { href: '/shop', label: S.nav.nursery },
                ...(data.gone.length > 0 ? [{ href: at(GONE_ID), label: S.nav.gone }] : []),
                { href: at(ARTIST_ID), label: S.nav.artist },
                ...(data.dates.length > 0 ? [{ href: at(VISIT_ID), label: S.nav.visit }] : []),
                { href: at(TOUCH_ID), label: S.nav.touch, cta: true },
              ]}
            />
          </div>
        </header>
        <main id={MAIN_ID}>{children}</main>
        <footer className="nn-foot">
          <div className="nn-wrap nn-foot__in">
            <span>{S.footer.year(new Date().getFullYear(), data.name)}</span>
            <span className="nn-foot__legal">
              <Link href="/terms">{S.footer.terms}</Link>
              <Link href="/privacy">{S.footer.privacy}</Link>
            </span>
            <a href={PLATFORM_URL}>{S.footer.empowered}</a>
          </div>
        </footer>
      </div>
    </>
  );
}

function BassinetCard({ baby, tint }: { baby: ProductView; tint: string }): ReactElement {
  return (
    <div className={`nn-card nn-card--${tint}`}>
      <div className="nn-card__top" aria-hidden="true" />
      <p className="nn-card__hello">{S.card.hello}</p>
      <p className="nn-card__name">{baby.name}</p>
      {baby.shortDescription !== undefined && baby.shortDescription !== '' && (
        <p className="nn-card__desc">{baby.shortDescription}</p>
      )}
      <span className="nn-card__fee">
        {S.card.fee}
        <b>{baby.price}</b>
      </span>
    </div>
  );
}

function Nursery({ babies }: { babies: ProductView[] }): ReactElement {
  if (babies.length === 0) return <p className="nn-empty">{S.nursery.empty}</p>;
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
                aria-label={S.card.open(b.name)}
              >
                <div className="nn-baby__crib">
                  {photo !== undefined && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.alt} loading="lazy" />
                  )}
                </div>
                {adopted && <span className="nn-stamp">{S.card.adopted}</span>}
                <BassinetCard baby={b} tint={cardTint(i)} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The bracelet's beads: each word of the owner's "what I make", hearts between. */
function Beads({ words }: { words: string[] }): ReactElement | null {
  if (words.length === 0) return null;
  const beads = words.flatMap((w, wi) => [
    ...[...w].map((ch, ci) =>
      ch === ' '
        ? { k: `${wi}-${ci}`, kind: 'gap' as const, ch: '' }
        : { k: `${wi}-${ci}`, kind: 'letter' as const, ch: ch.toUpperCase() },
    ),
    { k: `${wi}-h`, kind: 'heart' as const, ch: '♥' },
  ]);
  const run = [...beads, ...beads];
  return (
    <div className="nn-beads">
      <p className="nn-sr">{words.join(' · ')}</p>
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
function GoneHome({ photos }: { photos: BoutiqueData['gone'] }): ReactElement | null {
  if (photos.length === 0) return null;
  return (
    <section className="nn-sec nn-gone" id={GONE_ID} aria-labelledby="nn-gone-h">
      <div className="nn-wrap">
        <span className="nn-script-tag">{S.gone.tag}</span>
        <h2 className="nn-h2" id="nn-gone-h">
          {S.gone.title}
        </h2>
        <PhotoViewerProvider photos={photos}>
          {clotheslines(photos).map((line, li) => (
            <ul key={li} className="nn-line" role="list">
              {line.map((p, i) => {
                const n = li * 4 + i;
                return (
                  <li key={p.id} className="nn-peg">
                    <Snapshot index={n} className="nn-print" label={S.gone.open(p.caption, n + 1)}>
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
  const { profile } = data;
  return (
    <section className="nn-sec" id={TOUCH_ID} aria-labelledby="nn-touch-h">
      <div className="nn-wrap">
        <div className="nn-gift">
          <div className="nn-gift__side">
            <span className="nn-script-tag">{S.touch.tag}</span>
            <h2 className="nn-h2" id="nn-touch-h">
              {S.touch.title}
            </h2>
            <p>{S.touch.lede}</p>
            <ul className="nn-reach">
              {profile.phone !== '' && (
                <li>
                  <small>{S.touch.call}</small>
                  <a href={`tel:${dialable(profile.phone)}`}>{profile.phone}</a>
                </li>
              )}
              {profile.facebookUrl !== '' && (
                <li>
                  <a href={profile.facebookUrl} rel="noopener">
                    {S.touch.facebook}
                  </a>
                </li>
              )}
              {profile.instagramUrl !== '' && (
                <li>
                  <a href={profile.instagramUrl} rel="noopener">
                    {S.touch.instagram}
                  </a>
                </li>
              )}
            </ul>
            <span className="nn-gift__hole" aria-hidden="true" />
          </div>
          <div className="nn-gift__form">
            <CardContactForm tenantId={tenantId} />
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
  const { profile } = data;
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
                {S.hero.meet}
              </a>
              {from !== null && <span className="nn-tag">{S.hero.from(from)}</span>}
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
                aria-label={S.card.open(first.name)}
              >
                <BassinetCard baby={first} tint="blush" />
              </a>
            </div>
          )}
        </div>
      </section>

      <Beads words={words} />

      <section className="nn-sec" id={NURSERY_ID} aria-labelledby="nn-nursery-h">
        <div className="nn-wrap">
          <div className="nn-nursery__head">
            <div>
              <span className="nn-script-tag">{S.nursery.tag}</span>
              <h2 className="nn-h2" id="nn-nursery-h">
                {S.nursery.title}
              </h2>
            </div>
            {products.length > 0 && (
              <span className="nn-count">
                {S.nursery.count(products.filter((p) => p.status !== 'sold_out').length)}
              </span>
            )}
          </div>
          <Nursery babies={babies} />
          {products.length > babies.length && (
            <div className="nn-more">
              <a className="nn-btn" href="/shop">
                {S.nursery.all(products.length)}
              </a>
            </div>
          )}
        </div>
      </section>

      <GoneHome photos={data.gone} />

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
              <span className="nn-script-tag">{S.artist.tag}</span>
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
                <span className="nn-script-tag">{S.visit.tag}</span>
                <h2 className="nn-sign-board__title" id="nn-visit-h">
                  {S.visit.title}
                </h2>
                <ul className="nn-visits" role="list">
                  {data.dates.map((d) => {
                    const { weekday, day } = visitDay(d);
                    return (
                      <li key={d.id}>
                        <span className="nn-visits__when">
                          {weekday}
                          <b>{day}</b>
                        </span>
                        <span className="nn-visits__what">{d.name}</span>
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
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <section className="nn-sec" aria-labelledby="nn-shop-h">
        <div className="nn-wrap">
          <div className="nn-nursery__head">
            <div>
              <span className="nn-script-tag">{S.nursery.tag}</span>
              <h1 className="nn-h2" id="nn-shop-h">
                {S.shop.title}
              </h1>
            </div>
            {products.length > 0 && (
              <span className="nn-count">
                {S.nursery.count(products.filter((p) => p.status !== 'sold_out').length)}
              </span>
            )}
          </div>
          <Nursery babies={products} />
        </div>
      </section>
    </Frame>
  );
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
  return (
    <Frame chrome={{ data, logoUrl }} onHome={false}>
      <section className="nn-cert-page">
        <div className="nn-wrap">
          <a className="nn-back" href="/shop">
            {S.certificate.back}
          </a>
          <div className="nn-cert-grid">
            <NurseryPhotos name={product.name} media={product.media} />
            <article className="nn-cert" aria-labelledby="nn-cert-h">
              <div className="nn-cert__in">
                <p className="nn-cert__title">{S.certificate.title}</p>
                <p className="nn-cert__hello">{S.card.hello}</p>
                <h1 className="nn-cert__name" id="nn-cert-h">
                  {product.name}
                </h1>
                {product.shortDescription !== undefined && product.shortDescription !== '' && (
                  <p className="nn-cert__short">{product.shortDescription}</p>
                )}
                <dl className="nn-fields">
                  <div>
                    <dt>{S.certificate.born}</dt>
                    <dd>{data.name}</dd>
                  </div>
                  {data.profile.signature !== '' && (
                    <div>
                      <dt>{S.certificate.artist}</dt>
                      <dd>{data.profile.signature}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{S.certificate.status}</dt>
                    <dd>{adopted ? S.card.adopted : S.card.ready}</dd>
                  </div>
                  <div>
                    <dt>{S.certificate.fee}</dt>
                    <dd className="nn-fee">{product.price}</dd>
                  </div>
                </dl>
                {paragraphs.length > 0 && (
                  <div className="nn-cert__desc">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
                {!adopted && (
                  <a className="nn-btn" href={`/#${TOUCH_ID}`}>
                    {S.certificate.adopt(product.name)}
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

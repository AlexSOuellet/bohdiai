/**
 * Contractor — the HARBOR design, a website built to Alex's Stitch reference for
 * Joe (2026-10-06), keeping what he liked on an earlier trial of Joe's page: the owner cut
 * out and oversized over the cover photo. Coastal navy with the brand's gold,
 * Playfair Display headlines over Plus Jakarta Sans, cool pale surfaces, an icon
 * on every card. Order: the cover, a trust strip, the request form right away,
 * photo service cards, project cards, review cards, where, and the owner's
 * promises on navy with his photo. Real content only on a real client.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';
import { EstimateForm } from '../EstimateForm';
import { Media } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { harborCss, HARBOR_FONTS_HREF } from './styles';
import { QuoteRotator } from '../QuoteRotator';

const ESTIMATE_ID = 'estimate';

function Icon({ name, fill }: { name: string; fill?: boolean }): ReactElement {
  return <span className={fill === true ? 'hb-icon hb-icon--fill' : 'hb-icon'} aria-hidden="true">{name}</span>;
}

/** Header, footer and the phone thumb bar around any page body. */
export function HarborShell({
  content: c,
  palette,
  children,
  platformCredit = true,
}: {
  content: ContractorContent;
  palette: DerivedPalette;
  children: ReactNode;
  platformCredit?: boolean;
}): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const year = new Date().getFullYear();
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={HARBOR_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: harborCss(palette) }} />
      <div className="hb">
        <a className="hb-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>
        {c.notice !== undefined && <p className="hb-notice"><Icon name="campaign" /> {c.notice}</p>}

        <header className="hb-head">
          <div className="hb-wrap hb-head__row">
            <Link className="hb-mark" href="/">
              <span className="hb-mark__name">{b.name}</span>
              <span className="hb-mark__trade">{b.trade}</span>
            </Link>
            <nav className="hb-head__actions" aria-label={S.menuLabel}>
              <a className="hb-head__phone" href={tel}><Icon name="call" /> <span>{b.phone}</span></a>
              <a className="hb-btn hb-btn--gold" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="hb-foot">
          <div className="hb-wrap hb-foot__row">
            <span className="hb-foot__name">{b.name} {b.trade}</span>
            <span>{S.serving} {b.serviceArea.join(' · ')}</span>
            <a href={tel}>{b.phone}</a>
            <a href="/privacy">{S.footer.privacy}</a>
            <span>© {year} · {S.footer.rights}</span>
            {platformCredit && (
              <a href={PLATFORM_URL}>
                {year} {S.footer.creditPrefix} {S.footer.creditBrand}
              </a>
            )}
          </div>
        </footer>

        <div className="hb-thumb">
          <a href={tel}><Icon name="call" /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}><Icon name="architecture" /> {S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the harbor chrome. */
export function HarborContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <HarborShell content={content} palette={palette}>
      <main className="hb-section">
        <div className="hb-wrap hb-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </HarborShell>
  );
}

function SectionHead({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro?: string | undefined; id: string }): ReactElement {
  return (
    <div className="hb-shead">
      <p className="hb-eyebrow">{eyebrow}</p>
      <h2 className="hb-h2" id={id}>{title}</h2>
      {intro !== undefined && <p className="hb-lede">{intro}</p>}
    </div>
  );
}

export function HarborLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const owner = c.hero.cutout;
  const reviews = c.reviews;

  return (
    <HarborShell content={c} palette={palette}>
      <main>
        {/* ── the cover: photo, words on it, the owner large in front ── */}
        <section className="hb-cover">
          <div className="hb-cover__photo"><Media media={c.hero.media} eager /></div>
          {owner !== undefined && (
            <img className="hb-cover__owner" src={owner.url} alt={owner.alt} loading="eager" decoding="async" />
          )}
          <div className="hb-wrap hb-cover__words">
            <p className="hb-pill"><Icon name="home_work" /> {c.hero.kicker}</p>
            <h1 className="hb-h1">{c.hero.headline}</h1>
            <p className="hb-cover__sub">{c.hero.sub}</p>
            <div className="hb-cover__ctas">
              <a className="hb-btn hb-btn--gold hb-btn--big" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <Icon name="arrow_downward" /></a>
              <a className="hb-btn hb-btn--ghost hb-btn--big" href={tel}><Icon name="call" /> {b.phone}</a>
            </div>
          </div>
        </section>

        {c.hero.badges !== undefined && (
          <div className="hb-wrap">
            <ul className="hb-trust">
              {c.hero.badges.map((t) => (
                <li key={t.label} className="hb-trust__item">
                  <Icon name={t.icon} fill />
                  <span className="hb-trust__label">{t.label}</span>
                  {t.sub !== undefined && <span className="hb-trust__sub">{t.sub}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── the request, right away ───────────────────────────── */}
        <section className="hb-section hb-request" id={ESTIMATE_ID} aria-labelledby="hb-estimate-title">
          <div className="hb-wrap hb-request__grid">
            <div>
              <p className="hb-eyebrow hb-eyebrow--dot">{c.estimate.eyebrow}</p>
              <h2 className="hb-h2" id="hb-estimate-title">{c.estimate.title}</h2>
              <p className="hb-lede">{c.estimate.intro}</p>
              {c.estimate.steps !== undefined && (
                <ul className="hb-steps">{c.estimate.steps.map((s) => <li key={s}><Icon name="check_circle" /> {s}</li>)}</ul>
              )}
              <a className="hb-direct" href={tel}>
                <span className="hb-direct__label">{S.callOrText}</span>
                <span className="hb-direct__phone">{b.phone}</span>
              </a>
            </div>
            {tenantId !== undefined && (
              <div className="hb-formcard">
                <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} />
              </div>
            )}
          </div>
        </section>

        {/* ── services as photo cards ───────────────────────────── */}
        <section className="hb-section hb-tint" aria-labelledby="hb-services-title">
          <div className="hb-wrap">
            <SectionHead eyebrow={c.services.eyebrow} title={c.services.title} intro={c.services.note} id="hb-services-title" />
            <ul className="hb-services">
              {c.services.items.map((s) => (
                <li key={s.name} className={s.photo !== undefined ? 'hb-card' : 'hb-card hb-card--plain'}>
                  {s.photo !== undefined && <div className="hb-card__photo"><Media media={s.photo} /></div>}
                  <div className="hb-card__body">
                    <div className="hb-card__top">
                      <h3 className="hb-h3">{s.name}</h3>
                      {s.icon !== undefined && <Icon name={s.icon} />}
                    </div>
                    <p className="hb-card__text">{s.detail}</p>
                    {s.tags !== undefined && <ul className="hb-tags">{s.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── the work as project cards ─────────────────────────── */}
        <section className="hb-section hb-warm" aria-labelledby="hb-work-title">
          <div className="hb-wrap">
            <SectionHead eyebrow={c.work.eyebrow} title={c.work.title} intro={c.work.intro} id="hb-work-title" />
            <ul className="hb-projects">
              {c.work.items.map((item) => (
                <li key={item.media.url} className="hb-card">
                  <div className="hb-card__photo hb-card__photo--tall">
                    <Media media={item.media} />
                    {(item.place ?? item.tag) !== undefined && <span className="hb-card__flag">{item.place ?? item.tag}</span>}
                  </div>
                  <div className="hb-card__body">
                    <h3 className="hb-h3 hb-h3--sans">{item.caption}</h3>
                    {item.detail !== undefined && <p className="hb-card__text">{item.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── reviews ───────────────────────────────────────────── */}
        {reviews !== undefined && (
          <section className="hb-section hb-tint" aria-labelledby="hb-reviews-title">
            <div className="hb-wrap">
              <div className="hb-reviews__head">
                <SectionHead eyebrow={reviews.eyebrow} title={reviews.title} id="hb-reviews-title" />
                {reviews.rating !== undefined && (
                  <p className="hb-rating">
                    <span className="hb-rating__score"><Icon name="star" fill /> {reviews.rating.score}</span>
                    <span className="hb-rating__label">{reviews.rating.label}</span>
                  </p>
                )}
              </div>
              <QuoteRotator items={reviews.items} prefix="hb" />
              {reviews.note !== undefined && <p className="hb-note">{reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── where ─────────────────────────────────────────────── */}
        <section className="hb-section" aria-labelledby="hb-area-title">
          <div className="hb-wrap hb-area">
            <SectionHead eyebrow={c.area.eyebrow} title={c.area.title} intro={c.area.intro} id="hb-area-title" />
            <ul className="hb-area__towns">
              {b.serviceArea.map((t) => <li key={t}><Icon name="location_on" /> {t}</li>)}
            </ul>
          </div>
        </section>

        {/* ── the owner's word, on navy, with his photo ─────────── */}
        <section className="hb-promise" aria-labelledby="hb-promise-title">
          <div className="hb-wrap hb-promise__grid">
            <div className="hb-promise__words">
              <p className="hb-eyebrow hb-eyebrow--light">{c.crew.eyebrow}</p>
              <h2 className="hb-h2 hb-h2--light" id="hb-promise-title">{c.crew.quote}</h2>
              <p className="hb-promise__who">{c.crew.attribution}</p>
              {c.crew.promises !== undefined ? (
                <ul className="hb-promises">
                  {c.crew.promises.map((p) => (
                    <li key={p.title}>
                      <Icon name={p.icon} />
                      <span><strong>{p.title}</strong>{p.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                c.crew.body.map((p) => <p className="hb-promise__body" key={p.slice(0, 32)}>{p}</p>)
              )}
              <a className="hb-btn hb-btn--gold hb-btn--big" href={tel}><Icon name="phone_in_talk" /> {S.callNow}: {b.phone}</a>
            </div>
            <div className={owner !== undefined ? 'hb-promise__figure hb-promise__figure--owner' : 'hb-promise__figure'}>
              {owner !== undefined ? <img src={owner.url} alt="" loading="lazy" decoding="async" /> : <Media media={c.crew.photo} />}
            </div>
          </div>
        </section>
      </main>
    </HarborShell>
  );
}

/**
 * Contractor — the BLUEPRINT design: the harbor design's dark sibling, built to
 * pull Joe's site away from the painter sample (Alex, 2026-10-06). A mostly navy
 * page with blueprint grid lines and crop marks; the owner still stands over the
 * cover; the request form still comes right after the top. The middle changes
 * shape: services as one big list whose photo appears as you point at each name,
 * the work in framed photos with crop marks, and the reviews as one large quote
 * at a time. Harbor stays untouched beside it.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';
import { EstimateForm } from '../EstimateForm';
import { Media } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { blueprintCss, BLUEPRINT_FONTS_HREF } from './styles';
import { ServiceList } from './ServiceList';
import { QuoteRotator } from '../QuoteRotator';

const ESTIMATE_ID = 'estimate';

function Icon({ name, fill }: { name: string; fill?: boolean }): ReactElement {
  return <span className={fill === true ? 'bp-icon bp-icon--fill' : 'bp-icon'} aria-hidden="true">{name}</span>;
}

/** Header, footer and the phone thumb bar around any page body. */
export function BlueprintShell({
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
      <link rel="stylesheet" href={BLUEPRINT_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: blueprintCss(palette) }} />
      <div className="bp">
        <a className="bp-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>
        {c.notice !== undefined && <p className="bp-notice"><Icon name="campaign" /> {c.notice}</p>}

        <header className="bp-head">
          <div className="bp-wrap bp-head__row">
            <Link className="bp-mark" href="/">
              <span className="bp-mark__name">{b.name}</span>
              <span className="bp-mark__trade">{b.trade}</span>
            </Link>
            <nav className="bp-head__actions" aria-label={S.menuLabel}>
              <a className="bp-head__phone" href={tel}><Icon name="call" /> <span>{b.phone}</span></a>
              <a className="bp-btn bp-btn--gold" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="bp-foot">
          <div className="bp-wrap">
            <p className="bp-foot__big" aria-hidden="true">{b.name}</p>
            <div className="bp-foot__row">
              <span>{b.name} {b.trade}</span>
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
          </div>
        </footer>

        <div className="bp-thumb">
          <a href={tel}><Icon name="call" /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}><Icon name="architecture" /> {S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the blueprint chrome. */
export function BlueprintContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <BlueprintShell content={content} palette={palette}>
      <main className="bp-section">
        <div className="bp-wrap bp-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </BlueprintShell>
  );
}

function SectionHead({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro?: string | undefined; id: string }): ReactElement {
  return (
    <div className="bp-shead">
      <p className="bp-eyebrow"><span className="bp-rule" aria-hidden="true" />{eyebrow}</p>
      <h2 className="bp-h2" id={id}>{title}</h2>
      {intro !== undefined && <p className="bp-lede">{intro}</p>}
    </div>
  );
}

export function BlueprintLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const owner = c.hero.cutout;
  const reviews = c.reviews;

  return (
    <BlueprintShell content={c} palette={palette}>
      <main>
        {/* ── the cover: photo, words on it, the owner large in front ── */}
        <section className="bp-cover">
          <div className="bp-cover__photo"><Media media={c.hero.media} eager /></div>
          {owner !== undefined && (
            <img className="bp-cover__owner" src={owner.url} alt={owner.alt} loading="eager" decoding="async" />
          )}
          <div className="bp-wrap bp-cover__words">
            <p className="bp-kicker">{c.hero.kicker}</p>
            <h1 className="bp-h1">{c.hero.headline}</h1>
            <p className="bp-cover__sub">{c.hero.sub}</p>
            <div className="bp-cover__ctas">
              <a className="bp-btn bp-btn--gold bp-btn--big" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <Icon name="arrow_downward" /></a>
              <a className="bp-btn bp-btn--line bp-btn--big" href={tel}><Icon name="call" /> {b.phone}</a>
            </div>
          </div>
        </section>

        {c.hero.badges !== undefined && (
          <div className="bp-trustband">
            <ul className="bp-wrap bp-trust">
              {c.hero.badges.map((t) => (
                <li key={t.label} className="bp-trust__item">
                  <Icon name={t.icon} fill />
                  <span className="bp-trust__label">{t.label}</span>
                  {t.sub !== undefined && <span className="bp-trust__sub">{t.sub}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── the request, right away ───────────────────────────── */}
        <section className="bp-section bp-grid" id={ESTIMATE_ID} aria-labelledby="bp-estimate-title">
          <div className="bp-wrap bp-request">
            <div>
              <SectionHead eyebrow={c.estimate.eyebrow} title={c.estimate.title} intro={c.estimate.intro} id="bp-estimate-title" />
              {c.estimate.steps !== undefined && (
                <ul className="bp-steps">{c.estimate.steps.map((s) => <li key={s}><Icon name="check" /> {s}</li>)}</ul>
              )}
              <a className="bp-direct" href={tel}>
                <span className="bp-direct__label">{S.callOrText}</span>
                <span className="bp-direct__phone">{b.phone}</span>
              </a>
            </div>
            {tenantId !== undefined && (
              <div className="bp-formcard bp-marks">
                <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} />
              </div>
            )}
          </div>
        </section>

        {/* ── services: one big list, the photo appears as you point ── */}
        <section className="bp-section bp-deep" aria-labelledby="bp-services-title">
          <div className="bp-wrap">
            <SectionHead eyebrow={c.services.eyebrow} title={c.services.title} intro={c.services.note} id="bp-services-title" />
            <ServiceList items={c.services.items} />
          </div>
        </section>

        {/* ── the work, framed like drawings ────────────────────── */}
        <section className="bp-section bp-grid" aria-labelledby="bp-work-title">
          <div className="bp-wrap">
            <SectionHead eyebrow={c.work.eyebrow} title={c.work.title} intro={c.work.intro} id="bp-work-title" />
            <ul className="bp-work">
              {c.work.items.map((item) => (
                <li key={item.media.url} className="bp-work__item">
                  <div className="bp-frame"><Media media={item.media} /></div>
                  <p className="bp-work__cap">
                    {item.tag !== undefined && <span className="bp-work__tag">{item.tag}</span>}
                    {item.caption}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── reviews: one big quote at a time ───────────────────── */}
        {reviews !== undefined && (
          <section className="bp-section bp-deep" aria-labelledby="bp-reviews-title">
            <div className="bp-wrap">
              <div className="bp-reviews__head">
                <SectionHead eyebrow={reviews.eyebrow} title={reviews.title} id="bp-reviews-title" />
                {reviews.rating !== undefined && (
                  <p className="bp-rating">
                    <span className="bp-rating__score"><Icon name="star" fill /> {reviews.rating.score}</span>
                    <span className="bp-rating__label">{reviews.rating.label}</span>
                  </p>
                )}
              </div>
              <QuoteRotator items={reviews.items} prefix="bp" />
              {reviews.note !== undefined && <p className="bp-note">{reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── where ─────────────────────────────────────────────── */}
        <section className="bp-section bp-grid" aria-labelledby="bp-area-title">
          <div className="bp-wrap bp-area">
            <SectionHead eyebrow={c.area.eyebrow} title={c.area.title} intro={c.area.intro} id="bp-area-title" />
            <ul className="bp-area__towns">
              {b.serviceArea.map((t) => <li key={t}><Icon name="location_on" /> {t}</li>)}
            </ul>
          </div>
        </section>

        {/* ── the owner's word, with his photo ──────────────────── */}
        <section className="bp-promise" aria-labelledby="bp-promise-title">
          <div className="bp-wrap bp-promise__grid">
            <div className="bp-promise__words">
              <p className="bp-eyebrow"><span className="bp-rule" aria-hidden="true" />{c.crew.eyebrow}</p>
              <h2 className="bp-h2" id="bp-promise-title">{c.crew.quote}</h2>
              <p className="bp-promise__who">{c.crew.attribution}</p>
              {c.crew.promises !== undefined ? (
                <ul className="bp-promises">
                  {c.crew.promises.map((p) => (
                    <li key={p.title}>
                      <Icon name={p.icon} />
                      <span><strong>{p.title}</strong>{p.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                c.crew.body.map((p) => <p className="bp-promise__body" key={p.slice(0, 32)}>{p}</p>)
              )}
              <a className="bp-btn bp-btn--gold bp-btn--big" href={tel}><Icon name="phone_in_talk" /> {S.callNow}: {b.phone}</a>
            </div>
            <div className={owner !== undefined ? 'bp-promise__figure bp-promise__figure--owner' : 'bp-promise__figure'}>
              {owner !== undefined ? <img src={owner.url} alt="" loading="lazy" decoding="async" /> : <Media media={c.crew.photo} />}
            </div>
          </div>
        </section>
      </main>
    </BlueprintShell>
  );
}

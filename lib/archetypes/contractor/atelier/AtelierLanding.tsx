/**
 * Contractor — the ATELIER design, a full website in the look of Alex's Stitch
 * reference (2026-10-06: "the whole actual look", "I want it web"). Quiet and
 * high-end: warm stone surfaces, Newsreader headlines over Plus Jakarta Sans,
 * small spaced capitals, an icon on nearly everything, rounded cards, sage tags.
 * The page does something: a live ballpark estimator. Then services as photo
 * cards, the work as case studies, a "typical vs us" comparison, the owner,
 * the rating and reviews, and a closing call. Shares only the content shape,
 * the estimate form's workings and the site's words with the other designs.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent } from '../schemas';
import { fill } from '@/lib/site-words/words';
import type { ContractorWords } from '../words';
import { EstimateForm } from '../EstimateForm';
import { Media } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { atelierCss, ATELIER_FONTS_HREF } from './styles';
import { Estimator } from './Estimator';
import { BookedMonth } from './BookedCalendar';

const ESTIMATE_ID = 'estimate';
const ESTIMATOR_ID = 'ballpark';

function Icon({ name }: { name: string }): ReactElement {
  return <span className="at-icon" aria-hidden="true">{name}</span>;
}

/** Header, footer and the phone thumb bar around any page body. */
export function AtelierShell({
  content: c,
  palette,
  words: w,
  children,
  platformCredit = true,
}: {
  content: ContractorContent;
  palette: DerivedPalette;
  words: ContractorWords;
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
      <link rel="stylesheet" href={ATELIER_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: atelierCss(palette) }} />
      <div className="at">
        <a className="at-skip" href={`/#${ESTIMATE_ID}`}>{w.skipToEstimate}</a>
        {c.notice !== undefined && (
          <p className="at-notice"><Icon name="campaign" /> {c.notice}</p>
        )}

        <header className="at-head">
          <div className="at-wrap at-head__row">
            <Link className="at-mark" href="/">
              <span className="at-mark__name">{b.name}</span>
              <span className="at-mark__trade">{b.trade}</span>
            </Link>
            <nav className="at-head__actions" aria-label={w.menuLabel}>
              <a className="at-btn at-btn--soft" href={tel}><Icon name="call" /> <span className="at-head__phone">{b.phone}</span></a>
              <a className="at-btn at-btn--dark" href={`/#${ESTIMATE_ID}`}><Icon name="request_quote" /> {w.estimateShort}</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="at-foot">
          <div className="at-wrap at-foot__row">
            <span className="at-foot__name">{b.name} {b.trade}</span>
            <span>{w.serving} {b.serviceArea.join(w.separator)}</span>
            <a href={tel}>{b.phone}</a>
            <a href="/privacy">{w.footer.privacy}</a>
            <span>{w.footer.copyright} {year}{w.separator}{w.footer.rights}</span>
            {platformCredit && (
              <a href={PLATFORM_URL}>
                {year} {w.footer.creditPrefix} {w.footer.creditBrand}
              </a>
            )}
          </div>
        </footer>

        <div className="at-thumb">
          <a href={tel}><Icon name="call" /> {w.call}</a>
          <a href={`/#${ESTIMATE_ID}`}><Icon name="request_quote" /> {w.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the atelier chrome. */
export function AtelierContentPage({ content, palette, words, html }: { content: ContractorContent; palette: DerivedPalette; words: ContractorWords; html: string }): ReactElement {
  return (
    <AtelierShell content={content} palette={palette} words={words}>
      <main className="at-section">
        <div className="at-wrap at-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </AtelierShell>
  );
}

export function AtelierLanding({
  content: c,
  palette,
  words: w,
  tenantId,
}: {
  content: ContractorContent;
  palette: DerivedPalette;
  words: ContractorWords;
  tenantId: string | undefined;
}): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const reviews = c.reviews;

  return (
    <AtelierShell content={c} palette={palette} words={w}>
      <main>
        {/* ── hero: a magazine cover — one photo edge to edge, the headline on it ── */}
        <section className="at-cover">
          <div className="at-cover__photo"><Media media={c.hero.media} eager /></div>
          <div className="at-wrap at-cover__inner">
            <div className="at-cover__words">
              <p className="at-pill at-pill--glass"><Icon name="architecture" /> {c.hero.kicker}</p>
              <h1 className="at-cover__headline">{c.hero.headline}</h1>
            </div>
            {c.hero.feature !== undefined && (
              <p className="at-cover__feature">
                <span className="at-label at-label--light">{c.hero.feature.label}</span>
                <span className="at-cover__featuretitle">{c.hero.feature.title}</span>
                {c.hero.feature.tag !== undefined && <span className="at-glass">{c.hero.feature.tag}</span>}
              </p>
            )}
            <div className="at-cover__card">
              <p className="at-cover__sub">{c.hero.sub}</p>
              {c.hero.badges !== undefined && (
                <ul className="at-badges">
                  {c.hero.badges.map((badge) => (
                    <li key={badge.label} className="at-badge"><Icon name={badge.icon} /> {badge.label}</li>
                  ))}
                </ul>
              )}
              <div className="at-hero__ctas">
                <a className="at-btn at-btn--dark at-btn--big" href={c.estimator !== undefined ? `#${ESTIMATOR_ID}` : `#${ESTIMATE_ID}`}>
                  <Icon name="calculate" /> {c.hero.estimateLabel}
                </a>
                <a className="at-btn at-btn--soft at-btn--big" href={tel}><Icon name="phone_in_talk" /> {b.phone}</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── the live ballpark estimator ───────────────────────── */}
        {c.estimator !== undefined && (
          <section className="at-section at-tint" id={ESTIMATOR_ID} aria-labelledby="at-est-title">
            <div className="at-wrap">
              <div className="at-estcard">
                <div className="at-estcard__head">
                  <h2 className="at-estcard__title" id="at-est-title">{c.estimator.title}</h2>
                  <p className="at-lede">{c.estimator.intro}</p>
                </div>
                <Estimator estimator={c.estimator} estimateHref={`#${ESTIMATE_ID}`} words={w.estimator} />
              </div>
            </div>
          </section>
        )}

        {/* ── services as photo cards ───────────────────────────── */}
        <section className="at-section" aria-labelledby="at-services-title">
          <div className="at-wrap">
            <div className="at-dek">
              <h2 className="at-dek__title" id="at-services-title">{c.services.title}</h2>
              {c.services.note !== undefined && <p className="at-dek__note">{c.services.note}</p>}
            </div>
            <ul className="at-services">
              {c.services.items.map((s) => (
                <li key={s.name} className="at-card">
                  {s.photo !== undefined && (
                    <div className="at-card__photo">
                      <Media media={s.photo} />
                      {s.label !== undefined && <span className="at-card__label">{s.label}</span>}
                    </div>
                  )}
                  <div className="at-card__body">
                    <h3 className="at-h3">{s.name}</h3>
                    <p className="at-card__text">{s.detail}</p>
                    {s.tags !== undefined && (
                      <ul className="at-tags">{s.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── the work as case studies ──────────────────────────── */}
        <section className="at-section at-tint" aria-labelledby="at-work-title">
          <div className="at-wrap">
            <ul className="at-cases">
              {c.work.items.map((item) => (
                <li key={item.media.url} className="at-card at-card--white">
                  <div className="at-card__photo at-card__photo--tall">
                    <Media media={item.media} />
                    {item.tag !== undefined && <span className="at-card__flag">{item.tag}</span>}
                  </div>
                  <div className="at-card__body">
                    <div className="at-case__top">
                      <h3 className="at-h3">{item.caption}</h3>
                      {item.place !== undefined && <span className="at-case__place">{item.place}</span>}
                    </div>
                    {item.detail !== undefined && <p className="at-card__text">{item.detail}</p>}
                    {item.swatch !== undefined && (
                      <p className="at-case__color"><Icon name="palette" /> {item.swatch.name}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="at-aftercap">
              <h2 className="at-aftercap__title" id="at-work-title">{c.work.title}</h2>
              {c.work.intro !== undefined && <p className="at-aftercap__text">{c.work.intro}</p>}
            </div>
          </div>
        </section>

        {/* ── why us: the comparison, then the owner ────────────── */}
        <section className="at-section" aria-labelledby="at-why-title">
          <div className="at-wrap at-why">
            {c.comparison !== undefined && (
              <div>
                <h2 className="at-h2 at-h2--italic" id="at-why-title">{c.comparison.title}</h2>
                {c.comparison.intro !== undefined && <p className="at-lede">{c.comparison.intro}</p>}
                <ul className="at-compare">
                  {c.comparison.rows.map((r) => (
                    <li key={r.topic} className="at-compare__row">
                      <p className="at-label">{r.topic}</p>
                      <div className="at-compare__cols">
                        <div>
                          <p className="at-compare__them"><Icon name="close" /> {c.comparison?.themLabel}</p>
                          <p className="at-compare__text">{r.them}</p>
                        </div>
                        <div>
                          <p className="at-compare__us"><Icon name="check" /> {c.comparison?.usLabel}</p>
                          <p className="at-compare__text at-compare__text--us">{r.us}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <figure className="at-owner">
              <div className="at-owner__photo"><Media media={c.crew.photo} /></div>
              <blockquote className="at-owner__quote">{fill(w.quoted, { quote: c.crew.quote })}</blockquote>
              <figcaption className="at-label at-label--accent">{c.crew.attribution}</figcaption>
              {c.crew.body.map((p) => <p className="at-card__text" key={p.slice(0, 32)}>{p}</p>)}
            </figure>
          </div>
        </section>

        {/* ── rating and reviews ────────────────────────────────── */}
        {reviews !== undefined && (
          <section className="at-section at-tint" aria-labelledby="at-reviews-title">
            <div className="at-wrap">
              <div className="at-scorehead">
                {reviews.rating !== undefined && (
                  <p className="at-scorehead__score">
                    {reviews.rating.score}
                    <span className="at-stars" aria-hidden="true">{'star '.repeat(5).trim()}</span>
                  </p>
                )}
                <div>
                  <h2 className="at-scorehead__title" id="at-reviews-title">{reviews.title}</h2>
                  {reviews.rating !== undefined && <p className="at-label">{reviews.rating.label}</p>}
                </div>
              </div>
              <ul className="at-reviews">
                {reviews.items.map((r) => (
                  <li key={r.quote} className="at-card at-card--white at-review">
                    <blockquote className="at-review__quote">{fill(w.quoted, { quote: r.quote })}</blockquote>
                    <p className="at-review__top">
                      <strong className="at-review__who">{r.author}</strong>
                      {r.job !== undefined && <span className="at-label">{r.job}</span>}
                    </p>
                  </li>
                ))}
              </ul>
              {reviews.note !== undefined && <p className="at-note">{reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── when we're booked ─────────────────────────────────── */}
        {c.calendar !== undefined && (
          <section className="at-section at-ghosted" aria-labelledby="at-cal-title">
            <p className="at-ghost" aria-hidden="true">{w.calendar.booked}</p>
            <div className="at-wrap at-booked">
              <div>
                <h2 className="at-h2" id="at-cal-title">{c.calendar.title}</h2>
                {c.calendar.intro !== undefined && <p className="at-lede">{c.calendar.intro}</p>}
                <p className="at-cal__legend">
                  <span className="at-cal__key at-cal__key--booked" aria-hidden="true" /> {w.calendar.booked}
                  <span className="at-cal__key" aria-hidden="true" /> {w.calendar.open}
                </p>
              </div>
              <div className="at-booked__months">
                {c.calendar.months.map((m) => <BookedMonth key={`${m.year}-${m.month}`} month={m} words={w.calendar} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── questions ─────────────────────────────────────────── */}
        {c.faq !== undefined && (
          <section className="at-section at-tint" aria-labelledby="at-faq-title">
            <div className="at-wrap at-faq">
              <div className="at-faq__head">
                <h2 className="at-h2 at-h2--big" id="at-faq-title">{c.faq.title}</h2>
              </div>
              <div className="at-faq__list">
                {c.faq.items.map((f) => (
                  <details key={f.q} className="at-faq__item">
                    <summary><span>{f.q}</span><Icon name="add" /></summary>
                    <p className="at-card__text">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── the closing call: banner, where, and the real form ── */}
        <section className="at-section" id={ESTIMATE_ID} aria-labelledby="at-estimate-title">
          <div className="at-wrap">
            {c.banner !== undefined && (
              <div className="at-banner">
                <span className="at-banner__dot" aria-hidden="true" />
                <span className="at-banner__text">
                  <span className="at-label at-label--light">{c.banner.label}</span>
                  <span>{c.banner.text}</span>
                </span>
                {c.banner.tag !== undefined && <span className="at-banner__tag">{c.banner.tag}</span>}
              </div>
            )}
            <div className="at-close">
              <div>
                <p className="at-lede at-lede--first">{c.estimate.intro}</p>
                {c.estimate.steps !== undefined && (
                  <ul className="at-steps">{c.estimate.steps.map((s) => <li key={s}><Icon name="check_circle" /> {s}</li>)}</ul>
                )}
                <div className="at-callcard">
                  <p className="at-label">{c.area.title}</p>
                  <p className="at-card__text">{c.area.intro}</p>
                  <a className="at-callcard__phone" href={tel}><Icon name="call" /> {fill(w.callNow, { phone: b.phone })}</a>
                </div>
              </div>
              {tenantId !== undefined && (
                <div className="at-formcard">
                  <h2 className="at-formcard__title" id="at-estimate-title">{c.estimate.title}</h2>
                  <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} words={w.form} />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </AtelierShell>
  );
}

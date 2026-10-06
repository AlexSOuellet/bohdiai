/**
 * Contractor — the RIDGE design: Cut-Pro's yard look combined with the Stitch
 * card format (Alex, 2026-10-06: "try halfmoon and combine the two"). The top is
 * Cut-Pro's: a dark header, big condensed capitals, the hand-painted marker, the
 * tall photo beside the words — its top cut at a roof pitch. The middle is the
 * Stitch format's: a trust strip, photo service cards with icons and tags,
 * project cards, star review cards and the form as a clean card, on light
 * sections, so the page runs dark, light, dark.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';
import { EstimateForm } from '../EstimateForm';
import { ArrowIcon, Headline, Media, PhoneIcon } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { ridgeCss, RIDGE_FONTS_HREF } from './styles';

const ESTIMATE_ID = 'estimate';

function Icon({ name, fill }: { name: string; fill?: boolean }): ReactElement {
  return <span className={fill === true ? 'rg-icon rg-icon--fill' : 'rg-icon'} aria-hidden="true">{name}</span>;
}

/** Header, footer and the phone thumb bar around any page body. */
export function RidgeShell({
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
      <link rel="stylesheet" href={RIDGE_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: ridgeCss(palette) }} />
      <div className="rg">
        <a className="rg-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>
        {c.notice !== undefined && <p className="rg-notice"><Icon name="campaign" /> {c.notice}</p>}

        <header className="rg-head">
          <div className="rg-wrap rg-head__row">
            <Link className="rg-mark" href="/">
              <span className="rg-mark__name">{b.name}</span>
              <span className="rg-mark__trade">{b.trade}</span>
            </Link>
            <nav className="rg-head__actions" aria-label={S.menuLabel}>
              <a className="rg-btn rg-btn--line" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
              <a className="rg-btn rg-btn--solid" href={tel}><PhoneIcon /> <span className="rg-btn__text">{b.phone}</span></a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="rg-foot">
          <div className="rg-wrap">
            <p className="rg-foot__big" aria-hidden="true">{b.name}</p>
            <div className="rg-foot__row">
              <span>© {year} {b.name} · {S.footer.rights}</span>
              <span>{S.serving} {b.serviceArea.join(' · ')}</span>
              <a href={tel}>{b.phone}</a>
              <a href="/privacy">{S.footer.privacy}</a>
              {platformCredit && (
                <a href={PLATFORM_URL}>
                  {year} {S.footer.creditPrefix} {S.footer.creditBrand}
                </a>
              )}
            </div>
          </div>
        </footer>

        <div className="rg-thumb">
          <a href={tel}><PhoneIcon /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the ridge chrome. */
export function RidgeContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <RidgeShell content={content} palette={palette}>
      <main className="rg-section rg-light">
        <div className="rg-wrap rg-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </RidgeShell>
  );
}

export function RidgeLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const reviews = c.reviews;

  return (
    <RidgeShell content={c} palette={palette}>
      <main>
        {/* ── Cut-Pro's top: big capitals, the marker, the photo cut at a roof pitch ── */}
        <section className="rg-hero">
          <div className="rg-wrap rg-hero__grid">
            <div>
              <p className="rg-hero__kicker rg-rise">{c.hero.kicker}</p>
              <p className="rg-hero__marker rg-rise"><span className="rg-brush">{c.hero.marker}</span></p>
              <h1 className="rg-hero__headline rg-rise"><Headline text={c.hero.headline} highlight={c.hero.highlight} /></h1>
              <p className="rg-hero__sub rg-rise">{c.hero.sub}</p>
              <div className="rg-hero__ctas rg-rise">
                <a className="rg-btn rg-btn--solid rg-btn--big" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <ArrowIcon /></a>
                <a className="rg-btn rg-btn--line rg-btn--big" href={tel}><PhoneIcon /> {b.phone}</a>
              </div>
            </div>
            <div className="rg-gable"><div className="rg-gable__media"><Media media={c.hero.media} eager /></div></div>
          </div>
        </section>

        {/* ── the Stitch format's trust strip ── */}
        {c.hero.badges !== undefined && (
          <div className="rg-trustband">
            <ul className="rg-wrap rg-trust">
              {c.hero.badges.map((t) => (
                <li key={t.label} className="rg-trust__item">
                  <Icon name={t.icon} fill />
                  <span>
                    <span className="rg-trust__label">{t.label}</span>
                    {t.sub !== undefined && <span className="rg-trust__sub">{t.sub}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── services: the headline pinned on the side, the cards beside it ── */}
        <section className="rg-section rg-light" aria-labelledby="rg-services-title">
          <div className="rg-wrap rg-side">
            <div className="rg-side__head">
              <h2 className="rg-title" id="rg-services-title">{c.services.title}</h2>
              {c.services.note !== undefined && <p className="rg-lede">{c.services.note}</p>}
            </div>
            <ul className="rg-cards rg-cards--two">
              {c.services.items.map((s) => (
                <li key={s.name} className={s.photo !== undefined ? 'rg-card' : 'rg-card rg-card--plain'}>
                  {s.photo !== undefined && (
                    <div className="rg-card__photo">
                      <Media media={s.photo} />
                      {s.label !== undefined && <span className="rg-card__label">{s.label}</span>}
                    </div>
                  )}
                  <div className="rg-card__body">
                    <div className="rg-card__top">
                      <h3 className="rg-card__name">{s.name}</h3>
                      {s.icon !== undefined && <Icon name={s.icon} />}
                    </div>
                    <p className="rg-card__text">{s.detail}</p>
                    {s.tags !== undefined && <ul className="rg-tags">{s.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── the work: no heading above; the headline sits across the first, big photo ── */}
        <section className="rg-section" aria-labelledby="rg-work-title">
          <div className="rg-wrap">
            <ul className="rg-projects rg-projects--lead">
              {c.work.items.map((item, i) => (
                <li key={item.media.url} className={i === 0 ? 'rg-project rg-project--lead' : 'rg-project'}>
                  <div className="rg-project__photo">
                    <Media media={item.media} />
                    {item.tag !== undefined && <span className="rg-card__label rg-card__label--accent">{item.tag}</span>}
                    {i === 0 && (
                      <div className="rg-project__over">
                        <h2 className="rg-title" id="rg-work-title">{c.work.title}</h2>
                        {c.work.intro !== undefined && <p className="rg-project__intro">{c.work.intro}</p>}
                      </div>
                    )}
                  </div>
                  <p className="rg-project__cap">
                    <span className="rg-project__title">{item.caption}</span>
                    {item.place !== undefined && <span className="rg-project__place"><Icon name="location_on" /> {item.place}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── reviews: the first customer's words, huge, open the section ── */}
        {reviews !== undefined && reviews.items[0] !== undefined && (
          <section className="rg-section rg-light" aria-labelledby="rg-reviews-title">
            <div className="rg-wrap">
              <h2 className="rg-sr" id="rg-reviews-title">{reviews.title}</h2>
              <figure className="rg-lead-quote">
                <span className="rg-stars" role="img" aria-label={S.starsLabel}>{'star '.repeat(5).trim()}</span>
                <blockquote className="rg-lead-quote__text">“{reviews.items[0].quote}”</blockquote>
                <figcaption className="rg-review__who">
                  <strong>{reviews.items[0].author}</strong>
                  {reviews.items[0].job !== undefined && <span>{reviews.items[0].job}</span>}
                </figcaption>
              </figure>
              {reviews.items.length > 1 && (
                <ul className="rg-reviews">
                  {reviews.items.slice(1).map((r) => (
                    <li key={r.quote} className="rg-card rg-review">
                      <span className="rg-stars" role="img" aria-label={S.starsLabel}>{'star '.repeat(5).trim()}</span>
                      <blockquote className="rg-review__quote">“{r.quote}”</blockquote>
                      <p className="rg-review__who"><strong>{r.author}</strong>{r.job !== undefined && <span>{r.job}</span>}</p>
                    </li>
                  ))}
                </ul>
              )}
              {reviews.note !== undefined && <p className="rg-note">{reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── Cut-Pro's crew quote, on dark ── */}
        <section className="rg-section rg-crew" aria-labelledby="rg-crew-title">
          <div className="rg-wrap rg-crew__grid">
            <div className="rg-crew__photo"><Media media={c.crew.photo} /></div>
            <div>
              <h2 className="rg-sr" id="rg-crew-title">{c.crew.eyebrow}</h2>
              <blockquote className="rg-crew__quote">{c.crew.quote}</blockquote>
              <p className="rg-crew__who">{c.crew.attribution}</p>
              {c.crew.body.map((p) => <p className="rg-crew__body" key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ── the estimate: a giant faded word behind the form and its title ── */}
        <section className="rg-section rg-light rg-ghosted" id={ESTIMATE_ID} aria-labelledby="rg-estimate-title">
          <p className="rg-ghost" aria-hidden="true">{c.estimate.eyebrow}</p>
          <div className="rg-wrap rg-close">
            <div>
              <h2 className="rg-title" id="rg-estimate-title">{c.estimate.title}</h2>
              <p className="rg-lede">{c.estimate.intro}</p>
              {c.estimate.steps !== undefined && (
                <ul className="rg-steps">{c.estimate.steps.map((s) => <li key={s}><Icon name="check_circle" /> {s}</li>)}</ul>
              )}
              <div className="rg-areacard">
                <p className="rg-areacard__title"><Icon name="location_on" /> {c.area.title}</p>
                <p className="rg-card__text">{c.area.intro}</p>
              </div>
            </div>
            {tenantId !== undefined && (
              <div className="rg-formcard">
                <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} />
              </div>
            )}
          </div>
        </section>
      </main>
    </RidgeShell>
  );
}

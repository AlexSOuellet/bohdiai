/**
 * Contractor — the one-page site. Order is the sales argument for a referred
 * customer looking them up on a phone: who they are + call/estimate (hero),
 * proof in numbers, their real work, what they do, what customers said, the
 * people who show up, where they work, and the estimate request.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent, ContractorMedia } from './schemas';
import { contractorCss, CONTRACTOR_FONTS_HREF } from './styles';
import { CONTRACTOR_STRINGS as S } from './strings';
import { EstimateForm } from './EstimateForm';
import { VideoTile } from './VideoTile';
import { SlowVideo } from './SlowVideo';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';

const ESTIMATE_ID = 'estimate';

function PhoneIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function ArrowIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}

function Stars(): ReactElement {
  return (
    <div className="cp-stars" role="img" aria-label={S.starsLabel}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </div>
  );
}

function Media({ media, eager }: { media: ContractorMedia; eager?: boolean }): ReactElement {
  if (media.kind === 'video') {
    return (
      <SlowVideo src={media.url} poster={media.poster} autoPlay muted loop playsInline preload={eager === true ? 'auto' : 'metadata'} aria-label={media.alt} />
    );
  }
  return <img src={media.url} alt={media.alt} loading={eager === true ? 'eager' : 'lazy'} decoding="async" />;
}

/** The headline with one word painted in the accent, when the content names it. */
function Headline({ text, highlight }: { text: string; highlight?: string | undefined }): ReactElement {
  if (highlight === undefined) return <>{text}</>;
  const at = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em>{text.slice(at, at + highlight.length)}</em>
      {text.slice(at + highlight.length)}
    </>
  );
}

/** Header, footer and the phone thumb bar around any page body. */
/** `platformCredit`: the "Empowered by BohdiAI" line on a bohdiai.com address; off on a custom domain (wired with custom domains). */
export function ContractorShell({
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
      <link rel="stylesheet" href={CONTRACTOR_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: contractorCss(palette) }} />
      <div className="cp">
        <a className="cp-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>

        <header className="cp-head">
          <div className="cp-wrap cp-head__row">
            <Link className="cp-mark" href="/">
              <span className="cp-mark__name">{b.name}</span>
              <span className="cp-mark__trade">{b.trade}</span>
            </Link>
            <nav className="cp-head__actions" aria-label={S.menuLabel}>
              <a className="cp-btn cp-btn--line" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
              <a className="cp-btn cp-btn--solid" href={tel}>
                <PhoneIcon />
                <span className="cp-btn__text">{b.phone}</span>
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="cp-foot">
          <div className="cp-wrap">
            <p className="cp-foot__big" aria-hidden="true">{b.name}</p>
            <div className="cp-foot__row">
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

        <div className="cp-thumb">
          <a href={tel}><PhoneIcon /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the site's chrome. The html is
 *  pre-rendered from the platform's legal templates (escaped markdown). */
export function ContractorContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <ContractorShell content={content} palette={palette}>
      <main className="cp-section">
        <div className="cp-wrap cp-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </ContractorShell>
  );
}

export function ContractorLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const [featured, ...others] = c.reviews?.items ?? [];

  return (
    <ContractorShell content={c} palette={palette}>
        <main>
          <section className="cp-hero">
            <div className="cp-wrap cp-hero__grid">
              <div>
                <p className="cp-hero__kicker cp-rise">{c.hero.kicker}</p>
                <p className="cp-hero__marker cp-rise"><span className="cp-brush">{c.hero.marker}</span></p>
                <h1 className="cp-hero__headline cp-rise"><Headline text={c.hero.headline} highlight={c.hero.highlight} /></h1>
                <p className="cp-hero__sub cp-rise">{c.hero.sub}</p>
                <div className="cp-hero__ctas cp-rise">
                  <a className="cp-btn cp-btn--solid" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <ArrowIcon /></a>
                  <a className="cp-btn cp-btn--line" href={tel}><PhoneIcon /> {b.phone}</a>
                </div>
                <p className="cp-hero__area cp-rise">
                  {b.serviceArea.map((s) => <span key={s}>{s}</span>)}
                </p>
              </div>
              <div className="cp-slab">
                <div className="cp-slab__media"><Media media={c.hero.media} eager /></div>
                {c.proof?.[0] !== undefined && <span className="cp-slab__since" aria-hidden="true">{c.proof[0].label} {c.proof[0].figure}</span>}
              </div>
            </div>
          </section>

          {c.proof !== undefined && c.proof.length > 0 && (
            <div className="cp-wrap">
              <dl className="cp-proof">
                {c.proof.map((p) => (
                  <div className="cp-proof__cell" key={p.label}>
                    <dt className="cp-proof__label">{p.label}</dt>
                    <dd className="cp-proof__fig">{p.figure}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <section className="cp-section" aria-labelledby="cp-work-title">
            <div className="cp-wrap">
              <div className="cp-section__head">
                <div>
                  <p className="cp-eyebrow">{c.work.eyebrow}</p>
                  <h2 className="cp-title" id="cp-work-title">{c.work.title}</h2>
                </div>
                {c.work.intro !== undefined && <p className="cp-lede">{c.work.intro}</p>}
              </div>
              <div className="cp-work">
                {c.work.items.map((w) => (
                  <figure className="cp-work__item cp-unroll" key={w.media.url}>
                    {w.media.kind === 'video' ? <VideoTile media={w.media} /> : <Media media={w.media} />}
                    <figcaption className="cp-work__cap">
                      <span className="cp-work__caption">{w.caption}</span>
                      {w.tag !== undefined && <span className="cp-work__tag">{w.tag}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <div className="cp-strip" aria-hidden="true" />

          <section className="cp-section" aria-labelledby="cp-services-title">
            <div className="cp-wrap">
              <div className="cp-section__head">
                <div>
                  <p className="cp-eyebrow">{c.services.eyebrow}</p>
                  <h2 className="cp-title" id="cp-services-title">{c.services.title}</h2>
                </div>
              </div>
              <div className="cp-services">
                <ol className="cp-services__list">
                  {c.services.items.map((s) => (
                    <li className="cp-services__row" key={s.name}>
                      <h3 className="cp-services__name">{s.name}</h3>
                      <p className="cp-services__detail">{s.detail}</p>
                    </li>
                  ))}
                </ol>
                {c.services.note !== undefined && <p className="cp-services__note">{c.services.note}</p>}
              </div>
            </div>
          </section>

          {c.reviews !== undefined && featured !== undefined && (
            <section className="cp-section cp-reviews" aria-labelledby="cp-reviews-title">
              <div className="cp-wrap">
                <div className="cp-section__head">
                  <div>
                    <p className="cp-eyebrow">{c.reviews.eyebrow}</p>
                    <h2 className="cp-title" id="cp-reviews-title">{c.reviews.title}</h2>
                  </div>
                </div>
                <figure className="cp-feature">
                  <Stars />
                  <blockquote>{featured.quote}</blockquote>
                  <figcaption className="cp-cite">{featured.author}{featured.job !== undefined && <small>{featured.job}</small>}</figcaption>
                </figure>
                <div className="cp-quotes">
                  {others.map((r) => (
                    <figure className="cp-quote" key={r.author + r.quote.slice(0, 16)}>
                      <Stars />
                      <blockquote>{r.quote}</blockquote>
                      <figcaption className="cp-cite">{r.author}{r.job !== undefined && <small>{r.job}</small>}</figcaption>
                    </figure>
                  ))}
                </div>
                {c.reviews.note !== undefined && <p className="cp-reviews__note">{c.reviews.note}</p>}
              </div>
            </section>
          )}

          <section className="cp-section" aria-labelledby="cp-crew-title">
            <div className="cp-wrap cp-crew">
              <div className="cp-crew__photo">
                <img src={c.crew.photo.url} alt={c.crew.photo.alt} loading="lazy" decoding="async" />
                {c.crew.inset !== undefined && (
                  <figure className="cp-inset">
                    <img src={c.crew.inset.media.url} alt={c.crew.inset.media.alt} loading="lazy" decoding="async" />
                    <figcaption>{c.crew.inset.caption}</figcaption>
                  </figure>
                )}
              </div>
              <div>
                <p className="cp-eyebrow">{c.crew.eyebrow}</p>
                <h2 className="cp-crew__quote" id="cp-crew-title">{c.crew.quote}</h2>
                <p className="cp-crew__who">{c.crew.attribution}</p>
                <div className="cp-crew__body">{c.crew.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
              </div>
            </div>
          </section>

          <div className="cp-strip" aria-hidden="true" />

          <section className="cp-section" aria-labelledby="cp-area-title">
            <div className="cp-wrap">
              <div className="cp-section__head">
                <div>
                  <p className="cp-eyebrow">{c.area.eyebrow}</p>
                  <h2 className="cp-title" id="cp-area-title">{c.area.title}</h2>
                </div>
                <p className="cp-lede">{c.area.intro}</p>
              </div>
              <ul className="cp-area__states">
                {b.serviceArea.map((s) => <li className="cp-area__state" key={s}>{s}</li>)}
              </ul>
            </div>
          </section>

          <section className="cp-section cp-estimate" id={ESTIMATE_ID} aria-labelledby="cp-estimate-title">
            <div className="cp-wrap cp-estimate__grid">
              <div>
                <p className="cp-eyebrow">{c.estimate.eyebrow}</p>
                <h2 className="cp-title" id="cp-estimate-title">{c.estimate.title}</h2>
                <p className="cp-lede">{c.estimate.intro}</p>
                {c.estimate.steps !== undefined && (
                  <ol className="cp-steps">{c.estimate.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                )}
                <div className="cp-direct">
                  <p className="cp-direct__label">{S.callOrText}</p>
                  <a className="cp-direct__phone" href={tel}>{b.phone}</a>
                  {b.email !== undefined && <a className="cp-direct__email" href={`mailto:${b.email}`}>{b.email}</a>}
                </div>
              </div>
              {tenantId !== undefined && (
                <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={b.serviceArea} />
              )}
            </div>
          </section>
        </main>
    </ContractorShell>
  );
}

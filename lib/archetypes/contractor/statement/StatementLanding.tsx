/**
 * Contractor — the STATEMENT design (Alex, 2026-10-06: "a whole new design from
 * Cut-Pro"). One organizing idea: A HOME-MAGAZINE FEATURE ON THE OWNER. The owner
 * cut out and oversized on the cover, wide confident lettering, navy pages
 * alternating with warm paper pages, the work shown big and room by room, and
 * customers' words set as pull-quotes. Shares only the content shape, the
 * estimate form's workings and the UI strings with the yard (Cut-Pro) design.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';
import { EstimateForm } from '../EstimateForm';
import { ArrowIcon, Headline, Media, PhoneIcon } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { statementCss, STATEMENT_FONTS_HREF } from './styles';

const ESTIMATE_ID = 'estimate';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Header, footer and the phone thumb bar around any page body. */
export function StatementShell({
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
      <link rel="stylesheet" href={STATEMENT_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: statementCss(palette) }} />
      <div className="st">
        <a className="st-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>

        <header className="st-head">
          <div className="st-wrap st-head__row">
            <Link className="st-mark" href="/">
              <span className="st-mark__name">{b.name}</span>
              <span className="st-mark__trade">{b.trade}</span>
            </Link>
            <nav className="st-head__actions" aria-label={S.menuLabel}>
              <a className="st-head__phone" href={tel}><PhoneIcon /> <span>{b.phone}</span></a>
              <a className="st-pill st-pill--gold" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="st-foot">
          <div className="st-wrap">
            <p className="st-foot__big" aria-hidden="true">{b.name}</p>
            <div className="st-foot__row">
              <span>© {year} {b.name} {b.trade} · {S.footer.rights}</span>
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

        <div className="st-thumb">
          <a href={tel}><PhoneIcon /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the statement chrome. */
export function StatementContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <StatementShell content={content} palette={palette}>
      <main className="st-paper st-section">
        <div className="st-wrap st-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </StatementShell>
  );
}

/** The work, grouped into rooms by tag in the order the tags first appear. */
function rooms(items: ContractorContent['work']['items']): { tag: string; items: ContractorContent['work']['items'] }[] {
  const order: string[] = [];
  const byTag = new Map<string, ContractorContent['work']['items']>();
  for (const item of items) {
    const tag = item.tag ?? '';
    if (!byTag.has(tag)) {
      order.push(tag);
      byTag.set(tag, []);
    }
    byTag.get(tag)?.push(item);
  }
  return order.map((tag) => ({ tag, items: byTag.get(tag) ?? [] }));
}

export function StatementLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const [featured, ...others] = c.reviews?.items ?? [];
  const owner = c.hero.cutout;

  return (
    <StatementShell content={c} palette={palette}>
      <main>
        {/* ── the cover ─────────────────────────────────────── */}
        <section className="st-cover">
          <div className="st-cover__stage">
            <div className="st-cover__bg"><Media media={c.hero.media} eager /></div>
            {owner !== undefined && (
              <img className="st-cover__owner" src={owner.url} alt={owner.alt} loading="eager" decoding="async" />
            )}
          </div>
          <div className="st-wrap st-cover__words">
            <p className="st-kicker st-rise">{c.hero.kicker}</p>
            <h1 className="st-cover__headline st-rise"><Headline text={c.hero.headline} highlight={c.hero.highlight} /></h1>
            <p className="st-cover__sub st-rise">{c.hero.sub}</p>
            <div className="st-cover__ctas st-rise">
              <a className="st-pill st-pill--gold st-pill--big" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <ArrowIcon /></a>
              <a className="st-pill st-pill--line st-pill--big" href={tel}><PhoneIcon /> {b.phone}</a>
            </div>
          </div>
        </section>

        {c.proof !== undefined && c.proof.length > 0 && (
          <section className="st-proof" aria-label={c.hero.kicker}>
            <ul className="st-wrap st-proof__row">
              {c.proof.map((p) => (
                <li key={p.label}><span className="st-proof__fig">{p.figure}</span><span className="st-proof__label">{p.label}</span></li>
              ))}
            </ul>
          </section>
        )}

        {/* ── what he does: a numbered contents page ─────────── */}
        <section className="st-paper st-section" aria-labelledby="st-services-title">
          <div className="st-wrap st-split">
            <div className="st-split__head">
              <p className="st-eyebrow">{c.services.eyebrow}</p>
              <h2 className="st-title" id="st-services-title">{c.services.title}</h2>
              {c.services.note !== undefined && <p className="st-lede">{c.services.note}</p>}
            </div>
            <ol className="st-contents">
              {c.services.items.map((s, i) => (
                <li key={s.name} className="st-contents__item">
                  <span className="st-contents__num" aria-hidden="true">{pad(i + 1)}</span>
                  <div>
                    <h3 className="st-contents__name">{s.name}</h3>
                    <p className="st-contents__detail">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── the work, room by room, big ──────────────────── */}
        <section className="st-section st-work" aria-labelledby="st-work-title">
          <div className="st-wrap st-work__head">
            <div>
              <p className="st-eyebrow">{c.work.eyebrow}</p>
              <h2 className="st-title" id="st-work-title">{c.work.title}</h2>
            </div>
            {c.work.intro !== undefined && <p className="st-lede">{c.work.intro}</p>}
          </div>
          <div className="st-reel" tabIndex={0} aria-label={c.work.title}>
            {rooms(c.work.items).flatMap((room) =>
              room.items.map((item, i) => (
                <figure className="st-reel__item" key={item.media.url}>
                  <div className="st-reel__media"><Media media={item.media} /></div>
                  <figcaption className="st-reel__cap">
                    {i === 0 && room.tag !== '' && <span className="st-reel__room">{room.tag}</span>}
                    <span className="st-reel__caption">{item.caption}</span>
                  </figcaption>
                </figure>
              )),
            )}
          </div>
          <p className="st-wrap st-reel__hint" aria-hidden="true">{S.scrollHint} <ArrowIcon /></p>
        </section>

        {/* ── what customers said: pull-quotes ──────────────── */}
        {c.reviews !== undefined && featured !== undefined && (
          <section className="st-paper st-section" aria-labelledby="st-reviews-title">
            <div className="st-wrap">
              <p className="st-eyebrow">{c.reviews.eyebrow}</p>
              <h2 className="st-title st-sr" id="st-reviews-title">{c.reviews.title}</h2>
              <figure className="st-pull">
                <blockquote className="st-pull__quote">{featured.quote}</blockquote>
                <figcaption className="st-pull__who">
                  <strong>{featured.author}</strong>
                  {featured.job !== undefined && <span>{featured.job}</span>}
                </figcaption>
              </figure>
              {others.length > 0 && (
                <div className="st-quotes">
                  {others.map((r) => (
                    <figure className="st-quote" key={r.quote}>
                      <blockquote>{r.quote}</blockquote>
                      <figcaption><strong>{r.author}</strong>{r.job !== undefined && <span>{r.job}</span>}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {c.reviews.note !== undefined && <p className="st-note">{c.reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── who shows up: the owner again, on gold ────────── */}
        <section className="st-crew" aria-labelledby="st-crew-title">
          <div className="st-wrap st-crew__grid">
            <div className={owner !== undefined ? 'st-crew__figure st-crew__figure--owner' : 'st-crew__figure'}>
              {owner !== undefined
                ? <img src={owner.url} alt="" loading="lazy" decoding="async" />
                : <Media media={c.crew.photo} />}
            </div>
            <div className="st-crew__words">
              <p className="st-eyebrow st-eyebrow--ink" id="st-crew-title">{c.crew.eyebrow}</p>
              <blockquote className="st-crew__quote">{c.crew.quote}</blockquote>
              <p className="st-crew__who">{c.crew.attribution}</p>
              {c.crew.body.map((p) => <p className="st-crew__body" key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ── where ─────────────────────────────────────────── */}
        <section className="st-section st-area" aria-labelledby="st-area-title">
          <div className="st-wrap">
            <p className="st-eyebrow">{c.area.eyebrow}</p>
            <h2 className="st-title st-title--wide" id="st-area-title">{c.area.title}</h2>
            <p className="st-lede">{c.area.intro}</p>
          </div>
        </section>

        {/* ── the estimate ──────────────────────────────────── */}
        <section className="st-paper st-section st-estimate" id={ESTIMATE_ID} aria-labelledby="st-estimate-title">
          <div className="st-wrap st-estimate__grid">
            <div>
              <p className="st-eyebrow">{c.estimate.eyebrow}</p>
              <h2 className="st-title" id="st-estimate-title">{c.estimate.title}</h2>
              <p className="st-lede">{c.estimate.intro}</p>
              {c.estimate.steps !== undefined && (
                <ol className="st-steps">
                  {c.estimate.steps.map((s, i) => (
                    <li key={s}><span aria-hidden="true">{pad(i + 1)}</span>{s}</li>
                  ))}
                </ol>
              )}
              <div className="st-direct">
                <p className="st-direct__label">{S.callOrText}</p>
                <a className="st-direct__phone" href={tel}>{b.phone}</a>
                {b.email !== undefined && <a className="st-direct__email" href={`mailto:${b.email}`}>{b.email}</a>}
              </div>
            </div>
            {tenantId !== undefined && (
              <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} />
            )}
          </div>
        </section>
      </main>
    </StatementShell>
  );
}

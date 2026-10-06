/**
 * Contractor — the SWATCH design (Alex, 2026-10-06: "do one of the other samples
 * and see if you can make it different"). One organizing idea: THE SITE IS A
 * PAINT-CHIP CARD. A white page like a paint store's color rack; the top is a
 * wall of color bands with the painter set into one of them; the work is a deck
 * of chips (photo above, the job's own color below, named); reviews are printed
 * on wooden stir sticks. No services list, no gallery grid, no reviews block, no
 * numbering. Shares only the content shape, the estimate form's workings and the
 * UI strings with the other designs.
 */
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import type { DerivedPalette } from '@/lib/color/brand-palette';
import { hexToOklch } from '@/lib/color/oklch';
import type { ContractorContent } from '../schemas';
import { CONTRACTOR_STRINGS as S } from '../strings';
import { EstimateForm } from '../EstimateForm';
import { ArrowIcon, Headline, Media, PhoneIcon } from '../ContractorLanding';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { swatchCss, SWATCH_FONTS_HREF } from './styles';

const ESTIMATE_ID = 'estimate';
/** How many color bands stand across the top. */
const BANDS = 6;

type Swatch = { color: string; name: string };

/** A chip's color travels as CSS custom properties (the per-instance value), never as a style rule. */
function chipVars(color: string): CSSProperties {
  const ink = hexToOklch(color).l > 0.68 ? '#1b1b1f' : '#ffffff';
  return { '--chip': color, '--chip-ink': ink } as CSSProperties;
}

function swatchesOf(c: ContractorContent): Swatch[] {
  return c.work.items.flatMap((i) => (i.swatch !== undefined ? [i.swatch] : []));
}

/** Header, footer and the phone thumb bar around any page body. */
export function SwatchShell({
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
  const swatches = swatchesOf(c);
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={SWATCH_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: swatchCss(palette) }} />
      <div className="sw">
        <a className="sw-skip" href={`/#${ESTIMATE_ID}`}>{S.skipToEstimate}</a>

        <header className="sw-head">
          <div className="sw-wrap sw-head__row">
            <Link className="sw-mark" href="/">
              <span className="sw-mark__name">{b.name}</span>
              <span className="sw-mark__trade">{b.trade}</span>
            </Link>
            <nav className="sw-head__actions" aria-label={S.menuLabel}>
              <a className="sw-head__phone" href={tel}><PhoneIcon /> <span>{b.phone}</span></a>
              <a className="sw-btn sw-btn--ink" href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="sw-foot">
          {swatches.length > 0 && (
            <div className="sw-foot__strip" aria-hidden="true">
              {swatches.map((s) => <span key={s.name} style={chipVars(s.color)} />)}
            </div>
          )}
          <div className="sw-wrap sw-foot__row">
            <span className="sw-foot__name">{b.name} {b.trade}</span>
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

        <div className="sw-thumb">
          <a href={tel}><PhoneIcon /> {S.call}</a>
          <a href={`/#${ESTIMATE_ID}`}>{S.estimateShort}</a>
        </div>
      </div>
    </>
  );
}

/** A plain content page (privacy, terms) in the swatch chrome. */
export function SwatchContentPage({ content, palette, html }: { content: ContractorContent; palette: DerivedPalette; html: string }): ReactElement {
  return (
    <SwatchShell content={content} palette={palette}>
      <main className="sw-section">
        <div className="sw-wrap sw-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </SwatchShell>
  );
}

export function SwatchLanding({ content: c, palette, tenantId }: { content: ContractorContent; palette: DerivedPalette; tenantId: string | undefined }): ReactElement {
  const b = c.business;
  const tel = `tel:${b.phoneDial}`;
  const bands = swatchesOf(c).slice(0, BANDS);
  const photoAt = Math.min(2, bands.length);

  return (
    <SwatchShell content={c} palette={palette}>
      <main>
        {/* ── the wall of color, the painter set into it ───── */}
        <section className="sw-wall">
          <div className="sw-wall__bands">
            {bands.slice(0, photoAt).map((s) => (
              <div className="sw-band" key={s.name} style={chipVars(s.color)}><span className="sw-band__name">{s.name}</span></div>
            ))}
            <div className="sw-band sw-band--photo"><Media media={c.hero.media} eager /></div>
            {bands.slice(photoAt).map((s) => (
              <div className="sw-band" key={s.name} style={chipVars(s.color)}><span className="sw-band__name">{s.name}</span></div>
            ))}
          </div>
          <div className="sw-wrap sw-wall__labelwrap">
            <div className="sw-label">
              <p className="sw-label__kicker">{c.hero.kicker}</p>
              <h1 className="sw-label__headline"><Headline text={c.hero.headline} highlight={c.hero.highlight} /></h1>
              <p className="sw-label__sub">{c.hero.sub}</p>
              <div className="sw-label__ctas">
                <a className="sw-btn sw-btn--accent" href={`#${ESTIMATE_ID}`}>{c.hero.estimateLabel} <ArrowIcon /></a>
                <a className="sw-btn sw-btn--line" href={tel}><PhoneIcon /> {b.phone}</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── what we paint, said in one breath ─────────────── */}
        <section className="sw-section sw-say" aria-labelledby="sw-services-title">
          <div className="sw-wrap">
            <p className="sw-eyebrow">{c.services.eyebrow}</p>
            <h2 className="sw-say__title" id="sw-services-title">{c.services.title}</h2>
            <ul className="sw-tags">
              {c.services.items.map((s) => (
                <li key={s.name} className="sw-tag" title={s.detail}>{s.name}</li>
              ))}
            </ul>
            <p className="sw-say__detail">{c.services.items.map((s) => s.detail).join(' ')}</p>
          </div>
        </section>

        {/* ── the work: a deck of paint chips ────────────────── */}
        <section className="sw-section sw-deck" aria-labelledby="sw-work-title">
          <div className="sw-wrap">
            <div className="sw-deck__head">
              <p className="sw-eyebrow">{c.work.eyebrow}</p>
              <h2 className="sw-title" id="sw-work-title">{c.work.title}</h2>
              {c.work.intro !== undefined && <p className="sw-lede">{c.work.intro}</p>}
            </div>
            <ul className="sw-chips">
              {c.work.items.map((item) => (
                <li className="sw-chip" key={item.media.url} style={item.swatch !== undefined ? chipVars(item.swatch.color) : undefined}>
                  <div className="sw-chip__photo"><Media media={item.media} /></div>
                  <div className="sw-chip__color">
                    {item.swatch !== undefined && <span className="sw-chip__name">{item.swatch.name}</span>}
                    <span className="sw-chip__caption">{item.caption}</span>
                    {item.tag !== undefined && <span className="sw-chip__tag">{item.tag}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── reviews on paint stir sticks ───────────────────── */}
        {c.reviews !== undefined && c.reviews.items.length > 0 && (
          <section className="sw-section sw-sticks" aria-labelledby="sw-reviews-title">
            <div className="sw-wrap">
              <p className="sw-eyebrow">{c.reviews.eyebrow}</p>
              <h2 className="sw-title" id="sw-reviews-title">{c.reviews.title}</h2>
              <ul className="sw-sticks__list">
                {c.reviews.items.map((r) => (
                  <li className="sw-stick" key={r.quote}>
                    <blockquote className="sw-stick__quote">{r.quote}</blockquote>
                    <p className="sw-stick__who">{r.author}{r.job !== undefined && <span> · {r.job}</span>}</p>
                  </li>
                ))}
              </ul>
              {c.reviews.note !== undefined && <p className="sw-note">{c.reviews.note}</p>}
            </div>
          </section>
        )}

        {/* ── who shows up: the photo dripping wet ───────────── */}
        <section className="sw-section sw-crew" aria-labelledby="sw-crew-title">
          <div className="sw-wrap sw-crew__grid">
            <div className="sw-crew__photo"><Media media={c.crew.photo} /></div>
            <div>
              <p className="sw-eyebrow" id="sw-crew-title">{c.crew.eyebrow}</p>
              <blockquote className="sw-crew__quote">{c.crew.quote}</blockquote>
              <p className="sw-crew__who">{c.crew.attribution}</p>
              {c.crew.body.map((p) => <p className="sw-crew__body" key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ── where, then the estimate on a color card ───────── */}
        <section className="sw-section sw-estimate" id={ESTIMATE_ID} aria-labelledby="sw-estimate-title">
          <div className="sw-wrap">
            <div className="sw-estimate__head">
              <p className="sw-eyebrow">{c.estimate.eyebrow}</p>
              <h2 className="sw-title" id="sw-estimate-title">{c.estimate.title}</h2>
              <p className="sw-lede">{c.estimate.intro}</p>
              <p className="sw-area"><strong>{c.area.title}.</strong> {c.area.intro}</p>
              <ul className="sw-towns">{b.serviceArea.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="sw-card">
              <div className="sw-card__strip" aria-hidden="true">
                {bands.map((s) => <span key={s.name} style={chipVars(s.color)} />)}
              </div>
              <div className="sw-card__body">
                {c.estimate.steps !== undefined && (
                  <p className="sw-card__steps">{c.estimate.steps.join(' → ')}</p>
                )}
                {tenantId !== undefined && (
                  <EstimateForm tenantId={tenantId} services={c.services.items.map((s) => s.name)} states={c.estimate.states ?? b.serviceArea} detailsHint={c.estimate.detailsHint} />
                )}
                <p className="sw-card__direct">{S.callOrText} <a href={tel}>{b.phone}</a></p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SwatchShell>
  );
}

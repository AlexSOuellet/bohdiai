'use client';

/**
 * Main Street — a swappable HERO variant: EDITORIAL COVER.
 *
 * A magazine-cover composition: full-bleed media, the brand set as a GIANT
 * masthead, with the coverlines (eyebrow / sub / CTA) anchored at the bottom.
 * The text is painted OVER the media, so it uses the skin-agnostic --ms-on-media
 * near-white plus a scrim (never the skin's own fg, whose luminance can't be
 * trusted over an unknown image) — the same legibility rule as the Story hero.
 * The brand's TYPE still comes from the skin's display role, so each family's
 * cover reads as that family. Editorial cover has no family default; it lives in
 * the catalog for the editor.
 *
 * Reads the shared hero content contract (the "pile"); does NOT use the Story
 * fading lines.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function EditorialCoverHero({
  identity,
  moment,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';

  return (
    <header data-ms-hero="editorial-cover" className="ms-editorial-hero">
      <style>{`
        .ms-editorial-hero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);display:flex;flex-direction:column}
        .ms-editorial-hero [data-ms-hero-media]{position:absolute;inset:0;z-index:0}
        /* Cover gradient: darken the TOP (for the masthead banner) and the BOTTOM
           (for the coverlines), leaving the middle of the photo clear — a magazine
           cover, not Story's centre-weighted cinematic scrim. */
        .ms-editorial-hero .ms-cover-grad{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.62),transparent 32%,transparent 58%,rgba(0,0,0,.7))}
        .ms-editorial-hero .ms-cover-inner{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;color:var(--ms-on-media);padding:clamp(14px,2vw,24px) clamp(20px,4vw,52px) clamp(28px,4vh,52px)}
        .ms-editorial-hero .ms-cover-masthead{text-align:center;margin-top:clamp(6px,1.5vh,18px)}
        .ms-editorial-hero .ms-cover-rule{height:1px;background:var(--ms-on-media);opacity:.75;margin-top:clamp(12px,1.8vh,22px)}
        .ms-editorial-hero .ms-cover-coverlines{margin-top:auto;max-width:34ch;display:flex;flex-direction:column;align-items:flex-start;text-align:left}
        /* AMPLIFICATION — the cover blows the brand up to masthead scale and the
           coverline above body size. These are real scoped rules (more specific
           than the base [data-type] rule, later in the cascade), so they win
           WITHOUT inline styles — which is what makes media queries work and the
           old dead-CSS masthead bug impossible. */
        .ms-editorial-hero .ms-cover-masthead [data-type="brand"]{font-size:clamp(56px,11vw,168px);line-height:.9;letter-spacing:-.015em}
        .ms-editorial-hero .ms-cover-coverlines [data-type="body"]{font-size:clamp(18px,2vw,26px);line-height:1.35}
      `}</style>

      <div data-ms-hero-media>
        <Media media={moment.media} />
      </div>
      <div aria-hidden className="ms-cover-grad" />

      <div className="ms-cover-inner">
        <nav
          data-ms-hero-nav
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, color: 'var(--ms-on-media)' }}
        >
          <Nav identity={identity} />
        </nav>

        {/* MASTHEAD BANNER — pinned to the top, centred, with a full-width rule
            beneath: the magazine title block. This is what separates the cover from
            Story (whose brand sits centred in the frame). The eyebrow is the small
            tracked dateline kicker above the title. */}
        <div className="ms-cover-masthead">
          <Type as="div" role="eyebrow" style={{ color: 'var(--ms-on-media)', marginBottom: 'clamp(10px,1.4vh,16px)' }}>
            {moment.eyebrow}
          </Type>
          {/* The skin owns the brand's FONT (family/weight, from the role's CSS
              vars); the cover amplifies its SIZE to masthead scale via the scoped
              [data-type="brand"] rule in the <style> above — a real rule, so it
              can use media queries and never fights an inline size. */}
          <Type
            as="h1"
            role="brand"
            style={{ color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 50px rgba(0,0,0,.5)' }}
          >
            {moment.brand}
          </Type>
          <div className="ms-cover-rule" />
        </div>

        {/* COVERLINES — bottom-LEFT corner, like newsstand teaser lines (Story
            keeps everything centred). An accent tick leads the line. */}
        <div className="ms-cover-coverlines">
          <div aria-hidden style={{ width: 40, height: 3, background: 'var(--ms-accent)', marginBottom: 16 }} />
          {moment.sub && (
            <Type
              as="p"
              role="body"
              data-ms-hero-sub
              style={{ color: 'var(--ms-on-media)', margin: 0, textShadow: '0 1px 24px rgba(0,0,0,.55)' }}
            >
              {moment.sub}
            </Type>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 26, flexWrap: 'wrap' }}>
            <Type
              as="a"
              role="navLabel"
              href={ctaHref}
              style={{ background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}
            >
              {moment.ctaLabel}
            </Type>
            {moment.secondaryCtaLabel && (
              <Type
                as="a"
                role="navLabel"
                href={secondaryHref}
                style={{ border: '1px solid var(--ms-on-media-muted)', color: 'var(--ms-on-media)', padding: '16px 26px', borderRadius: 2 }}
              >
                {moment.secondaryCtaLabel}
              </Type>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

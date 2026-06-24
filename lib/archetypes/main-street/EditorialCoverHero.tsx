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
import { Media, Nav, typeRoleCss, roles, linkHref } from './chrome';

export function EditorialCoverHero({
  identity,
  moment,
  skin,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const r = roles(skin);
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';

  return (
    <header data-ms-hero="editorial-cover" className="ms-editorial-hero">
      <style>{`
        .ms-editorial-hero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);display:flex;flex-direction:column}
        .ms-editorial-hero [data-ms-hero-media]{position:absolute;inset:0;z-index:0}
        .ms-editorial-hero .ms-cover-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.15) 40%,rgba(0,0,0,.72))}
        .ms-editorial-hero .ms-cover-inner{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;color:var(--ms-on-media);padding:0 clamp(24px,5vw,64px) clamp(32px,5vh,64px)}
        .ms-editorial-hero .ms-cover-masthead{margin-top:clamp(24px,6vh,72px)}
        .ms-editorial-hero .ms-cover-coverlines{margin-top:auto;max-width:54ch}
      `}</style>

      <div data-ms-hero-media>
        <Media media={moment.media} />
      </div>
      <div aria-hidden className="ms-cover-scrim" />

      <div className="ms-cover-inner">
        <nav
          data-ms-hero-nav
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, paddingTop: 'clamp(20px,3vw,32px)', color: 'var(--ms-on-media)' }}
        >
          <Nav identity={identity} skin={skin} />
        </nav>

        <div className="ms-cover-masthead">
          {/* The skin owns the brand's FONT (family/weight via typeRoleCss); the
              cover amplifies its SIZE to masthead scale. The size MUST be inline —
              an inline style beats a stylesheet rule, so a <style> font-size here
              would be overridden by typeRoleCss's inline size and never apply. */}
          <h1
            data-type="brand"
            style={{
              ...typeRoleCss(r.brand),
              fontSize: 'clamp(56px, 11vw, 168px)',
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              color: 'var(--ms-on-media)',
              margin: 0,
              textShadow: '0 2px 50px rgba(0,0,0,.5)',
            }}
          >
            {moment.brand}
          </h1>
        </div>

        <div className="ms-cover-coverlines">
          <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-on-media)', marginBottom: 14 }}>
            {moment.eyebrow}
          </div>
          {moment.sub && (
            <p data-ms-hero-sub data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-on-media-muted)', margin: 0, textShadow: '0 1px 24px rgba(0,0,0,.5)' }}>
              {moment.sub}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 26, flexWrap: 'wrap' }}>
            <a
              href={ctaHref}
              data-type="navLabel"
              style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}
            >
              {moment.ctaLabel}
            </a>
            {moment.secondaryCtaLabel && (
              <a
                href={secondaryHref}
                data-type="navLabel"
                style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-on-media-muted)', color: 'var(--ms-on-media)', padding: '16px 26px', borderRadius: 2 }}
              >
                {moment.secondaryCtaLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

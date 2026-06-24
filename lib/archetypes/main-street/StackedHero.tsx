'use client';

/**
 * Main Street — a swappable HERO variant: STACKED.
 *
 * A horizontal nav bar, a centered text block (eyebrow / headline / sub / CTA),
 * then a full-width media band that fills the rest of the viewport. Like Split,
 * the words sit ON the skin's surface (--ms-bg / --ms-fg / --ms-accent + the
 * type roles), so the same structure reads as whichever family wears it — the
 * renderer names no color and no font. Stacked is Rustic's default in the family
 * docs; the family's texture-blended band is a SKIN concern (the look layer),
 * not this structure.
 *
 * Reads the shared hero content contract (the "pile"): eyebrow, brand, sub,
 * media, CTA(s). It does NOT use the Story fading lines — those belong to Story.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles, linkHref } from './chrome';

export function StackedHero({
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
    <header data-ms-hero="stacked" className="ms-stacked-hero">
      <style>{`
        .ms-stacked-hero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
        .ms-stacked-hero [data-ms-hero-media]{flex:1;min-height:40vh}
      `}</style>

      <div
        data-ms-hero-nav
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 'clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0' }}
      >
        <Nav identity={identity} skin={skin} />
      </div>

      <div
        data-ms-hero-text
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'clamp(32px,6vh,72px) clamp(24px,6vw,64px)' }}
      >
        <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', marginBottom: 20 }}>
          {moment.eyebrow}
        </div>
        <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-fg)', margin: 0, maxWidth: '18ch' }}>
          {moment.brand}
        </h1>
        {moment.sub && (
          <p data-ms-hero-sub data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', maxWidth: '52ch', marginTop: 20, marginBottom: 0 }}>
            {moment.sub}
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 'clamp(24px,3vh,36px)', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-rule)', color: 'var(--ms-fg)', padding: '16px 26px', borderRadius: 2 }}
            >
              {moment.secondaryCtaLabel}
            </a>
          )}
        </div>
      </div>

      <div data-ms-hero-media style={{ position: 'relative', overflow: 'hidden', background: 'var(--ms-contrast-bg)' }}>
        <Media media={moment.media} />
      </div>
    </header>
  );
}

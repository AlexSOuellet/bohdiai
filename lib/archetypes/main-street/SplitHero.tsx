'use client';

/**
 * Main Street — a swappable HERO variant: SPLIT.
 *
 * Text on a solid skin panel beside a full-bleed media panel. Unlike the Story
 * hero (MomentHero), the words here sit ON the skin's own surface — not over the
 * media — so they read the skin's real colors and fonts (--ms-bg / --ms-fg /
 * --ms-accent and the type roles). That is what makes Split look like whatever
 * family wears it: Cozy-Split, Rustic-Split, and Modern-Split are the SAME
 * structure with each family's skin poured in. The renderer names no color and
 * no font (the skin system's trick), so this component is family-agnostic.
 *
 * It reads the shared hero CONTENT CONTRACT (the "pile"): eyebrow (label), brand
 * (headline), sub (the plain supporting sentence), media, and the CTA(s). It
 * does NOT use the Story fading lines (`moment.story`) — those belong to the
 * Story hero alone.
 *
 * `mediaSide` is the one structural knob: 'right' (default) or 'left' (the
 * mirror). On a phone the two panels stack into one column.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles, linkHref } from './chrome';

export function SplitHero({
  identity,
  moment,
  skin,
  mediaSide = 'right',
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  /** Which side the media sits on. 'right' (default) puts the text first; 'left'
   *  is the mirror. The only structural variation Split carries. */
  mediaSide?: 'left' | 'right';
}) {
  const r = roles(skin);
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';

  const textPanel = (
    <div
      data-ms-hero-text
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ms-bg)',
        color: 'var(--ms-fg)',
        padding: 'clamp(28px,5vw,60px)',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: 'clamp(24px,5vh,56px)' }}>
        <Nav identity={identity} skin={skin} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 540 }}>
        <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', marginBottom: 24 }}>
          {moment.eyebrow}
        </div>
        <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-fg)', margin: 0 }}>
          {moment.brand}
        </h1>
        {moment.sub && (
          <p data-ms-hero-sub data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', maxWidth: '42ch', marginTop: 24, marginBottom: 0 }}>
            {moment.sub}
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 'clamp(28px,4vh,40px)', flexWrap: 'wrap' }}>
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
    </div>
  );

  const mediaPanel = (
    <div data-ms-hero-media style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: 'var(--ms-contrast-bg)' }}>
      <Media media={moment.media} />
    </div>
  );

  return (
    <header data-ms-hero="split" data-media-side={mediaSide} className="ms-split-hero">
      <style>{`
        .ms-split-hero{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
        @media(max-width:860px){
          .ms-split-hero{grid-template-columns:1fr}
          .ms-split-hero [data-ms-hero-text]{min-height:auto;order:1}
          .ms-split-hero [data-ms-hero-media]{min-height:56vh;order:2}
        }
      `}</style>
      {mediaSide === 'left' ? (
        <>
          {mediaPanel}
          {textPanel}
        </>
      ) : (
        <>
          {textPanel}
          {mediaPanel}
        </>
      )}
    </header>
  );
}

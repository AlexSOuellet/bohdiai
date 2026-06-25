'use client';

/**
 * Main Street — a swappable HERO variant: FLOATING CARD.
 *
 * Full-bleed media with a solid card floating over it. The nav sits over the
 * media (legible via the skin-agnostic --ms-on-media token + a wash); the card
 * holds the text on the skin's OWN surface (--ms-bg / --ms-fg / --ms-accent), so
 * the words stay readable regardless of the media's luminance and still read as
 * whichever family wears the hero. Floating card is Dark's default in the family
 * docs (still open there — easy to swap).
 *
 * Reads the shared hero content contract (the "pile"): eyebrow, brand, sub,
 * media, CTA(s). It does NOT use the Story fading lines.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function FloatingCardHero({
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
    <header data-ms-hero="floating-card" className="ms-floating-hero">
      <style>{`
        .ms-floating-hero{position:relative;min-height:100vh;overflow:hidden;background:var(--ms-contrast-bg);display:flex;flex-direction:column}
        .ms-floating-hero [data-ms-hero-media]{position:absolute;inset:0;z-index:0}
        .ms-floating-hero .ms-float-wash{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,.5))}
        .ms-floating-hero .ms-float-card-wrap{position:relative;z-index:2;flex:1;display:flex;align-items:center;justify-content:flex-end;padding:clamp(24px,5vw,80px)}
        @media(max-width:860px){.ms-floating-hero .ms-float-card-wrap{justify-content:center}}
      `}</style>

      <div data-ms-hero-media>
        <Media media={moment.media} />
      </div>
      <div aria-hidden className="ms-float-wash" />

      <nav
        data-ms-hero-nav
        style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 'clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0', color: 'var(--ms-on-media)' }}
      >
        <Nav identity={identity} />
      </nav>

      <div className="ms-float-card-wrap">
        <div
          data-ms-hero-card
          data-ms-hero-text
          style={{
            background: 'var(--ms-bg)',
            color: 'var(--ms-fg)',
            padding: 'clamp(32px,4vw,52px)',
            maxWidth: 460,
            border: '1px solid var(--ms-rule)',
            boxShadow: '0 44px 100px -24px rgba(0,0,0,.55)',
          }}
        >
          <Type as="div" role="eyebrow" style={{ color: 'var(--ms-accent)', marginBottom: 18 }}>
            {moment.eyebrow}
          </Type>
          <div aria-hidden style={{ width: 46, height: 2, background: 'var(--ms-accent)', marginBottom: 20 }} />
          <Type as="h1" role="brand" style={{ color: 'var(--ms-fg)', margin: 0 }}>
            {moment.brand}
          </Type>
          {moment.sub && (
            <Type as="p" role="body" data-ms-hero-sub style={{ color: 'var(--ms-fg-muted)', marginTop: 20, marginBottom: 0 }}>
              {moment.sub}
            </Type>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
            <Type
              as="a"
              role="navLabel"
              href={ctaHref}
              style={{ background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '15px 24px', borderRadius: 2 }}
            >
              {moment.ctaLabel}
            </Type>
            {moment.secondaryCtaLabel && (
              <Type
                as="a"
                role="navLabel"
                href={secondaryHref}
                style={{ border: '1px solid var(--ms-rule)', color: 'var(--ms-fg)', padding: '15px 24px', borderRadius: 2 }}
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

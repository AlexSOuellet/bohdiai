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
import { Media, Nav, typeRoleCss, roles, linkHref } from './chrome';

export function FloatingCardHero({
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
        <Nav identity={identity} skin={skin} />
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
          <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', marginBottom: 18 }}>
            {moment.eyebrow}
          </div>
          <div aria-hidden style={{ width: 46, height: 2, background: 'var(--ms-accent)', marginBottom: 20 }} />
          <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-fg)', margin: 0 }}>
            {moment.brand}
          </h1>
          {moment.sub && (
            <p data-ms-hero-sub data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', marginTop: 20, marginBottom: 0 }}>
              {moment.sub}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
            <a
              href={ctaHref}
              data-type="navLabel"
              style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '15px 24px', borderRadius: 2 }}
            >
              {moment.ctaLabel}
            </a>
            {moment.secondaryCtaLabel && (
              <a
                href={secondaryHref}
                data-type="navLabel"
                style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-rule)', color: 'var(--ms-fg)', padding: '15px 24px', borderRadius: 2 }}
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

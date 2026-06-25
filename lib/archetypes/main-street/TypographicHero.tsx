'use client';

/**
 * Main Street — a swappable HERO variant: TYPOGRAPHIC.
 *
 * No image. The words carry it: a horizontal nav, then a centered column —
 * eyebrow, a large headline, a thin divider rule, the sub-line, and the CTA.
 * Reads the skin's surface and type roles (--ms-bg / --ms-fg / --ms-accent), so
 * the same structure reads as whichever family wears it. Typographic is Luxury's
 * default in the family docs.
 *
 * Reads the shared hero content contract (the "pile") MINUS the media — a hero
 * with no picture simply does not reach for it. The video / stills the build
 * produces are unused on this hero. It does NOT use the Story fading lines.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Nav, linkHref } from './chrome';
import { Type } from './Type';

export function TypographicHero({
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
    <header data-ms-hero="typographic" className="ms-typographic-hero">
      <style>{`
        .ms-typographic-hero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
        .ms-typographic-hero .ms-typ-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(40px,8vh,120px) clamp(24px,6vw,72px)}
      `}</style>

      <div
        data-ms-hero-nav
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 'clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0' }}
      >
        <Nav identity={identity} />
      </div>

      <div className="ms-typ-body">
        <Type as="div" role="eyebrow" style={{ color: 'var(--ms-accent)', marginBottom: 28 }}>
          {moment.eyebrow}
        </Type>
        <Type as="h1" role="brand" style={{ color: 'var(--ms-fg)', margin: 0, maxWidth: '16ch' }}>
          {moment.brand}
        </Type>
        <div aria-hidden style={{ width: 64, height: 1, background: 'var(--ms-accent)', opacity: 0.7, margin: 'clamp(20px,3vh,32px) 0' }} />
        {moment.sub && (
          <Type as="p" role="body" data-ms-hero-sub style={{ color: 'var(--ms-fg-muted)', maxWidth: '46ch', margin: 0 }}>
            {moment.sub}
          </Type>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 'clamp(28px,4vh,40px)', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              style={{ border: '1px solid var(--ms-rule)', color: 'var(--ms-fg)', padding: '16px 26px', borderRadius: 2 }}
            >
              {moment.secondaryCtaLabel}
            </Type>
          )}
        </div>
      </div>
    </header>
  );
}

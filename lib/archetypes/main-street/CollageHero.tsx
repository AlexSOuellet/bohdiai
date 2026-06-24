'use client';

/**
 * Main Street — a swappable HERO variant: COLLAGE.
 *
 * A text column (eyebrow / headline / sub / CTA) beside a cluster of THREE shots.
 * Collage is the one hero whose imagery is its own dedicated stills — generated
 * at build time as `moment.collageShots` (NOT frames of the hero video, NOT the
 * product catalog). Skin-agnostic: text reads --ms-bg / --ms-fg / --ms-accent +
 * the type roles; the shot frames use the skin's rule colour. Collage is
 * Playful's default in the family docs.
 *
 * CONTENT GATE / FUNCTIONAL FLOOR: a shot with no resolved url is skipped (no
 * broken image); with no shots at all the cluster doesn't render and the text
 * still stands. Reads the shared "pile" text; does NOT use the Story fading lines
 * or the hero media clip.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Nav, typeRoleCss, roles, linkHref } from './chrome';

const POSITIONS = [
  { width: '46%', height: '64%', left: '0', top: '6%', rotate: '-5deg', z: 1 },
  { width: '38%', height: '44%', right: '2%', top: '0', rotate: '5deg', z: 2 },
  { width: '42%', height: '46%', right: '6%', bottom: '2%', rotate: '-3deg', z: 3 },
] as const;

export function CollageHero({
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
  const shots = (moment.collageShots ?? []).filter((s) => typeof s.url === 'string' && s.url !== '').slice(0, POSITIONS.length);

  return (
    <header data-ms-hero="collage" className="ms-collage-hero">
      <style>{`
        .ms-collage-hero{display:flex;flex-direction:column;min-height:100vh;background:var(--ms-bg);color:var(--ms-fg)}
        .ms-collage-hero .ms-collage-body{flex:1;display:grid;grid-template-columns:0.92fr 1.08fr;align-items:center;gap:clamp(24px,4vw,48px);padding:clamp(16px,3vh,32px) clamp(24px,5vw,60px) clamp(32px,5vh,56px);min-height:0}
        .ms-collage-hero .ms-collage-cluster{position:relative;width:100%;height:100%;min-height:360px}
        .ms-collage-hero [data-ms-collage-shot]{position:absolute;overflow:hidden;border:6px solid var(--ms-bg);box-shadow:0 16px 36px -12px rgba(0,0,0,.26)}
        .ms-collage-hero [data-ms-collage-shot] img{width:100%;height:100%;object-fit:cover;display:block}
        @media(max-width:860px){
          .ms-collage-hero .ms-collage-body{grid-template-columns:1fr;gap:clamp(20px,4vh,32px)}
          .ms-collage-hero .ms-collage-cluster{min-height:300px}
        }
      `}</style>

      <div
        data-ms-hero-nav
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 'clamp(20px,3vw,32px) clamp(24px,5vw,60px) 0' }}
      >
        <Nav identity={identity} skin={skin} />
      </div>

      <div className="ms-collage-body">
        <div data-ms-hero-text style={{ display: 'flex', flexDirection: 'column' }}>
          <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', marginBottom: 20 }}>
            {moment.eyebrow}
          </div>
          <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-fg)', margin: 0 }}>
            {moment.brand}
          </h1>
          {moment.sub && (
            <p data-ms-hero-sub data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg-muted)', maxWidth: '38ch', marginTop: 20, marginBottom: 0 }}>
              {moment.sub}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap' }}>
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

        {shots.length > 0 && (
          <div className="ms-collage-cluster" aria-label="A few moments from the shop">
            {shots.map((s, i) => {
              const pos = POSITIONS[i]!;
              return (
                <div
                  key={i}
                  data-ms-collage-shot
                  style={{
                    width: pos.width,
                    height: pos.height,
                    left: 'left' in pos ? pos.left : undefined,
                    right: 'right' in pos ? pos.right : undefined,
                    top: 'top' in pos ? pos.top : undefined,
                    bottom: 'bottom' in pos ? pos.bottom : undefined,
                    transform: `rotate(${pos.rotate})`,
                    zIndex: pos.z,
                  }}
                >
                  <img src={s.url} alt={s.alt} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

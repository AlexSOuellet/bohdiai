/**
 * Main Street — SpotlightStage: cinematic reveal for a 'spotlight' moment.
 * Single continuous timeline from mount: pure black → hero object rises
 * (opacity 6s, 500ms delay) + slow push-in (scale 20s) → scrim → words
 * fade in with staggered delays that OVERLAP the rising object (eyebrow at
 * 4.2s, brand at 5s, line at 6.2s, action at 7.2s — same rhythm as the
 * legacy Spotlight primitive). Used identically by the rested hero and the
 * intro overlay; only the `action` element differs between them.
 * Pure component — no hooks, no IO. Reduced-motion: all animations disabled,
 * everything visible immediately.
 * DO NOT import from components/storefront/layout/primitives/Spotlight.tsx.
 */
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { typeRoleCss, roles } from './chrome';

const RISE_DURATION = '6s';
const RISE_DELAY = '500ms';
const PUSH_DURATION = '20s';

// Stagger delays (ms) from mount — words OVERLAP the rising object
// (eyebrow appears at 4.2s while the object is ~70% risen). Durations
// match the legacy Spotlight primitive.
const D = {
  eyebrow: { delay: 4200, dur: '2.2s' },
  brand:   { delay: 5000, dur: '2.6s' },
  line:    { delay: 6200, dur: '2.6s' },
  action:  { delay: 7200, dur: '2.6s' },
} as const;

const SCOPED_CSS = `
  @keyframes ss-rise{from{opacity:0}to{opacity:1}}
  @keyframes ss-push{from{transform:scale(1)}to{transform:scale(1.08)}}
  @keyframes ss-fade{from{opacity:0}to{opacity:1}}
  [data-spotlight-stage] [data-spotlight-object]{animation:ss-push ${PUSH_DURATION} ease-out forwards}
  [data-spotlight-stage] [data-spotlight-rise]{animation:ss-rise ${RISE_DURATION} linear ${RISE_DELAY} both}
  [data-spotlight-stage] [data-spotlight-eyebrow]{animation:ss-fade ${D.eyebrow.dur} linear ${D.eyebrow.delay}ms both}
  [data-spotlight-stage] [data-spotlight-brand]{animation:ss-fade ${D.brand.dur} linear ${D.brand.delay}ms both}
  [data-spotlight-stage] [data-spotlight-line]{animation:ss-fade ${D.line.dur} linear ${D.line.delay}ms both}
  [data-spotlight-stage] [data-spotlight-action]{animation:ss-fade ${D.action.dur} linear ${D.action.delay}ms both}
  @media(prefers-reduced-motion:reduce){
    [data-spotlight-stage] [data-spotlight-object]{animation:none}
    [data-spotlight-stage] [data-spotlight-rise]{animation:none;opacity:1}
    [data-spotlight-stage] [data-spotlight-eyebrow]{animation:none;opacity:1;transition:none}
    [data-spotlight-stage] [data-spotlight-brand]{animation:none;opacity:1;transition:none}
    [data-spotlight-stage] [data-spotlight-line]{animation:none;opacity:1;transition:none}
    [data-spotlight-stage] [data-spotlight-action]{animation:none;opacity:1;transition:none}
  }
`;

export function SpotlightStage({
  moment,
  skin,
  action,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  action: ReactNode;
}) {
  const r = roles(skin);
  const line = moment.story[0] ?? null;

  return (
    <section
      data-spotlight-stage
      style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        // CSS custom property preserves the literal '#000' in the style attribute
        // so tests can assert on it without jsdom rgb() normalization.
        ['--spotlight-bg' as string]: '#000',
        background: 'var(--spotlight-bg)',
        color: 'var(--ms-on-media)',
      }}
    >
      <style>{SCOPED_CSS}</style>

      {/* Rising-object layer: push-in wrapper → rise → image or placeholder */}
      <div data-spotlight-object style={{ position: 'absolute', inset: 0, zIndex: 0, transformOrigin: '50% 52%' }}>
        <div data-spotlight-rise style={{ position: 'absolute', inset: 0 }}>
          {moment.media.url ? (
            <img src={moment.media.url} alt={moment.media.alt} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div aria-label={moment.media.alt} style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)' }} />
          )}
        </div>
      </div>

      {/* Center-weighted scrim — text reads over any image luminance */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,.42),rgba(0,0,0,.82))' }} />

      {/* Words layer — all elements animate in from mount with staggered delays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 'clamp(28px,6vw,96px)' }}>
        <div>
          <div
            data-spotlight-eyebrow data-type="eyebrow"
            style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-on-media-muted)', marginBottom: 18 }}
          >
            {moment.eyebrow}
          </div>
          <div
            data-spotlight-brand data-type="brand"
            style={{ ...typeRoleCss(r.brand), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}
          >
            {moment.brand}
          </div>
          {line !== null && (
            <div
              data-spotlight-line data-type="storyline"
              style={{ ...typeRoleCss(r.storyline), color: 'var(--ms-on-media)', maxWidth: '18ch', margin: '20px auto 0', textShadow: '0 2px 36px rgba(0,0,0,.55)' }}
            >
              {line}
            </div>
          )}
          {action != null && (
            <div data-spotlight-action style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              {action}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

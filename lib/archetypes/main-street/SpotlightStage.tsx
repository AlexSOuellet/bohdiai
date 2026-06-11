/**
 * Main Street — SpotlightStage: cinematic reveal for a 'spotlight' moment.
 * Pure black → hero object rises (opacity 6s, 500ms delay) + slow push-in
 * (scale 20s) → scrim → words fade in when phase === 'brand', staggered.
 * Pure component — no hooks, no IO. Reduced-motion: keyframes disabled,
 * object visible at rest, words appear instantly.
 * DO NOT import from components/storefront/layout/primitives/Spotlight.tsx.
 */
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { typeRoleCss, roles } from './chrome';

const RISE_DURATION = '6s';
const RISE_DELAY = '500ms';
const PUSH_DURATION = '20s';
const WORD_FADE = '1.1s';
// Stagger delays (ms) counting from when phase becomes 'brand'.
const D = { eyebrow: 4200, brand: 5000, line: 6200, action: 7200 } as const;

const SCOPED_CSS = `
  @keyframes ss-rise{from{opacity:0}to{opacity:1}}
  @keyframes ss-push{from{transform:scale(1)}to{transform:scale(1.08)}}
  [data-spotlight-stage] [data-spotlight-object]{animation:ss-push ${PUSH_DURATION} ease-out forwards}
  [data-spotlight-stage] [data-spotlight-rise]{animation:ss-rise ${RISE_DURATION} linear ${RISE_DELAY} both}
  @media(prefers-reduced-motion:reduce){
    [data-spotlight-stage] [data-spotlight-object]{animation:none}
    [data-spotlight-stage] [data-spotlight-rise]{animation:none;opacity:1}
  }
`;

function wordStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transition: visible ? `opacity ${WORD_FADE} linear` : 'none',
    transitionDelay: visible ? `${delayMs}ms` : '0ms',
  };
}

export function SpotlightStage({
  moment,
  skin,
  phase,
  action,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  phase: { kind: 'rising' | 'brand' };
  action: ReactNode;
}) {
  const r = roles(skin);
  const landed = phase.kind === 'brand';
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

      {/* Words layer — each element fades in at phase === 'brand' with stagger */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 'clamp(28px,6vw,96px)' }}>
        <div>
          <div
            data-spotlight-eyebrow data-type="eyebrow"
            style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-on-media-muted)', marginBottom: 18, ...wordStyle(landed, D.eyebrow) }}
          >
            {moment.eyebrow}
          </div>
          <div
            data-spotlight-brand data-type="brand"
            style={{ ...typeRoleCss(r.brand), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)', ...wordStyle(landed, D.brand) }}
          >
            {moment.brand}
          </div>
          {line !== null && (
            <div
              data-spotlight-line data-type="storyline"
              style={{ ...typeRoleCss(r.storyline), color: 'var(--ms-on-media)', maxWidth: '18ch', margin: '20px auto 0', textShadow: '0 2px 36px rgba(0,0,0,.55)', ...wordStyle(landed, D.line) }}
            >
              {line}
            </div>
          )}
          {action != null && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap', ...wordStyle(landed, D.action) }}>
              {action}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

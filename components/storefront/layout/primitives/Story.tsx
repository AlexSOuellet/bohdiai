'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { SurfaceRole } from '@/lib/design-system/types';
import type { StoryNode, StoryTone } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { surfaceStyleVars, typeRoleStyle } from '../intent';

// Timing from the proven probe. Slow and deliberate. The cross-fade is LINEAR:
// an eased opacity fade front-loads and reads as a pop; linear reads as a real
// dissolve. (Motion/timing are the brick's behavior, not type or color.)
const OPEN_MS = 900; // a breath of media alone before the first line
const HOLD_MS = 3400; // how long each line lingers before dissolving
const FADE = '1.8s'; // how long the cross-fade takes

// The mood-driven tone maps to one of the design system's surfaces. The text
// color is that surface's guaranteed-readable paired foreground — sourced from
// the design system, not hardcoded. A neutral scrim darkens/lightens the media
// so the paired color reads (the scrim is a legibility device, not a color choice).
const TONE_SURFACE: Record<StoryTone, SurfaceRole> = {
  dark: 'inverse-surface',
  light: 'surface',
};
const TONE_SCRIM: Record<StoryTone, string> = {
  dark: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.25), rgba(0,0,0,0.72))',
  light: 'radial-gradient(120% 90% at 50% 45%, rgba(255,255,255,0.30), rgba(255,255,255,0.78))',
};

export function Story({ node, ctx }: { node: StoryNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const tone = node.tone ?? 'dark';
  const surface = surfaceStyleVars(TONE_SURFACE[tone]);
  const scrim = TONE_SCRIM[tone];
  const brandStep = node.story.length; // the final frame's step index
  const [step, setStep] = useState(-1); // -1 = media alone, a breath before it starts

  useEffect(() => {
    if (step >= brandStep) return; // landed on the brand — stop
    const delay = step < 0 ? OPEN_MS : HOLD_MS;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, brandStep]);

  function frame(visible: boolean, zIndex: number): CSSProperties {
    return {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      padding: 'clamp(28px, 6vw, 96px)',
      textAlign: 'center',
      color: surface.color, // design system's paired-contrast text color
      opacity: visible ? 1 : 0,
      transition: `opacity ${FADE} linear`,
      pointerEvents: visible ? 'auto' : 'none',
      zIndex,
      // keep the cross-fade alive under reduced motion (opacity is motion-safe).
      ['--meld-fade-duration' as string]: FADE,
    } as CSSProperties;
  }

  return (
    <section
      data-node-type="story"
      data-node-id={node.id}
      data-story-tone={tone}
      className="relative flex w-full overflow-hidden min-h-screen"
      style={{ background: surface.background }}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Node node={node.media} ctx={{ ...childCtx, path: childPath(ctx, 'media') }} />
      </div>
      <div
        data-story-scrim
        className="absolute inset-0 pointer-events-none"
        style={{ background: scrim, zIndex: 1 }}
      />

      {/* the story, one line at a time, each cross-fading into the next.
          Type comes entirely from the headline role of the design system. */}
      {node.story.map((textLine, i) => (
        <div key={i} data-story-line data-meld-fade style={frame(step === i, 2)}>
          <p style={{ ...typeRoleStyle('headline'), margin: 0, maxWidth: '20em' }}>{textLine}</p>
        </div>
      ))}

      {/* the brand frame — fades in last and stays */}
      <div data-story-brand data-meld-fade style={frame(step >= brandStep, 3)}>
        <div>
          {node.eyebrow !== undefined && (
            <div style={{ ...typeRoleStyle('eyebrow'), opacity: 0.78, marginBottom: 18 }}>
              {node.eyebrow}
            </div>
          )}
          <div data-story-wordmark style={{ ...typeRoleStyle('wordmark'), margin: 0 }}>
            {node.brand}
          </div>
          {node.cta !== undefined && (
            <a
              href={node.cta.href}
              data-story-cta
              style={{
                ...typeRoleStyle('body'),
                display: 'inline-block',
                marginTop: 34,
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                padding: '15px 34px',
                borderRadius: 2,
              }}
            >
              {node.cta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { StoryNode, StoryTone } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { typeRoleStyle } from '../intent';

// Timing from the proven probe (CandleStoryDemo). Slow and deliberate — a moment
// breathes. The cross-fade is LINEAR: an eased opacity fade front-loads and reads
// as a pop; linear climbs steadily and reads as a real dissolve.
const OPEN_MS = 900; // a breath of media alone before the first line
const HOLD_MS = 3400; // how long each line lingers before dissolving
const FADE = '1.8s'; // how long the cross-fade takes

// The moment's tone is mood-driven. Dark sits in shadow (dark scrim, light text);
// light lifts (light scrim, dark text). The paired text color is the moment's
// contrast guarantee — overlay text can't read off a flat token, so we supply it.
const TONE: Record<StoryTone, { base: string; scrim: string; text: string; shadow: string }> = {
  dark: {
    base: '#0c0907',
    scrim: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.25), rgba(0,0,0,0.72))',
    text: '#f6f1ea',
    shadow: '0 2px 36px rgba(0,0,0,0.5)',
  },
  light: {
    base: '#f6f1ea',
    scrim: 'radial-gradient(120% 90% at 50% 45%, rgba(255,255,255,0.30), rgba(255,255,255,0.78))',
    text: '#15110d',
    shadow: 'none',
  },
};

export function Story({ node, ctx }: { node: StoryNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const tone = node.tone ?? 'dark';
  const { base, scrim, text, shadow } = TONE[tone];
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
      color: text,
      opacity: visible ? 1 : 0,
      transition: `opacity ${FADE} linear`,
      pointerEvents: visible ? 'auto' : 'none',
      zIndex,
      // keep the cross-fade alive under reduced motion (opacity is motion-safe);
      // the globals.css exemption restores this duration under the blanket reduce rule.
      ['--meld-fade-duration' as string]: FADE,
    } as CSSProperties;
  }

  return (
    <section
      data-node-type="story"
      data-node-id={node.id}
      data-story-tone={tone}
      className="relative flex w-full overflow-hidden min-h-screen"
      style={{ background: base }}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Node node={node.media} ctx={{ ...childCtx, path: childPath(ctx, 'media') }} />
      </div>
      <div
        data-story-scrim
        className="absolute inset-0 pointer-events-none"
        style={{ background: scrim, zIndex: 1 }}
      />

      {/* the story, one line at a time, each cross-fading into the next */}
      {node.story.map((textLine, i) => (
        <div key={i} data-story-line data-meld-fade style={frame(step === i, 2)}>
          <p
            style={{
              ...typeRoleStyle('headline'),
              margin: 0,
              maxWidth: 920,
              textShadow: shadow,
            }}
          >
            {textLine}
          </p>
        </div>
      ))}

      {/* the brand frame — fades in last and stays */}
      <div data-story-brand data-meld-fade style={frame(step >= brandStep, 3)}>
        <div>
          {node.eyebrow !== undefined && (
            <div
              style={{
                ...typeRoleStyle('eyebrow'),
                color: 'var(--color-primary)',
                marginBottom: 18,
              }}
            >
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
                display: 'inline-block',
                marginTop: 34,
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                ...typeRoleStyle('caption'),
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

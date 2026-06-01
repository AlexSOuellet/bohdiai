import type { CSSProperties } from 'react';
import type { SpotlightNode, SpotlightSide } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { surfaceStyleVars, typeRoleStyle } from '../intent';

// The signature: the object rises out of pure black over ~6s. Opacity, linear.
const RISE_DURATION = '6s';
const RISE_DELAY_MS = 500;

// The push-in is slow and secondary. Its duration lives in a var so the
// reduced-motion exemption ([data-spotlight-zoom] in globals.css) can keep it.
const PUSH_DURATION = '20s';

// A reduced-motion-safe slow opacity fade for the words. They arrive only after
// the object is lit. (Motion/timing are the brick's behavior, not type or color.)
function reveal(delayMs: number, durSec = 2.6): CSSProperties {
  return {
    '--stage-reveal-duration': `${durSec}s`,
    animation: `stage-fade var(--stage-reveal-duration) linear ${delayMs}ms both`,
  } as CSSProperties;
}

const SIDE_CLASS: Record<SpotlightSide, string> = {
  left: 'justify-start',
  right: 'justify-end',
};

export function Spotlight({ node, ctx }: { node: SpotlightNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const side = node.contentSide ?? 'right';
  const textAlign = side === 'right' ? 'right' : 'left';
  // The text color is the design system's paired foreground for a dark field.
  const textColor = surfaceStyleVars('inverse-surface').color;
  // Deepen the side the words sit on so they read once the light is up.
  const gradient =
    side === 'right'
      ? 'linear-gradient(90deg, transparent 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%)'
      : 'linear-gradient(270deg, transparent 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%)';

  return (
    <section
      data-node-type="spotlight"
      data-node-id={node.id}
      data-spotlight-side={side}
      className={`relative flex w-full items-center overflow-hidden min-h-screen ${SIDE_CLASS[side]}`}
      // Pure black is the brick's defining structure — the void the object rises
      // out of — not a palette/brand color.
      style={{ background: '#000' }}
    >
      {/* slow push-in wrapper (gentle, secondary) */}
      <div
        data-spotlight-zoom
        className="absolute inset-0 overflow-hidden"
        style={
          {
            transformOrigin: '30% 52%',
            '--spotlight-zoom-duration': PUSH_DURATION,
            animation: `spotlight-push ${PUSH_DURATION} ease-out forwards`,
            zIndex: 0,
          } as CSSProperties
        }
      >
        {/* THE SPOTLIGHT: the object rises out of pure black */}
        <div
          data-spotlight-rise
          data-stage-reveal
          className="absolute inset-0"
          style={
            {
              '--stage-reveal-duration': RISE_DURATION,
              animation: `stage-fade var(--stage-reveal-duration) linear ${RISE_DELAY_MS}ms both`,
            } as CSSProperties
          }
        >
          <Node node={node.media} ctx={{ ...childCtx, path: childPath(ctx, 'media') }} />
        </div>
      </div>

      {/* deepen the content side so the words read once the light is up */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: gradient, zIndex: 1 }}
      />

      <div
        className="relative"
        style={{ zIndex: 2, maxWidth: 480, textAlign, padding: 'clamp(32px, 6vw, 96px)', color: textColor }}
      >
        {node.eyebrow !== undefined && (
          <div data-stage-reveal style={{ ...reveal(4200, 2.2), ...typeRoleStyle('eyebrow'), opacity: 0.82, marginBottom: 22 }}>
            {node.eyebrow}
          </div>
        )}

        <div data-stage-reveal data-spotlight-wordmark style={{ ...reveal(5000), ...typeRoleStyle('wordmark') }}>
          {node.brand}
        </div>

        <p data-stage-reveal style={{ ...reveal(6200), ...typeRoleStyle('sub'), margin: '20px 0 0' }}>
          {node.line}
        </p>

        {node.cta !== undefined && (
          <a
            data-stage-reveal
            href={node.cta.href}
            style={{
              ...reveal(7200),
              ...typeRoleStyle('caption'),
              display: 'inline-block',
              marginTop: 34,
              borderBottom: '1px solid currentColor',
              paddingBottom: 4,
            }}
          >
            {node.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}

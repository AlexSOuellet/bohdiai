import type { CSSProperties } from 'react';
import type { SpotlightNode, SpotlightSide } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { typeRoleStyle } from '../intent';

const cream = '#f4efe6';

// The signature: the object rises out of pure black over ~6s. Opacity, linear.
const RISE_DURATION = '6s';
const RISE_DELAY_MS = 500;

// The push-in is slow and secondary. Its duration lives in a var so the
// reduced-motion exemption ([data-spotlight-zoom] in globals.css) can keep it.
const PUSH_DURATION = '20s';

// A reduced-motion-safe slow opacity fade for the words (the same mechanism the
// stage reveal uses). The words arrive only after the object is lit.
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
        style={{
          zIndex: 2,
          maxWidth: 480,
          textAlign,
          padding: 'clamp(32px, 6vw, 96px)',
          color: cream,
        }}
      >
        {node.eyebrow !== undefined && (
          <div
            data-stage-reveal
            style={{
              ...reveal(4200, 2.2),
              ...typeRoleStyle('eyebrow'),
              color: 'var(--color-primary)',
              marginBottom: 22,
            }}
          >
            {node.eyebrow}
          </div>
        )}

        <div data-stage-reveal data-spotlight-wordmark style={{ ...reveal(5000), ...typeRoleStyle('wordmark') }}>
          {node.brand}
        </div>

        <p
          data-stage-reveal
          style={{
            ...reveal(6200),
            ...typeRoleStyle('headline'),
            margin: '20px 0 0',
            textShadow: '0 2px 40px rgba(0,0,0,0.6)',
          }}
        >
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
              color: cream,
              borderBottom: `1px solid ${cream}`,
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

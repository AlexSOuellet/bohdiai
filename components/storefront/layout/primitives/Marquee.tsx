'use client';

import type { CSSProperties } from 'react';
import type { MarqueeNode, MarqueeSpeed } from '@/lib/layout';
import { Node, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import { GAP_CLASS, GAP_CLASS_MD, joinClasses } from '../scale';

const SPEED_SECONDS: Record<MarqueeSpeed, number> = {
  slow: 80,
  medium: 50,
  fast: 25,
};

export function Marquee({ node, ctx }: { node: MarqueeNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopGap = applyDensity(node.gap, ctx.density) ?? 'md';
  const mobileGap = applyDensity(node.mobile?.gap, ctx.density) ?? desktopGap;
  const desktopSpeed = node.speed ?? 'medium';
  const mobileSpeed = node.mobile?.speed ?? desktopSpeed;
  const direction = node.direction ?? 'left';
  const pauseOnHover = node.pauseOnHover ?? true;

  const animationName = direction === 'left' ? 'scroll-left' : 'scroll-right';

  const desktopDuration = SPEED_SECONDS[desktopSpeed];
  const mobileDuration = SPEED_SECONDS[mobileSpeed];

  const trackStyle: CSSProperties = {
    animationName,
    animationDuration: `${mobileDuration}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  };

  const desktopVar = { ['--marquee-duration-md' as string]: `${desktopDuration}s` };

  return (
    <div
      data-node-type="marquee"
      data-node-id={node.id}
      style={{ ...intentToStyleVars(node.intent), ...desktopVar }}
      className={joinClasses(
        'relative w-full overflow-hidden',
        pauseOnHover && 'hover:[&_*]:[animation-play-state:paused]',
      )}
    >
      <div
        className={joinClasses(
          'flex w-max',
          GAP_CLASS[mobileGap],
          GAP_CLASS_MD[desktopGap],
        )}
        style={trackStyle}
      >
        {node.children.map((child, i) => (
          <div key={child.id ?? `marquee-a-${i}`} className="shrink-0">
            <Node node={child} ctx={childCtx} />
          </div>
        ))}
        {node.children.map((child, i) => (
          <div
            key={child.id ?? `marquee-b-${i}`}
            className="shrink-0"
            aria-hidden="true"
          >
            <Node node={child} ctx={childCtx} />
          </div>
        ))}
      </div>
    </div>
  );
}

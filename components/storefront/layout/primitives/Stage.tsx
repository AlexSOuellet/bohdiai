import type { CSSProperties } from 'react';
import type { OverlapAnchorPosition, OverlapScrim, StageNode, StageRevealStagger } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  MIN_HEIGHT_CLASS,
  MIN_HEIGHT_CLASS_MD,
  PADDING_CLASS,
  PADDING_CLASS_MD,
  joinClasses,
} from '../scale';

// Where the content block sits over the media. The <section> is a flex row, so
// justify is the horizontal axis and items is the vertical one.
const POSITION_CLASS: Record<OverlapAnchorPosition, string> = {
  'top-left': 'justify-start items-start',
  top: 'justify-center items-start',
  'top-right': 'justify-end items-start',
  left: 'justify-start items-center',
  center: 'justify-center items-center',
  right: 'justify-end items-center',
  'bottom-left': 'justify-start items-end',
  bottom: 'justify-center items-end',
  'bottom-right': 'justify-end items-end',
};

const POSITION_CLASS_MD: Record<OverlapAnchorPosition, string> = {
  'top-left': 'md:justify-start md:items-start',
  top: 'md:justify-center md:items-start',
  'top-right': 'md:justify-end md:items-start',
  left: 'md:justify-start md:items-center',
  center: 'md:justify-center md:items-center',
  right: 'md:justify-end md:items-center',
  'bottom-left': 'md:justify-start md:items-end',
  bottom: 'md:justify-center md:items-end',
  'bottom-right': 'md:justify-end md:items-end',
};

// How long each node takes to arrive. Slow and deliberate — a moment breathes,
// it doesn't snap. Global default for every stage. Linear, so it climbs the whole
// way (see the animation below) instead of front-loading into a pop.
const REVEAL_DURATION = '5s';

// Stagger step between each content node arriving, in ms. Deliberate gaps so each
// beat lands on its own before the next begins.
const STAGGER_MS: Record<StageRevealStagger, number> = {
  tight: 280,
  normal: 550,
  loose: 900,
};

const SCRIM_CLASS: Record<'light' | 'dark', string> = {
  light: 'absolute inset-0 pointer-events-none bg-gradient-to-t from-white/75 via-white/35 to-transparent',
  dark: 'absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-black/35 to-transparent',
};

function resolveScrim(scrim: OverlapScrim | undefined): 'none' | 'light' | 'dark' {
  const s: OverlapScrim = scrim ?? 'auto';
  if (s === 'none' || s === 'light' || s === 'dark') return s;
  return 'dark'; // auto: a held image wants a dark wash so overlay text reads
}

export function Stage({ node, ctx }: { node: StageNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const minHeight = node.minHeight ?? 'screen';
  const mobileMinHeight = node.mobile?.minHeight ?? minHeight;
  const align = node.align ?? 'bottom-left';
  const mobileAlign = node.mobile?.align ?? align;
  const padding = node.padding ?? 'xl';
  const mobilePadding = node.mobile?.padding ?? padding;
  const motion = node.reveal?.motion ?? 'rise-fade';
  const stagger = node.reveal?.stagger ?? 'normal';
  const stepMs = STAGGER_MS[stagger];
  const scrim = resolveScrim(node.scrim);

  // The stage owns its contrast guarantee: a dark scrim pairs with light text,
  // a light scrim with dark text. This is the media-surface analogue of the
  // design system's paired on-colors — overlay text over media can't read off a
  // flat surface token, so the stage supplies the readable color directly.
  const overlayColor = scrim === 'light' ? '#15110d' : '#f6f1ea';
  const overlayStyle: CSSProperties = {
    color: overlayColor,
    textShadow: scrim === 'dark' ? '0 1px 28px rgba(0,0,0,0.45)' : 'none',
  };

  return (
    <section
      data-node-type="stage"
      data-node-id={node.id}
      data-stage-scrim={scrim}
      data-stage-motion={motion}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'relative flex w-full overflow-hidden',
        MIN_HEIGHT_CLASS[mobileMinHeight],
        MIN_HEIGHT_CLASS_MD[minHeight],
        POSITION_CLASS[mobileAlign],
        POSITION_CLASS_MD[align],
      )}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Node node={node.media} ctx={{ ...childCtx, path: childPath(ctx, 'media') }} />
      </div>
      {scrim !== 'none' && <div data-stage-scrim-layer className={SCRIM_CLASS[scrim]} style={{ zIndex: 1 }} />}
      <div
        className={joinClasses('relative', PADDING_CLASS[mobilePadding], PADDING_CLASS_MD[padding])}
        style={{ zIndex: 2 }}
      >
        <div data-stage-overlay className="flex max-w-2xl flex-col gap-4" style={overlayStyle}>
          {node.content.map((child, i) => (
            <div
              key={child.id ?? `stage-content-${i}`}
              data-stage-reveal
              style={
                {
                  // Duration lives in a CSS var so the reduced-motion rule in
                  // globals.css can keep the gentle fade (opacity is motion-safe)
                  // while the blanket override flattens everything that moves.
                  '--stage-reveal-duration': REVEAL_DURATION,
                  // linear, NOT an ease — an eased opacity fade front-loads the
                  // visible change and reads as a pop. Linear climbs steadily.
                  animation: `stage-${motion} var(--stage-reveal-duration) linear ${i * stepMs}ms both`,
                } as CSSProperties
              }
            >
              <Node node={child} ctx={{ ...childCtx, path: childPath(ctx, `content[${i}]`) }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

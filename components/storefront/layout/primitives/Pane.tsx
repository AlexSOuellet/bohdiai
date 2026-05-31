import type { PaneNode } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import {
  BORDER_CLASS,
  BORDER_CLASS_MD,
  PADDING_CLASS,
  PADDING_CLASS_MD,
  RADIUS_CLASS,
  RADIUS_CLASS_MD,
  SHADOW_CLASS,
  SHADOW_CLASS_MD,
  joinClasses,
} from '../scale';

export function Pane({ node, ctx }: { node: PaneNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopPadding = applyDensity(node.padding, ctx.density) ?? 'md';
  const mobilePadding =
    applyDensity(node.mobile?.padding, ctx.density) ??
    applyDensity(desktopPadding, 'compact') ??
    desktopPadding;
  const desktopRadius = node.radius ?? 'none';
  const mobileRadius = node.mobile?.radius ?? desktopRadius;
  const desktopBorder = node.border ?? 'none';
  const mobileBorder = node.mobile?.border ?? desktopBorder;
  const desktopShadow = node.shadow ?? 'none';
  const mobileShadow = node.mobile?.shadow ?? desktopShadow;
  const fill = node.fill === true;

  return (
    <div
      data-node-type="pane"
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...(fill && node.intent?.palette ? { background: 'var(--node-palette)' } : null),
      }}
      className={joinClasses(
        PADDING_CLASS[mobilePadding],
        PADDING_CLASS_MD[desktopPadding],
        RADIUS_CLASS[mobileRadius],
        RADIUS_CLASS_MD[desktopRadius],
        BORDER_CLASS[mobileBorder],
        BORDER_CLASS_MD[desktopBorder],
        SHADOW_CLASS[mobileShadow],
        SHADOW_CLASS_MD[desktopShadow],
      )}
    >
      <Node node={node.child} ctx={{ ...childCtx, path: childPath(ctx, 'child') }} />
    </div>
  );
}

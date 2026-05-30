import type { BandContentWidth, BandNode } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import {
  ALIGN_ITEMS_CLASS,
  ALIGN_ITEMS_CLASS_MD,
  JUSTIFY_CONTENT_CLASS,
  JUSTIFY_CONTENT_CLASS_MD,
  MIN_HEIGHT_CLASS,
  MIN_HEIGHT_CLASS_MD,
  PADDING_Y_CLASS,
  PADDING_Y_CLASS_MD,
  joinClasses,
} from '../scale';

const CONTENT_WIDTH_CLASS: Record<Exclude<BandContentWidth, 'full'>, string> = {
  narrow: 'max-w-3xl',
  normal: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export function Band({ node, ctx }: { node: BandNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopPadding = applyDensity(node.padding, ctx.density) ?? 'md';
  const mobilePadding =
    applyDensity(node.mobile?.padding, ctx.density) ??
    applyDensity(desktopPadding, 'compact') ??
    desktopPadding;
  const desktopMinHeight = node.minHeight;
  const mobileMinHeight = node.mobile?.minHeight ?? desktopMinHeight;
  const desktopAlign = node.align;
  const mobileAlign = node.mobile?.align ?? desktopAlign;
  const desktopJustify = node.justify;
  const mobileJustify = node.mobile?.justify ?? desktopJustify;
  const contentWidth: BandContentWidth = node.contentWidth ?? 'normal';

  const children = node.children.map((child, i) => (
    <Node
      key={child.id ?? `band-${i}`}
      node={child}
      ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
    />
  ));

  const inner =
    contentWidth === 'full' ? (
      children
    ) : (
      <div
        className={joinClasses(
          'w-full mx-auto flex flex-col',
          CONTENT_WIDTH_CLASS[contentWidth],
          mobileAlign && ALIGN_ITEMS_CLASS[mobileAlign],
          desktopAlign && ALIGN_ITEMS_CLASS_MD[desktopAlign],
          mobileJustify && JUSTIFY_CONTENT_CLASS[mobileJustify],
          desktopJustify && JUSTIFY_CONTENT_CLASS_MD[desktopJustify],
        )}
      >
        {children}
      </div>
    );

  return (
    <section
      data-node-type="band"
      data-node-id={node.id}
      data-content-width={contentWidth}
      style={{
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { background: 'var(--node-palette)' } : null),
      }}
      className={joinClasses(
        'w-full flex flex-col',
        PADDING_Y_CLASS[mobilePadding],
        PADDING_Y_CLASS_MD[desktopPadding],
        mobileMinHeight && MIN_HEIGHT_CLASS[mobileMinHeight],
        desktopMinHeight && MIN_HEIGHT_CLASS_MD[desktopMinHeight],
        contentWidth === 'full' && mobileAlign && ALIGN_ITEMS_CLASS[mobileAlign],
        contentWidth === 'full' && desktopAlign && ALIGN_ITEMS_CLASS_MD[desktopAlign],
        contentWidth === 'full' && mobileJustify && JUSTIFY_CONTENT_CLASS[mobileJustify],
        contentWidth === 'full' && desktopJustify && JUSTIFY_CONTENT_CLASS_MD[desktopJustify],
      )}
    >
      {inner}
    </section>
  );
}

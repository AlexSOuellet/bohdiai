import type { DividerNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const WEIGHT_CLASS: Record<NonNullable<DividerNode['weight']>, string> = {
  hairline: 'border-t-[0.5px]',
  thin: 'border-t',
  medium: 'border-t-2',
  thick: 'border-t-4',
};

const STYLE_CLASS: Record<NonNullable<DividerNode['style']>, string> = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
};

export function DividerContent({
  node,
  ctx: _ctx,
}: {
  node: DividerNode;
  ctx: RenderContext;
}) {
  const weight = node.weight ?? 'thin';
  const style = node.style ?? 'solid';
  return (
    <hr
      data-node-type="divider"
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { borderColor: 'var(--node-palette)' } : null),
      }}
      className={joinClasses('w-full', WEIGHT_CLASS[weight], STYLE_CLASS[style])}
    />
  );
}

import type { BleedNode, BleedSide } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const BLEED_CLASS: Record<BleedSide, string> = {
  left: '-ml-[100vw] pl-[100vw]',
  right: '-mr-[100vw] pr-[100vw]',
  both: '-mx-[100vw] px-[100vw]',
  top: '-mt-[100vh] pt-[100vh]',
  bottom: '-mb-[100vh] pb-[100vh]',
  all: '-m-[100vmax] p-[100vmax]',
};

const BLEED_CLASS_MD: Record<BleedSide, string> = {
  left: 'md:-ml-[100vw] md:pl-[100vw]',
  right: 'md:-mr-[100vw] md:pr-[100vw]',
  both: 'md:-mx-[100vw] md:px-[100vw]',
  top: 'md:-mt-[100vh] md:pt-[100vh]',
  bottom: 'md:-mb-[100vh] md:pb-[100vh]',
  all: 'md:-m-[100vmax] md:p-[100vmax]',
};

export function Bleed({ node, ctx }: { node: BleedNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopSide = node.side;
  const mobileSide = node.mobile?.side ?? node.side;

  return (
    <div
      data-node-type="bleed"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'relative w-full overflow-visible',
        BLEED_CLASS[mobileSide],
        BLEED_CLASS_MD[desktopSide],
      )}
    >
      <Node node={node.child} ctx={{ ...childCtx, path: childPath(ctx, 'child') }} />
    </div>
  );
}

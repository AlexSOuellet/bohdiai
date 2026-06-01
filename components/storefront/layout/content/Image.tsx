import NextImage from 'next/image';
import type { AspectRatio, ImageNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const ASPECT_CLASS: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '16:9': 'aspect-[16/9]',
  '21:9': 'aspect-[21/9]',
  auto: '',
};

export function ImageContent({
  node,
  ctx: _ctx,
}: {
  node: ImageNode;
  ctx: RenderContext;
}) {
  const aspect = node.aspect ?? 'auto';
  const focalObjectPosition =
    node.focal !== undefined ? `${node.focal.x}% ${node.focal.y}%` : 'center';

  if (node.assetUrl === undefined) {
    return (
      <div
        data-node-type="image"
        data-node-id={node.id}
        data-image-placeholder
        role="img"
        aria-label={node.alt}
        style={{ ...intentToStyleVars(node.intent), background: 'var(--color-surface-variant)' }}
        className={joinClasses('relative w-full', ASPECT_CLASS[aspect] || 'aspect-[3/2]')}
      />
    );
  }

  return (
    <div
      data-node-type="image"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses('relative w-full', ASPECT_CLASS[aspect])}
    >
      <NextImage
        src={node.assetUrl}
        alt={node.alt}
        fill
        sizes="(min-width: 720px) 50vw, 100vw"
        style={{ objectFit: 'cover', objectPosition: focalObjectPosition }}
      />
    </div>
  );
}

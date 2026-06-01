import type { AspectRatio, VideoNode } from '@/lib/layout';
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

export function VideoContent({ node, ctx: _ctx }: { node: VideoNode; ctx: RenderContext }) {
  const aspect = node.aspect ?? '16:9';
  // Fill mode: cover the parent (e.g. a stage's full-bleed backdrop). Aspect ignored.
  const fillClass = node.fill === true ? 'absolute inset-0 h-full w-full' : ASPECT_CLASS[aspect];
  return (
    <div
      data-node-type="video"
      data-node-id={node.id}
      {...(node.fill === true ? { 'data-video-fill': true } : {})}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(node.fill === true ? '' : 'relative w-full', fillClass)}
    >
      <video
        src={node.assetUrl}
        poster={node.poster}
        autoPlay={node.autoplay}
        loop={node.loop}
        muted={node.muted ?? node.autoplay === true}
        controls={node.controls ?? !(node.autoplay === true)}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

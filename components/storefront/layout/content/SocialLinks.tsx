import type { SocialLinksNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

export function SocialLinksContent({
  node,
  ctx: _ctx,
}: {
  node: SocialLinksNode;
  ctx: RenderContext;
}) {
  const platforms = node.platforms ?? ['instagram', 'tiktok', 'youtube'];
  const style = node.style ?? 'icons';

  return (
    <ul
      data-node-type="socialLinks"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'flex items-center gap-4',
        style === 'labels' ? 'flex-col items-start gap-2' : '',
      )}
    >
      {platforms.map((p) => (
        <li key={p} className="inline-flex items-center gap-2">
          {(style === 'icons' || style === 'both') && (
            <span className="inline-block w-6 h-6 rounded-full bg-black/10" aria-hidden="true" />
          )}
          {(style === 'labels' || style === 'both') && (
            <span className="capitalize text-sm">{p}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

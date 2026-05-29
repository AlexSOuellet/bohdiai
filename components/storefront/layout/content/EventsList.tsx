import type { EventsListNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

export function EventsListContent({
  node,
  ctx: _ctx,
}: {
  node: EventsListNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const layout = node.layout ?? 'stack';

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
      : layout === 'row'
        ? 'flex flex-col md:flex-row gap-6'
        : 'flex flex-col gap-4';

  return (
    <div
      data-node-type="eventsList"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className={joinClasses('w-full', containerClass)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`event-${i}`}
          className="flex flex-col gap-2 p-4 border border-black/10 rounded-md"
        >
          <div className="h-3 w-1/3 bg-black/10 rounded" />
          <div className="h-5 w-2/3 bg-black/10 rounded" />
          <div className="h-3 w-1/2 bg-black/10 rounded" />
        </div>
      ))}
    </div>
  );
}

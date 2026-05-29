import type { EventsListNode, ResolvedEvent } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

function resolvedEventsAt(ctx: RenderContext): ResolvedEvent[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedEvent[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventsListContent({
  node,
  ctx,
}: {
  node: EventsListNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const layout = node.layout ?? 'stack';
  const events = resolvedEventsAt(ctx);
  const items: (ResolvedEvent | null)[] =
    events !== null ? events : Array.from({ length: count }).map(() => null);

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
      style={intentToStyleVars(node.intent)}
      className={joinClasses('w-full', containerClass)}
    >
      {items.map((e, i) =>
        e === null ? (
          <div
            key={`event-skel-${i}`}
            className="flex flex-col gap-2 p-4 border border-black/10 rounded-md"
          >
            <div className="h-3 w-1/3 bg-black/10 rounded" />
            <div className="h-5 w-2/3 bg-black/10 rounded" />
            <div className="h-3 w-1/2 bg-black/10 rounded" />
          </div>
        ) : (
          <div
            key={e.id}
            className="flex flex-col gap-2 p-4 border border-black/10 rounded-md"
          >
            <div className="text-xs uppercase tracking-[0.15em] opacity-70">
              {formatDate(e.date)}
            </div>
            <h4 className="text-lg font-medium leading-snug">{e.name}</h4>
            {e.location !== undefined && (
              <div className="text-sm opacity-70">{e.location}</div>
            )}
            {e.description !== undefined && (
              <p className="text-sm opacity-70 leading-relaxed">
                {e.description}
              </p>
            )}
          </div>
        ),
      )}
    </div>
  );
}

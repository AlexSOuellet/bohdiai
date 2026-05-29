import type {
  ResolvedSubscription,
  SubscriptionGridNode,
} from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  GAP_X_CLASS,
  GAP_X_CLASS_MD,
  GAP_Y_CLASS,
  GAP_Y_CLASS_MD,
  GRID_COLS_CLASS,
  GRID_COLS_CLASS_MD,
  joinClasses,
} from '../scale';

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function resolvedSubscriptionsAt(
  ctx: RenderContext,
): ResolvedSubscription[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedSubscription[];
}

export function SubscriptionGridContent({
  node,
  ctx,
}: {
  node: SubscriptionGridNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const desktopColumns = node.columns ?? 3;
  const mobileColumns = node.mobileColumns ?? 1;
  const subs = resolvedSubscriptionsAt(ctx);
  const items: (ResolvedSubscription | null)[] =
    subs !== null ? subs : Array.from({ length: count }).map(() => null);

  return (
    <div
      data-node-type="subscriptionGrid"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'grid w-full',
        GRID_COLS_CLASS[mobileColumns] ?? GRID_COLS_CLASS[1],
        GRID_COLS_CLASS_MD[desktopColumns] ?? GRID_COLS_CLASS_MD[3],
        GAP_X_CLASS.md,
        GAP_X_CLASS_MD.md,
        GAP_Y_CLASS.md,
        GAP_Y_CLASS_MD.md,
      )}
    >
      {items.map((s, i) =>
        s === null ? (
          <div
            key={`subscription-skel-${i}`}
            className="flex flex-col gap-3 p-6 border border-black/10 rounded-lg"
          >
            <div className="h-6 w-2/3 bg-black/10 rounded" />
            <div className="h-4 w-1/3 bg-black/10 rounded" />
            <div className="h-3 w-full bg-black/10 rounded" />
            <div className="h-3 w-5/6 bg-black/10 rounded" />
            <div className="h-10 w-full bg-black/10 rounded mt-3" />
          </div>
        ) : (
          <div
            key={s.id}
            className="flex flex-col gap-3 p-6 border border-black/10 rounded-lg"
          >
            <h3 className="text-xl font-semibold">{s.name}</h3>
            <div className="text-base opacity-80">
              {formatPriceCents(s.priceCents)} / {s.interval}
            </div>
            {s.description !== undefined && (
              <p className="text-sm opacity-70 leading-relaxed">
                {s.description}
              </p>
            )}
            <a
              href={`/subscriptions#${s.id}`}
              className="mt-3 inline-flex items-center justify-center px-6 py-3 rounded-md bg-black text-white font-medium"
            >
              Subscribe
            </a>
          </div>
        ),
      )}
    </div>
  );
}

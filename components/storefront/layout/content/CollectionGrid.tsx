import Image from 'next/image';
import type { CollectionGridNode, ResolvedCollection } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  GAP_X_CLASS,
  GAP_X_CLASS_MD,
  GAP_Y_CLASS,
  GAP_Y_CLASS_MD,
  GRID_COLS_CLASS,
  GRID_COLS_CLASS_MD,
  defaultMobileColumnsForDesktop,
  joinClasses,
} from '../scale';

function resolvedCollectionsAt(ctx: RenderContext): ResolvedCollection[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedCollection[];
}

export function CollectionGridContent({
  node,
  ctx,
}: {
  node: CollectionGridNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const desktopColumns = node.columns ?? 3;
  const mobileColumns = node.mobileColumns ?? defaultMobileColumnsForDesktop(desktopColumns);

  const collections = resolvedCollectionsAt(ctx);
  const items: (ResolvedCollection | null)[] =
    collections !== null ? collections : Array.from({ length: count }).map(() => null);

  return (
    <div
      data-node-type="collectionGrid"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'grid w-full',
        GRID_COLS_CLASS[mobileColumns] ?? GRID_COLS_CLASS[1],
        GRID_COLS_CLASS_MD[desktopColumns] ?? GRID_COLS_CLASS_MD[3],
        GAP_X_CLASS.sm,
        GAP_X_CLASS_MD.md,
        GAP_Y_CLASS.md,
        GAP_Y_CLASS_MD.lg,
      )}
    >
      {items.map((c, i) =>
        c === null ? (
          <div key={`collection-skel-${i}`} className="flex flex-col gap-2">
            <div className="aspect-[3/2] w-full bg-black/10" />
            <div className="h-5 w-1/2 rounded bg-black/10" />
          </div>
        ) : c.imageUrl === undefined || c.imageUrl === '' ? (
          <a
            key={c.slug}
            href={`/collections/${c.slug}`}
            data-text-only
            style={
              node.intent?.palette
                ? {
                    background: 'var(--node-palette)',
                    color: 'var(--node-palette-fg)',
                  }
                : undefined
            }
            className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded p-8 text-center transition-opacity hover:opacity-80"
          >
            <div className="text-lg font-medium">{c.name}</div>
            <div className="text-xs opacity-60">{c.itemCount} pieces</div>
          </a>
        ) : (
          <a key={c.slug} href={`/collections/${c.slug}`} className="group flex flex-col gap-2">
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-black/10">
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="font-medium">{c.name}</div>
            <div className="text-xs opacity-60">{c.itemCount} pieces</div>
          </a>
        ),
      )}
    </div>
  );
}

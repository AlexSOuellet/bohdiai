import Image from 'next/image';
import type { ProductGridNode, ResolvedProduct } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';
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

function formatPriceCents(cents: number | undefined): string {
  if (cents === undefined) return '';
  return `$${(cents / 100).toFixed(2)}`;
}

function resolvedProductsAt(ctx: RenderContext): ResolvedProduct[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedProduct[];
}

export function ProductGridContent({ node, ctx }: { node: ProductGridNode; ctx: RenderContext }) {
  const count = node.count ?? 6;
  const desktopColumns = node.columns ?? 3;
  const mobileColumns = node.mobileColumns ?? defaultMobileColumnsForDesktop(desktopColumns);

  const products = resolvedProductsAt(ctx);
  const items: (ResolvedProduct | null)[] =
    products !== null ? products : Array.from({ length: count }).map(() => null);

  return (
    <div
      data-node-type="productGrid"
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
      {items.map((p, i) =>
        p === null ? (
          <div key={`product-skel-${i}`} className="flex flex-col gap-2">
            <div
              style={{ background: 'var(--color-surface-variant)' }}
              className="aspect-[4/5] w-full"
            />
            <div
              style={{ background: 'var(--color-surface-variant)' }}
              className="h-4 w-3/4 rounded"
            />
            <div
              style={{ background: 'var(--color-surface-variant)' }}
              className="h-3 w-1/3 rounded"
            />
          </div>
        ) : (
          <a key={p.id} href={`/listings/${p.slug}`} className="group flex flex-col gap-2">
            <div
              style={{ background: 'var(--color-surface-variant)' }}
              className="relative aspect-[4/5] w-full overflow-hidden"
            >
              {p.imageUrl !== undefined && (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div style={typeRoleStyle('body')}>{p.name}</div>
            {p.priceCents !== undefined && (
              <div style={{ ...typeRoleStyle('caption'), opacity: 0.7 }}>
                {formatPriceCents(p.priceCents)}
              </div>
            )}
          </a>
        ),
      )}
    </div>
  );
}

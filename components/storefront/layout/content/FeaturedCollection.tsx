import Image from 'next/image';
import type { FeaturedCollectionNode, ResolvedCollection } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

function resolvedCollectionAt(ctx: RenderContext): ResolvedCollection | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (Array.isArray(data) || data === undefined || data === null) return null;
  return data as ResolvedCollection;
}

export function FeaturedCollectionContent({
  node,
  ctx,
}: {
  node: FeaturedCollectionNode;
  ctx: RenderContext;
}) {
  const preview = node.previewCount ?? 4;
  const collection = resolvedCollectionAt(ctx);

  if (collection === null) {
    return (
      <div
        data-node-type="featuredCollection"
        data-node-id={node.id}
        data-bound-placeholder
        data-collection-slug={node.collectionSlug}
        style={intentToStyleVars(node.intent)}
        className="flex w-full flex-col gap-4"
      >
        <div className="h-7 w-1/3 rounded bg-black/10" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: preview }).map((_, i) => (
            <div
              key={`featured-collection-skel-${i}`}
              className="aspect-square w-full bg-black/10"
            />
          ))}
        </div>
      </div>
    );
  }

  const imageUrl = collection.imageUrl;

  if (imageUrl === undefined || imageUrl === '') {
    return (
      <a
        data-node-type="featuredCollection"
        data-node-id={node.id}
        data-text-only
        href={`/collections/${collection.slug}`}
        style={
          node.intent?.palette
            ? {
                ...intentToStyleVars(node.intent),
                background: 'var(--node-palette)',
                color: 'var(--node-palette-fg)',
              }
            : intentToStyleVars(node.intent)
        }
        className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-3 rounded p-10 text-center transition-opacity hover:opacity-80"
      >
        <h3 className="text-2xl font-semibold">{collection.name}</h3>
        <span className="text-xs opacity-60">{collection.itemCount} pieces</span>
      </a>
    );
  }

  return (
    <a
      data-node-type="featuredCollection"
      data-node-id={node.id}
      href={`/collections/${collection.slug}`}
      style={intentToStyleVars(node.intent)}
      className="group flex w-full flex-col gap-4"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold">{collection.name}</h3>
        <span className="text-xs opacity-60">{collection.itemCount} pieces</span>
      </div>
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-black/10">
        <Image
          src={imageUrl}
          alt={collection.name}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    </a>
  );
}

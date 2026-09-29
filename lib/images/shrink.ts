import { getCloudflareContext } from '@opennextjs/cloudflare';

export type ShrinkFormat = 'jpeg' | 'webp';

export interface ShrinkOptions {
  /** The longest side after shrinking, in pixels. Smaller photos are never enlarged. */
  readonly maxEdge: number;
  readonly format: ShrinkFormat;
  readonly quality: number;
}

const MIME: Readonly<Record<ShrinkFormat, 'image/jpeg' | 'image/webp'>> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Shrink a photo to fit inside maxEdge × maxEdge and re-encode it, through
 * Cloudflare's Images binding (the app runs on Workers, where native image
 * libraries can't load). Throws when the bytes aren't a readable image — the
 * caller turns that into a message the person sees.
 *
 * `images` is for tests; in the app the binding comes from the Worker's env.
 */
export async function shrinkImage(
  bytes: ArrayBuffer,
  opts: ShrinkOptions,
  images?: ImagesBinding,
): Promise<Uint8Array> {
  const binding = images ?? (await getCloudflareContext({ async: true })).env.IMAGES;
  if (binding === undefined) throw new Error('Images binding missing — add "images": { "binding": "IMAGES" } to wrangler.jsonc');
  const result = await binding
    .input(new Blob([bytes]).stream())
    .transform({ width: opts.maxEdge, height: opts.maxEdge, fit: 'scale-down' })
    .output({ format: MIME[opts.format], quality: opts.quality });
  return new Uint8Array(await result.response().arrayBuffer());
}

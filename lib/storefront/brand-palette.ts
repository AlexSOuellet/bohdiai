import { logger } from '@/lib/logger';
import { parseBrandPalette, type BrandPalette } from '@/lib/color/brand-palette';

/** The envelope's brand palette, or undefined. A broken stored value never breaks
 *  the page: the shopper gets the mood's colors, and the error is logged. */
export function readBrandPalette(env: Record<string, unknown>, tenantId: string): BrandPalette | undefined {
  const parsed = parseBrandPalette(env['brandPalette']);
  if (parsed.kind === 'invalid') {
    logger.error('storefront: invalid brandPalette — painting the mood colors instead', { tenantId });
  }
  return parsed.kind === 'valid' ? parsed.value : undefined;
}

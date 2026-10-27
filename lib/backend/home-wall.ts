/** The wall of her work on Home. On Showcase it's her gallery: the pieces she
 *  ticked, or her newest until she ticks any (the site does the same). On Market
 *  and Full it's her products, newest first. */
import type { ProductRowView } from './catalog/queries';
import { GALLERY_MAX } from '@/lib/catalog/home';

export type HomeWall = { title: string; sub: string; items: ProductRowView[] };

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function homeWall(products: readonly ProductRowView[], showcase: boolean, max: number): HomeWall {
  const current = products.filter((p) => p.status !== 'archived');
  if (showcase) {
    const live = current.filter((p) => p.status === 'active');
    const picked = live.filter((p) => p.inGallery);
    return {
      title: 'Your gallery',
      sub: picked.length === 0 ? `Showing your newest ${GALLERY_MAX} until you pick` : `${picked.length} of ${GALLERY_MAX} picked`,
      items: (picked.length === 0 ? live : picked).slice(0, Math.min(max, GALLERY_MAX)),
    };
  }
  const live = current.filter((p) => p.status === 'active').length;
  const drafts = current.filter((p) => p.status === 'draft').length;
  return {
    title: 'Your work',
    sub: `${count(live, 'product on your site', 'products on your site')}${drafts > 0 ? `, ${count(drafts, 'draft', 'drafts')}` : ''}`,
    items: current.slice(0, max),
  };
}

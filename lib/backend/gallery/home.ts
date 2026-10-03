/** The gallery's part of the home screen: how full it is, and an empty gallery. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { listGallery } from './queries';
import { GALLERY_LIMIT, type GalleryItem } from './gallery-form';

export function galleryHomeData(items: readonly GalleryItem[]): HomeData {
  return {
    tiles: [{ label: 'Gallery', value: String(items.length), note: `of ${GALLERY_LIMIT} photos` }],
    attention: items.length === 0 ? ['Your gallery is empty. Add photos of your work.'] : [],
  };
}

export const galleryHome: HomeContributor = {
  feature: 'gallery',
  load: async (tenantId) => galleryHomeData(await listGallery(await createSupabaseServerClient(), tenantId)),
};

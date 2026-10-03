/** Gallery reads, in the owner's order. Used by the backend (the person's own
 *  client, RLS applies) and by the storefront (service role). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { GalleryItem } from './gallery-form';

export async function listGallery(db: SupabaseClient<Database>, tenantId: string): Promise<GalleryItem[]> {
  const { data, error } = await db
    .from('gallery_items')
    .select('id, caption, position, created_at, uploads(public_url)')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load the gallery: ${error.message}`);
  return (data ?? []).flatMap((r) => {
    const url = r.uploads?.public_url ?? null;
    return url === null ? [] : [{ id: r.id, url, caption: r.caption ?? '' }];
  });
}

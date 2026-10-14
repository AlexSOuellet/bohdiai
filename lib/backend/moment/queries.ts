/** The moment — read. Used by the backend (the person's own client, RLS applies)
 *  and by the storefront (service role). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { momentFormFromRow, type MomentMedia, type MomentView } from './moment-form';

const MOMENT_COLUMNS =
  'kicker, headline, sub, story, cta_label, cta_target, second_cta_label, second_cta_target, play_mode, media:uploads!site_moments_media_upload_id_fkey(public_url, mime_type, alt_text), poster:uploads!site_moments_poster_upload_id_fkey(public_url)' as const;

type UploadRef = { public_url: string | null; mime_type?: string; alt_text?: string | null } | null;

/** An upload as the moment's media: a video when its file is a video, else a photo. */
export function momentMedia(media: UploadRef, poster: UploadRef): MomentMedia | null {
  const url = media?.public_url ?? null;
  if (url === null) return null;
  return {
    kind: (media?.mime_type ?? '').startsWith('video/') ? 'video' : 'image',
    url,
    alt: media?.alt_text ?? '',
    posterUrl: poster?.public_url ?? '',
  };
}

export async function getMoment(db: SupabaseClient<Database>, tenantId: string): Promise<MomentView> {
  const [moment, photos] = await Promise.all([
    db.from('site_moments').select(MOMENT_COLUMNS).eq('tenant_id', tenantId).maybeSingle(),
    db
      .from('site_moment_photos')
      .select('id, position, created_at, uploads(public_url, alt_text)')
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);
  if (moment.error !== null) throw new Error(`Could not load the moment: ${moment.error.message}`);
  if (photos.error !== null) throw new Error(`Could not load the moment’s photos: ${photos.error.message}`);
  const row = moment.data;
  return {
    ...momentFormFromRow(row),
    media: row === null ? null : momentMedia(row.media, row.poster),
    photos: (photos.data ?? []).flatMap((p) => {
      const url = p.uploads?.public_url ?? null;
      return url === null ? [] : [{ id: p.id, url, alt: p.uploads?.alt_text ?? '' }];
    }),
  };
}

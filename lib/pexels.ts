import { serverEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const BUCKET = 'placeholder-images';

interface PexelsPhoto {
  id: number;
  src: {
    large: string;
    medium: string;
  };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

// Returns a public URL for a placeholder product image.
// Checks Supabase Storage cache first; falls back to Pexels and caches the result.
export async function getPlaceholderImage(
  nicheSlug: string,
  searchQuery: string,
): Promise<string | null> {
  const db = supabaseAdmin();
  const cachePrefix = `${nicheSlug}/`;

  const { data: cached } = await db.storage
    .from(BUCKET)
    .list(cachePrefix, { limit: 20 });

  if (cached !== null && cached.length > 0) {
    const file = cached[Math.floor(Math.random() * cached.length)];
    if (file !== undefined) {
      const { data: urlData } = db.storage
        .from(BUCKET)
        .getPublicUrl(`${cachePrefix}${file.name}`);
      return urlData.publicUrl;
    }
  }

  const photo = await fetchPexelsPhoto(searchQuery);
  if (photo === null) return null;

  try {
    const res = await fetch(photo.src.large);
    if (!res.ok) return photo.src.large;
    const buffer = await res.arrayBuffer();
    const fileName = `${cachePrefix}${photo.id}.jpg`;

    await db.storage.from(BUCKET).upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err) {
    logger.warn('pexels: storage cache failed, using direct URL', {
      error: String(err),
      nicheSlug,
    });
    return photo.src.large;
  }
}

async function fetchPexelsPhoto(query: string): Promise<PexelsPhoto | null> {
  const { PEXELS_API_KEY } = serverEnv();

  try {
    const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=15&orientation=square`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      logger.error('pexels: API request failed', { status: res.status, query });
      return null;
    }

    const data = (await res.json()) as PexelsResponse;
    if (data.photos.length === 0) return null;

    const idx = Math.floor(Math.random() * Math.min(data.photos.length, 10));
    return data.photos[idx] ?? null;
  } catch (err) {
    logger.error('pexels: fetch threw', { error: String(err), query });
    return null;
  }
}

/**
 * Read a tenant's current look (skin key + feeling) off the stored home envelope
 * (D37) for the editor. Returns null for a legacy / not-yet-built store. The
 * feeling is normalised to a real MoodKey: the stored `mood` if valid, otherwise
 * derived from which feeling the skin belongs to, so the editor always opens on a
 * real feeling even if older data drifted.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { feelingForSkin } from '@/lib/editor/look-shelf';

export interface CurrentLook {
  lookKey: string;
  moodKey: MoodKey;
}

function isMoodKey(value: unknown): value is MoodKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MOODS, value);
}

export async function loadCurrentLook(tenantId: string): Promise<CurrentLook | null> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { layout_tree: unknown } | null }> };
          };
        };
      };
    };
  };
  const { data } = await db
    .from('content_pages')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();

  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  const root = (tree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object' || Array.isArray(root)) return null;
  const rootObj = root as Record<string, unknown>;
  if (rootObj['kind'] !== 'archetype') return null;

  const lookKey = rootObj['lookKey'];
  if (typeof lookKey !== 'string') return null;

  const moodKey = isMoodKey(rootObj['mood'])
    ? rootObj['mood']
    : (feelingForSkin(lookKey) ?? 'rustic');

  return { lookKey, moodKey };
}

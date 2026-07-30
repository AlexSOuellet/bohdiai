/**
 * Niche voice loader for the content editor.
 *
 * Resolves a tenant's own niche and returns the same `{ displayName, body }` the
 * onboarding copywriter grounds on (`niches.body_markdown` / `display_name`, read
 * in `lib/onboarding/build-archetype-store.ts`), so a rewrite in the editor sounds
 * like this shop, not generic copy. Never throws — a missing tenant or niche row
 * degrades to a safe empty voice so the editor keeps working.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { NicheVoice } from './content-agent';

const EMPTY: NicheVoice = { displayName: 'maker', body: '' };

export async function loadNicheVoice(tenantId: string): Promise<NicheVoice> {
  const db = supabaseAdmin();

  const { data: tenant } = await db.from('tenants').select('primary_niche').eq('id', tenantId).single();
  const slug = tenant?.primary_niche;
  if (!slug) return EMPTY;

  const { data: niche } = await db.from('niches').select('display_name, body_markdown').eq('slug', slug).single();
  if (!niche) return EMPTY;

  return { displayName: niche.display_name ?? 'maker', body: niche.body_markdown ?? '' };
}

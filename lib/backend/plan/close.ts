/**
 * Close my account (Alex, 2026-11-16): for a maker who wants to leave BohdiAI
 * completely, not just move to Free. When it runs (the end of their paid term, or at
 * once for a site Stripe doesn't bill) it removes, for good:
 * - every photo and file they uploaded (their storage folder and the uploads list),
 * - the site form they sent and its photos,
 * - the site and everything attached to it (products, events, sales, customers,
 *   Print it pieces, tool numbers, words, sections: all removed with the site),
 * - their login, unless it runs another site (and never Alex's).
 * Stripe keeps its own record of past payments (receipts and tax). Scenes made for the
 * site stay in the shared scene library. Runs with the service role.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isFounder } from '@/lib/founder/access';

type Db = SupabaseClient<Database>;

const MEDIA = 'tenant-media';
const INTAKE = 'intake-photos';

/** The site's name as the maker typed it to confirm, any case, spaces around it ignored. */
export function nameMatches(typed: unknown, siteName: string): boolean {
  return typeof typed === 'string' && typed.trim().toLowerCase() === siteName.trim().toLowerCase();
}

/** Every file in a storage folder, one level of subfolders down (how site files are laid out). */
async function folderFiles(db: Db, bucket: string, folder: string): Promise<string[]> {
  const { data, error } = await db.storage.from(bucket).list(folder, { limit: 1000 });
  if (error !== null) throw new Error(error.message);
  const out: string[] = [];
  for (const entry of data ?? []) {
    const path = `${folder}/${entry.name}`;
    if (entry.id !== null) out.push(path);
    else out.push(...(await folderFiles(db, bucket, path)));
  }
  return out;
}

export async function removeAccount(
  db: Db,
  tenantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Who and what, gathered before anything goes.
  const [uploads, intakes, members] = await Promise.all([
    db.from('uploads').select('storage_bucket, storage_path').eq('tenant_id', tenantId),
    db.from('intakes').select('id, portrait_path').eq('tenant_id', tenantId),
    db.from('tenant_members').select('user_id').eq('tenant_id', tenantId),
  ]);
  if (uploads.error !== null) return { ok: false, error: `uploads: ${uploads.error.message}` };
  if (intakes.error !== null) return { ok: false, error: `site form: ${intakes.error.message}` };
  if (members.error !== null) return { ok: false, error: `logins: ${members.error.message}` };
  const intakeIds = (intakes.data ?? []).map((i) => i.id);
  const pieces =
    intakeIds.length === 0
      ? { data: [], error: null }
      : await db.from('intake_pieces').select('photo_path').in('intake_id', intakeIds);
  if (pieces.error !== null) return { ok: false, error: `site form: ${pieces.error.message}` };

  // The files first: if they can't go, the site stays, so nothing is left without it.
  try {
    const byBucket = new Map<string, Set<string>>();
    const add = (bucket: string, path: string | null): void => {
      if (path === null || path === '') return;
      const set = byBucket.get(bucket) ?? new Set<string>();
      set.add(path);
      byBucket.set(bucket, set);
    };
    for (const u of uploads.data ?? []) add(u.storage_bucket, u.storage_path);
    for (const p of await folderFiles(db, MEDIA, `tenant/${tenantId}`)) add(MEDIA, p);
    for (const i of intakes.data ?? []) add(INTAKE, i.portrait_path);
    for (const p of pieces.data ?? []) add(INTAKE, p.photo_path);
    for (const [bucket, paths] of byBucket) {
      const { error } = await db.storage.from(bucket).remove([...paths]);
      if (error !== null) throw new Error(error.message);
    }
  } catch (err) {
    return { ok: false, error: `files: ${err instanceof Error ? err.message : String(err)}` };
  }

  // The site form and build records keep only a pointer to the site, so they go by name.
  const form = await db.from('intakes').delete().eq('tenant_id', tenantId);
  if (form.error !== null) return { ok: false, error: `site form: ${form.error.message}` };
  const builds = await db.from('builds').delete().eq('tenant_id', tenantId);
  if (builds.error !== null) return { ok: false, error: `builds: ${builds.error.message}` };
  const site = await db.from('tenants').delete().eq('id', tenantId);
  if (site.error !== null) return { ok: false, error: `site: ${site.error.message}` };

  // Their login goes last, unless it runs another site, and never Alex's.
  for (const { user_id: userId } of members.data ?? []) {
    if (isFounder(userId)) continue;
    const others = await db
      .from('tenant_members')
      .select('tenant_id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (others.error !== null || (others.count ?? 0) > 0) continue;
    await db.auth.admin.deleteUser(userId);
  }
  return { ok: true };
}

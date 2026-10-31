/**
 * Saves a checked intake: every photo shrunk to WebP and stored in the private
 * intake-photos bucket, then the intake and its pieces. All or nothing: if any
 * step fails, what was stored is removed, so a maker never half-arrives.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import type { ShrinkOptions } from '@/lib/images/shrink';
import type { IntakeFields, IntakePiece } from './request';

export const INTAKE_BUCKET = 'intake-photos';
const SHRINK: ShrinkOptions = { maxEdge: 2400, format: 'webp', quality: 82 };

export type Shrink = (bytes: ArrayBuffer, opts: ShrinkOptions) => Promise<Uint8Array>;

export type SaveResult = { ok: true; id: string } | { ok: false; reason: 'photoUnread' | 'failed' };

export async function saveIntake(args: {
  db: SupabaseClient<Database>;
  shrink: Shrink;
  fields: IntakeFields;
  pieces: readonly IntakePiece[];
  portrait: File | null;
  /** The account the maker made at sign-up. */
  userId: string;
  /** The site record sign-up made, which this fills (Session 119). */
  tenantId: string;
  /** For tests; a fresh id otherwise. */
  id?: string;
}): Promise<SaveResult> {
  const { db, shrink, fields, pieces, portrait, userId, tenantId } = args;
  const id = args.id ?? crypto.randomUUID();

  // Shrink everything first: an unreadable photo stops the send before anything is stored.
  const photos: { path: string; bytes: Uint8Array }[] = [];
  const toShrink: { path: string; file: File }[] = [
    ...pieces.map((p, i) => ({ path: `${id}/piece-${i + 1}.webp`, file: p.photo })),
    ...(portrait === null ? [] : [{ path: `${id}/portrait.webp`, file: portrait }]),
  ];
  for (const { path, file } of toShrink) {
    try {
      photos.push({ path, bytes: await shrink(await file.arrayBuffer(), SHRINK) });
    } catch (err) {
      logger.warn('intake: photo unreadable', { id, path, error: String(err) });
      return { ok: false, reason: 'photoUnread' };
    }
  }

  const stored: string[] = [];
  const undo = async (why: string, error: string | undefined): Promise<SaveResult> => {
    logger.error(`intake: ${why}`, { id, error });
    const { error: delErr } = await db.from('intakes').delete().eq('id', id);
    if (delErr !== null) logger.error('intake: could not remove the half-saved intake', { id, error: delErr.message });
    if (stored.length > 0) {
      const { error: rmErr } = await db.storage.from(INTAKE_BUCKET).remove(stored);
      if (rmErr !== null) logger.error('intake: orphaned photos', { id, paths: stored, error: rmErr.message });
    }
    return { ok: false, reason: 'failed' };
  };

  for (const { path, bytes } of photos) {
    const { error } = await db.storage.from(INTAKE_BUCKET).upload(path, bytes, { contentType: 'image/webp', upsert: false });
    if (error !== null) return undo('photo upload failed', error.message);
    stored.push(path);
  }

  const { error: intakeErr } = await db.from('intakes').insert({
    id,
    user_id: userId,
    tenant_id: tenantId,
    plan: fields.plan,
    billing: fields.billing,
    maker_name: fields.makerName,
    business_name: fields.businessName,
    email: fields.email,
    makes: fields.makes,
    about: fields.about,
    family: fields.family,
    portrait_path: portrait === null ? null : `${id}/portrait.webp`,
  });
  if (intakeErr !== null) return undo('saving the intake failed', intakeErr.message);

  const { error: piecesErr } = await db.from('intake_pieces').insert(
    pieces.map((p, i) => ({
      intake_id: id,
      position: i,
      name: p.name,
      price_cents: p.priceCents,
      description: p.description,
      photo_path: `${id}/piece-${i + 1}.webp`,
    })),
  );
  if (piecesErr !== null) return undo('saving the pieces failed', piecesErr.message);

  return { ok: true, id };
}

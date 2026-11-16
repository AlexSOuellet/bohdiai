'use server';

/** Print it's saved pieces: save, rename and remove (Alex, 2026-11-15). */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '@/lib/backend/catalog/results';
import { PIECES_MAX, PIECE_COLUMNS, checkPiece, checkPieceName, pieceFromRow, type PieceInput, type PrintPiece } from './pieces';

const PATH = '/manage/tools/print';
const SAVE_FAILED = 'The piece couldn’t be saved. Try again in a moment.';

export async function savePiece(input: PieceInput): Promise<{ ok: true; piece: PrintPiece } | { ok: false; error: string }> {
  const checked = checkPiece(input);
  if (!checked.ok) return checked;
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const { count, error: countError } = await db.from('print_pieces').select('id', { count: 'exact', head: true }).eq('tenant_id', site.tenantId);
  if (countError !== null || count === null) {
    logger.error('print: pieces count failed', { tenantId: site.tenantId, error: countError?.message ?? 'no count' });
    return { ok: false, error: SAVE_FAILED };
  }
  if (count >= PIECES_MAX) return { ok: false, error: `You can keep up to ${PIECES_MAX} pieces.` };
  const p = checked.piece;
  const { data, error } = await db
    .from('print_pieces')
    .insert({ tenant_id: site.tenantId, name: p.name, shape: p.shape, width_in: p.widthIn, height_in: p.heightIn, wrap_in: p.wrapIn, position: count })
    .select(PIECE_COLUMNS)
    .single();
  if (error !== null || data === null) {
    logger.error('print: piece save failed', { tenantId: site.tenantId, error: error?.message ?? 'no row' });
    return { ok: false, error: SAVE_FAILED };
  }
  revalidatePath(PATH);
  return { ok: true, piece: pieceFromRow(data) };
}

export async function renamePiece(id: string, rawName: string): Promise<DoneResult> {
  const named = checkPieceName(rawName);
  if (!named.ok) return named;
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const { error } = await db.from('print_pieces').update({ name: named.name }).eq('id', id).eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('print: piece rename failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: SAVE_FAILED };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function deletePiece(id: string): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const { error } = await db.from('print_pieces').delete().eq('id', id).eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('print: piece delete failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The piece couldn’t be removed. Try again in a moment.' };
  }
  revalidatePath(PATH);
  return { ok: true };
}

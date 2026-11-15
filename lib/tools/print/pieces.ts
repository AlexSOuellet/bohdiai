/**
 * Print it's saved pieces (Alex, 2026-11-15): the pieces a maker covers again and
 * again, a tray or a box lid, kept with their shape, size and how much wraps over
 * the edge. Sizes are kept in inches and shown in the maker's unit.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';

export type PieceShape = 'rect' | 'round' | 'oval';
export const PIECE_SHAPES: readonly PieceShape[] = ['rect', 'round', 'oval'];
export type PrintPiece = { id: string; name: string; shape: PieceShape; widthIn: number; heightIn: number; wrapIn: number };
export type PieceInput = { name: string; shape: string; widthIn: number; heightIn: number; wrapIn: number };

export const PIECES_MAX = 50;
export const PIECE_NAME_MAX = 60;
export const PIECE_SIZE_MAX = 200;
export const PIECE_WRAP_MAX = 6;

type Db = SupabaseClient<Database>;
type Row = Pick<Database['public']['Tables']['print_pieces']['Row'], 'id' | 'name' | 'shape' | 'width_in' | 'height_in' | 'wrap_in'>;

export const PIECE_COLUMNS = 'id, name, shape, width_in, height_in, wrap_in';

/** A piece's name, checked. */
export function checkPieceName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (name === '') return { ok: false, error: 'Give the piece a name.' };
  if (name.length > PIECE_NAME_MAX) return { ok: false, error: `Keep the name to ${PIECE_NAME_MAX} letters or fewer.` };
  return { ok: true, name };
}

const isShape = (s: string): s is PieceShape => (PIECE_SHAPES as readonly string[]).includes(s);
const sizeOk = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= PIECE_SIZE_MAX;

/** A piece as the maker set it, checked. A round piece is as tall as it is wide. */
export function checkPiece(input: PieceInput): { ok: true; piece: Omit<PrintPiece, 'id'> } | { ok: false; error: string } {
  const named = checkPieceName(input.name);
  if (!named.ok) return named;
  if (typeof input.shape !== 'string' || !isShape(input.shape)) return { ok: false, error: 'Pick a shape for the piece.' };
  const heightIn = input.shape === 'round' ? input.widthIn : input.heightIn;
  if (!sizeOk(input.widthIn) || !sizeOk(heightIn)) return { ok: false, error: `The size has to be more than 0 and up to ${PIECE_SIZE_MAX} inches.` };
  if (typeof input.wrapIn !== 'number' || !Number.isFinite(input.wrapIn) || input.wrapIn < 0 || input.wrapIn > PIECE_WRAP_MAX) return { ok: false, error: `The wrap has to be between 0 and ${PIECE_WRAP_MAX} inches.` };
  const round2 = (n: number): number => Math.round(n * 100) / 100;
  return { ok: true, piece: { name: named.name, shape: input.shape, widthIn: round2(input.widthIn), heightIn: round2(heightIn), wrapIn: round2(input.wrapIn) } };
}

export function pieceFromRow(r: Row): PrintPiece {
  return { id: r.id, name: r.name, shape: isShape(r.shape) ? r.shape : 'rect', widthIn: Number(r.width_in), heightIn: Number(r.height_in), wrapIn: Number(r.wrap_in) };
}

/** The site's saved pieces, in the maker's order. A failed read shows none. */
export async function loadPieces(db: Db, tenantId: string): Promise<PrintPiece[]> {
  const { data, error } = await db.from('print_pieces').select(PIECE_COLUMNS).eq('tenant_id', tenantId).order('position').order('name');
  if (error !== null) {
    logger.error('print: pieces read failed', { tenantId, error: error.message });
    return [];
  }
  return (data ?? []).map(pieceFromRow);
}

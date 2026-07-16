/**
 * Editor Door 2 — read the niche style sheet from disk and return the texture
 * shelf the maker sees in the editor. The style sheet lives at
 * `content/style-sheets/niche-<slug>.json` alongside the niche's prose entry.
 *
 * Textures use the object shape (Session 73 direction): `key`, `name`,
 * `sourceUrl` — real stock URLs sourced by the niche writer, NOT AI-generated
 * prompts. Older style sheets on disk still carry the legacy flat-array shape
 * (strings that were once generation prompts); those return an empty shelf
 * from this loader so the editor gracefully shows "no niche textures yet"
 * instead of crashing.
 *
 * Runs server-side only (uses `fs/promises`).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface NicheTexture {
  key: string;
  name: string;
  sourceUrl: string;
  note?: string | undefined;
}

interface RawTextureObject {
  key?: unknown;
  name?: unknown;
  sourceUrl?: unknown;
  note?: unknown;
}

function isRawTextureObject(v: unknown): v is RawTextureObject {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export async function loadNicheTextures(nicheSlug: string | null): Promise<readonly NicheTexture[]> {
  if (nicheSlug === null || nicheSlug === '') return [];

  const filePath = path.join(process.cwd(), 'content', 'style-sheets', `niche-${nicheSlug}.json`);

  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  const textures = (parsed as Record<string, unknown>)['textures'];
  if (!Array.isArray(textures)) return [];

  const out: NicheTexture[] = [];
  for (const t of textures) {
    if (!isRawTextureObject(t)) continue;
    const key = pickString(t.key);
    const name = pickString(t.name);
    const sourceUrl = pickString(t.sourceUrl);
    if (key === undefined || name === undefined || sourceUrl === undefined) continue;
    const note = pickString(t.note);
    out.push(note !== undefined ? { key, name, sourceUrl, note } : { key, name, sourceUrl });
  }
  return out;
}

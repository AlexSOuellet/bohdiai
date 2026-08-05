'use server';

// Editor look actions. Everything the maker changes writes to the STAGED draft
// (never live): stageLook writes the look into the draft, publishStore promotes
// it, resetStore discards it. Ownership is enforced via getCurrentShop before any
// write. Spec: Editor-Make-It-Yours-Design.md Part 1.

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { applyLookToEnvelope } from '@/lib/editor/apply-look';
import { isKnownSkin } from '@/lib/editor/look-shelf';
import { normaliseTexture, type StoredTexture } from '@/lib/editor/texture';
import { MOODS, type MoodKey } from '@/lib/moods';
import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from '@/lib/editor/draft';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';
import { EDITABLE_FIELDS, fieldsForSection, getFieldValue, setFieldValue } from '@/lib/editor/editable-fields';
import { markSectionMade, markSectionKept, setSectionHidden, unmarkSectionMade } from '@/lib/editor/section-state';
import { parseFindUsDate } from '@/lib/archetypes/main-street/findus';
import { publishBlockers } from '@/lib/editor/publish-gate';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth/session';
import { parsePriceToCents } from '@/lib/listings/price';
import {
  hasRealProducts,
  hasPlaceholderProducts,
  clearPlaceholderProducts,
  insertRealProduct,
  updateRealProduct,
  softDeleteProduct,
  type WalkProductInput,
} from '@/lib/listings/product-queries';
import { draftProductCopy, type ProductCopy } from '@/lib/listings/product-copy';
import { runContentEdit } from '@/lib/editor/content-agent';
import {
  bohdiConverse,
  buildConversationWriteInstruction,
  conversationDepth,
  sanitizeConversation,
  type BohdiTurn,
} from '@/lib/editor/conversation';
import { loadNicheVoice } from '@/lib/editor/niche-voice';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import type { MomentPlayMode } from '@/lib/archetypes/main-street/moment-gate';
import { logger } from '@/lib/logger';

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Load the maker's working base tree — the current draft if there is one, else a
 *  fresh tree seeded from the live envelope (the first edit creates the draft). */
async function loadBaseTree(tenantId: string): Promise<Record<string, unknown> | null> {
  const draftTree = await readDraftTree(tenantId);
  if (draftTree !== null) return draftTree;
  const live = await loadHomeEnvelope(tenantId);
  return live === null ? null : { root: live };
}

function isMoodKey(value: string): value is MoodKey {
  return Object.prototype.hasOwnProperty.call(MOODS, value);
}

/** Stage a look change (feeling/skin/texture) onto the draft. Seeds the draft
 *  from the live envelope on first edit, else builds on the existing draft, so a
 *  maker stacking several changes accumulates them. The look lives on the
 *  envelope root, so we stage a full layout_tree ({ root }). Never touches live. */
export async function stageLook(skinKey: string, moodKey: string, texture?: StoredTexture): Promise<ActionResult> {
  if (!isKnownSkin(skinKey)) return { ok: false, error: 'Unknown look.' };
  if (!isMoodKey(moodKey)) return { ok: false, error: 'Unknown feeling.' };
  // Texture crosses the client boundary — clamp/normalise before it touches the envelope.
  const cleanTexture = texture !== undefined ? normaliseTexture(texture) : undefined;

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  // Start from the current draft if there is one, else seed from the live envelope.
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  let next: Record<string, unknown>;
  try {
    ({ next } = applyLookToEnvelope(
      baseTree,
      cleanTexture !== undefined ? { skinKey, moodKey, texture: cleanTexture } : { skinKey, moodKey },
    ));
  } catch (err) {
    logger.warn('stageLook: apply failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'This store can’t take a new look right now.' };
  }

  const staged = await stageDraftTree(shop.tenantId, next);
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Stage Bohdi's content rewrites into the draft. Resolves the named fields, reads
 *  their current values from the draft (seeded from live on first edit), grounds
 *  Bohdi in the shop's niche voice, and folds his rewrites back onto the draft —
 *  marking the section made-yours. Never touches live; on a Bohdi failure the draft
 *  is left untouched and a friendly error is returned. */
export async function editContent(
  fieldIds: readonly string[],
  instruction: string,
  section?: SectionKey,
): Promise<ActionResult> {
  const fields = EDITABLE_FIELDS.filter((f) => fieldIds.includes(f.id));
  if (fields.length === 0) return { ok: false, error: 'Nothing to edit.' };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  // Seed from the current draft, else from live (first edit creates the draft).
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const current: Record<string, unknown> = {};
  for (const f of fields) current[f.id] = getFieldValue(baseTree, f.id);

  const niche = await loadNicheVoice(shop.tenantId);

  let values: Record<string, unknown>;
  try {
    ({ values } = await runContentEdit({ fields, current, instruction, niche }));
  } catch (err) {
    logger.warn('editContent: Bohdi failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'Couldn’t write that just now — try again.' };
  }

  if (Object.keys(values).length === 0) {
    return { ok: false, error: 'That didn’t change any words — try saying it a different way, or use the feeling picker for the look.' };
  }

  let next = baseTree;
  for (const [id, value] of Object.entries(values)) next = setFieldValue(next, id, value);
  if (section !== undefined) next = markSectionMade(next, section);

  const staged = await stageDraftTree(shop.tenantId, next);
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Coerce a maker-typed value to the field's kind, VERBATIM — trim only, keep their
 *  exact words and punctuation (D68: "type exactly what I want, taken as-is"). Unlike
 *  Bohdi's output, the maker's own text is never punctuation-stripped. */
function coerceVerbatim(field: { kind: 'text' | 'lines' | 'items' }, raw: unknown): unknown | undefined {
  if (field.kind === 'text') return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
  if (field.kind === 'lines') {
    // A lines field may arrive as an array, or as a single string the maker typed into a
    // textarea (e.g. their About story as paragraphs) — split a string on blank/newlines
    // rather than drop it. Their words are kept verbatim otherwise (D68).
    const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\r?\n+/) : undefined;
    if (arr === undefined) return undefined;
    const lines = arr.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter((x) => x.length > 0);
    return lines.length > 0 ? lines : undefined;
  }
  return Array.isArray(raw) ? raw : undefined;
}

/** Stage the maker's OWN words into the draft, verbatim (no Bohdi). The first-class
 *  "type exactly what I want" path (D68). Marks the section made-yours. */
export async function setFieldValues(
  updates: { id: string; value: unknown }[],
  section?: SectionKey,
): Promise<ActionResult> {
  const clean: { id: string; value: unknown }[] = [];
  for (const u of updates) {
    const field = EDITABLE_FIELDS.find((f) => f.id === u.id);
    if (!field) continue;
    const v = coerceVerbatim(field, u.value);
    if (v !== undefined) clean.push({ id: field.id, value: v });
  }
  if (clean.length === 0) return { ok: false, error: 'Nothing to save.' };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  let next = baseTree;
  for (const c of clean) next = setFieldValue(next, c.id, c.value);
  if (section !== undefined) next = markSectionMade(next, section);

  const staged = await stageDraftTree(shop.tenantId, next);
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** One turn of the "Make It Yours" interview (D69): given the conversation so far,
 *  Bohdi reacts and asks the next question, or signals he has enough to write. Depth
 *  (deep story section vs light) is derived from the section, never trusted from the
 *  client. Read-only — stages nothing; the write happens on writeSectionFromConversation. */
export async function converseSection(
  section: SectionKey,
  turns: unknown,
): Promise<{ ok: true; turn: BohdiTurn } | { ok: false; error: string }> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to work on.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const current: Record<string, unknown> = {};
  for (const f of fieldsForSection(section)) current[f.id] = getFieldValue(baseTree, f.id);
  const niche = await loadNicheVoice(shop.tenantId);

  try {
    const turn = await bohdiConverse({
      section,
      niche,
      current,
      conversation: sanitizeConversation(turns),
      depth: conversationDepth(section),
    });
    return { ok: true, turn };
  } catch (err) {
    logger.warn('converseSection: Bohdi failed', { tenantId: shop.tenantId, section, err: String(err) });
    return { ok: false, error: 'Bohdi lost his thread just now — try that again.' };
  }
}

/** Write a section from the finished interview (D69): render the conversation into
 *  the write instruction and hand it to Bohdi the writer over the given fields.
 *  `fieldIds` scopes the write to the STEP's own fields — load-bearing where a
 *  section is split across two walk steps (the Moment step writes only the fading
 *  lines; the Hero step only the resting words), so one doesn't clobber the other.
 *  Falls back to the section's writable text fields when omitted. For the founder
 *  section the instruction still writes both the home snippet and the full About
 *  page. Delegates to editContent, so it stages to the draft and marks made-yours. */
export async function writeSectionFromConversation(
  section: SectionKey,
  turns: unknown,
  fieldIds?: readonly string[],
): Promise<ActionResult> {
  const conversation = sanitizeConversation(turns);
  if (conversation.length === 0) return { ok: false, error: 'Tell Bohdi a little first, then he can write it.' };
  const ids =
    fieldIds !== undefined && fieldIds.length > 0
      ? fieldIds
      : fieldsForSection(section)
          .filter((f) => f.kind !== 'items')
          .map((f) => f.id);
  const instruction = buildConversationWriteInstruction(section, conversation);
  return editContent(ids, instruction, section);
}

/** Ensure `parent[key]` is a plain object and return it (creating it if missing), so
 *  a nested envelope path can be written without clobbering siblings. */
function ensureObject(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const cur = parent[key];
  if (cur !== null && typeof cur === 'object' && !Array.isArray(cur)) return cur as Record<string, unknown>;
  const fresh: Record<string, unknown> = {};
  parent[key] = fresh;
  return fresh;
}

/** How often the Moment plays — once per visitor / always / off (D54). Writes
 *  `moment.playMode` on the draft and marks the hero made-yours, resolving the
 *  Moment step. The Cozy-only opening play; a maker who adopts Cozy later sets
 *  this in the editor (its default stays `once`, so nothing breaks unset). */
export async function setMomentPlayMode(mode: MomentPlayMode): Promise<ActionResult> {
  if (mode !== 'once' && mode !== 'always' && mode !== 'off') return { ok: false, error: 'Unknown play setting.' };
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const next = structuredClone(baseTree);
  const moment = ensureObject(ensureObject(ensureObject(next, 'root'), 'content'), 'moment');
  moment['playMode'] = mode;

  const staged = await stageDraftTree(shop.tenantId, markSectionMade(next, 'hero'));
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** One real testimonial the maker typed — the customer's words, never Bohdi's (D68). */
export interface ReviewQuoteInput {
  quote: string;
  author: string;
  location?: string;
}

/** Keep only the complete rows (quote + author both filled), trimmed verbatim; drop
 *  a location that's blank so the schema's optional-min-1 holds. Silently drops
 *  half-empty rows rather than erroring on them (accept-or-coerce, D57). */
function cleanReviewRows(rows: unknown): ReviewQuoteInput[] {
  if (!Array.isArray(rows)) return [];
  const out: ReviewQuoteInput[] = [];
  for (const r of rows) {
    if (r === null || typeof r !== 'object') continue;
    const rec = r as Record<string, unknown>;
    const quote = typeof rec['quote'] === 'string' ? rec['quote'].trim() : '';
    const author = typeof rec['author'] === 'string' ? rec['author'].trim() : '';
    if (quote.length === 0 || author.length === 0) continue;
    const location = typeof rec['location'] === 'string' ? rec['location'].trim() : '';
    out.push(location.length > 0 ? { quote, author, location } : { quote, author });
  }
  return out;
}

/** The maker's real overall rating for the star-rating layout — an aggregate they
 *  actually have (their Etsy/Google figure), or nothing. Both parts required together
 *  (a score with no count, or a count with no score, is dropped as incomplete). */
export interface ReviewSummaryInput {
  score: string;
  count: string;
}

/** A complete summary (both score AND count filled), trimmed — or undefined. A
 *  partial one is treated as none, so we never show half a rating. */
function cleanReviewSummary(summary: unknown): ReviewSummaryInput | undefined {
  if (summary === null || typeof summary !== 'object') return undefined;
  const rec = summary as Record<string, unknown>;
  const score = typeof rec['score'] === 'string' ? rec['score'].trim() : '';
  const count = typeof rec['count'] === 'string' ? rec['count'].trim() : '';
  return score.length > 0 && count.length > 0 ? { score, count } : undefined;
}

/** Save the maker's real testimonial quotes into the draft (D68/D70). Writes
 *  `reviews.items`, marks the section made-yours, and un-hides it (real content
 *  brings the beat back on if it was off). No Bohdi — these are the customer's own
 *  words. An all-empty submission is rejected so the section is never "made" hollow;
 *  the maker turns it off instead.
 *
 *  `summary` is the OPTIONAL real overall rating for stores whose feeling uses the
 *  star-rating layout. When the maker gives a complete one it's saved; otherwise any
 *  existing summary is DELETED — this is what strips Bohdi's build-time invented
 *  rating so a fabricated "4.9 out of 5" never reaches the live store. */
export async function setReviewQuotes(rows: unknown, summary?: unknown): Promise<ActionResult> {
  const clean = cleanReviewRows(rows);
  if (clean.length === 0) return { ok: false, error: 'Add at least one real review (quote and name), or turn the section off.' };
  const cleanSummary = cleanReviewSummary(summary);

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const next = structuredClone(baseTree);
  const reviews = ensureObject(ensureObject(ensureObject(next, 'root'), 'content'), 'reviews');
  reviews['items'] = clean;
  // Save a real rating, or delete any existing one (strips a fabricated summary so it
  // never publishes — a curated wall never wears an invented average).
  if (cleanSummary) reviews['summary'] = cleanSummary;
  else delete reviews['summary'];
  // The section needs a heading to render; preserve the maker's/built one, else a plain
  // fallback so the schema's required title never lands empty.
  if (typeof reviews['title'] !== 'string' || reviews['title'].trim().length === 0) reviews['title'] = 'Kind words';

  const staged = await stageDraftTree(shop.tenantId, setSectionHidden(markSectionMade(next, 'reviews'), 'reviews', false));
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** One real event the maker typed (D71) — a place, a date, and a time. */
export interface FindUsRowInput {
  where: string;
  date: string;
  time: string;
}

/** Keep only the complete rows (place + date + time), trimmed verbatim, and stamp the
 *  human `day` echo the renderer reads from the ISO date (falls back to the raw date
 *  string so `day` is never empty — accept-or-coerce, D57). */
function cleanFindUsRows(rows: unknown): { day: string; where: string; time: string; date: string }[] {
  if (!Array.isArray(rows)) return [];
  const out: { day: string; where: string; time: string; date: string }[] = [];
  for (const r of rows) {
    if (r === null || typeof r !== 'object') continue;
    const rec = r as Record<string, unknown>;
    const where = typeof rec['where'] === 'string' ? rec['where'].trim() : '';
    const date = typeof rec['date'] === 'string' ? rec['date'].trim() : '';
    const time = typeof rec['time'] === 'string' ? rec['time'].trim() : '';
    if (where.length === 0 || date.length === 0 || time.length === 0) continue;
    const p = parseFindUsDate(date);
    const day = p ? `${p.weekdayShort}, ${p.monthShort} ${p.dayNum}` : date;
    out.push({ day, where, time, date });
  }
  return out;
}

/** Save the maker's real event dates into the draft (D71). Writes
 *  `founder.findUs.rows` (where the renderer reads the calendar), marks the section
 *  made-yours, and un-hides it. Each row's `day` echo is derived from the date at
 *  save time — the maker sets the date, we shape the label. An all-empty submission
 *  is rejected; the maker turns the section off instead. */
export async function setFindUsRows(rows: unknown): Promise<ActionResult> {
  const clean = cleanFindUsRows(rows);
  if (clean.length === 0) return { ok: false, error: 'Add at least one date (place, date and time), or turn the section off.' };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const next = structuredClone(baseTree);
  const findUs = ensureObject(ensureObject(ensureObject(ensureObject(next, 'root'), 'content'), 'founder'), 'findUs');
  findUs['rows'] = clean;
  if (typeof findUs['label'] !== 'string' || findUs['label'].trim().length === 0) findUs['label'] = 'Where to find us';

  const staged = await stageDraftTree(shop.tenantId, setSectionHidden(markSectionMade(next, 'findUs'), 'findUs', false));
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Mark a section kept-as-built — the maker looked at it and is keeping our version
 *  (D69). Resolves keep-or-change and optional sections without an edit. */
export async function keepSection(section: SectionKey): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };
  const staged = await stageDraftTree(shop.tenantId, markSectionKept(baseTree, section));
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Turn an optional section off or back on (D69). Off keeps the content, so turning
 *  it back on restores it. Marks nothing made-yours — hiding is its own resolution. */
export async function toggleSection(section: SectionKey, hidden: boolean): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };
  const staged = await stageDraftTree(shop.tenantId, setSectionHidden(baseTree, section, hidden));
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

// ————————————————————————————————————————————————————————————————————————————
// Walk products (the goods step). Products live in the `listings` table, not the
// draft envelope — the renderer reads them directly for both the live store and the
// preview. So these actions do ownership-gated DB work; the goods envelope FLAG is
// staged alongside so `walkComplete`/`publishBlockers` (which read the envelope) stay
// in sync. Real products are `is_preview = false`; the first real one clears the AI
// placeholders. (This build is the walk's simple editor; the richer Listings Admin —
// options, several photos, video, stock — is a later build.)
// ————————————————————————————————————————————————————————————————————————————

/** The maker's product form (raw, as typed). Price is raw text (parsed here); the
 *  photo is referenced by the id `uploadProductPhoto` returned. */
export interface WalkProductForm {
  name: string;
  price: string;
  shortDescription?: string;
  description?: string;
  uploadId?: string;
}

export type ProductSaveResult = { ok: true; id: string } | { ok: false; error: string };

const ALLOWED_IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Upload a maker's product photo to the tenant-media bucket and record an uploads
 *  row, returning the id (referenced by the product's media_ids) and the public URL
 *  (for the editor thumbnail). Ownership-gated; validates mime + size. */
export async function uploadProductPhoto(
  formData: FormData,
): Promise<{ ok: true; uploadId: string; url: string } | { ok: false; error: string }> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pick a photo to upload.' };
  const ext = ALLOWED_IMAGE_EXT[file.type];
  if (ext === undefined) return { ok: false, error: 'Use a JPG, PNG, or WebP image.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'That image is over 10MB — pick a smaller one.' };

  const user = await requireUser();
  const db = supabaseAdmin();
  const path = `tenant/${shop.tenantId}/products/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await db.storage
    .from('tenant-media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    logger.warn('uploadProductPhoto: storage upload failed', { tenantId: shop.tenantId, err: upErr.message });
    return { ok: false, error: 'Could not upload that photo — try again.' };
  }

  const publicUrl = db.storage.from('tenant-media').getPublicUrl(path).data.publicUrl;
  const { data: row, error: insErr } = await db
    .from('uploads')
    .insert({
      tenant_id: shop.tenantId,
      uploaded_by_user_id: user.id,
      storage_bucket: 'tenant-media',
      storage_path: path,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      source: 'user_upload',
      status: 'active',
    })
    .select('id')
    .single();
  if (insErr || !row) {
    logger.warn('uploadProductPhoto: uploads insert failed', { tenantId: shop.tenantId, err: insErr?.message });
    return { ok: false, error: 'Could not save that photo — try again.' };
  }
  return { ok: true, uploadId: row.id, url: publicUrl };
}

/** Coerce a raw product form to a validated `WalkProductInput`, or an error string. */
function validateProductForm(form: WalkProductForm): { input: WalkProductInput } | { error: string } {
  const name = (form.name ?? '').trim();
  if (name.length === 0) return { error: 'Give your product a name.' };
  const priceCents = parsePriceToCents(form.price ?? '');
  if (priceCents === null) return { error: 'Add a price, like $24.' };
  return {
    input: {
      name,
      priceCents,
      shortDescription: form.shortDescription?.trim() || null,
      description: form.description?.trim() || null,
      uploadId: form.uploadId || null,
    },
  };
}

/** Save a new real product. The FIRST real product clears the AI placeholders and
 *  marks the goods section made-yours (resolving the walk's goods step + unblocking
 *  Publish); later saves just insert. */
export async function saveWalkProduct(form: WalkProductForm): Promise<ProductSaveResult> {
  const v = validateProductForm(form);
  if ('error' in v) return { ok: false, error: v.error };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const db = supabaseAdmin();

  const first = !(await hasRealProducts(db, shop.tenantId));
  let id: string;
  try {
    ({ id } = await insertRealProduct(db, shop.tenantId, v.input));
  } catch (err) {
    logger.warn('saveWalkProduct: insert failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'Could not save your product — try again.' };
  }

  if (first) {
    await clearPlaceholderProducts(db, shop.tenantId);
    const baseTree = await loadBaseTree(shop.tenantId);
    if (baseTree !== null) await stageDraftTree(shop.tenantId, markSectionMade(baseTree, 'goods'));
  }
  revalidatePath('/dashboard/website');
  return { ok: true, id };
}

/** Update one of the maker's real products. */
export async function updateWalkProduct(id: string, form: WalkProductForm): Promise<ActionResult> {
  const v = validateProductForm(form);
  if ('error' in v) return { ok: false, error: v.error };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  try {
    await updateRealProduct(supabaseAdmin(), shop.tenantId, id, v.input);
  } catch (err) {
    logger.warn('updateWalkProduct: update failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'Could not save your changes — try again.' };
  }
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Remove one of the maker's real products. If it was the last real one, goods drops
 *  back to unresolved (the store honestly has no products again). */
export async function removeWalkProduct(id: string): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const db = supabaseAdmin();
  try {
    await softDeleteProduct(db, shop.tenantId, id);
  } catch (err) {
    logger.warn('removeWalkProduct: delete failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'Could not remove that product — try again.' };
  }
  if (!(await hasRealProducts(db, shop.tenantId))) {
    const baseTree = await loadBaseTree(shop.tenantId);
    if (baseTree !== null) await stageDraftTree(shop.tenantId, unmarkSectionMade(baseTree, 'goods'));
  }
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Ask Bohdi to draft a product's words (short line + description) from the maker's
 *  hint, grounded in the shop's niche voice. Returns the copy only — never the photo
 *  or price. Read-only: the maker reviews/edits before saving. */
export async function draftProductCopyAction(
  name: string,
  hint: string,
): Promise<{ ok: true; copy: ProductCopy } | { ok: false; error: string }> {
  const cleanName = (name ?? '').trim();
  if (cleanName.length === 0) return { ok: false, error: 'Name your product first, then Bohdi can help with the words.' };

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to work on.' };
  const niche = await loadNicheVoice(shop.tenantId);
  try {
    const copy = await draftProductCopy({ name: cleanName, hint: hint ?? '', niche });
    if (copy.shortDescription === undefined && copy.description === undefined) {
      return { ok: false, error: 'Tell Bohdi a little about the piece and he’ll take another run at it.' };
    }
    return { ok: true, copy };
  } catch (err) {
    logger.warn('draftProductCopyAction: Bohdi failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'Couldn’t write that just now — try again.' };
  }
}

/** Publish the staged draft to the live store (promote + delete the draft). Gated
 *  by the honesty check (D68/D70): the draft is what's about to go live, so if it
 *  still shows our About / placeholder products / fake reviews / seeded dates, we
 *  block and name what's left. A direct placeholder-product check backs the goods
 *  case so a fabricated product can never go live even if the envelope flag drifts. */
export async function publishStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to publish.' };

  const draftTree = await readDraftTree(shop.tenantId);
  const labels: string[] = draftTree != null ? publishBlockers(draftTree).map((b) => b.label) : [];
  if (await hasPlaceholderProducts(supabaseAdmin(), shop.tenantId)) {
    if (!labels.includes('your products')) labels.push('your products');
  }
  if (labels.length > 0) {
    return { ok: false, error: `Before your store goes live, finish ${labels.join(', ')}.` };
  }

  const res = await publishDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Nothing to publish, or the store couldn’t be updated.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Discard the staged draft — back to what's live. */
export async function resetStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to reset.' };
  const res = await resetDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Could not reset.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

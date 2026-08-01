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
import { markSectionMade, markSectionKept, setSectionHidden } from '@/lib/editor/section-state';
import { publishBlockers } from '@/lib/editor/publish-gate';
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
    if (!Array.isArray(raw)) return undefined;
    const lines = raw.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter((x) => x.length > 0);
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
 *  the write instruction and hand it to Bohdi the writer over that section's fields.
 *  For the founder section this writes both the home snippet and the full About page.
 *  Delegates to editContent, so it stages to the draft and marks the section made-yours. */
export async function writeSectionFromConversation(section: SectionKey, turns: unknown): Promise<ActionResult> {
  const conversation = sanitizeConversation(turns);
  if (conversation.length === 0) return { ok: false, error: 'Tell Bohdi a little first, then he can write it.' };
  const fieldIds = fieldsForSection(section).map((f) => f.id);
  const instruction = buildConversationWriteInstruction(section, conversation);
  return editContent(fieldIds, instruction, section);
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

/** Turn the hero's first-run intro on or off (D54). Writes `moment.playIntro` on the
 *  draft and marks the hero made-yours — turning the intro off is a deliberate choice
 *  that resolves the hero step. Off means the store loads straight to the resting hero. */
export async function setHeroIntro(enabled: boolean): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };
  const baseTree = await loadBaseTree(shop.tenantId);
  if (baseTree === null) return { ok: false, error: 'Could not load your store.' };

  const next = structuredClone(baseTree);
  const moment = ensureObject(ensureObject(ensureObject(next, 'root'), 'content'), 'moment');
  moment['playIntro'] = enabled;

  const staged = await stageDraftTree(shop.tenantId, markSectionMade(next, 'hero'));
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

/** Publish the staged draft to the live store (promote + delete the draft). Gated
 *  by the honesty check (D68/D70): the draft is what's about to go live, so if it
 *  still shows our About / placeholder products / fake reviews / seeded dates, we
 *  block and name what's left. */
export async function publishStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to publish.' };

  const draftTree = await readDraftTree(shop.tenantId);
  if (draftTree != null) {
    const blockers = publishBlockers(draftTree);
    if (blockers.length > 0) {
      return { ok: false, error: `Before your store goes live, finish ${blockers.map((b) => b.label).join(', ')}.` };
    }
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

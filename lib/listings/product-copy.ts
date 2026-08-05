/**
 * Bohdi's product-copy assist for the walk's goods step. The maker tells Bohdi what
 * a piece is (a few words) and he drafts the short line + description in the shop's
 * voice — the words only. Photo and price are always the maker's own and never pass
 * through here.
 *
 * A thin wrapper over the existing content agent (`runContentEdit`): two ad-hoc
 * product fields, the shop's niche voice, and the same honesty rule (Bohdi shapes
 * what he's told and never invents facts, D68). The runner is injectable so this is
 * unit-testable without the model.
 */
import { runContentEdit, type NicheVoice } from '@/lib/editor/content-agent';
import type { EditableField } from '@/lib/editor/editable-fields';

/** The two fields Bohdi drafts for a product. Ad-hoc (not registry fields — a product
 *  lives in the listings table, not the envelope), but the content agent accepts any
 *  EditableField[]. Plain normalize: product prose keeps its sentences. */
const SHORT_FIELD: EditableField = {
  id: 'product.shortDescription',
  path: ['product', 'shortDescription'],
  kind: 'text',
  section: 'goods',
  normalize: 'plain',
  label: 'a one-line summary of this product (the card line)',
};
const DESCRIPTION_FIELD: EditableField = {
  id: 'product.description',
  path: ['product', 'description'],
  kind: 'text',
  section: 'goods',
  normalize: 'plain',
  label: 'the full product description — a short, inviting paragraph',
};

export interface ProductCopyInput {
  /** The product's name (the maker's own — Bohdi writes around it, never renames it). */
  readonly name: string;
  /** What the maker told Bohdi about the piece, in their words (may be empty). */
  readonly hint: string;
  /** The shop's niche voice, so the copy sounds like this shop. */
  readonly niche: NicheVoice;
}

export interface ProductCopy {
  shortDescription?: string;
  description?: string;
}

/** Build the instruction Bohdi writes from — the product name + the maker's hint,
 *  with the honesty guard (don't invent a price or specifics not given). */
export function buildProductCopyInstruction(name: string, hint: string): string {
  const about = hint.trim().length > 0 ? ` Here's what it is, in the maker's words: ${hint.trim()}` : '';
  return `Write the words for a product called "${name}".${about} Write a short one-line summary and a short, inviting description in this shop's voice. Don't invent a price, materials, sizes, or details the maker didn't give you — describe only what you know.`;
}

/** Draft a product's short line + description. Returns only the fields Bohdi wrote
 *  (he may omit one he'd have to invent). Photo and price are untouched. */
export async function draftProductCopy(
  input: ProductCopyInput,
  run: typeof runContentEdit = runContentEdit,
): Promise<ProductCopy> {
  const { values } = await run({
    fields: [SHORT_FIELD, DESCRIPTION_FIELD],
    current: {},
    instruction: buildProductCopyInstruction(input.name, input.hint),
    niche: input.niche,
  });
  const out: ProductCopy = {};
  const short = values['product.shortDescription'];
  const desc = values['product.description'];
  if (typeof short === 'string' && short.length > 0) out.shortDescription = short;
  if (typeof desc === 'string' && desc.length > 0) out.description = desc;
  return out;
}

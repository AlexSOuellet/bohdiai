/**
 * The product editor's form and its validation (spec piece 1 §4). Shared by the
 * editor (instant messages) and the save action (which re-checks before writing),
 * so the rules can't drift. Prices and stock stay text until validated.
 */
import { combinationsOf, combinationKey, MAX_OPTIONS, MAX_CHOICES, MAX_COMBINATIONS, type Combination } from '@/lib/catalog/combinations';

export type Kind = 'physical' | 'digital';
export type ItemStatus = 'draft' | 'active' | 'archived';
export type ChoiceForm = { value: string; kind: Kind; fileUploadId: string | null; fileName: string | null };
export type OptionForm = { name: string; choices: ChoiceForm[] };
export type VariantForm = { choices: Combination; price: string; stock: string; available: boolean };
export type PhotoForm = { uploadId: string; url: string };

export type ProductForm = {
  id: string | null;
  slug: string | null;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  stock: string;
  status: ItemStatus;
  kind: Kind;
  fileUploadId: string | null;
  fileName: string | null;
  photos: PhotoForm[];
  /** Display only, never saved: the legacy sample photo the shop shows while the
   *  product has no real photos (null once it has one). */
  samplePhotoUrl: string | null;
  collectionIds: string[];
  options: OptionForm[];
  variants: VariantForm[];
};

export type ProductPayload = {
  listing_type: 'product' | 'digital_product';
  name: string;
  short_description: string | null;
  description: string | null;
  base_price_cents: number;
  status: ItemStatus;
  inventory_count: number | null;
  media_ids: string[];
  file_upload_id: string | null;
  collection_ids: string[];
  options: { name: string; choices: { value: string; kind: Kind; file_upload_id: string | null }[] }[];
  variants: { combination: Combination; price_cents: number | null; inventory_count: number | null; available: boolean }[];
};

export type BuildResult = { ok: true; payload: ProductPayload } | { ok: false; error: string };

export const MAX_PHOTOS = 12;
const MAX_NAME = 120;
const MAX_SHORT = 300;
const MAX_LONG = 5000;

export function emptyProductForm(): ProductForm {
  return {
    id: null,
    slug: null,
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    stock: '',
    status: 'draft',
    kind: 'physical',
    fileUploadId: null,
    fileName: null,
    photos: [],
    samplePhotoUrl: null,
    collectionIds: [],
    options: [],
    variants: [],
  };
}

export function parseDollars(text: string): { ok: true; cents: number | null } | { ok: false } {
  const t = text.trim();
  if (t === '') return { ok: true, cents: null };
  const m = /^\$?\s*(\d{1,6})(?:\.(\d{1,2}))?$/.exec(t);
  if (m === null) return { ok: false };
  return { ok: true, cents: Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0')) };
}

export function parseStock(text: string): { ok: true; count: number | null } | { ok: false } {
  const t = text.trim();
  if (t === '') return { ok: true, count: null };
  return /^\d{1,6}$/.test(t) ? { ok: true, count: Number(t) } : { ok: false };
}

export function formatCents(cents: number | null): string {
  if (cents === null) return '';
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** The options with blank names/choices dropped — what combinations are built from. */
function filledOptions(options: readonly OptionForm[]): { name: string; choices: string[] }[] {
  return options
    .map((o) => ({ name: o.name.trim(), choices: o.choices.map((c) => c.value.trim()).filter((v) => v !== '') }))
    .filter((o) => o.name !== '');
}

/** One row per combination of the current options, keeping what was already typed. */
export function syncVariants(options: readonly OptionForm[], existing: readonly VariantForm[]): VariantForm[] {
  const byKey = new Map(existing.map((v) => [combinationKey(v.choices), v]));
  return combinationsOf(filledOptions(options)).map(
    (choices) => byKey.get(combinationKey(choices)) ?? { choices, price: '', stock: '', available: true },
  );
}

/** Carry typed combination values across an option rename (old name → new name). */
export function renameOptionInVariants(variants: readonly VariantForm[], from: string, to: string): VariantForm[] {
  const oldName = from.trim();
  const newName = to.trim();
  if (oldName === '' || newName === '' || oldName === newName) return [...variants];
  return variants.map((v) => ({
    ...v,
    choices: Object.fromEntries(Object.entries(v.choices).map(([k, value]) => [k.trim() === oldName ? newName : k, value])),
  }));
}

const label = (c: Combination): string => Object.values(c).join(' / ');
const fail = (error: string): BuildResult => ({ ok: false, error });

export const STATUSES: readonly ItemStatus[] = ['draft', 'active', 'archived'];
const KINDS: readonly Kind[] = ['physical', 'digital'];
const isString = (v: unknown): v is string => typeof v === 'string';
const isStringOrNull = (v: unknown): boolean => v === null || typeof v === 'string';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isStatus = (v: unknown): v is ItemStatus => (STATUSES as readonly unknown[]).includes(v);
const isKind = (v: unknown): v is Kind => (KINDS as readonly unknown[]).includes(v);
export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

/** The form arrives from the browser, so a crafted request can send anything. Check
 *  the shape before the rules read it, so bad input gets a message instead of a crash. */
function hasProductShape(f: unknown): boolean {
  if (!isRecord(f)) return false;
  if (![f['name'], f['shortDescription'], f['description'], f['price'], f['stock']].every(isString)) return false;
  if (!isStringOrNull(f['id']) || !isStatus(f['status']) || !isKind(f['kind']) || !isStringOrNull(f['fileUploadId'])) return false;
  const photos = f['photos'];
  if (!Array.isArray(photos) || !photos.every((p) => isRecord(p) && isString(p['uploadId']))) return false;
  if (!isStringOrNull(f['samplePhotoUrl'])) return false;
  if (!isStringArray(f['collectionIds'])) return false;
  const options = f['options'];
  const choiceOk = (c: unknown): boolean => isRecord(c) && isString(c['value']) && isKind(c['kind']) && isStringOrNull(c['fileUploadId']);
  if (!Array.isArray(options) || !options.every((o) => isRecord(o) && isString(o['name']) && Array.isArray(o['choices']) && o['choices'].every(choiceOk))) return false;
  const variants = f['variants'];
  const variantOk = (v: unknown): boolean =>
    isRecord(v) && isRecord(v['choices']) && Object.values(v['choices']).every(isString) && isString(v['price']) && isString(v['stock']) && typeof v['available'] === 'boolean';
  return Array.isArray(variants) && variants.every(variantOk);
}

export function buildProductPayload(form: ProductForm, site: { digital: boolean }): BuildResult {
  if (!hasProductShape(form)) return fail('Something about this product didn’t look right. Reload the page and try again.');
  const name = form.name.trim();
  if (name === '') return fail('Give the product a name.');
  if (name.length > MAX_NAME) return fail(`Keep the name to ${MAX_NAME} characters or fewer.`);
  const short = form.shortDescription.trim();
  if (short.length > MAX_SHORT) return fail(`Keep the short description to ${MAX_SHORT} characters or fewer.`);
  const long = form.description.trim();
  if (long.length > MAX_LONG) return fail(`Keep the description to ${MAX_LONG} characters or fewer.`);

  const price = parseDollars(form.price);
  if (!price.ok || price.cents === null) return fail('Enter a price, like 24 or 24.50.');
  if (form.photos.length > MAX_PHOTOS) return fail(`A product can have up to ${MAX_PHOTOS} photos.`);

  const hasOptions = form.options.length > 0;
  const usesDigital = hasOptions ? form.options.some((o) => o.choices.some((c) => c.kind === 'digital')) : form.kind === 'digital';
  if (usesDigital && !site.digital) return fail('Downloads aren’t switched on for this site.');
  const live = form.status === 'active';

  if (form.options.length > MAX_OPTIONS) return fail(`A product can have up to ${MAX_OPTIONS} options.`);
  const names = new Set<string>();
  const options: ProductPayload['options'] = [];
  for (const o of form.options) {
    const oname = o.name.trim();
    if (oname === '') return fail('Name every option (like Size or Scent).');
    if (names.has(oname.toLowerCase())) return fail('Two options can’t share a name.');
    names.add(oname.toLowerCase());
    if (o.choices.length === 0) return fail(`Give ${oname} at least one choice.`);
    if (o.choices.length > MAX_CHOICES) return fail(`${oname} can have up to ${MAX_CHOICES} choices.`);
    const seen = new Set<string>();
    const choices: ProductPayload['options'][number]['choices'] = [];
    for (const c of o.choices) {
      const value = c.value.trim();
      if (value === '') return fail(`Fill in every choice for ${oname}.`);
      if (seen.has(value.toLowerCase())) return fail(`${oname} lists ${value} twice.`);
      seen.add(value.toLowerCase());
      if (live && c.kind === 'digital' && c.fileUploadId === null) return fail(`Add the download file for ${value} before making this live.`);
      choices.push({ value, kind: c.kind, file_upload_id: c.kind === 'digital' ? c.fileUploadId : null });
    }
    options.push({ name: oname, choices });
  }

  const combos = combinationsOf(options.map((o) => ({ name: o.name, choices: o.choices.map((c) => c.value) })));
  if (combos.length > MAX_COMBINATIONS) return fail(`That makes ${combos.length} combinations — the most is ${MAX_COMBINATIONS}. Remove some choices.`);
  const typed = new Map(form.variants.map((v) => [combinationKey(v.choices), v]));
  const variants: ProductPayload['variants'] = [];
  for (const combination of combos) {
    const v = typed.get(combinationKey(combination)) ?? { choices: combination, price: '', stock: '', available: true };
    const vp = parseDollars(v.price);
    if (!vp.ok) return fail(`Check the price for ${label(combination)}.`);
    const vs = parseStock(v.stock);
    if (!vs.ok) return fail(`Check the stock for ${label(combination)}.`);
    variants.push({ combination, price_cents: vp.cents, inventory_count: vs.count, available: v.available });
  }
  if (live && hasOptions && !variants.some((v) => v.available)) return fail('Turn on at least one combination before making this live.');

  // Product-level stock and file apply only without options (plan decision 5).
  let inventory: number | null = null;
  if (!hasOptions && form.kind === 'physical') {
    const s = parseStock(form.stock);
    if (!s.ok) return fail('Stock must be a whole number, 0 or more. Leave it blank if you make to order.');
    inventory = s.count;
  }
  const digitalProduct = !hasOptions && form.kind === 'digital';
  if (live && digitalProduct && form.fileUploadId === null) return fail('Add the download file before making this live.');

  return {
    ok: true,
    payload: {
      listing_type: digitalProduct ? 'digital_product' : 'product',
      name,
      short_description: short === '' ? null : short,
      description: long === '' ? null : long,
      base_price_cents: price.cents,
      status: form.status,
      inventory_count: inventory,
      media_ids: form.photos.map((p) => p.uploadId),
      file_upload_id: digitalProduct ? form.fileUploadId : null,
      collection_ids: [...new Set(form.collectionIds)],
      options,
      variants,
    },
  };
}

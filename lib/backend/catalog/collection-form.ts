/** The collection editor's form and validation (spec piece 1 §5). */
import type { ItemStatus } from './product-form';

export type CollectionForm = {
  id: string | null;
  name: string;
  description: string;
  status: ItemStatus;
  featuredImageId: string | null;
  productIds: string[];
};

export type CollectionPayload = {
  name: string;
  description: string | null;
  status: ItemStatus;
  featured_image_id: string | null;
  listing_ids: string[];
};

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;

export function buildCollectionPayload(form: CollectionForm): { ok: true; payload: CollectionPayload } | { ok: false; error: string } {
  const name = form.name.trim();
  if (name === '') return { ok: false, error: 'Give the collection a name.' };
  if (name.length > MAX_NAME) return { ok: false, error: `Keep the name under ${MAX_NAME} characters.` };
  const description = form.description.trim();
  if (description.length > MAX_DESCRIPTION) return { ok: false, error: `Keep the description under ${MAX_DESCRIPTION} characters.` };
  if (new Set(form.productIds).size !== form.productIds.length) return { ok: false, error: 'A product is in this collection twice. Remove one.' };
  return {
    ok: true,
    payload: { name, description: description === '' ? null : description, status: form.status, featured_image_id: form.featuredImageId, listing_ids: form.productIds },
  };
}

/** The list with item `index` moved one step (`delta` −1 up, +1 down); unchanged at the ends. */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item as T);
  return next;
}

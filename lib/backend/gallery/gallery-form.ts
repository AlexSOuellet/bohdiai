/**
 * Gallery (card site spec; the shared gallery feature from the backend overview).
 * The owner's photos in their order, each with an optional caption. The first
 * photo is the one a card site opens with.
 */

/** The most photos a gallery holds. A constant until plans drive it (card spec). */
export const GALLERY_LIMIT = 12;
export const CAPTION_MAX = 80;

export type GalleryItem = { id: string; url: string; caption: string };

export type GalleryOrderRow = { id: string; caption: string | null; position: number };

/** The owner's order and captions, checked, as rows to write. Every listed id must
 *  be one of the site's current photos, listed once. */
export function buildGalleryOrder(
  items: readonly { id: string; caption: string }[],
  existingIds: ReadonlySet<string>,
): { ok: true; rows: GalleryOrderRow[] } | { ok: false; error: string } {
  const seen = new Set<string>();
  const rows: GalleryOrderRow[] = [];
  for (const [i, item] of items.entries()) {
    if (!existingIds.has(item.id) || seen.has(item.id)) {
      return { ok: false, error: 'Your gallery changed somewhere else. Refresh the page and try again.' };
    }
    seen.add(item.id);
    const caption = item.caption.trim().replace(/\s+/g, ' ');
    if (caption.length > CAPTION_MAX) {
      return { ok: false, error: `Photo ${i + 1}’s caption is ${caption.length} characters. Keep it to ${CAPTION_MAX}.` };
    }
    rows.push({ id: item.id, caption: caption === '' ? null : caption, position: i });
  }
  return { ok: true, rows };
}

/** Move one item up or down a list (a new array; out-of-range moves change nothing). */
export function moveGalleryItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
}

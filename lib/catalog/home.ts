/** The most products a shop owner can put on the home page. The database enforces it
 *  (save_product raises 'home limit'); the backend editor and the home sampling mirror it. */
export const HOME_MAX = 5;

/** The most pieces a Showcase gallery shows. The database enforces the ticks
 *  (set_listing_in_gallery raises 'gallery limit'); the products list and the site mirror it. */
export const GALLERY_MAX = 12;

/** Showcase's gallery from its live catalog (oldest first, as the catalog loads):
 *  the pieces the maker ticked, or with none ticked the newest; newest first, at most
 *  GALLERY_MAX. */
export function showcaseGallery<T extends { inGallery?: boolean | undefined }>(catalog: readonly T[]): T[] {
  const picked = catalog.filter((p) => p.inGallery === true);
  const pool = picked.length > 0 ? picked : catalog;
  return [...pool].reverse().slice(0, GALLERY_MAX);
}

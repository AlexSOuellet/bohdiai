/**
 * Cheerful's collage source (D73).
 *
 * The Collage hero renders three still shots; only the Cheerful family uses it. Which
 * source feeds it depends on both the CURRENT family (may be a try-on) and the tenant's
 * ORIGINAL mood at onboarding:
 *
 *   Native Cheerful (originalMood === 'cheerful') — the cinematographer directed three
 *   collage scenes at build time and the walk's hero step decides what happens (keep
 *   the three AI shots, upload 1 to take the featured slot with 2 AI supporting, or
 *   upload 3 to fill every slot). The projection trusts whatever is in
 *   `moment.collageShots` because a native Cheerful build has always had them.
 *
 *   Try-on Cheerful (originalMood !== 'cheerful' but currentFamily === 'cheerful') —
 *   the maker onboarded as some OTHER family and swapped to Cheerful in the editor.
 *   Any AI collage shots that exist on such a tenant are STALE (they were generated
 *   before the pipeline gate landed, or against a different family's world). We
 *   ignore them and derive three shots from the maker's real products — each
 *   product's first image becomes a collage shot. Try-on only exists post-walk, so
 *   real listings are always present by the time this runs.
 *
 * If neither path yields shots (native Cheerful with no shots + no products, or try-on
 * Cheerful with no products) the moment passes through untouched. The CollageHero
 * already filters shots without urls, so the cluster simply doesn't render — an
 * honest sparse signal to add more products, not something we paper over with fill.
 */
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';
import type { Family } from './families';

/** How many shots the Collage hero renders at most (matches CollageHero's MAX_SHOTS). */
const COLLAGE_SLOTS = 3;

/**
 * For the Cheerful family, ensure `moment.collageShots` reflects the D73 rule.
 * `originalMood` is the tenant's stored `mood_key` (its mood at onboarding) — used
 * to distinguish native-Cheerful from try-on Cheerful, since both may have stale
 * collageShots data lying around. Undefined originalMood is treated as non-native
 * (safe default: derive from products rather than trust unknown-provenance shots).
 * For every other current family (or an undefined family in previews/tests) the
 * moment passes through unchanged — the Collage hero isn't in play.
 */
export function resolveCollageShots(
  moment: MainStreetContent['moment'],
  family: Family | undefined,
  products: readonly ProductView[],
  originalMood?: string,
): MainStreetContent['moment'] {
  if (family?.key !== 'cheerful') return moment;
  const nativeCheerful = originalMood === 'cheerful';
  if (nativeCheerful) {
    const existing = (moment.collageShots ?? []).filter(
      (s) => typeof s.url === 'string' && s.url.length > 0,
    );
    if (existing.length > 0) return moment;
    // Native Cheerful edge case — no shots at all (shouldn't happen after a normal
    // build, but keeps the fallback graceful). Fall through to products.
  }
  const derived = productsToCollageShots(products, COLLAGE_SLOTS);
  if (derived.length === 0) return moment;
  return { ...moment, collageShots: derived };
}

/** Build up to `limit` collage shots from the products list, taking each product's
 *  first image and skipping any without one. The `prompt` fields exist to satisfy
 *  the CollageShot schema — they carry a truthful marker string but are never sent
 *  to a generator (product-derived shots are never regenerated). */
function productsToCollageShots(
  products: readonly ProductView[],
  limit: number,
): NonNullable<MainStreetContent['moment']['collageShots']> {
  const shots: NonNullable<MainStreetContent['moment']['collageShots']> = [];
  for (const p of products) {
    if (shots.length >= limit) break;
    const image = p.media.find(
      (m) => m.kind === 'image' && typeof m.url === 'string' && m.url.length > 0,
    );
    if (image === undefined || image.url === undefined) continue;
    shots.push({
      prompt: {
        composition: 'product-derived',
        subject: p.name,
        environment: 'product-derived',
        atmosphere: 'product-derived',
        camera: 'product-derived',
        lighting: 'product-derived',
        style: 'product-derived',
      },
      url: image.url,
      alt: image.alt,
    });
  }
  return shots;
}

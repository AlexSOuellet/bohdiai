/**
 * Search details from the homes (Alex, 2026-10-16): a site with nothing written for
 * search in its page record (every site on the newer format) gets them from content
 * it already has, so a real maker's site shows up properly in search and in shared
 * links. Pure: the loader (seo-data) reads the rows; this picks.
 *
 *   - the line above the name (the moment's short line) leads the description
 *   - the line under their name (About you) is the description
 *   - what they make names the site when it has no craft set
 *   - the share picture is the opening photo, else its first extra photo, else the
 *     first piece's photo (photos only; a video has no still)
 */
import type { TenantSeoFacts } from './seo';

export type HomesSeoRows = {
  momentKicker: string | null;
  profileHeadline: string | null;
  makes: readonly string[] | null;
  /** Candidate share pictures, best first: the opening, its first extra photo, the first piece. */
  pictures: readonly ({ url: string; mime: string } | null)[];
};

function text(v: string | null | undefined): string | undefined {
  const t = v?.trim();
  return t === undefined || t === '' ? undefined : t;
}

export function seoFromHomes(rows: HomesSeoRows): Pick<TenantSeoFacts, 'tagline' | 'seoDescription' | 'nicheLabel' | 'imageUrl'> {
  const picture = rows.pictures.find((p) => p !== null && p.mime.startsWith('image/'));
  return {
    tagline: text(rows.momentKicker),
    seoDescription: text(rows.profileHeadline),
    nicheLabel: text(rows.makes?.[0]),
    imageUrl: picture?.url,
  };
}

/** The page record's own details win; the homes fill only what it doesn't say. */
export function withHomesSeo(facts: TenantSeoFacts, homes: ReturnType<typeof seoFromHomes>): TenantSeoFacts {
  return {
    ...facts,
    tagline: facts.tagline ?? homes.tagline,
    seoDescription: facts.seoDescription ?? homes.seoDescription,
    nicheLabel: facts.nicheLabel ?? homes.nicheLabel,
    imageUrl: facts.imageUrl ?? homes.imageUrl,
  };
}

/**
 * Main Street — what a Scenic page paints behind itself (the Scenic family; Alex
 * approved, Session 107).
 *
 * Scenic is the one family with a photo locked behind the page and the content
 * floating over it. A Scenic site shows a scene from the library (the `scenes`
 * table: tagged and searchable, and every Scenic build adds the ones it makes) or
 * the maker's own photo, with a clip if it has one; which, is stored per site in
 * `site_scenes`. Reading and saving live in `lib/backend/scene`.
 */

/** What a Scenic page paints behind itself. */
export interface ScenePhoto {
  url: string;
  /** Where the photo's point of interest sits, so `cover` keeps it in frame. */
  focus: string;
  /** A dark photo takes light lettering in the opening. Left out: light. */
  tone?: 'light' | 'dark';
  /** A short muted clip that loops behind the page; the photo is its still frame. */
  video?: string;
  /** The site's own background photo (site_backgrounds), not Scenic's scene: Rustic shows it behind its pages. */
  own?: boolean;
}

/** A library scene's name: lowercase words joined by dashes ("classic-loafs-1"). */
export const SCENE_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The picture the family shows of itself before a site has its own: on the intake
 *  form's mood tile, and behind a Scenic page that somehow has no scene (every
 *  Scenic build makes its own, so a site shouldn't). A platform file. */
export const SCENIC_PREVIEW: ScenePhoto = { url: '/scenes/marsh.webp', focus: 'center 62%' };

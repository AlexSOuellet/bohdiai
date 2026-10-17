/**
 * Main Street — the scene library (the Scenic family; Alex approved, Session 107).
 *
 * Scenic is the one family with a photo locked behind the page and the content
 * floating over it. A Scenic site shows either a scene from this library or the
 * maker's own photo; which one is stored per site in `site_scenes`. The library
 * photos are platform files kept with the design files (`/public/scenes/`), the
 * way the family textures are. Each scene is tagged with the kinds of work it
 * suits, so the builder (and later the maker) can be offered scenes that fit.
 * The tags are internal: a site never shows them.
 */

export interface Scene {
  key: string;
  /** Public path of the photo. */
  url: string;
  /** Where the photo's point of interest sits, so `cover` keeps it in frame. */
  focus: string;
  /** The kinds of work it suits (internal tags, matched against what a maker makes). */
  suits: readonly string[];
  /** How light the photo is: a dark one takes light lettering in the opening. */
  tone: 'light' | 'dark';
}

export const SCENES = {
  /** A salt marsh at dusk, open sky over still water (Saltmarsh's photo). */
  marsh: {
    key: 'marsh',
    url: '/scenes/marsh.webp',
    focus: 'center 62%',
    suits: ['coastal', 'decoupage', 'pottery', 'jewelry', 'glass', 'painting', 'any'],
    tone: 'light',
  },
} as const satisfies Record<string, Scene>;

export type SceneKey = keyof typeof SCENES;

/** The scene a Scenic site starts on when it has none of its own. */
export const DEFAULT_SCENE: SceneKey = 'marsh';

export function isSceneKey(key: string): key is SceneKey {
  return Object.prototype.hasOwnProperty.call(SCENES, key);
}

/** What a Scenic page paints behind itself: a photo URL and where its focus sits. */
export interface ScenePhoto {
  url: string;
  focus: string;
  /** A dark photo takes light lettering in the opening. Left out: light. */
  tone?: 'light' | 'dark';
  /** A short muted clip that loops behind the page; the photo is its still frame. */
  video?: string;
}

/** A library scene as a photo to paint; unknown keys fall back to the default scene. */
export function scenePhoto(key: string): ScenePhoto {
  const scene: Scene = isSceneKey(key) ? SCENES[key] : SCENES[DEFAULT_SCENE];
  return { url: scene.url, focus: scene.focus, ...(scene.tone === 'dark' ? { tone: 'dark' as const } : {}) };
}

/**
 * The Moment gate (D44, refined by D54). The hero's Moment timeline plays ONLY
 * when this visit *landed* on the home page and the visitor hasn't entered
 * before. Reaching home by clicking around inside the site does not trigger it
 * — a side-door (deep link / QR) arrival gets no Moment for the whole visit,
 * even on the way to home. The play-through lands on the brand+CTA at rest;
 * that landing is what writes the do-not-replay cookie, so a returning visitor
 * skips straight to the resting hero.
 *
 * The decision is pure and tested; the thin DOM readers below (the document's
 * landing path, the cookie write) are the only browser-touching pieces.
 */

/** Window event the footer "Intro" link fires to replay the Moment without a
 *  full page reload. MomentHero listens for it; the link also navigates to
 *  `/?intro=1` so the replay works whether you're already on home or arriving
 *  from another page. */
export const REPLAY_INTRO_EVENT = 'bohdi:replay-intro';

/** How often the Moment plays, the maker's choice in the walk / editor (D54,
 *  refined this session):
 *   - `once`   — plays on a visitor's first cold front-door arrival, then the
 *                seen-cookie rests it (the long-standing default).
 *   - `always` — plays on EVERY cold front-door arrival, ignoring the cookie, so
 *                returning visitors see it again each time they land fresh.
 *   - `off`    — never plays; the store opens straight to the resting hero. */
export type MomentPlayMode = 'once' | 'always' | 'off';

const PLAY_MODES: ReadonlySet<string> = new Set<MomentPlayMode>(['once', 'always', 'off']);

/** Resolve the stored moment's play mode. Prefers an explicit `playMode`; falls
 *  back to the legacy on/off `playIntro` boolean (false → off, true/absent →
 *  once), so envelopes authored before the once/always split keep playing. */
export function resolveMomentPlayMode(moment: { playMode?: unknown; playIntro?: unknown } | null | undefined): MomentPlayMode {
  const raw = moment?.playMode;
  if (typeof raw === 'string' && PLAY_MODES.has(raw)) return raw as MomentPlayMode;
  return moment?.playIntro === false ? 'off' : 'once';
}

export function momentSeenCookieName(key: string): string {
  return `bohdi_moment_seen_${key}`;
}

/** True if a do-not-replay cookie for this shop is present in the cookie string. */
export function hasSeenMoment(key: string, cookieString: string): boolean {
  const name = momentSeenCookieName(key);
  return cookieString.split(';').some((c) => c.trim().startsWith(`${name}=`));
}

/** A cold front-door arrival = the document this visit LOADED on is the home
 *  page. After a client-side navigation to home from an inside page, the loaded
 *  document is still that inside page, so this stays false — which is the whole
 *  point (the side door never opens the front-door show on the same trip). */
export function isColdFrontDoorEntry(initialPath: string | null, homePath = '/'): boolean {
  return initialPath !== null && initialPath === homePath;
}

export interface MomentPlayDecision {
  /** The pathname of the document this visit loaded on (not the current route). */
  initialPath: string | null;
  homePath?: string;
  /** Per-shop key for the seen-cookie (the tenant id). Null disables play (e.g. preview). */
  key: string | null;
  cookieString: string;
  /** A deliberate replay (footer "Intro", or the walk's Moment step) forces play
   *  regardless of cold/seen. */
  forceReplay?: boolean;
  /** How often the Moment plays (D54). `off` disables it outright — it never
   *  plays, not even a forced replay. `always` ignores the seen-cookie so it
   *  replays every cold front-door visit. Default `once`. */
  playMode?: MomentPlayMode;
  /** The editor/walk preview. The maker's `playMode` governs LIVE visitors, not
   *  the preview, so in preview the Moment never auto-plays — it plays only when
   *  explicitly forced (the walk's Moment step passes `forceReplay`). This keeps a
   *  step that shows the resting hero from being hijacked by an "always" intro. */
  preview?: boolean;
}

/** Whether the Moment timeline should play on this load. */
export function shouldPlayMoment(d: MomentPlayDecision): boolean {
  const { initialPath, homePath = '/', key, cookieString, forceReplay = false, playMode = 'once', preview = false } = d;
  // The maker set the Moment off — it never plays, overriding even a forced replay.
  if (playMode === 'off') return false;
  if (forceReplay) return true;
  // In the editor preview, the maker's playMode does not auto-play the intro; only
  // an explicit replay (handled above) does.
  if (preview) return false;
  if (!key) return false;
  if (!isColdFrontDoorEntry(initialPath, homePath)) return false;
  // `always` replays for every cold front-door visitor; `once` rests after the
  // seen-cookie is written.
  if (playMode === 'always') return true;
  return !hasSeenMoment(key, cookieString);
}

/** The pathname of the document the browser actually loaded for this visit.
 *  Survives client-side route changes (the navigation entry keeps the loaded
 *  URL), which is how a deep-link visitor who later walks to home is told apart
 *  from a cold front-door visitor. */
export function initialDocumentPath(): string | null {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') return null;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav || !nav.name) return null;
  try {
    return new URL(nav.name).pathname;
  } catch {
    return null;
  }
}

/** Write the per-shop do-not-replay cookie (1 year). No-op off the browser. */
export function markMomentSeen(key: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${momentSeenCookieName(key)}=1; path=/; max-age=31536000; samesite=lax`;
}

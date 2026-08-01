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
  /** A deliberate replay (footer "Intro") forces play regardless of cold/seen. */
  forceReplay?: boolean;
  /** The maker's on/off setting for the intro (D54). Off means the intro is
   *  disabled outright — it never plays, not even a forced replay. Default on. */
  introEnabled?: boolean;
}

/** Whether the Moment timeline should play on this load. */
export function shouldPlayMoment(d: MomentPlayDecision): boolean {
  const { initialPath, homePath = '/', key, cookieString, forceReplay = false, introEnabled = true } = d;
  // The maker turned the intro off — it never plays, overriding even a forced replay.
  if (!introEnabled) return false;
  if (forceReplay) return true;
  if (!key) return false;
  if (!isColdFrontDoorEntry(initialPath, homePath)) return false;
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

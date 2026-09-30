/**
 * Sign-in, password setup and the backend are served only on the app host
 * (app.bohdiai.com / app.localhost). From any other host — a shop, a custom
 * domain later, the marketing apex — those paths redirect there, so the session
 * cookie only ever lives on the app host (spec §1).
 */
import { isAppHost } from '@/lib/proxy-security';

const EXACT = ['/signin', '/forgot-password', '/manage'] as const;
const PREFIXES = ['/auth/', '/manage/'] as const;

export function isBackendPath(pathname: string): boolean {
  return (EXACT as readonly string[]).includes(pathname) || PREFIXES.some((p) => pathname.startsWith(p));
}

/** The app host to send someone to. Never derived from a production request host
 *  (custom domains, workers.dev, trailing dots); only local dev derives it, so it
 *  works whatever SITE_URL is. */
function appTarget(hostname: string, appBase: string): string {
  const [host = '', port] = hostname.split(':');
  const local = host === 'localhost' || host.endsWith('.localhost');
  return local ? `http://app.localhost${port !== undefined ? `:${port}` : ''}` : appBase;
}

/** Where to send a backend path requested on the wrong host, or null to let it through. */
export function backendRedirect(hostname: string, url: URL, appBase: string): string | null {
  if (!isBackendPath(url.pathname) || isAppHost(hostname)) return null;
  return `${appTarget(hostname, appBase)}${url.pathname}${url.search}`;
}

/**
 * The owner's way in from their own site: yourshop.com/admin goes to the backend
 * (which shows sign-in first when signed out), the way Shopify's /admin does. Nothing on the site links to it, so
 * shoppers never see it (Alex, 2026-09-30). Only on shop hosts; the marketing
 * apex and the app host are left alone.
 */
export function ownerEntryRedirect(hostname: string, url: URL, appBase: string, isShopHost: boolean): string | null {
  if (!isShopHost || (url.pathname !== '/admin' && url.pathname !== '/admin/')) return null;
  return `${appTarget(hostname, appBase)}/manage`;
}

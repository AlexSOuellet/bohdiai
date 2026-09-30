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

/** Where to send a backend path requested on the wrong host, or null to let it through. */
export function backendRedirect(hostname: string, url: URL, appBase: string): string | null {
  if (!isBackendPath(url.pathname) || isAppHost(hostname)) return null;
  const [host = '', port] = hostname.split(':');
  const local = host === 'localhost' || host.endsWith('.localhost');
  // Never derive the app origin from a production request host (custom domains,
  // workers.dev, trailing dots); only local dev derives it, so it works whatever SITE_URL is.
  const origin = local ? `http://app.localhost${port !== undefined ? `:${port}` : ''}` : appBase;
  return `${origin}${url.pathname}${url.search}`;
}

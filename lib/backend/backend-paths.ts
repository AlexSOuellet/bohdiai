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
export function backendRedirect(hostname: string, url: URL): string | null {
  if (!isBackendPath(url.pathname) || isAppHost(hostname)) return null;
  const [host = '', port] = hostname.split(':');
  const local = host === 'localhost' || host.endsWith('.localhost');
  const apex = local ? 'localhost' : host.split('.').slice(-2).join('.');
  const origin = local ? `http://app.${apex}${port !== undefined ? `:${port}` : ''}` : `https://app.${apex}`;
  return `${origin}${url.pathname}${url.search}`;
}

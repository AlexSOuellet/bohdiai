/**
 * The origin the visitor actually used (scheme + Host header), for same-origin
 * checks and redirects in backend route handlers. `request.url` is not reliable
 * for this: the Next dev server reports its own listen address (localhost:3000)
 * even when the browser is on app.localhost:3000, so comparing a form post's
 * Origin against it refused every real click.
 */
import { requestHost } from '@/lib/proxy-security';

export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = requestHost(request.headers) || url.host;
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const scheme = forwarded === 'https' || forwarded === 'http' ? forwarded : url.protocol.replace(':', '');
  return `${scheme}://${host}`;
}

/** True when a form post came from the same origin the visitor is on (absent Origin is allowed). */
export function isSameOriginPost(request: Request): boolean {
  const from = request.headers.get('origin');
  return from === null || from.toLowerCase() === requestOrigin(request);
}

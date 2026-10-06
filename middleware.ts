import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { sanitizeTenantHeaders, isUnreachableStorefrontPath, requestHost, isAppHost, isDormantPath, tenantLookupUrl, apexRedirect } from '@/lib/proxy-security';
import { appOrigin } from '@/lib/backend/app-url';
import { backendRedirect, isBackendPath, isManagePath, ownerEntryRedirect } from '@/lib/backend/backend-paths';
import { ACTIVITY_COOKIE, IDLE_SECONDS, checkBackendSession, sessionSecret } from '@/lib/backend/session-limits';
import { DRAFT_HEADERS, PREVIEW_COOKIE, PREVIEW_MAX_AGE, PREVIEW_PARAM, draftGate } from '@/lib/storefront/draft-preview';

const RESERVED = new Set(['www', 'admin', 'app', 'learn']);
const BASE_DOMAIN = 'bohdiai.com';

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// This stays `middleware.ts` (edge runtime) rather than Next 16's `proxy.ts`:
// proxy.ts always runs on Node, and the Cloudflare adapter only supports Node
// middleware experimentally. Edge middleware is its supported path. Next prints
// a deprecation warning for this file — expected until the adapter catches up.
export async function middleware(request: NextRequest) {
  // Every shop subdomain reaches this Worker directly, so the real Host header
  // says which shop. The old forwarded-shop header is ignored (see requestHost).
  const hostname = requestHost(request.headers);
  const subdomain = extractSubdomain(hostname);

  const toApex = apexRedirect(hostname, request.nextUrl);
  if (toApex !== null) return NextResponse.redirect(toApex, 308);

  // Switched-off surfaces (builder, dashboard, sign-in, ...) answer 404 on every
  // host before anything else runs. See isDormantPath.
  if (isDormantPath(request.nextUrl.pathname)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Sign-in, password setup and the backend live only on the app host; every
  // other host sends those paths there (spec §1 — the session cookie stays on
  // app.bohdiai.com).
  const appBase = appOrigin(process.env['SITE_URL'] || 'https://bohdiai.com');
  const toApp = backendRedirect(hostname, request.nextUrl, appBase);
  if (toApp !== null) return NextResponse.redirect(toApp, 307);

  // An owner reaches their backend by typing /admin on their own site (no
  // visible link — shoppers never see it).
  const toSignIn = ownerEntryRedirect(hostname, request.nextUrl, appBase, subdomain !== null);
  if (toSignIn !== null) return NextResponse.redirect(toSignIn, 307);

  // The backend lives on app.bohdiai.com under /manage/*. Land the bare app
  // root on the backend home so app.bohdiai.com isn't the marketing page.
  // Other app-host paths (/signin, /auth/*) pass through unchanged.
  if (isAppHost(hostname) && request.nextUrl.pathname === '/') {
    const dest = request.nextUrl.clone();
    dest.pathname = '/manage';
    return NextResponse.redirect(dest);
  }

  // /storefront/* is an internal rewrite target — on the apex (no subdomain)
  // it is never directly addressable. 404 instead of leaking the rewrite shape.
  if (isUnreachableStorefrontPath(request.nextUrl.pathname, subdomain)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Storefront subdomains: resolve tenant or return 404
  let tenantId: string | undefined;
  let isDraft = false;
  if (subdomain !== null) {
    const tenant = await resolveTenant(subdomain);
    if (!tenant) {
      return new NextResponse('Store not found', { status: 404 });
    }
    // A draft site is "not found" to everyone but its private preview link.
    // The link's code is remembered in a cookie for this site only, then the
    // address is cleaned of it.
    if (tenant.status === 'draft') {
      const gate = await draftGate(
        process.env['BACKEND_SESSION_SECRET'],
        subdomain,
        request.nextUrl.searchParams.get(PREVIEW_PARAM),
        request.cookies.get(PREVIEW_COOKIE)?.value,
      );
      if (gate === 'deny') {
        return new NextResponse('Store not found', { status: 404, headers: DRAFT_HEADERS });
      }
      if (gate === 'link') {
        const clean = request.nextUrl.clone();
        const code = clean.searchParams.get(PREVIEW_PARAM) ?? '';
        clean.searchParams.delete(PREVIEW_PARAM);
        const admitted = NextResponse.redirect(clean, 303);
        admitted.cookies.set(PREVIEW_COOKIE, code, {
          httpOnly: true,
          secure: request.nextUrl.protocol === 'https:',
          sameSite: 'lax',
          path: '/',
          maxAge: PREVIEW_MAX_AGE,
        });
        Object.entries(DRAFT_HEADERS).forEach(([k, v]) => admitted.headers.set(k, v));
        return admitted;
      }
      isDraft = true;
    }
    tenantId = tenant.id;
  }

  // Build augmented request headers (includes tenant context when applicable).
  // CRITICAL: drop any forged x-tenant-* headers from the inbound request
  // BEFORE we (maybe) set them ourselves. Without this, an outside caller
  // could send `x-tenant-id: <victim-uuid>` from the apex and have it
  // propagate unchecked into every server component and API handler.
  const requestHeaders = new Headers(request.headers);
  sanitizeTenantHeaders(requestHeaders);
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId);
    requestHeaders.set('x-tenant-subdomain', subdomain!);
  }

  // For tenant requests, rewrite the URL to the storefront route so that
  // myshop.bohdiai.com/ hits app/storefront/ rather than the marketing home.
  // EXCEPT /api/* — those route to the shared platform API regardless of which
  // subdomain the request originated from (forms posted from tenant pages
  // hit /api/notify-interest, /api/contact, etc, and need to resolve normally).
  const isTenantRequest = tenantId !== undefined;
  const originalPath = request.nextUrl.pathname;
  const skipRewrite = originalPath.startsWith('/api/') || isBackendPath(originalPath);
  const rewriteUrl = isTenantRequest && !skipRewrite ? request.nextUrl.clone() : null;
  if (rewriteUrl !== null) {
    rewriteUrl.pathname = '/storefront' + (originalPath === '/' ? '' : originalPath);
  }

  // Start response — rewrite for tenant requests, pass-through for marketing/app.
  let response = rewriteUrl !== null
    ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh the Supabase auth session on every request so JWTs stay current.
  // If NEXT_PUBLIC_SUPABASE_* vars are missing (e.g. during early dev), skip gracefully.
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (supabaseUrl && anonKey) {
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // When Supabase needs to update the session cookie it rebuilds the
        // response so the new cookies are included. We recreate with the same
        // requestHeaders and rewriteUrl (if any) so tenant context is preserved.
        // `headers` are the no-cache headers the library sends with every auth
        // cookie write, so a CDN never serves one person's session to another.
        setAll: ((cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = rewriteUrl !== null
            ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
            : NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        }) satisfies SetAllCookies,
      },
    });
    if (isAppHost(hostname) && isManagePath(request.nextUrl.pathname)) {
      // The backend enforces auto sign-out (8h idle, 7 days max). getClaims
      // refreshes the session like getUser and returns the verified token.
      const { data } = await supabase.auth.getClaims();
      if (data !== null) {
        const { verdict, nextCookie } = await checkBackendSession({
          claims: data.claims,
          cookie: request.cookies.get(ACTIVITY_COOKIE)?.value,
          now: Math.floor(Date.now() / 1000),
          secret: sessionSecret(process.env['BACKEND_SESSION_SECRET']),
        });
        const secure = request.nextUrl.protocol === 'https:';
        if (verdict !== 'ok') {
          // Local scope: end this device's session only. Its cookie clearing
          // (and no-cache headers) land on `response` through setAll above;
          // carry them onto the redirect.
          const { error } = await supabase.auth.signOut({ scope: 'local' });
          if (error !== null) console.error('[middleware] Backend auto sign-out failed:', error.message);
          const dest = request.nextUrl.clone();
          dest.pathname = '/signin';
          dest.search = `?ended=${verdict}`;
          const ended = NextResponse.redirect(dest, 303);
          response.cookies.getAll().forEach((c) => ended.cookies.set(c));
          ended.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
          ended.cookies.set(ACTIVITY_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 });
          return ended;
        }
        if (nextCookie !== null) {
          response.cookies.set(ACTIVITY_COOKIE, nextCookie, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: IDLE_SECONDS });
        }
      }
    } else {
      await supabase.auth.getUser();
    }
  }

  // Frame protection, per surface. A storefront (the rewritten tenant render) may
  // be framed by our own dashboard for the editor's live preview, and by nobody
  // else — `frame-ancestors` lists our origins (same-origin 'self' covers a maker
  // editing on their own shop subdomain; *.bohdiai.com covers the app host
  // framing a shop). Everything else — the dashboard itself, marketing, admin —
  // stays un-frameable.
  if (rewriteUrl !== null) {
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://*.bohdiai.com http://*.localhost:3000",
    );
    response.headers.delete('X-Frame-Options');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  if (isDraft) Object.entries(DRAFT_HEADERS).forEach(([k, v]) => response.headers.set(k, v));

  return response;
}

/**
 * Returns the storefront subdomain from a hostname, or null if the request
 * is not for a tenant storefront.
 *
 * Examples:
 *   bohdiai.com          → null  (marketing site)
 *   app.bohdiai.com      → null  (maker dashboard)
 *   admin.bohdiai.com    → null  (founder admin)
 *   myshop.bohdiai.com   → "myshop"
 *   localhost            → null  (local marketing site)
 *   myshop.localhost     → "myshop"  (local storefront dev)
 */
function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0] ?? '';

  if (host === 'localhost') return null;

  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, -'.localhost'.length);
    return sub !== '' && !RESERVED.has(sub) ? sub : null;
  }

  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) return null;

  if (!host.endsWith(`.${BASE_DOMAIN}`)) return null;

  const sub = host.slice(0, -(`.${BASE_DOMAIN}`.length));

  // Reject nested subdomains (e.g. a.b.bohdiai.com)
  if (sub.includes('.')) return null;

  return sub !== '' && !RESERVED.has(sub) ? sub : null;
}

async function resolveTenant(subdomain: string): Promise<{ id: string; status: string } | null> {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[middleware] Missing Supabase env vars — cannot resolve tenant');
    return null;
  }

  const url = tenantLookupUrl(supabaseUrl, subdomain);

  try {
    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[middleware] Supabase tenant lookup failed: ${res.status}`);
      return null;
    }

    const rows = (await res.json()) as Array<{ id: string; status: string }>;
    return rows[0] ?? null;
  } catch (err) {
    console.error('[middleware] Tenant resolution error:', err);
    return null;
  }
}

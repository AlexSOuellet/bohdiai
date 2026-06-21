import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { sanitizeTenantHeaders, isUnreachableStorefrontPath, resolveProxyHost, isAppHost, isAppSurfacePath } from '@/lib/proxy-security';

const RESERVED = new Set(['www', 'admin', 'app', 'learn']);
const BASE_DOMAIN = 'bohdiai.com';

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function proxy(request: NextRequest) {
  // A Cloudflare edge snippet proxies shop subdomains to the apex (the only host
  // with a valid cert) and forwards the real shop host in `x-bohdi-shop`. Prefer
  // it; on the apex and everywhere else this is just the normal Host header.
  // (NOT x-forwarded-host — Vercel's edge manages/overwrites that one.)
  const hostname = resolveProxyHost(
    request.headers.get('x-bohdi-shop'),
    request.headers.get('host'),
  );
  const subdomain = extractSubdomain(hostname);

  // The maker dashboard lives on app.bohdiai.com under /dashboard/*. Land the
  // bare app root on the dashboard home so app.bohdiai.com isn't the marketing
  // page. Other app-host paths (/signin, /onboarding) pass through unchanged.
  if (isAppHost(hostname) && request.nextUrl.pathname === '/') {
    const dest = request.nextUrl.clone();
    dest.pathname = '/dashboard';
    return NextResponse.redirect(dest);
  }

  // /storefront/* is an internal rewrite target — on the apex (no subdomain)
  // it is never directly addressable. 404 instead of leaking the rewrite shape.
  if (isUnreachableStorefrontPath(request.nextUrl.pathname, subdomain)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Storefront subdomains: resolve tenant or return 404
  let tenantId: string | undefined;
  if (subdomain !== null) {
    const tenant = await resolveTenant(subdomain);
    if (!tenant) {
      return new NextResponse('Store not found', { status: 404 });
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
  // On a shop subdomain we still serve the platform API and — so a maker can sign
  // in on their own site and manage it there — the auth + dashboard surface, with
  // the shop's tenant context attached. Everything else paints the storefront.
  const isTenantRequest = tenantId !== undefined;
  const originalPath = request.nextUrl.pathname;
  const skipRewrite = originalPath.startsWith('/api/') || isAppSurfacePath(originalPath);
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
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = rewriteUrl !== null
            ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
            : NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
        }) satisfies SetAllCookies,
      },
    });
    await supabase.auth.getUser();
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

async function resolveTenant(subdomain: string): Promise<{ id: string } | null> {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[middleware] Missing Supabase env vars — cannot resolve tenant');
    return null;
  }

  // Lowercase matches the unique index on lower(subdomain)
  const url =
    `${supabaseUrl}/rest/v1/tenants` +
    `?select=id` +
    `&subdomain=eq.${encodeURIComponent(subdomain.toLowerCase())}` +
    `&status=eq.active` +
    `&limit=1`;

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

    const rows = (await res.json()) as Array<{ id: string }>;
    return rows[0] ?? null;
  } catch (err) {
    console.error('[middleware] Tenant resolution error:', err);
    return null;
  }
}

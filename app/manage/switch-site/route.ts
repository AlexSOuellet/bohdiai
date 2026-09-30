import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getUserShops } from '@/lib/auth/membership';
import { SITE_COOKIE } from '@/lib/backend/current-site';
import { requestOrigin, isSameOriginPost } from '@/lib/backend/request-origin';

/** Picker: POST tenantId → set the acting site if the person administers it. */
export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  const origin = requestOrigin(request);
  const home = NextResponse.redirect(new URL('/manage', origin), 303);

  // A cross-site form post must not be able to change which site is acted on.
  if (!isSameOriginPost(request)) return home;

  let tenantId = '';
  try {
    tenantId = String((await request.formData()).get('tenantId') ?? '');
  } catch {
    return home;
  }

  const sites = await getUserShops(user.id);
  if (sites.some((s) => s.tenantId === tenantId)) {
    home.cookies.set(SITE_COOKIE, tenantId, {
      httpOnly: true,
      secure: origin.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
    });
  }
  return home;
}

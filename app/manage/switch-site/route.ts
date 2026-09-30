import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getUserShops } from '@/lib/auth/membership';
import { SITE_COOKIE } from '@/lib/backend/current-site';

/** Picker: POST tenantId → set the acting site if the person administers it. */
export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  const url = new URL(request.url);
  const home = NextResponse.redirect(new URL('/manage', url), 303);

  // A cross-site form post must not be able to change which site is acted on.
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== url.origin) return home;

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
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
    });
  }
  return home;
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getUserShops } from '@/lib/auth/membership';
import { SITE_COOKIE } from '@/lib/backend/current-site';

/** Picker: POST tenantId → set the acting site if the person administers it. */
export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  const form = await request.formData();
  const tenantId = String(form.get('tenantId') ?? '');
  const sites = await getUserShops(user.id);
  const home = NextResponse.redirect(new URL('/manage', request.url), 303);
  if (sites.some((s) => s.tenantId === tenantId)) {
    home.cookies.set(SITE_COOKIE, tenantId, {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
    });
  }
  return home;
}

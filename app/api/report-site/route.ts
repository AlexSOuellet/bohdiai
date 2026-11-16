import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseReport } from '@/lib/site-reports/report';
import { tellAlex } from '@/lib/site-reports/tell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * "Report this site" (go-live step 3, Alex 2026-11-16): saved for Alex's admin, and
 * Alex is emailed. Answers `{ ok }`, or `{ problem }` naming the spot in the page's own
 * words, or `{ failed }` when nothing was saved.
 */
export async function POST(req: Request): Promise<Response> {
  const turnedAway = await formLimitResponse(req, 'report', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }
  const parsed = parseReport(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid')
    return NextResponse.json({ problem: parsed.problem }, { status: 400 });
  const { site, reason, details, email } = parsed.fields;
  try {
    const db = supabaseAdmin();
    const { data: tenant, error } = await db
      .from('tenants')
      .select('id, business_name, subdomain')
      .eq('subdomain', site)
      .is('deleted_at', null)
      .maybeSingle();
    if (error !== null) throw new Error(error.message);
    if (tenant === null) return NextResponse.json({ problem: 'notFound' }, { status: 400 });
    const saved = await db
      .from('site_reports')
      .insert({ tenant_id: tenant.id, reason, details, email });
    if (saved.error !== null) throw new Error(saved.error.message);
    await tellAlex({
      siteName: tenant.business_name,
      subdomain: tenant.subdomain,
      tenantId: tenant.id,
      reason,
      details,
      email,
    });
  } catch (err) {
    logger.error('site report: save failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ failed: true }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

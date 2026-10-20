import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { CRON_KEY_HEADER, isCronKey } from '@/lib/visits/cron-key';
import { appVisitsReader } from '@/lib/visits/queries';
import { saveFinishedMonths } from '@/lib/visits/months';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The daily job (worker.ts): save each Full site's finished months of visitor
 * numbers. Only the job's key opens it. Any failure is answered and logged, so the
 * Worker's logs show it.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!(await isCronKey(process.env['BACKEND_SESSION_SECRET'], 'visit-months', req.headers.get(CRON_KEY_HEADER)))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const run = appVisitsReader();
  if (run === null) {
    logger.error('visit months: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_ANALYTICS_TOKEN is missing');
    return NextResponse.json({ error: 'Visitor numbers are not set up.' }, { status: 503 });
  }
  try {
    const result = await saveFinishedMonths(supabaseAdmin(), run, new Date());
    if (result.failed.length > 0) logger.error('visit months: some not saved', { failed: result.failed });
    return NextResponse.json(result, { status: result.failed.length > 0 ? 500 : 200 });
  } catch (err) {
    logger.error('visit months failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Visit months could not be saved.' }, { status: 500 });
  }
}

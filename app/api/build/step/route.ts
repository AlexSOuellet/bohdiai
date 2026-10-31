import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { CRON_KEY_HEADER, isCronKey } from '@/lib/visits/cron-key';
import { buildDeps, runStep } from '@/lib/build/run-step';
import { BUILD_JOB, isStepInput } from '@/lib/build/start-build';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One step of the automatic build (Session 119), asked for by the Cloudflare
 * Workflow (worker.ts) through the Worker's own binding. Only a request carrying
 * the build's key (made from BACKEND_SESSION_SECRET) is run; anything else is
 * turned away before the database is touched. Answers `{ result }`, which the
 * Workflow keeps and passes to the next step; a failure answers 500 so the
 * Workflow tries again.
 */
export async function POST(req: Request): Promise<Response> {
  if (!(await isCronKey(process.env['BACKEND_SESSION_SECRET'], BUILD_JOB, req.headers.get(CRON_KEY_HEADER)))) {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'not a step' }, { status: 400 });
  }
  if (!isStepInput(input)) return NextResponse.json({ error: 'not a step' }, { status: 400 });
  try {
    return NextResponse.json({ result: (await runStep(buildDeps(), input)) ?? null });
  } catch (err) {
    logger.error('site build step failed', { step: input.step, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

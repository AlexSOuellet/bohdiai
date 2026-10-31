/**
 * Starting the automatic build when the site form is sent (Session 119). On
 * Cloudflare it's a Workflow (SITE_BUILD in wrangler.jsonc, worker.ts), which
 * runs each step as its own request and tries a failed step again. The dev
 * server has no Workflows, so there the steps run one after another in the
 * background of the request that sent the form.
 */
import { after } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { logger } from '@/lib/logger';
import { runSequence, type StepInput } from './build-sequence';
import { buildDeps, runStep } from './run-step';

/** The build's key name: the Workflow signs its step requests with it. */
export const BUILD_JOB = 'site-build';

const STEPS = new Set(['prepare', 'plan', 'background', 'draft', 'write', 'finish', 'attach', 'failed']);

/** A step request's body, shaped right (its contents are checked by the step). */
export function isStepInput(v: unknown): v is StepInput {
  return v !== null && typeof v === 'object' && 'step' in v && typeof v.step === 'string' && STEPS.has(v.step);
}

/** The Workflow instance's name: one build per form. */
export const buildId = (intakeId: string): string => `site-${intakeId}`;

export async function startBuild(intakeId: string): Promise<void> {
  const workflow = (await getCloudflareContext({ async: true })).env.SITE_BUILD;
  if (workflow !== undefined) {
    await workflow.create({ id: buildId(intakeId), params: { intakeId } });
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('SITE_BUILD Workflow binding missing — "workflows" in wrangler.jsonc');
  // The dev server: no time limit, so the steps simply run in turn.
  after(() =>
    runSequence(intakeId, (_name, input) => runStep(buildDeps(), input)).catch((err: unknown) =>
      logger.error('site build failed', { intakeId, error: err instanceof Error ? err.message : String(err) }),
    ),
  );
}

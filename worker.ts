/**
 * The Worker's entry: the OpenNext app (built into .open-next/worker.js by
 * `opennextjs-cloudflare build`) plus the daily job wrangler.jsonc's "triggers"
 * runs, and the automatic site build's Workflow. The job and the Workflow ask the
 * app itself (WORKER_SELF_REFERENCE) to do the work, signed with a key made from
 * BACKEND_SESSION_SECRET: the daily job's work lives in /api/cron/visit-months,
 * each build step's in /api/build/step.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep, type WorkflowStepConfig } from 'cloudflare:workers';
// @ts-expect-error `.open-next/worker.js` is generated at build time.
import { default as app } from './.open-next/worker.js';
import { CRON_KEY_HEADER, cronKey } from './lib/visits/cron-key';
import { runSequence, type StepInput } from './lib/build/build-sequence';

const VISIT_MONTHS_JOB = 'visit-months';
/** Matches BUILD_JOB in lib/build/start-build.ts. */
const BUILD_JOB = 'site-build';

/** A step that fails is tried twice more; writing the site is never tried twice. */
const RETRY: WorkflowStepConfig = { retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' }, timeout: '15 minutes' };
const ONCE: WorkflowStepConfig = { retries: { limit: 0, delay: '1 second' }, timeout: '15 minutes' };

/** The automatic site build after onboarding, one form at a time. */
export class SiteBuild extends WorkflowEntrypoint<CloudflareEnv, { intakeId: string }> {
  override async run(event: WorkflowEvent<{ intakeId: string }>, step: WorkflowStep): Promise<void> {
    const key = await cronKey(this.env.BACKEND_SESSION_SECRET, BUILD_JOB);
    if (key === null) throw new Error('BACKEND_SESSION_SECRET is missing');
    const self = this.env.WORKER_SELF_REFERENCE;
    if (self === undefined) throw new Error('WORKER_SELF_REFERENCE binding missing (wrangler.jsonc "services")');
    const call = async (input: StepInput): Promise<string> => {
      const res = await self.fetch('https://bohdiai.com/api/build/step', {
        method: 'POST',
        headers: { 'content-type': 'application/json', [CRON_KEY_HEADER]: key },
        body: JSON.stringify(input),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`step ${input.step} failed (${res.status}): ${text}`);
      // Kept as text between steps; read back as the step's answer.
      return text;
    };
    await runSequence(event.payload.intakeId, async (name, input, opts) => {
      const text = await step.do(name, opts.retry ? RETRY : ONCE, () => call(input));
      return (JSON.parse(text) as { result: unknown }).result;
    });
  }
}

export default {
  fetch: (app as Required<Pick<ExportedHandler<CloudflareEnv>, 'fetch'>>).fetch,
  async scheduled(_event: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext): Promise<void> {
    const key = await cronKey(env.BACKEND_SESSION_SECRET, VISIT_MONTHS_JOB);
    if (key === null) {
      console.error('[cron] visit months not saved: BACKEND_SESSION_SECRET is missing');
      return;
    }
    const self = env.WORKER_SELF_REFERENCE;
    if (self === undefined) {
      console.error('[cron] visit months not saved: WORKER_SELF_REFERENCE binding missing (wrangler.jsonc "services")');
      return;
    }
    ctx.waitUntil(
      self.fetch('https://bohdiai.com/api/cron/visit-months', { method: 'POST', headers: { [CRON_KEY_HEADER]: key } })
        .then(async (res) => {
          if (!res.ok) console.error('[cron] visit months failed:', res.status, await res.text());
        })
        .catch((err: unknown) => console.error('[cron] visit months failed:', err instanceof Error ? err.message : String(err))),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

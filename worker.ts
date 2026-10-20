/**
 * The Worker's entry: the OpenNext app (built into .open-next/worker.js by
 * `opennextjs-cloudflare build`) plus the daily job wrangler.jsonc's "triggers"
 * runs. The job asks the app itself (WORKER_SELF_REFERENCE) to save each Full
 * site's finished months of visitor numbers; the work lives in the app route
 * /api/cron/visit-months, which checks the key.
 */
// @ts-expect-error `.open-next/worker.js` is generated at build time.
import { default as app } from './.open-next/worker.js';
import { CRON_KEY_HEADER, cronKey } from './lib/visits/cron-key';

const VISIT_MONTHS_JOB = 'visit-months';

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

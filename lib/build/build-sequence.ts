/**
 * The order of the automatic build's steps (lib/build/site-build.ts), with no
 * other code in it: the Cloudflare Workflow (worker.ts) and the dev server both
 * run this one list, each with its own way of running a step. A step that fails
 * after its retries stops the build, and Alex is told which form and which step.
 */
import type { BuildState } from './site-build';
import type { ScenePlan } from './scene-art';
import type { IntakeDrafts } from './from-intake';

/** What one step is given. */
export type StepInput =
  | { step: 'prepare'; intakeId: string }
  | { step: 'plan'; state: BuildState }
  | { step: 'background'; state: BuildState; index: number; plan: ScenePlan }
  | { step: 'draft'; state: BuildState }
  | { step: 'write'; state: BuildState; drafts: IntakeDrafts }
  | { step: 'finish'; state: BuildState }
  | { step: 'attach'; state: BuildState }
  | { step: 'failed'; intakeId: string; error: string };

/** Runs one step by name; `retry: false` for a step that must not run twice. */
export type RunStep = (name: string, input: StepInput, opts: { retry: boolean }) => Promise<unknown>;

export async function runSequence(intakeId: string, run: RunStep): Promise<void> {
  try {
    const state = (await run('prepare', { step: 'prepare', intakeId }, { retry: true })) as BuildState;
    const scenic = state.family === 'scenic';
    const backgrounds = async (): Promise<void> => {
      const plans = (await run('plan backgrounds', { step: 'plan', state }, { retry: true })) as ScenePlan[];
      for (const [index, plan] of plans.entries()) await run(`background ${index + 1}`, { step: 'background', state, index, plan }, { retry: true });
    };
    // Scenic's page needs its photo first; every other mood gets them after "your site is ready".
    if (scenic) await backgrounds();
    const drafts = (await run('draft words', { step: 'draft', state }, { retry: true })) as IntakeDrafts;
    await run('write site', { step: 'write', state, drafts }, { retry: false });
    await run('finish', { step: 'finish', state }, { retry: true });
    if (!scenic) {
      await backgrounds();
      await run('attach background', { step: 'attach', state }, { retry: true });
    }
  } catch (err) {
    await run('tell Alex', { step: 'failed', intakeId, error: err instanceof Error ? err.message : String(err) }, { retry: true });
    throw err;
  }
}

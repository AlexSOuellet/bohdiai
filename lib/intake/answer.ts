/** The intake route's answer as what the page shows. */
import { isErrorSpot, type IntakeProblem } from './request';

export type IntakeAnswer = { kind: 'problem'; problem: IntakeProblem } | { kind: 'message'; message: string };

function values(v: unknown): Record<string, string | number> {
  if (v === null || typeof v !== 'object') return {};
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, string | number] => typeof e[1] === 'string' || typeof e[1] === 'number'));
}

/** A named problem shows in the form's own words; the limiter's message shows as it
 *  came; anything else is `failed` ("it didn't send", with Alex's address). */
export function answerStatus(body: unknown, failed: string): IntakeAnswer {
  if (body !== null && typeof body === 'object') {
    const problem: unknown = 'problem' in body ? body.problem : undefined;
    if (problem !== null && typeof problem === 'object' && 'spot' in problem && isErrorSpot(problem.spot)) {
      return { kind: 'problem', problem: { spot: problem.spot, values: values('values' in problem ? problem.values : undefined) } };
    }
    const error: unknown = 'error' in body ? body.error : undefined;
    if (typeof error === 'string' && error !== '') return { kind: 'message', message: error };
  }
  return { kind: 'message', message: failed };
}

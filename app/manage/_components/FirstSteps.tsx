import Link from 'next/link';
import type { Route } from 'next';
import type { Steps } from '@/lib/backend/first-steps';

/** Her plan's first steps on Home: each ticks itself off when it's done, and the
 *  first one left is marked as next. */
export function FirstSteps({ steps }: { steps: Steps }): React.ReactElement {
  const done = steps.steps.filter((s) => s.done).length;
  const next = steps.steps.find((s) => !s.done);
  return (
    <section className="bk-steps" aria-labelledby="bk-steps">
      <div className="bk-steps-head">
        <h2 id="bk-steps" className="bk-band-title">
          {steps.title}
        </h2>
        <p className="bk-steps-count">
          {done} of {steps.steps.length} done
        </p>
      </div>
      <progress className="bk-steps-bar" value={done} max={steps.steps.length} aria-hidden="true" />
      <ul className="bk-steps-list">
        {steps.steps.map((step) => (
          <li key={step.key}>
            {step.done ? (
              <span className="bk-step" data-done="true">
                <span className="bk-step-mark" aria-hidden="true" />
                <span className="bk-step-label">{step.label}</span>
                <span className="bk-sr">Done</span>
              </span>
            ) : step.href.startsWith('#') ? (
              <a className="bk-step" href={step.href} data-next={step === next}>
                <span className="bk-step-mark" aria-hidden="true" />
                <span className="bk-step-label">{step.label}</span>
                {step === next && <span className="bk-step-go">Up next</span>}
              </a>
            ) : (
              <Link className="bk-step" href={step.href as Route} data-next={step === next}>
                <span className="bk-step-mark" aria-hidden="true" />
                <span className="bk-step-label">{step.label}</span>
                {step === next && <span className="bk-step-go">Up next</span>}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

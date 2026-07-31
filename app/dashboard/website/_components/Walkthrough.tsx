'use client';

import { useState } from 'react';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';
import SectionEditor from './SectionEditor';

interface WalkthroughProps {
  /** id → current value from the draft/live envelope (seeds the "write it myself" fields). */
  values: Record<string, unknown>;
  /** First run chases completeness; a re-run is a keep-or-change tour. Framing only. */
  firstRun: boolean;
  /** Ask the host to refresh the preview after a staged change. */
  onChanged: () => void;
  /** Leave the walk (back to the look editor). */
  onExit: () => void;
}

/** The walk's step sequence: header + progress, one SectionEditor per step, and the
 *  step navigation. The per-section editing lives in SectionEditor (reused by the
 *  editor's content area); this component owns only the sequence. */
export default function Walkthrough({ values, firstRun, onChanged, onExit }: WalkthroughProps) {
  const steps = WALKTHROUGH_STEPS;
  const [index, setIndex] = useState(0);
  const [resolved, setResolved] = useState(false);

  const step = steps[index]!;
  const isLast = index === steps.length - 1;

  function goNext() {
    if (isLast) onExit();
    else {
      setIndex(index + 1);
      setResolved(false);
    }
  }

  function goBack() {
    if (index === 0) return;
    setIndex(index - 1);
    setResolved(false);
  }

  const nextHint =
    step.cls === 'must-change'
      ? 'Make this yours to continue'
      : 'Keep it, change it, or turn it off to continue';

  return (
    <div className="flex min-h-0 flex-col px-6 py-8">
      {/* Header + progress */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-honey-warm">
            {firstRun ? 'Make it yours' : 'A look back through your store'}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-muted transition-colors hover:text-text-soft"
          >
            Close
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3" data-progress={`${index + 1}/${steps.length}`}>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-honey transition-all duration-500"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted">
            Step {index + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* The section being made yours */}
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
        <SectionEditor
          key={step.section}
          section={step.section}
          cls={step.cls}
          keepable={step.keepable}
          fieldIds={step.fieldIds}
          values={values}
          questions={step.questions}
          onResolved={setResolved}
          onChanged={onChanged}
        />
      </div>

      {/* Step navigation — Next waits until this section is resolved (D69). */}
      <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="text-sm text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          {!resolved && <span className="text-[11px] text-muted">{nextHint}</span>}
          <button
            type="button"
            onClick={goNext}
            disabled={!resolved}
            className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:cursor-not-allowed disabled:opacity-30"
          >
            {isLast ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

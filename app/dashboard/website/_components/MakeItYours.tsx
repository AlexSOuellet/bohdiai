'use client';

import { useState } from 'react';
import { WALKTHROUGH_STEPS } from '@/lib/editor/walkthrough';
import SectionEditor from './SectionEditor';

interface MakeItYoursProps {
  /** Signed token authorising the draft preview for this tenant. */
  previewToken: string;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
  /** id → current word value, seeding the "write it myself" fields. */
  values: Record<string, unknown>;
}

/** The full-screen "Make It Yours" walk — the second half of onboarding (D69). No
 *  dashboard chrome, no way out: it steps through every section, and the editor door
 *  stays closed until it's done (the gate lives on the routes). Left column is the
 *  section being made yours; right column is the live draft preview. */
export default function MakeItYours({ previewToken, previewOrigin, values }: MakeItYoursProps) {
  const steps = WALKTHROUGH_STEPS;
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [resolved, setResolved] = useState(false);
  // Bumped after any staged content change to force the preview iframe to re-fetch
  // the draft (a content edit doesn't change the URL, so src alone won't reload it).
  const [nonce, setNonce] = useState(0);

  const step = steps[index]!;
  const isLast = index === steps.length - 1;

  function goNext() {
    if (isLast) return; // finish screen lands in a later task
    setIndex(index + 1);
    setResolved(false);
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

  // The preview renders the maker's own draft (previewToken) as a static still so the
  // scroll-in reveals resolve in the iframe. previewStill keeps reveal-gated sections
  // (products) visible; the nonce forces a reload after each staged edit.
  const previewSrc = `${previewOrigin}/?previewToken=${encodeURIComponent(previewToken)}&previewStill=1&n=${nonce}`;

  // The opening welcome — what this is, before the first section (D69).
  if (!started) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg px-6 text-center text-text">
        <p className="text-[11px] uppercase tracking-[0.24em] text-honey-warm">Make it yours</p>
        <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-tight text-text">Let’s make this store yours</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-text-soft">
          We built you a complete store to start from. Now we’ll go through it together, one section at a
          time — keep what you like, change what you don’t, and put your own words where they count. It
          only takes a few minutes, and once you’re done you can refine anything in your editor whenever
          you want.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-10 rounded-lg bg-honey px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Let’s go
        </button>
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-cols-1 bg-bg text-text md:grid-cols-[minmax(380px,460px)_1fr]">
      {/* Left — the section being made yours */}
      <div className="flex min-h-0 flex-col border-b border-white/8 md:border-b-0 md:border-r">
        {/* Top bar — no exit; the editor is gated until the walk is done */}
        <div className="flex items-center justify-between gap-4 border-b border-white/8 px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-honey-warm">Make it yours</p>
          <span className="text-[11px] text-muted">Finish to reach your editor</span>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center gap-3">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <SectionEditor
            key={step.section}
            section={step.section}
            cls={step.cls}
            keepable={step.keepable}
            fieldIds={step.fieldIds}
            values={values}
            questions={step.questions}
            onResolved={setResolved}
            onChanged={() => setNonce((n) => n + 1)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
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
              disabled={!resolved || isLast}
              className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Right — the live draft preview */}
      <div className="relative flex min-h-[50vh] flex-col bg-[#050403] md:min-h-0">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Live preview · {step.title.toLowerCase()}</span>
        </div>
        <iframe
          key={previewSrc}
          src={previewSrc}
          title="Your store preview"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { WalkthroughStep } from '@/lib/editor/walkthrough';
import type { SectionResolution } from '@/lib/editor/section-state';
import type { MomentPlayMode } from '@/lib/archetypes/main-street/moment-gate';
import type { FamilyKey } from '@/lib/archetypes/main-street/families';
import SectionEditor from './SectionEditor';
import type { EditorProduct } from './ProductsEditor';
import type { EditorCollection } from './CollectionsEditor';
import type { HeroMediaSummary, CollageShotSummary } from './HeroPhotoPanel';

interface MakeItYoursProps {
  /** Signed token authorising the draft preview for this tenant. */
  previewToken: string;
  /** Origin of this tenant's storefront, e.g. https://ember.bohdiai.com. */
  previewOrigin: string;
  /** id → current word value, seeding the "write it myself" fields. */
  values: Record<string, unknown>;
  /** The family-aware walk list (computed server-side from the maker's feeling —
   *  a Cozy maker's list has a Moment step before the Hero step). */
  steps: readonly WalkthroughStep[];
  /** How often the Moment currently plays (seeds the Moment step's control). */
  momentPlayMode: MomentPlayMode;
  /** The maker's public feeling label (e.g. "Cozy") — named in the Moment step. */
  moodLabel: string;
  /** Whether the maker's feeling uses the star-RATING reviews layout — the only one
   *  that shows an overall number, so the only one whose reviews step offers the
   *  optional real-rating fields. */
  reviewsShowsRating?: boolean;
  /** The current overall rating on the store (seeds the rating fields on resume). */
  reviewsSummary?: { score?: string | undefined; count?: string | undefined } | undefined;
  /** Per-step: is this step's section already resolved in the draft? A finished section
   *  opens marked completed with Next open, so a returning maker can move through the
   *  walk without redoing it. Defaults to all-false (a fresh walk). Aligned to `steps`. */
  resolvedFlags?: readonly boolean[];
  /** Per-step: the section's raw resolution in the draft (made / kept / hidden /
   *  unresolved), so each step opens in the right state. Aligned to `steps`. */
  resolutions?: readonly SectionResolution[];
  /** The maker's real products (seeds the goods step's products editor, and the
   *  pool of products the collections step groups). */
  products?: readonly EditorProduct[];
  /** The maker's real collections (seeds the collections step). */
  collections?: readonly EditorCollection[];
  /** The maker's family key — drives the hero step's photo UI (single vs 0/1/3 collage). */
  family: FamilyKey;
  /** Current `moment.media` summary — seeds the hero step's photo preview (non-Cheerful). */
  heroMedia?: HeroMediaSummary | undefined;
  /** Current `moment.collageShots` summaries — seeds the hero step's collage preview (Cheerful). */
  heroShots?: readonly CollageShotSummary[] | undefined;
}

/** The full-screen "Make It Yours" walk — the second half of onboarding (D69). No
 *  dashboard chrome, no way out: it steps through every section, and the editor door
 *  stays closed until it's done (the gate lives on the routes). Left column is the
 *  section being made yours; right column is the live draft preview. */
export default function MakeItYours({ previewToken, previewOrigin, values, steps, momentPlayMode, moodLabel, reviewsShowsRating, reviewsSummary, resolvedFlags, resolutions, products, collections, family, heroMedia, heroShots }: MakeItYoursProps) {
  // The walk always starts at the beginning and runs top to bottom. Sections the maker
  // already finished in an earlier sitting open marked completed (Next stays open on
  // them) so they can breeze past or make changes — nothing is skipped or hidden.
  const resolvedSeed = steps.map((_, i) => resolvedFlags?.[i] ?? false);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [resolvedIdx, setResolvedIdx] = useState<ReadonlySet<number>>(
    () => new Set(resolvedSeed.flatMap((r, i) => (r ? [i] : []))),
  );
  // Bumped after any staged content change to force the preview iframe to re-fetch
  // the draft (a content edit doesn't change the URL, so src alone won't reload it).
  const [nonce, setNonce] = useState(0);

  const step = steps[index]!;
  const isLast = index === steps.length - 1;
  const resolved = resolvedIdx.has(index);

  // A section resolving (or a maker un-resolving it, e.g. turning it back on) updates
  // the set for the current step — the walk remembers it across Back/Next and reloads.
  function markResolved(ok: boolean) {
    setResolvedIdx((prev) => {
      const next = new Set(prev);
      if (ok) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  function goNext() {
    setIndex(index + 1);
  }

  // Finishing opens the editor door: every section is resolved (each Next was gated on
  // it), so `walkComplete` is true and /dashboard/website no longer bounces back here.
  // The maker's work is staged on their draft — the editor is where they publish it.
  function finish() {
    setFinished(true);
  }

  function goBack() {
    // From the first section, Back returns to the welcome screen (there's no section
    // before it), so the button is always live rather than a dead greyed-out control.
    if (index === 0) {
      setStarted(false);
      return;
    }
    setIndex(index - 1);
  }

  const nextHint =
    step.cls === 'must-change'
      ? 'Make this yours to continue'
      : step.cls === 'optional'
        ? 'Keep it, change it, or turn it off to continue'
        : 'Keep it or change it to continue';

  // The preview renders the maker's own draft (previewToken) as a static still so the
  // scroll-in reveals resolve in the iframe. previewStill keeps reveal-gated sections
  // (products) visible; previewSection spotlights just the section being edited so the
  // maker sees only that one; the nonce forces a reload after each staged edit. On the
  // Moment step we force the first-run intro to play (intro=1) so the maker watches their
  // opening lines fade in as a visitor would — unless they've set it off, in which case
  // the draft's playMode keeps it at rest even with intro=1. The Hero step shows the
  // resting top (no intro).
  const intro = step.isMoment ? '&intro=1' : '';
  // Contact has no home beat — its content lives on the /contact PAGE — so spotlighting
  // it on the home page would show nothing. Preview the whole /contact page instead
  // (still under the draft token). Every other step spotlights its home section.
  const isPageStep = step.section === 'contact';
  const previewPath = isPageStep ? '/contact' : '/';
  const sectionParam = isPageStep ? '' : `&previewSection=${encodeURIComponent(step.section)}`;
  const previewSrc = `${previewOrigin}${previewPath}?previewToken=${encodeURIComponent(previewToken)}&previewStill=1${sectionParam}${intro}&n=${nonce}`;

  // The closing screen — the walk is done and the editor is now open (D69). Neutral on
  // publish state: the maker's work is staged on their draft; the editor is where they
  // choose to publish it, so nothing here claims the live store already reflects it.
  if (finished) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg px-6 text-center text-text">
        <p className="text-[11px] uppercase tracking-[0.24em] text-honey-warm">All yours</p>
        <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-tight text-text">Your store is yours now</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-text-soft">
          You’ve been through every part and made it your own. Your editor is open from here on — come
          back and change anything, anytime. Nothing’s ever set in stone.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign('/dashboard/website')}
          className="mt-10 rounded-lg bg-honey px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Go to my editor
        </button>
      </div>
    );
  }

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
            key={step.id}
            section={step.section}
            title={step.title}
            cls={step.cls}
            keepable={step.keepable}
            fieldIds={step.fieldIds}
            values={values}
            initialProducts={step.section === 'goods' || step.section === 'collections' ? products : undefined}
            initialCollections={step.section === 'collections' ? collections : undefined}
            resolution={resolutions?.[index]}
            isMoment={step.isMoment ?? false}
            momentPlayMode={momentPlayMode}
            moodLabel={moodLabel}
            reviewsShowsRating={reviewsShowsRating}
            reviewsSummary={reviewsSummary}
            family={family}
            heroMedia={heroMedia}
            heroShots={heroShots}
            onResolved={markResolved}
            onChanged={() => setNonce((n) => n + 1)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-white/12 px-4 py-2 text-sm text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            {!resolved && <span className="text-[11px] text-muted">{nextHint}</span>}
            <button
              type="button"
              onClick={isLast ? finish : goNext}
              disabled={!resolved}
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
          {/* The Moment plays once and settles; a maker judging it needs to watch again.
              Bumping the nonce reloads the iframe, which replays the intro from the top. */}
          {step.isMoment && (
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] text-text-soft transition-colors hover:border-honey/50 hover:text-honey-warm"
            >
              ↻ Play it again
            </button>
          )}
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

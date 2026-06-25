'use client';

/**
 * Main Street — BEAT 1: the hero, which IS the Moment.
 *
 * D54 (corrected): the hero is the front door. There is no separate portable
 * layer that plays first and melts in. There is no Enter Site click. What plays
 * is the same brand-story timeline as before — held media + each story line
 * fading in and out one at a time, settling on the brand+CTA at rest — but it
 * plays IN the hero surface itself, not on an overlay above it.
 *
 * GATE — the timeline only runs on a cold front-door arrival (this visit loaded
 * on the home page, no per-shop seen-cookie). A side-door visitor (deep link /
 * QR / inside-page first hit) gets the resting hero directly; they get the
 * Moment next time they cold-arrive at home. When the timeline lands on the
 * brand phase, the per-shop seen-cookie is written, so a returning visitor
 * skips straight to the resting hero. A footer "Intro" link (./chrome) carries
 * `?intro=1` and forces a replay regardless of cookie or arrival kind. (See
 * `./moment-gate` for the decision and the cookie machinery.)
 *
 * SSR — the server renders the resting state (brand + CTA visible, no story
 * lines). On client mount the gate runs in a layout effect; if play is decided
 * we flip to the open phase before paint so there's no flash of brand on a
 * cold visit. Returning visitors and side-door visitors never see a flicker
 * because they keep the rest state.
 *
 * Two media kinds, both driven by the cinematographer's `media.kind` (D40, D54,
 * refined by D55):
 *   • VIDEO — fal-generated 16:9 clip with the camera LOCKED and in-frame motion
 *     only (D52). Autoplays muted, loops seamlessly.
 *   • STILL — fal-generated 16:9 cinematic SCENE composition (the product in its
 *     real world, lit naturally, with depth and air). A very subtle CSS push-in
 *     adds cinematic time at render.
 *
 * CONTRAST OVER MEDIA — every word painted over the hero uses the skin-agnostic
 * `--ms-on-media` near-white plus the dark scrim, NEVER the skin's contrast
 * color, so text stays legible over a hero of unknown luminance.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';
import { navContrast, relativeLuminance } from './logo-contrast';
import { shouldPlayMoment, initialDocumentPath, markMomentSeen, REPLAY_INTRO_EVENT } from './moment-gate';

const STILL_PUSH_IN_SECONDS = 24;

// Timeline tuning (ms). GAP_MS must be >= the fade so a line fully clears before
// the next begins — that no-overlap is the whole point. Pace is slow and
// deliberate; a line rests long enough to read twice.
const OPEN_MS = 1000; // media alone before the first line
const LINE_MS = 3400; // a line held (includes its own fade-in)
const GAP_MS = 1000; // media alone between lines
const FADE = '0.9s';

export type HeroPhase =
  | { kind: 'open' }
  | { kind: 'line'; index: number }
  | { kind: 'gap' }
  | { kind: 'brand' };

/** The ordered hero timeline: a breath of media, then each line followed by a
 *  clean gap, finally landing on the brand. Pure + exported so the rhythm is
 *  testable without driving the component's timers. */
export function buildHeroTimeline(lineCount: number): HeroPhase[] {
  const phases: HeroPhase[] = [{ kind: 'open' }];
  for (let i = 0; i < lineCount; i += 1) {
    phases.push({ kind: 'line', index: i });
    phases.push({ kind: 'gap' });
  }
  phases.push({ kind: 'brand' });
  return phases;
}

/** How long a phase holds before advancing; null = terminal (the brand rests). */
export function heroPhaseDurationMs(p: HeroPhase): number | null {
  switch (p.kind) {
    case 'open':
      return OPEN_MS;
    case 'line':
      return LINE_MS;
    case 'gap':
      return GAP_MS;
    case 'brand':
      return null;
  }
}

const overlayFrame = (visible: boolean, z: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: 'clamp(28px,6vw,96px)',
  opacity: visible ? 1 : 0,
  transition: `opacity ${FADE} linear`,
  pointerEvents: visible ? 'auto' : 'none',
  zIndex: z,
});

/** The shared inner visual: held media, a center-weighted scrim, story lines
 *  (each visible only during its own line phase), and the brand block (visible
 *  only on the brand phase). The brand block carries the eyebrow + heading +
 *  CTA — at rest, only the brand block shows, no story lines. */
function HeroStage({
  moment,
  phase,
  action,
}: {
  moment: MainStreetContent['moment'];
  phase: HeroPhase;
  action: ReactNode;
}) {
  const isStill = moment.media.kind === 'still';
  const landed = phase.kind === 'brand';
  const lineVisible = (i: number) => phase.kind === 'line' && phase.index === i;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          // For stills, a very subtle slow push-in adds cinematic time. The scale
          // tops at 1.03 over ~24s — visible only over the dwell, not on first
          // glance. The transform-origin keeps the center anchored. For videos
          // this wrapper is a noop and Media's <video> handles its own motion.
          ...(isStill ? { animation: `ms-hero-push ${STILL_PUSH_IN_SECONDS}s ease-in-out infinite alternate` } : {}),
          transformOrigin: 'center',
        }}
      >
        <Media media={moment.media} />
      </div>
      <style>{`@keyframes ms-hero-push { 0% { transform: scale(1); } 100% { transform: scale(1.03); } }`}</style>
      {/* Scrim weighted toward the center where the text sits, so white text reads
          whether the scene is bright or dark. */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.42), rgba(0,0,0,.82))' }}
      />

      {/* Story lines, one per phase frame — each cross-fades in and out. The
          authored array is rendered into the DOM so it's testable; visibility is
          driven by the phase. */}
      {moment.story.map((line, i) => (
        <div key={i} data-ms-hero-story-line-frame style={overlayFrame(lineVisible(i), 2)}>
          <Type
            as="p"
            role="storyline"
            data-ms-hero-story-line
            style={{ color: 'var(--ms-on-media)', maxWidth: '24ch', margin: 0, textShadow: '0 2px 36px rgba(0,0,0,.55)' }}
          >
            {line}
          </Type>
        </div>
      ))}

      {/* The brand block — eyebrow, heading, CTA. Visible only on the brand
          phase, which is the timeline's terminal state and also the SSR default
          state. */}
      <div data-ms-hero-brand style={overlayFrame(landed, 3)}>
        <div>
          <Type as="div" role="eyebrow" style={{ color: 'var(--ms-on-media-muted)', marginBottom: 18 }}>
            {moment.eyebrow}
          </Type>
          <Type as="h1" role="brand" style={{ color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}>
            {moment.brand}
          </Type>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>{action}</div>
        </div>
      </div>
    </>
  );
}

/** The hero's CTA row — the authored primary and an optional secondary, each
 *  pointed where its label says it goes (D46). When a button has no authored
 *  target the fallback is /shop (the home is a sampling; the catalog lives at
 *  the shop). */
function HeroCta({ moment }: { moment: MainStreetContent['moment'] }) {
  const primaryHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  return (
    <>
      <Type as="a" role="navLabel" href={primaryHref} style={{ background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}>
        {moment.ctaLabel}
      </Type>
      {moment.secondaryCtaLabel && (
        <Type as="a" role="navLabel" href={secondaryHref} style={{ border: '1px solid var(--ms-on-media-muted)', color: 'var(--ms-on-media)', padding: '16px 26px', borderRadius: 2 }}>
          {moment.secondaryCtaLabel}
        </Type>
      )}
    </>
  );
}

export function MomentHero({
  identity,
  moment,
  skin,
  momentKey,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  /** Per-shop key (tenant id) for the seen-cookie. Without it the timeline never
   *  plays and the hero renders at rest — used in previews / tests / SSR. */
  momentKey?: string | undefined;
}) {
  const timeline = buildHeroTimeline(moment.story.length);
  const lastIndex = timeline.length - 1; // the brand phase

  // The current timeline step. SSR default = the last step (brand at rest) so a
  // returning visitor and a deep-link visitor see the resting hero immediately
  // with no flicker. The step is an integer index — not a content-typed phase —
  // because the timeline has indistinguishable phases (two 'gap' frames) that
  // can't be told apart by shape alone.
  const [step, setStep] = useState<number>(lastIndex);
  const [solid, setSolid] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Decide whether the Moment plays. Client-only (reads the loaded-document
  // path + cookie); layout effect so we flip to step 0 (open) before paint when
  // play is decided, avoiding a flash of brand on cold arrivals.
  useLayoutEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const forceReplay = /[?&]intro=1(?:&|$)/.test(search);
    const cookieString = typeof document !== 'undefined' ? document.cookie : '';
    if (shouldPlayMoment({ initialPath: initialDocumentPath(), key: momentKey ?? null, cookieString, forceReplay })) {
      // The play decision is client-only; deciding in a layout effect is the
      // correct pattern here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(0);
    }
  }, [momentKey]);

  // Footer "Intro" replay: a client-side signal restarts the timeline without a
  // full reload (covers clicking Intro while already on the home page; arriving
  // from another page is handled by the mount effect above reading ?intro=1).
  useEffect(() => {
    const replay = () => setStep(0);
    window.addEventListener(REPLAY_INTRO_EVENT, replay);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, replay);
  }, []);

  // Drive the timeline. The brand step (last) is terminal — on landing on it,
  // write the per-shop cookie so the next cold visit skips the play. Marking
  // seen is idempotent.
  useEffect(() => {
    if (step >= lastIndex) {
      if (momentKey) markMomentSeen(momentKey);
      return undefined;
    }
    const ms = heroPhaseDurationMs(timeline[step]!);
    if (ms == null) return undefined;
    const t = setTimeout(() => setStep((n) => Math.min(n + 1, lastIndex)), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lastIndex, momentKey]);

  const phase = timeline[step]!;

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => setSolid(!e.isIntersecting)), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tone = identity.logoTone ?? 'unknown';
  const overMedia = navContrast(tone, 'dark');
  const skinBackdrop = relativeLuminance(skin.palette.bg) > 0.5 ? 'light' : 'dark';
  const onSurface = navContrast(tone, skinBackdrop);
  const navBg = solid
    ? (onSurface ? onSurface.bg : 'var(--ms-bg)')
    : (overMedia ? overMedia.bg : 'transparent');
  const navFg = solid
    ? (onSurface ? onSurface.fg : 'var(--ms-fg)')
    : (overMedia ? overMedia.fg : 'var(--ms-on-media)');

  return (
    <>
      <nav
        data-ms-nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 40px',
          background: navBg,
          color: navFg,
          boxShadow: solid && !onSurface ? '0 1px 0 var(--ms-rule)' : 'none',
          transition: 'background .5s ease, padding .5s ease, color .5s ease',
        }}
      >
        <Nav identity={identity} />
      </nav>

      <header
        ref={heroRef}
        data-ms-hero
        style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--ms-contrast-bg)', color: 'var(--ms-on-media)' }}
      >
        <HeroStage moment={moment} phase={phase} action={<HeroCta moment={moment} />} />
      </header>
    </>
  );
}

'use client';

/**
 * Main Street — BEAT 1: the resting hero, plus the Moment intro that plays over
 * it on a cold front-door arrival (D44).
 *
 * The hero RESTS by default — a full-screen held video that has already landed
 * on the brand + CTA. That rested hero is what the server renders and what a
 * returning or deep-link visitor sees immediately; it does NOT animate on its
 * own. Only a cold front-door visitor (this visit LANDED on home, hasn't entered
 * before — see ./moment-gate) gets the `MomentIntro`: a full-screen overlay that
 * plays the brand story one line at a time, lands, and then waits. Nothing
 * transitions until the customer clicks "Enter site" — that click melts the
 * overlay away (a fade) to reveal the rested hero beneath, and writes the
 * do-not-replay cookie.
 *
 * REVEAL RHYTHM — each line fades fully out and the video breathes alone for a
 * beat before the next fades in, so two lines never share the screen. The pace
 * is slow and deliberate — a line rests long enough to read twice. Timeline is a
 * pure, tested helper.
 *
 * CONTRAST OVER MEDIA — every word painted over the video uses the skin-agnostic
 * `--ms-on-media` near-white plus the dark scrim, NEVER the skin's contrast
 * color, so text stays legible over a video of unknown luminance.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles } from './chrome';
import { shouldPlayMoment, initialDocumentPath, markMomentSeen } from './moment-gate';

// Tunable reveal timing (ms). GAP_MS must be >= the fade so a line fully clears
// before the next begins — that no-overlap is the whole point.
const OPEN_MS = 1000; // media alone before the first line
const LINE_MS = 3400; // a line held (includes its own ~fade-in)
const GAP_MS = 1000; // media alone between lines
const FADE = '0.9s';
const MELT_MS = 1100; // the "melt": overlay fade-out on Enter

export type StoryPhase =
  | { kind: 'open' }
  | { kind: 'line'; index: number }
  | { kind: 'gap' }
  | { kind: 'brand' };

/** The ordered reveal timeline: a breath of media, then each line followed by a
 *  clean gap, finally landing on the brand. Pure + exported so the rhythm is
 *  testable without driving the component's timers. */
export function buildStoryTimeline(lineCount: number): StoryPhase[] {
  const phases: StoryPhase[] = [{ kind: 'open' }];
  for (let i = 0; i < lineCount; i += 1) {
    phases.push({ kind: 'line', index: i });
    phases.push({ kind: 'gap' });
  }
  phases.push({ kind: 'brand' });
  return phases;
}

/** How long a phase holds before advancing; null = terminal (the brand rests). */
export function phaseDurationMs(p: StoryPhase): number | null {
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

const frame = (visible: boolean, z: number): CSSProperties => ({
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

/** The shared inner visual: held media, a center-weighted scrim, the story lines
 *  (one visible at a time per `phase`), and the brand block with an `action` row
 *  (the hero's CTA at rest, the "Enter site" button in the intro). */
function MomentStage({
  moment,
  skin,
  phase,
  action,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  phase: StoryPhase;
  action: ReactNode;
}) {
  const r = roles(skin);
  const landed = phase.kind === 'brand';
  const lineVisible = (i: number) => phase.kind === 'line' && phase.index === i;

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* The hero media takes the skin's own photo grade (via .archetype-photo),
            so it's mood-driven rather than a fixed sepia. */}
        <Media media={moment.media} />
      </div>
      {/* Scrim weighted toward the center where the text sits, so white text reads
          whether the video is bright or dark. */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.42), rgba(0,0,0,.82))' }}
      />

      {moment.story.map((line, i) => (
        <div key={i} data-story-line style={frame(lineVisible(i), 2)}>
          <p
            data-type="storyline"
            style={{ ...typeRoleCss(r.storyline), color: 'var(--ms-on-media)', maxWidth: '18ch', margin: 0, textShadow: '0 2px 36px rgba(0,0,0,.55)' }}
          >
            {line}
          </p>
        </div>
      ))}

      <div data-story-brand style={frame(landed, 3)}>
        <div>
          <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-on-media-muted)', marginBottom: 18 }}>
            {moment.eyebrow}
          </div>
          <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}>
            {moment.brand}
          </h1>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>{action}</div>
        </div>
      </div>
    </>
  );
}

/** The rested hero's CTA row — the authored primary (scrolls to goods) and an
 *  optional secondary. */
function HeroCta({ moment, skin }: { moment: MainStreetContent['moment']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <>
      <a href="#goods" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}>
        {moment.ctaLabel}
      </a>
      {moment.secondaryCtaLabel && (
        <a href="#" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-on-media-muted)', color: 'var(--ms-on-media)', padding: '16px 26px', borderRadius: 2 }}>
          {moment.secondaryCtaLabel}
        </a>
      )}
    </>
  );
}

/** The cold-arrival intro: a full-screen overlay above the page that plays the
 *  story, lands, then holds with an "Enter site" button. The click melts it (a
 *  fade) and calls `onExited` once the fade completes. */
export function MomentIntro({
  moment,
  skin,
  onExited,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  onExited: () => void;
}) {
  const r = roles(skin);
  const lineCount = moment.story.length;
  const [pi, setPi] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const phase = buildStoryTimeline(lineCount)[pi]!;
  const landed = phase.kind === 'brand';

  // Advance the timeline one phase at a time; the brand phase is terminal.
  useEffect(() => {
    if (leaving) return undefined;
    const ms = phaseDurationMs(buildStoryTimeline(lineCount)[pi]!);
    if (ms == null) return undefined;
    const last = buildStoryTimeline(lineCount).length - 1;
    const t = setTimeout(() => setPi((n) => Math.min(n + 1, last)), ms);
    return () => clearTimeout(t);
  }, [pi, lineCount, leaving]);

  // Lock the page behind the overlay so it can't be scrolled during the intro.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
  };

  const onFadeEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (leaving && e.propertyName === 'opacity') onExited();
  };

  const enterButton = (
    <button
      type="button"
      onClick={enter}
      data-moment-enter
      data-type="navLabel"
      style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', border: 'none', padding: '16px 30px', borderRadius: 2, cursor: 'pointer' }}
    >
      Enter site
    </button>
  );

  return (
    <div
      data-moment-intro
      onTransitionEnd={onFadeEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        overflow: 'hidden',
        background: 'var(--ms-contrast-bg)',
        color: 'var(--ms-on-media)',
        opacity: leaving ? 0 : 1,
        transition: `opacity ${MELT_MS}ms ease`,
      }}
    >
      <MomentStage moment={moment} skin={skin} phase={phase} action={landed ? enterButton : null} />
    </div>
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
  /** Per-shop key (tenant id) for the do-not-replay cookie. */
  momentKey?: string | undefined;
}) {
  const [solid, setSolid] = useState(false);
  const [play, setPlay] = useState(false);
  const [gone, setGone] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Decide whether the cold-arrival intro plays. Client-only (reads the loaded
  // document path + cookie); useLayoutEffect so the overlay is up before paint
  // when it does play.
  useLayoutEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const forceReplay = /[?&]intro=1(?:&|$)/.test(search);
    const cookieString = typeof document !== 'undefined' ? document.cookie : '';
    if (shouldPlayMoment({ initialPath: initialDocumentPath(), key: momentKey ?? null, cookieString, forceReplay })) {
      setPlay(true);
    }
  }, [momentKey]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => setSolid(!e.isIntersecting)), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
          padding: solid ? '14px 40px' : '20px 40px',
          background: solid ? 'var(--ms-bg)' : 'transparent',
          color: solid ? 'var(--ms-fg)' : 'var(--ms-on-media)',
          boxShadow: solid ? '0 1px 0 var(--ms-rule)' : 'none',
          transition: 'background .5s ease, padding .5s ease, color .5s ease',
        }}
      >
        <Nav identity={identity} skin={skin} />
      </nav>

      <header
        ref={heroRef}
        data-ms-hero
        style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--ms-contrast-bg)', color: 'var(--ms-on-media)' }}
      >
        <MomentStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={<HeroCta moment={moment} skin={skin} />} />
      </header>

      {play && !gone && (
        <MomentIntro
          moment={moment}
          skin={skin}
          onExited={() => {
            if (momentKey) markMomentSeen(momentKey);
            setGone(true);
          }}
        />
      )}
    </>
  );
}

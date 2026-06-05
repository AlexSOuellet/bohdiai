'use client';

/**
 * Main Street — BEAT 1: the moment IS the hero.
 *
 * A full-screen held video with the brand story told one line at a time,
 * landing on the brand + CTA — and that landing IS the resting hero. Plays on
 * load; you scroll past it. The fixed nav stays hidden until the brand lands,
 * then appears, and goes solid once the hero scrolls out of view.
 *
 * REVEAL RHYTHM — each line fades fully out and the video breathes alone for a
 * beat before the next fades in, so two lines never share the screen. (An
 * overlapping cross-fade stacks the marks of two lines into a smeared
 * double-exposure.) Timeline is built by a pure, tested helper; the numbers are
 * deliberately on the quick side — eyeball on a real build and tune them here.
 *
 * CONTRAST OVER MEDIA — every word painted over the video uses the skin-agnostic
 * `--ms-on-media` near-white plus the dark scrim, NEVER the skin's contrast
 * color. A skin's contrast surface can itself be light (so its text is dark),
 * and the video's luminance is unknown, so reading text color from the skin is
 * how a dark wordmark lands invisibly on a dark video. The scrim + on-media
 * pairing guarantees legibility by construction, independent of both.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles } from './chrome';

// Tunable reveal timing (ms). GAP_MS must be >= the fade so a line fully clears
// before the next begins — that no-overlap is the whole point.
const OPEN_MS = 600; // media alone before the first line
const LINE_MS = 2000; // a line held (includes its own ~fade-in)
const GAP_MS = 800; // media alone between lines
const FADE = '0.7s';

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

export function MomentHero({
  identity,
  moment,
  skin,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const r = roles(skin);
  const lineCount = moment.story.length;
  const timeline = buildStoryTimeline(lineCount);
  const [pi, setPi] = useState(0);
  const [solid, setSolid] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const phase = timeline[pi]!;
  const landed = phase.kind === 'brand';

  useEffect(() => {
    const ms = phaseDurationMs(buildStoryTimeline(lineCount)[pi]!);
    if (ms == null) return undefined;
    const last = buildStoryTimeline(lineCount).length - 1;
    const t = setTimeout(() => setPi((n) => Math.min(n + 1, last)), ms);
    return () => clearTimeout(t);
  }, [pi, lineCount]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => setSolid(!e.isIntersecting)), {
      rootMargin: '-80px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const lineVisible = (i: number) => phase.kind === 'line' && phase.index === i;
  const navVisible = landed || solid;

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
          // Solid nav sits on the page surface (skin fg); over the hero it uses
          // the on-media near-white so it reads on the (dark-scrimmed) video.
          color: solid ? 'var(--ms-fg)' : 'var(--ms-on-media)',
          boxShadow: solid ? '0 1px 0 var(--ms-rule)' : 'none',
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? 'auto' : 'none',
          transition: 'opacity .8s ease, background .5s ease, padding .5s ease, color .5s ease',
        }}
      >
        <Nav identity={identity} skin={skin} />
      </nav>

      <header
        ref={heroRef}
        data-ms-hero
        style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--ms-contrast-bg)', color: 'var(--ms-on-media)' }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/* No hardcoded tint — the hero media takes the skin's own photo grade
              (applied via the .archetype-photo class), so it's mood-driven and a
              dark skin and a warm skin no longer come out the same sepia. */}
          <Media media={moment.media} />
        </div>
        {/* Scrim: weighted toward the center where the text sits, so white text
            reads regardless of whether the video is bright or dark. Tunable. */}
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.42), rgba(0,0,0,.82))' }}
        />

        {moment.story.map((line, i) => (
          <div key={i} data-story-line style={frame(lineVisible(i), 2)}>
            <p
              data-type="storyline"
              style={{
                ...typeRoleCss(r.storyline),
                color: 'var(--ms-on-media)',
                maxWidth: '18ch',
                margin: 0,
                textShadow: '0 2px 36px rgba(0,0,0,.55)',
              }}
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
            <h1
              data-type="brand"
              style={{ ...typeRoleCss(r.brand), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}
            >
              {moment.brand}
            </h1>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <a
                href="#goods"
                data-type="navLabel"
                style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}
              >
                {moment.ctaLabel}
              </a>
              {moment.secondaryCtaLabel && (
                <a
                  href="#"
                  data-type="navLabel"
                  style={{
                    ...typeRoleCss(r.navLabel),
                    border: '1px solid var(--ms-on-media-muted)',
                    color: 'var(--ms-on-media)',
                    padding: '16px 26px',
                    borderRadius: 2,
                  }}
                >
                  {moment.secondaryCtaLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

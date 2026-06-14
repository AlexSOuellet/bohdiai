'use client';

/**
 * Main Street — BEAT 1: the hero.
 *
 * The hero IS the front door. No portable Moment layer, no rise-from-black, no
 * Enter Site click-through, no play-once lifecycle, no cookie. A visitor lands
 * on the home page and the hero renders directly. (D54 retired the portable
 * Moment concept; the page-down treatments — Constellation, marquee, founder
 * portrait, skin and type — carry distinctiveness.)
 *
 * Two kinds, both driven by the cinematographer's `media.kind` (D40, D54):
 *   • VIDEO — fal-generated 16:9 clip with the camera LOCKED and in-frame motion
 *     only (D52). Autoplays muted, loops seamlessly. Used when the maker's world
 *     contains real ambient motion (steam, flame, water, hands, light).
 *   • STILL — fal-generated 16:9 cinematic SCENE composition (the product in its
 *     real world, lit naturally, with depth and air — not a product on a void).
 *     A very subtle CSS push-in adds cinematic time at render — scale 1.0 → 1.03
 *     over ~24s, basically imperceptible, the scene quietly settles.
 *
 * CONTRAST OVER MEDIA — every word painted over the hero uses the skin-agnostic
 * `--ms-on-media` near-white plus the dark scrim, NEVER the skin's contrast
 * color, so text stays legible over a hero of unknown luminance.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles, linkHref } from './chrome';
import { navContrast, relativeLuminance } from './logo-contrast';

const STILL_PUSH_IN_SECONDS = 24;

/** The shared inner visual: held media, a center-weighted scrim, the brand block
 *  with an `action` row (the hero's CTA). The eyebrow + brand land immediately —
 *  there's no story-play timeline anymore (D54). The story lines are still
 *  authored and stored, but the hero renders the brand at rest. */
function HeroStage({
  moment,
  skin,
  action,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  action: ReactNode;
}) {
  const r = roles(skin);
  const isStill = moment.media.kind === 'still';

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
      {/* The very gentle push-in lives in a stylesheet on document body via
          a global style tag below, so the animation keyframes are available. */}
      <style>{`@keyframes ms-hero-push { 0% { transform: scale(1); } 100% { transform: scale(1.03); } }`}</style>
      {/* Scrim weighted toward the center where the text sits, so white text reads
          whether the scene is bright or dark. */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.42), rgba(0,0,0,.82))' }}
      />

      <div data-ms-hero-brand style={brandFrame()}>
        <div>
          <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-on-media-muted)', marginBottom: 18 }}>
            {moment.eyebrow}
          </div>
          <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}>
            {moment.brand}
          </h1>
          {moment.story.length > 0 && (
            <div data-ms-hero-story style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '32ch', marginInline: 'auto' }}>
              {moment.story.map((line, i) => (
                <p
                  key={i}
                  data-type="storyline"
                  data-ms-hero-story-line
                  style={{ ...typeRoleCss(r.storyline), color: 'var(--ms-on-media)', margin: 0, textShadow: '0 2px 36px rgba(0,0,0,.55)' }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>{action}</div>
        </div>
      </div>
    </>
  );
}

function brandFrame(): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    padding: 'clamp(28px,6vw,96px)',
    zIndex: 2,
  };
}

/** The hero's CTA row — the authored primary and an optional secondary, each
 *  pointed where its label says it goes (D46). When a button has no authored
 *  target the legacy default holds: the primary scrolls to the goods, the
 *  secondary goes to the shop. */
function HeroCta({ moment, skin }: { moment: MainStreetContent['moment']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const primaryHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  return (
    <>
      <a href={primaryHref} data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', padding: '16px 26px', borderRadius: 2 }}>
        {moment.ctaLabel}
      </a>
      {moment.secondaryCtaLabel && (
        <a href={secondaryHref} data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-on-media-muted)', color: 'var(--ms-on-media)', padding: '16px 26px', borderRadius: 2 }}>
          {moment.secondaryCtaLabel}
        </a>
      )}
    </>
  );
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
  const [solid, setSolid] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => setSolid(!e.isIntersecting)), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tone = identity.logoTone ?? 'unknown';
  // Transparent state: logo sits over the dark scrim of the hero media
  const overMedia = navContrast(tone, 'dark');
  // Solid state: logo sits on the skin's background color
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
        <Nav identity={identity} skin={skin} />
      </nav>

      <header
        ref={heroRef}
        data-ms-hero
        style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--ms-contrast-bg)', color: 'var(--ms-on-media)' }}
      >
        <HeroStage moment={moment} skin={skin} action={<HeroCta moment={moment} skin={skin} />} />
      </header>
    </>
  );
}
